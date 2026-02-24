import React, { useEffect, useMemo, useState } from "react";
import { http } from "../api/http.js";
import { Link } from "react-router-dom";

const ESTADOS = [
  { value: "ACTIVOS", label: "Activos" },
  { value: "INACTIVOS", label: "Inactivos" },
  { value: "TODOS", label: "Todos" },
];

const TIPOS = [
  { value: "", label: "Todos" },
  { value: "CASA_CENTRAL", label: "Casa Central" },
  { value: "PLANTA", label: "Planta" },
  { value: "DEPOSITO", label: "Depósito" },
  { value: "VEHICULO", label: "Vehículo" },
  { value: "OTRO", label: "Otro" },
];

function s(v) {
  return v === null || v === undefined ? "" : String(v);
}

function hasCoords(row) {
  return row.latitud !== null && row.longitud !== null && row.latitud !== undefined && row.longitud !== undefined;
}

export default function PuntosOperativos() {
  const [estado, setEstado] = useState("ACTIVOS");
  const [tipo, setTipo] = useState("");
  const [search, setSearch] = useState("");
  const [items, setItems] = useState([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  // modal
  const [show, setShow] = useState(false);
  const [editing, setEditing] = useState(null);

  const [codigo, setCodigo] = useState("");
  const [nombre, setNombre] = useState("");
  const [tipoForm, setTipoForm] = useState("DEPOSITO");
  const [direccion, setDireccion] = useState("");
  const [localidad, setLocalidad] = useState("");
  const [latitud, setLatitud] = useState("");
  const [longitud, setLongitud] = useState("");

  function openNew() {
    setEditing(null);
    setCodigo("");
    setNombre("");
    setTipoForm("DEPOSITO");
    setDireccion("");
    setLocalidad("");
    setLatitud("");
    setLongitud("");
    setError(null);
    setShow(true);
  }

  function openEdit(row) {
    setEditing(row);
    setCodigo(s(row.codigo));
    setNombre(s(row.nombre));
    setTipoForm(row.tipo || "DEPOSITO");
    setDireccion(s(row.direccion));
    setLocalidad(s(row.localidad));
    setLatitud(s(row.latitud));
    setLongitud(s(row.longitud));
    setError(null);
    setShow(true);
  }

  function closeModal() {
    setShow(false);
    setEditing(null);
  }

  async function load() {
    setBusy(true);
    setError(null);
    try {
      const { data } = await http.get("/puntos-operativos", {
        params: {
          estado,
          tipo: tipo || undefined,
          search: search.trim() ? search.trim() : undefined,
        },
      });
      setItems(data);
    } catch (e) {
      setError("No se pudo cargar la lista de puntos operativos.");
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [estado, tipo]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return items;
    return items.filter((x) => {
      const blob = [x.codigo, x.nombre, x.direccion, x.localidad, x.tipo]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return blob.includes(q);
    });
  }, [items, search]);

  async function onSave(e) {
    e.preventDefault();
    setError(null);

    const payload = {
      codigo: codigo.trim(),
      nombre: nombre.trim(),
      tipo: tipoForm,
      direccion: direccion.trim(),
      localidad: localidad.trim() ? localidad.trim() : null,
      latitud: latitud.trim() ? Number(latitud) : null,
      longitud: longitud.trim() ? Number(longitud) : null,
    };

    if (!payload.codigo || !payload.nombre || !payload.direccion) {
      setError("Código, nombre y dirección son obligatorios.");
      return;
    }

    // coords en pareja
    const hasLat = payload.latitud !== null;
    const hasLon = payload.longitud !== null;
    if (hasLat !== hasLon) {
      setError("Latitud y longitud deben cargarse juntas.");
      return;
    }

    setBusy(true);
    try {
      if (editing) {
        await http.put(`/puntos-operativos/${editing.id}`, payload);
      } else {
        await http.post(`/puntos-operativos`, payload);
      }
      closeModal();
      await load();
    } catch (e) {
      const msg = e?.response?.data?.message;
      setError(msg || "Error al guardar.");
    } finally {
      setBusy(false);
    }
  }

  function badgeTipo(t) {
    switch (t) {
      case "CASA_CENTRAL":
        return <span className="badge text-bg-primary">Casa Central</span>;
      case "PLANTA":
        return <span className="badge text-bg-info">Planta</span>;
      case "DEPOSITO":
        return <span className="badge text-bg-warning">Depósito</span>;
      default:
        return <span className="badge text-bg-secondary">Otro</span>;
    }
  }

  return (
    <div className="container py-4">
      <div className="d-flex align-items-center justify-content-between mb-3">
        <div className="d-flex align-items-center gap-2">
          <Link to="/" className="btn btn-outline-secondary btn-sm">
            ← Volver
          </Link>
          <h4 className="mb-0">Puntos operativos</h4>
        </div>
        <button className="btn btn-primary btn-sm" onClick={openNew}>
          + Nuevo
        </button>
      </div>

      <div className="card mb-3">
        <div className="card-body">
          <div className="row g-2">
            <div className="col-12 col-md-3">
              <label className="form-label">Estado</label>
              <select className="form-select" value={estado} onChange={(e) => setEstado(e.target.value)}>
                {ESTADOS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="col-12 col-md-3">
              <label className="form-label">Tipo</label>
              <select className="form-select" value={tipo} onChange={(e) => setTipo(e.target.value)}>
                {TIPOS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="col-12 col-md-4">
              <label className="form-label">Buscar</label>
              <input
                className="form-control"
                placeholder="Código, nombre, dirección…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") load();
                }}
              />
            </div>

            <div className="col-12 col-md-2 d-flex align-items-end">
              <button className="btn btn-outline-primary w-100" onClick={load} disabled={busy}>
                {busy ? "Actualizando…" : "Actualizar"}
              </button>
            </div>
          </div>

          {error && <div className="alert alert-danger mt-3 py-2 mb-0">{error}</div>}
        </div>
      </div>

      <div className="card">
        <div className="card-body">
          <div className="table-responsive">
            <table className="table table-sm align-middle">
              <thead>
                <tr>
                  <th>Código</th>
                  <th>Nombre</th>
                  <th>Tipo</th>
                  <th>Dirección</th>
                  <th>Coords</th>
                  <th style={{ width: 140 }}></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((row) => (
                  <tr key={row.id}>
                    <td>{row.codigo}</td>
                    <td>{row.nombre}</td>
                    <td>{badgeTipo(row.tipo)}</td>
                    <td>{row.direccion}</td>
                    <td>{hasCoords(row) ? "Sí" : "No"}</td>
                    <td className="text-end">
                      <button className="btn btn-outline-secondary btn-sm" onClick={() => openEdit(row)}>
                        Editar
                      </button>
                    </td>
                  </tr>
                ))}

                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={6} className="text-center text-muted py-4">
                      {busy ? "Cargando…" : "Sin registros"}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="text-muted small mt-2">
            Regla: solo puede existir <b>una</b> Casa Central activa por empresa.
          </div>
        </div>
      </div>

      {/* Modal */}
      {show && (
        <div className="modal d-block" tabIndex="-1" role="dialog" style={{ background: "rgba(0,0,0,.35)" }}>
          <div className="modal-dialog modal-lg" role="document">
            <div className="modal-content">
              <form onSubmit={onSave}>
                <div className="modal-header">
                  <h5 className="modal-title">{editing ? "Editar punto operativo" : "Nuevo punto operativo"}</h5>
                  <button type="button" className="btn-close" onClick={closeModal} />
                </div>

                <div className="modal-body">
                  {error && <div className="alert alert-danger py-2">{error}</div>}

                  <div className="row g-2">
                    <div className="col-12 col-md-4">
                      <label className="form-label">Código *</label>
                      <input className="form-control" value={codigo} onChange={(e) => setCodigo(e.target.value)} />
                      <div className="form-text">Ej: CC, DEP1, PLANTA</div>
                    </div>

                    <div className="col-12 col-md-8">
                      <label className="form-label">Nombre *</label>
                      <input className="form-control" value={nombre} onChange={(e) => setNombre(e.target.value)} />
                    </div>

                    <div className="col-12 col-md-4">
                      <label className="form-label">Tipo *</label>
                      <select className="form-select" value={tipoForm} onChange={(e) => setTipoForm(e.target.value)}>
                        <option value="CASA_CENTRAL">Casa Central</option>
                        <option value="PLANTA">Planta</option>
                        <option value="DEPOSITO">Depósito</option>
                        <option value="OTRO">Otro</option>
                      </select>
                    </div>

                    <div className="col-12 col-md-8">
                      <label className="form-label">Dirección *</label>
                      <input className="form-control" value={direccion} onChange={(e) => setDireccion(e.target.value)} />
                    </div>

                    <div className="col-12 col-md-4">
                      <label className="form-label">Localidad</label>
                      <input className="form-control" value={localidad} onChange={(e) => setLocalidad(e.target.value)} />
                    </div>

                    <div className="col-12 col-md-4">
                      <label className="form-label">Latitud</label>
                      <input
                        type="number"
                        step="0.0000001"
                        className="form-control"
                        value={latitud}
                        onChange={(e) => setLatitud(e.target.value)}
                      />
                    </div>

                    <div className="col-12 col-md-4">
                      <label className="form-label">Longitud</label>
                      <input
                        type="number"
                        step="0.0000001"
                        className="form-control"
                        value={longitud}
                        onChange={(e) => setLongitud(e.target.value)}
                      />
                    </div>

                    <div className="col-12">
                      <div className="form-text">
                        Coordenadas opcionales. Si cargás latitud, también debés cargar longitud.
                      </div>
                    </div>
                  </div>
                </div>

                <div className="modal-footer">
                  <button type="button" className="btn btn-outline-secondary" onClick={closeModal} disabled={busy}>
                    Cancelar
                  </button>
                  <button type="submit" className="btn btn-primary" disabled={busy}>
                    {busy ? "Guardando…" : "Guardar"}
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