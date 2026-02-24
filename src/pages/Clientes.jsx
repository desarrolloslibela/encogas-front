import React, { useEffect, useMemo, useState } from "react";
import { http } from "../api/http.js";
import { Link } from "react-router-dom";

const ESTADOS = [
  { value: "ACTIVOS", label: "Activos" },
  { value: "INACTIVOS", label: "Inactivos" },
  { value: "TODOS", label: "Todos" },
];

function str(v) {
  return v === null || v === undefined ? "" : String(v);
}

export default function Clientes() {
  const [estado, setEstado] = useState("ACTIVOS");
  const [search, setSearch] = useState("");
  const [items, setItems] = useState([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  // modal
  const [show, setShow] = useState(false);
  const [editing, setEditing] = useState(null);

  const [razonSocial, setRazonSocial] = useState("");
  const [cuitDni, setCuitDni] = useState("");
  const [direccion, setDireccion] = useState("");
  const [localidad, setLocalidad] = useState("");
  const [telefono, setTelefono] = useState("");
  const [email, setEmail] = useState("");
  const [latitud, setLatitud] = useState("");
  const [longitud, setLongitud] = useState("");

  function openNew() {
    setEditing(null);
    setRazonSocial("");
    setCuitDni("");
    setDireccion("");
    setLocalidad("");
    setTelefono("");
    setEmail("");
    setLatitud("");
    setLongitud("");
    setError(null);
    setShow(true);
  }

  function openEdit(row) {
    setEditing(row);
    setRazonSocial(str(row.razonSocial));
    setCuitDni(str(row.cuitDni));
    setDireccion(str(row.direccion));
    setLocalidad(str(row.localidad));
    setTelefono(str(row.telefono));
    setEmail(str(row.email));
    setLatitud(str(row.latitud));
    setLongitud(str(row.longitud));
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
      const { data } = await http.get("/clientes", {
        params: {
          estado,
          search: search.trim() ? search.trim() : undefined,
        },
      });
      setItems(data);
    } catch (e) {
      setError("No se pudo cargar la lista de clientes.");
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [estado]);

  const filtered = useMemo(() => {
    const s = search.trim().toLowerCase();
    if (!s) return items;
    return items.filter((x) => {
      const blob = [
        x.razonSocial,
        x.cuitDni,
        x.direccion,
        x.localidad,
        x.telefono,
        x.email,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return blob.includes(s);
    });
  }, [items, search]);

  async function onSave(e) {
    e.preventDefault();
    setError(null);

    const payload = {
      razonSocial: razonSocial.trim(),
      cuitDni: cuitDni.trim() ? cuitDni.trim() : null,
      direccion: direccion.trim(),
      localidad: localidad.trim() ? localidad.trim() : null,
      telefono: telefono.trim() ? telefono.trim() : null,
      email: email.trim() ? email.trim() : null,
      latitud: latitud.trim() ? Number(latitud) : null,
      longitud: longitud.trim() ? Number(longitud) : null,
    };

    if (!payload.razonSocial || !payload.direccion) {
      setError("Razón social y dirección son obligatorias.");
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
        await http.put(`/clientes/${editing.id}`, payload);
      } else {
        await http.post(`/clientes`, payload);
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

  async function toggleActivo(row) {
    setBusy(true);
    setError(null);
    try {
      if (row.activo) await http.patch(`/clientes/${row.id}/desactivar`);
      else await http.patch(`/clientes/${row.id}/activar`);
      await load();
    } catch (e) {
      setError("No se pudo cambiar el estado.");
    } finally {
      setBusy(false);
    }
  }

  function hasCoords(row) {
    return row.latitud !== null && row.longitud !== null && row.latitud !== undefined && row.longitud !== undefined;
  }

  return (
    <div className="container py-4">
      <div className="d-flex align-items-center justify-content-between mb-3">
        <div className="d-flex align-items-center gap-2">
          <Link to="/" className="btn btn-outline-secondary btn-sm">
            ← Volver
          </Link>
          <h4 className="mb-0">Clientes</h4>
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
            <div className="col-12 col-md-6">
              <label className="form-label">Buscar</label>
              <input
                className="form-control"
                placeholder="Razón social, CUIT/DNI, dirección, etc…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") load();
                }}
              />
            </div>
            <div className="col-12 col-md-3 d-flex align-items-end">
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
                  <th>Razón social</th>
                  <th>CUIT/DNI</th>
                  <th>Teléfono</th>
                  <th>Dirección</th>
                  <th>Coords</th>
                  <th>Estado</th>
                  <th style={{ width: 240 }}></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((row) => (
                  <tr key={row.id}>
                    <td>{row.razonSocial}</td>
                    <td>{row.cuitDni || "-"}</td>
                    <td>{row.telefono || "-"}</td>
                    <td>{row.direccion}</td>
                    <td>{hasCoords(row) ? "Sí" : "No"}</td>
                    <td>
                      {row.activo ? (
                        <span className="badge text-bg-success">Activo</span>
                      ) : (
                        <span className="badge text-bg-secondary">Inactivo</span>
                      )}
                    </td>
                    <td className="text-end">
                      <button className="btn btn-outline-secondary btn-sm me-2" onClick={() => openEdit(row)}>
                        Editar
                      </button>
                      <button
                        className={`btn btn-sm ${row.activo ? "btn-outline-danger" : "btn-outline-success"}`}
                        onClick={() => toggleActivo(row)}
                        disabled={busy}
                      >
                        {row.activo ? "Desactivar" : "Activar"}
                      </button>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={7} className="text-center text-muted py-4">
                      {busy ? "Cargando…" : "Sin registros"}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
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
                  <h5 className="modal-title">{editing ? "Editar cliente" : "Nuevo cliente"}</h5>
                  <button type="button" className="btn-close" onClick={closeModal} />
                </div>

                <div className="modal-body">
                  {error && <div className="alert alert-danger py-2">{error}</div>}

                  <div className="row g-2">
                    <div className="col-12 col-md-8">
                      <label className="form-label">Razón social *</label>
                      <input className="form-control" value={razonSocial} onChange={(e) => setRazonSocial(e.target.value)} />
                    </div>
                    <div className="col-12 col-md-4">
                      <label className="form-label">CUIT/DNI</label>
                      <input className="form-control" value={cuitDni} onChange={(e) => setCuitDni(e.target.value)} />
                    </div>

                    <div className="col-12">
                      <label className="form-label">Dirección *</label>
                      <input className="form-control" value={direccion} onChange={(e) => setDireccion(e.target.value)} />
                    </div>

                    <div className="col-12 col-md-4">
                      <label className="form-label">Localidad</label>
                      <input className="form-control" value={localidad} onChange={(e) => setLocalidad(e.target.value)} />
                    </div>
                    <div className="col-12 col-md-4">
                      <label className="form-label">Teléfono</label>
                      <input className="form-control" value={telefono} onChange={(e) => setTelefono(e.target.value)} />
                    </div>
                    <div className="col-12 col-md-4">
                      <label className="form-label">Email</label>
                      <input className="form-control" value={email} onChange={(e) => setEmail(e.target.value)} />
                    </div>

                    <div className="col-12 col-md-6">
                      <label className="form-label">Latitud</label>
                      <input type="number" step="0.0000001" className="form-control" value={latitud} onChange={(e) => setLatitud(e.target.value)} />
                    </div>
                    <div className="col-12 col-md-6">
                      <label className="form-label">Longitud</label>
                      <input type="number" step="0.0000001" className="form-control" value={longitud} onChange={(e) => setLongitud(e.target.value)} />
                    </div>

                    <div className="col-12">
                      <div className="form-text">
                        Coordenadas opcionales. Si cargás latitud, también debés cargar longitud (y viceversa).
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