import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { http } from "../api/http.js";

function s(v){ return v===null||v===undefined?"":String(v); }

export default function Jornadas() {
  const [items, setItems] = useState([]);
  const [vehiculos, setVehiculos] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [puntos, setPuntos] = useState([]);

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  // modal jornada
  const [show, setShow] = useState(false);
  const [fecha, setFecha] = useState(() => new Date().toISOString().slice(0,10));
  const [vehiculoId, setVehiculoId] = useState("");
  const [driverId, setDriverId] = useState("");
  const [origenId, setOrigenId] = useState("");

  // modal carga
  const [showCarga, setShowCarga] = useState(false);
  const [jornadaSel, setJornadaSel] = useState(null);
  const [tipos, setTipos] = useState([]);
  const [obs, setObs] = useState("");
  const [lineas, setLineas] = useState([]); // {tipoEnvaseId, cantLlenos, cantVacios}

  async function loadAll() {
    setBusy(true); setError(null);
    try {
      const [j, v, d, po, te] = await Promise.all([
        http.get("/jornadas"),
        http.get("/vehiculos", { params: { estado: "ACTIVOS" } }),
        http.get("/drivers"),
        http.get("/puntos-operativos", { params: { estado: "ACTIVOS" } }),
        http.get("/tipos-envase", { params: { estado: "ACTIVOS" } }),
      ]);
      setItems(j.data || []);
      setVehiculos(v.data || []);
      setDrivers(d.data || []);
      // origen: solo puntos tipo CASA_CENTRAL activos
      setPuntos((po.data || []).filter(x => x.tipo === "CASA_CENTRAL"));
      setTipos(te.data || []);
      if (!vehiculoId && (v.data||[]).length) setVehiculoId(String(v.data[0].id));
      if (!driverId && (d.data||[]).length) setDriverId(String(d.data[0].id));
      if (!origenId && (po.data||[]).filter(x=>x.tipo==="CASA_CENTRAL").length) setOrigenId(String((po.data||[]).filter(x=>x.tipo==="CASA_CENTRAL")[0].id));
    } catch {
      setError("No se pudo cargar datos.");
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => { loadAll(); /* eslint-disable-next-line */ }, []);

  function openNueva() { setError(null); setShow(true); }
  function closeNueva(){ setShow(false); }

  async function crearJornada(e){
    e.preventDefault();
    setError(null);
    if(!fecha || !vehiculoId || !driverId || !origenId) return setError("Completá fecha, vehículo, chofer y origen.");
    setBusy(true);
    try{
      await http.post("/jornadas", {
        fecha,
        vehiculoId: Number(vehiculoId),
        choferUsuarioId: Number(driverId),
        puntoOperativoOrigenId: Number(origenId),
      });
      closeNueva();
      await loadAll();
    }catch(e2){
      setError(e2?.response?.data?.message || "No se pudo crear jornada.");
    }finally{ setBusy(false); }
  }

  async function cerrarJornada(j){
    setBusy(true); setError(null);
    try{
      await http.patch(`/jornadas/${j.id}/cerrar`);
      await loadAll();
    }catch{
      setError("No se pudo cerrar la jornada.");
    }finally{ setBusy(false); }
  }

  function openCarga(j){
    setError(null);
    setJornadaSel(j);
    setObs("");
    setLineas((tipos||[]).map(t => ({ tipoEnvaseId: t.id, cantLlenos: 0, cantVacios: 0 })));
    setShowCarga(true);
  }
  function closeCarga(){ setShowCarga(false); setJornadaSel(null); }

  function setLinea(tipoEnvaseId, field, value){
    setLineas(prev => prev.map(l => l.tipoEnvaseId===tipoEnvaseId ? ({...l, [field]: Math.max(0, Number(value||0)) }) : l));
  }

  const tiposById = useMemo(() => {
    const m = new Map();
    for(const t of tipos) m.set(t.id, t);
    return m;
  }, [tipos]);

  async function guardarCarga(e){
    e.preventDefault();
    setError(null);
    if(!jornadaSel) return;

    const itemsCarga = lineas
      .map(l => ({...l, cantLlenos: Number(l.cantLlenos), cantVacios: Number(l.cantVacios)}))
      .filter(l => (l.cantLlenos>0 || l.cantVacios>0));

    if(itemsCarga.length===0) return setError("Cargá al menos un ítem con cantidades > 0.");

    setBusy(true);
    try{
      await http.post("/cargas-vehiculo", {
        jornadaId: jornadaSel.id,
        items: itemsCarga,
        observacion: obs.trim() ? obs.trim() : null,
      });
      closeCarga();
      await loadAll();
    }catch(e2){
      setError(e2?.response?.data?.message || "No se pudo registrar la carga.");
    }finally{ setBusy(false); }
  }

  return (
    <div className="container py-4">
      <div className="d-flex align-items-center justify-content-between mb-3">
        <div className="d-flex align-items-center gap-2">
          <Link to="/" className="btn btn-outline-secondary btn-sm">← Volver</Link>
          <h4 className="mb-0">Jornadas</h4>
        </div>
        <button className="btn btn-primary btn-sm" onClick={openNueva}>+ Nueva jornada</button>
      </div>

      {error && <div className="alert alert-danger py-2">{error}</div>}

      <div className="card">
        <div className="card-body">
          <div className="table-responsive">
            <table className="table table-sm align-middle">
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Vehículo</th>
                  <th>Chofer</th>
                  <th>Origen</th>
                  <th>Estado</th>
                  <th style={{width: 320}}></th>
                </tr>
              </thead>
              <tbody>
                {items.map(j => (
                  <tr key={j.id}>
                    <td>{j.fecha}</td>
                    <td><b>{j.vehiculoPatente}</b></td>
                    <td>{j.choferEmail}</td>
                    <td>{j.puntoOperativoOrigenNombre}</td>
                    <td>
                      {j.estado === "ABIERTA"
                        ? <span className="badge text-bg-success">ABIERTA</span>
                        : <span className="badge text-bg-secondary">CERRADA</span>
                      }
                    </td>
                    <td className="text-end">
                      <button className="btn btn-outline-primary btn-sm me-2" disabled={busy || j.estado!=="ABIERTA"} onClick={()=>openCarga(j)}>
                        Carga inicial
                      </button>
                      <button className="btn btn-outline-danger btn-sm" disabled={busy || j.estado!=="ABIERTA"} onClick={()=>cerrarJornada(j)}>
                        Cerrar
                      </button>
                    </td>
                  </tr>
                ))}
                {items.length===0 && (
                  <tr><td colSpan={6} className="text-center text-muted py-4">{busy ? "Cargando…" : "Sin jornadas"}</td></tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="text-muted small">
            La carga inicial mueve stock: <b>Casa Central → Vehículo</b> y registra movimientos auditable.
          </div>
        </div>
      </div>

      {/* Modal Nueva Jornada */}
      {show && (
        <div className="modal d-block" tabIndex="-1" role="dialog" style={{ background: "rgba(0,0,0,.35)" }}>
          <div className="modal-dialog modal-lg" role="document">
            <div className="modal-content">
              <form onSubmit={crearJornada}>
                <div className="modal-header">
                  <h5 className="modal-title">Nueva jornada</h5>
                  <button type="button" className="btn-close" onClick={closeNueva} />
                </div>
                <div className="modal-body">
                  {error && <div className="alert alert-danger py-2">{error}</div>}
                  <div className="row g-2">
                    <div className="col-12 col-md-3">
                      <label className="form-label">Fecha</label>
                      <input type="date" className="form-control" value={fecha} onChange={(e)=>setFecha(e.target.value)} />
                    </div>
                    <div className="col-12 col-md-3">
                      <label className="form-label">Vehículo</label>
                      <select className="form-select" value={vehiculoId} onChange={(e)=>setVehiculoId(e.target.value)}>
                        {vehiculos.map(v => <option key={v.id} value={v.id}>{v.patente}</option>)}
                      </select>
                    </div>
                    <div className="col-12 col-md-3">
                      <label className="form-label">Chofer (DRIVER)</label>
                      <select className="form-select" value={driverId} onChange={(e)=>setDriverId(e.target.value)}>
                        {drivers.map(d => <option key={d.id} value={d.id}>{d.email} {d.nombreCompleto ? `— ${d.nombreCompleto}` : ""}</option>)}
                      </select>
                    </div>
                    <div className="col-12 col-md-3">
                      <label className="form-label">Origen (Casa Central)</label>
                      <select className="form-select" value={origenId} onChange={(e)=>setOrigenId(e.target.value)}>
                        {puntos.map(p => <option key={p.id} value={p.id}>{p.codigo} — {p.nombre}</option>)}
                      </select>
                    </div>
                  </div>
                  <div className="text-muted small mt-2">
                    Regla: no se permite más de una jornada <b>ABIERTA</b> para el mismo vehículo en la misma fecha.
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-outline-secondary" onClick={closeNueva} disabled={busy}>Cancelar</button>
                  <button type="submit" className="btn btn-primary" disabled={busy}>{busy ? "Guardando…" : "Crear jornada"}</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Modal Carga */}
      {showCarga && jornadaSel && (
        <div className="modal d-block" tabIndex="-1" role="dialog" style={{ background: "rgba(0,0,0,.35)" }}>
          <div className="modal-dialog modal-xl" role="document">
            <div className="modal-content">
              <form onSubmit={guardarCarga}>
                <div className="modal-header">
                  <h5 className="modal-title">Carga inicial — {jornadaSel.vehiculoPatente} ({jornadaSel.fecha})</h5>
                  <button type="button" className="btn-close" onClick={closeCarga} />
                </div>
                <div className="modal-body">
                  {error && <div className="alert alert-danger py-2">{error}</div>}

                  <div className="mb-2">
                    <label className="form-label">Observación</label>
                    <input className="form-control" value={obs} onChange={(e)=>setObs(e.target.value)} placeholder="Opcional" />
                  </div>

                  <div className="table-responsive">
                    <table className="table table-sm align-middle">
                      <thead>
                        <tr>
                          <th>Tipo envase</th>
                          <th className="text-end">Llenos</th>
                          <th className="text-end">Vacíos</th>
                        </tr>
                      </thead>
                      <tbody>
                        {lineas.map(l => {
                          const t = tiposById.get(l.tipoEnvaseId);
                          if(!t) return null;
                          return (
                            <tr key={l.tipoEnvaseId}>
                              <td><b>{t.codigo}</b> — {t.nombre} {t.capacidadKg}kg</td>
                              <td className="text-end">
                                <input type="number" min="0" className="form-control form-control-sm text-end"
                                       value={s(l.cantLlenos)} onChange={(e)=>setLinea(l.tipoEnvaseId, "cantLlenos", e.target.value)} />
                              </td>
                              <td className="text-end">
                                <input type="number" min="0" className="form-control form-control-sm text-end"
                                       value={s(l.cantVacios)} onChange={(e)=>setLinea(l.tipoEnvaseId, "cantVacios", e.target.value)} />
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  <div className="text-muted small">
                    Esto descuenta stock en <b>Casa Central</b> y suma en el <b>Vehículo</b>. Si no hay stock suficiente, el backend rechaza.
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-outline-secondary" onClick={closeCarga} disabled={busy}>Cancelar</button>
                  <button type="submit" className="btn btn-primary" disabled={busy}>{busy ? "Guardando…" : "Registrar carga"}</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}