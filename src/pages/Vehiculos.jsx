import React, { useEffect, useMemo, useState } from "react";
import { http } from "../api/http.js";
import { Link } from "react-router-dom";

const ESTADOS = [
  { value: "ACTIVOS", label: "Activos" },
  { value: "INACTIVOS", label: "Inactivos" },
  { value: "TODOS", label: "Todos" },
];

export default function Vehiculos() {
  const [estado, setEstado] = useState("ACTIVOS");
  const [search, setSearch] = useState("");
  const [items, setItems] = useState([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  const [show, setShow] = useState(false);
  const [editing, setEditing] = useState(null);
  const [patente, setPatente] = useState("");

  async function load() {
    setBusy(true);
    setError(null);
    try {
      const { data } = await http.get("/vehiculos", { params: { estado } });
      setItems(data || []);
    } catch {
      setError("No se pudo cargar vehículos.");
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [estado]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return items;
    return items.filter((x) => (x.patente || "").toLowerCase().includes(q));
  }, [items, search]);

  function openNew() {
    setEditing(null);
    setPatente("");
    setError(null);
    setShow(true);
  }

  function openEdit(row) {
    setEditing(row);
    setPatente(row.patente || "");
    setError(null);
    setShow(true);
  }

  function closeModal() {
    setShow(false);
    setEditing(null);
  }

  async function onSave(e) {
    e.preventDefault();
    setError(null);

    const payload = { patente: patente.trim() };
    if (!payload.patente) return setError("Patente obligatoria.");

    setBusy(true);
    try {
      if (editing) await http.put(`/vehiculos/${editing.id}`, payload);
      else await http.post(`/vehiculos`, payload);

      closeModal();
      await load();
    } catch (e2) {
      setError(e2?.response?.data?.message || "Error al guardar.");
    } finally {
      setBusy(false);
    }
  }

  async function toggleActivo(row) {
    setBusy(true);
    setError(null);
    try {
      if (row.activo) await http.patch(`/vehiculos/${row.id}/desactivar`);
      else await http.patch(`/vehiculos/${row.id}/activar`);
      await load();
    } catch {
      setError("No se pudo cambiar el estado.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="container py-4">
      <div className="d-flex align-items-center justify-content-between mb-3">
        <div className="d-flex align-items-center gap-2">
          <Link to="/" className="btn btn-outline-secondary btn-sm">← Volver</Link>
          <h4 className="mb-0">Vehículos</h4>
        </div>
        <button className="btn btn-primary btn-sm" onClick={openNew}>+ Nuevo</button>
      </div>

      <div className="card mb-3">
        <div className="card-body">
          <div className="row g-2">
            <div className="col-12 col-md-3">
              <label className="form-label">Estado</label>
              <select className="form-select" value={estado} onChange={(e) => setEstado(e.target.value)}>
                {ESTADOS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
            <div className="col-12 col-md-7">
              <label className="form-label">Buscar</label>
              <input className="form-control" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Patente…" />
            </div>
            <div className="col-12 col-md-2 d-flex align-items-end">
              <button className="btn btn-outline-primary w-100" onClick={load} disabled={busy}>
                {busy ? "…" : "Actualizar"}
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
                  <th>Patente</th>
                  <th>Punto Operativo</th>
                  <th>Estado</th>
                  <th style={{ width: 240 }}></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((v) => (
                  <tr key={v.id}>
                    <td><b>{v.patente}</b></td>
                    <td className="text-muted">PO #{v.puntoOperativoId}</td>
                    <td>
                      {v.activo ? <span className="badge text-bg-success">Activo</span> : <span className="badge text-bg-secondary">Inactivo</span>}
                    </td>
                    <td className="text-end">
                      <button className="btn btn-outline-secondary btn-sm me-2" onClick={() => openEdit(v)}>Editar</button>
                      <button
                        className={`btn btn-sm ${v.activo ? "btn-outline-danger" : "btn-outline-success"}`}
                        onClick={() => toggleActivo(v)}
                        disabled={busy}
                      >
                        {v.activo ? "Desactivar" : "Activar"}
                      </button>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={4} className="text-center text-muted py-4">{busy ? "Cargando…" : "Sin registros"}</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="text-muted small mt-2">
            Cada vehículo tiene un Punto Operativo tipo <b>VEHICULO</b> para controlar stock “en camión”.
          </div>
        </div>
      </div>

      {show && (
        <div className="modal d-block" tabIndex="-1" role="dialog" style={{ background: "rgba(0,0,0,.35)" }}>
          <div className="modal-dialog" role="document">
            <div className="modal-content">
              <form onSubmit={onSave}>
                <div className="modal-header">
                  <h5 className="modal-title">{editing ? "Editar vehículo" : "Nuevo vehículo"}</h5>
                  <button type="button" className="btn-close" onClick={closeModal} />
                </div>

                <div className="modal-body">
                  {error && <div className="alert alert-danger py-2">{error}</div>}
                  <label className="form-label">Patente *</label>
                  <input className="form-control" value={patente} onChange={(e) => setPatente(e.target.value)} />
                  <div className="form-text">Se normaliza a mayúsculas.</div>
                </div>

                <div className="modal-footer">
                  <button type="button" className="btn btn-outline-secondary" onClick={closeModal} disabled={busy}>Cancelar</button>
                  <button type="submit" className="btn btn-primary" disabled={busy}>{busy ? "Guardando…" : "Guardar"}</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}