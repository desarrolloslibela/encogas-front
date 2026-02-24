import React, { useEffect, useMemo, useState } from "react";
import { http } from "../api/http.js";
import { Link } from "react-router-dom";

function s(v) {
  return v === null || v === undefined ? "" : String(v);
}

export default function StockEnvases() {
  const [puntos, setPuntos] = useState([]);
  const [tipos, setTipos] = useState([]);

  const [puntoId, setPuntoId] = useState("");
  const [rows, setRows] = useState([]);
  const [movs, setMovs] = useState([]);

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  // modal ajuste
  const [show, setShow] = useState(false);
  const [tipoId, setTipoId] = useState("");
  const [nuevoLlenos, setNuevoLlenos] = useState("");
  const [nuevoVacios, setNuevoVacios] = useState("");
  const [motivo, setMotivo] = useState("");

  async function loadCatalogos() {
    const [poRes, teRes] = await Promise.all([
      http.get("/puntos-operativos", { params: { estado: "ACTIVOS" } }),
      http.get("/tipos-envase", { params: { estado: "ACTIVOS" } }),
    ]);
    setPuntos(poRes.data || []);
    setTipos(teRes.data || []);
    // default PO
    if (!puntoId && (poRes.data || []).length > 0) setPuntoId(String(poRes.data[0].id));
  }

  async function loadStockAndMovs(poId) {
    if (!poId) return;
    setBusy(true);
    setError(null);
    try {
      const [st, mv] = await Promise.all([
        http.get("/stock", { params: { puntoOperativoId: poId } }),
        http.get("/stock/movimientos", { params: { puntoOperativoId: poId } }),
      ]);
      setRows(st.data || []);
      setMovs(mv.data || []);
    } catch (e) {
      setError("No se pudo cargar stock/movimientos.");
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    loadCatalogos().catch(() => setError("No se pudieron cargar catálogos."));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (puntoId) loadStockAndMovs(puntoId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [puntoId]);

  const puntoActual = useMemo(() => puntos.find((p) => String(p.id) === String(puntoId)), [puntos, puntoId]);

  function openAjuste() {
    setError(null);
    setTipoId(tipos.length ? String(tipos[0].id) : "");
    setNuevoLlenos("");
    setNuevoVacios("");
    setMotivo("");
    setShow(true);
  }

  function closeModal() {
    setShow(false);
  }

  function prefillFromStock() {
    const r = rows.find((x) => String(x.tipoEnvaseId) === String(tipoId));
    if (!r) return;
    setNuevoLlenos(String(r.llenos));
    setNuevoVacios(String(r.vacios));
  }

  async function guardarAjuste(e) {
    e.preventDefault();
    setError(null);

    if (!puntoId) return setError("Seleccioná un punto operativo.");
    if (!tipoId) return setError("Seleccioná un tipo de envase.");
    if (nuevoLlenos === "" || nuevoVacios === "") return setError("Completá llenos y vacíos.");
    if (!motivo.trim()) return setError("Motivo obligatorio.");

    const payload = {
      puntoOperativoId: Number(puntoId),
      tipoEnvaseId: Number(tipoId),
      nuevoLlenos: Number(nuevoLlenos),
      nuevoVacios: Number(nuevoVacios),
      motivo: motivo.trim(),
    };

    if (payload.nuevoLlenos < 0 || payload.nuevoVacios < 0) return setError("No se permiten valores negativos.");

    setBusy(true);
    try {
      await http.post("/stock/ajustes", payload);
      closeModal();
      await loadStockAndMovs(puntoId);
    } catch (e2) {
      const msg = e2?.response?.data?.message;
      setError(msg || "No se pudo registrar el ajuste.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="container py-4">
      <div className="d-flex align-items-center justify-content-between mb-3">
        <div className="d-flex align-items-center gap-2">
          <Link to="/" className="btn btn-outline-secondary btn-sm">
            ← Volver
          </Link>
          <h4 className="mb-0">Stock por punto operativo</h4>
        </div>

        <button className="btn btn-primary btn-sm" onClick={openAjuste} disabled={!puntoId || !tipos.length}>
          + Ajuste de stock
        </button>
      </div>

      <div className="card mb-3">
        <div className="card-body">
          <div className="row g-2">
            <div className="col-12 col-md-6">
              <label className="form-label">Punto operativo</label>
              <select className="form-select" value={puntoId} onChange={(e) => setPuntoId(e.target.value)}>
                {puntos.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.codigo} — {p.nombre} ({p.tipo})
                  </option>
                ))}
              </select>
            </div>
            <div className="col-12 col-md-6 d-flex align-items-end">
              <button className="btn btn-outline-primary w-100" onClick={() => loadStockAndMovs(puntoId)} disabled={busy || !puntoId}>
                {busy ? "Actualizando…" : "Actualizar"}
              </button>
            </div>
          </div>

          {puntoActual && (
            <div className="text-muted small mt-2">
              <b>Dirección:</b> {puntoActual.direccion}
            </div>
          )}

          {error && <div className="alert alert-danger mt-3 py-2 mb-0">{error}</div>}
        </div>
      </div>

      <div className="row g-3">
        <div className="col-12 col-lg-7">
          <div className="card">
            <div className="card-body">
              <h6 className="mb-3">Stock actual (llenos / vacíos)</h6>
              <div className="table-responsive">
                <table className="table table-sm align-middle">
                  <thead>
                    <tr>
                      <th>Tipo</th>
                      <th className="text-end">Llenos</th>
                      <th className="text-end">Vacíos</th>
                      <th className="text-end">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((r) => (
                      <tr key={r.tipoEnvaseId}>
                        <td>
                          <b>{r.tipoEnvaseCodigo}</b> — {r.tipoEnvaseNombre} {r.tipoEnvaseCapacidadKg}kg
                        </td>
                        <td className="text-end">{r.llenos}</td>
                        <td className="text-end">{r.vacios}</td>
                        <td className="text-end">{r.llenos + r.vacios}</td>
                      </tr>
                    ))}
                    {rows.length === 0 && (
                      <tr>
                        <td colSpan={4} className="text-center text-muted py-4">
                          {busy ? "Cargando…" : "Sin registros (se crean al ajustar o mover stock)"}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              <div className="text-muted small">
                Nota: el stock se corrige por <b>ajustes</b> (con movimiento auditable). Luego, cargas/descargas/ventas serán movimientos.
              </div>
            </div>
          </div>
        </div>

        <div className="col-12 col-lg-5">
          <div className="card">
            <div className="card-body">
              <h6 className="mb-3">Últimos movimientos (50)</h6>
              <div className="table-responsive">
                <table className="table table-sm align-middle">
                  <thead>
                    <tr>
                      <th>Tipo</th>
                      <th className="text-end">ΔL</th>
                      <th className="text-end">ΔV</th>
                      <th className="text-end">Saldo</th>
                    </tr>
                  </thead>
                  <tbody>
                    {movs.map((m) => (
                      <tr key={m.id}>
                        <td>
                          <div><b>{m.tipo}</b></div>
                          <div className="text-muted small">{s(m.motivo)}</div>
                        </td>
                        <td className="text-end">{m.deltaLlenos}</td>
                        <td className="text-end">{m.deltaVacios}</td>
                        <td className="text-end">
                          {m.saldoLlenos}/{m.saldoVacios}
                        </td>
                      </tr>
                    ))}
                    {movs.length === 0 && (
                      <tr>
                        <td colSpan={4} className="text-center text-muted py-4">
                          {busy ? "Cargando…" : "Sin movimientos"}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              <div className="text-muted small">
                Saldo se muestra como <b>llenos/vacíos</b>.
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal Ajuste */}
      {show && (
        <div className="modal d-block" tabIndex="-1" role="dialog" style={{ background: "rgba(0,0,0,.35)" }}>
          <div className="modal-dialog modal-lg" role="document">
            <div className="modal-content">
              <form onSubmit={guardarAjuste}>
                <div className="modal-header">
                  <h5 className="modal-title">Ajuste de stock</h5>
                  <button type="button" className="btn-close" onClick={closeModal} />
                </div>

                <div className="modal-body">
                  {error && <div className="alert alert-danger py-2">{error}</div>}

                  <div className="row g-2">
                    <div className="col-12 col-md-8">
                      <label className="form-label">Tipo de envase</label>
                      <select className="form-select" value={tipoId} onChange={(e) => setTipoId(e.target.value)}>
                        {tipos.map((t) => (
                          <option key={t.id} value={t.id}>
                            {t.codigo} — {t.nombre} {t.capacidadKg}kg
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="col-12 col-md-4 d-flex align-items-end">
                      <button type="button" className="btn btn-outline-secondary w-100" onClick={prefillFromStock}>
                        Tomar valores actuales
                      </button>
                    </div>

                    <div className="col-12 col-md-6">
                      <label className="form-label">Nuevo llenos</label>
                      <input type="number" min="0" className="form-control" value={nuevoLlenos} onChange={(e) => setNuevoLlenos(e.target.value)} />
                    </div>
                    <div className="col-12 col-md-6">
                      <label className="form-label">Nuevo vacíos</label>
                      <input type="number" min="0" className="form-control" value={nuevoVacios} onChange={(e) => setNuevoVacios(e.target.value)} />
                    </div>

                    <div className="col-12">
                      <label className="form-label">Motivo *</label>
                      <input className="form-control" value={motivo} onChange={(e) => setMotivo(e.target.value)} placeholder="Ej: Control de stock mensual / roturas / diferencia de conteo" />
                    </div>

                    <div className="col-12">
                      <div className="text-muted small">
                        Este ajuste genera un <b>movimiento auditable</b> con deltas y saldo final.
                      </div>
                    </div>
                  </div>
                </div>

                <div className="modal-footer">
                  <button type="button" className="btn btn-outline-secondary" onClick={closeModal} disabled={busy}>
                    Cancelar
                  </button>
                  <button type="submit" className="btn btn-primary" disabled={busy}>
                    {busy ? "Guardando…" : "Guardar ajuste"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}