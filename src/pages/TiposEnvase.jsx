import React, { useEffect, useMemo, useState } from "react";
import { http } from "../api/http.js";
import { Link } from "react-router-dom";

const ESTADOS = [
  { value: "ACTIVOS", label: "Activos" },
  { value: "INACTIVOS", label: "Inactivos" },
  { value: "TODOS", label: "Todos" },
];

function normalizeNumber(v) {
  if (v === "" || v === null || v === undefined) return "";
  return String(v);
}

export default function TiposEnvase() {
  const [estado, setEstado] = useState("ACTIVOS");
  const [search, setSearch] = useState("");
  const [items, setItems] = useState([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  // modal state
  const [show, setShow] = useState(false);
  const [editing, setEditing] = useState(null);

  const [codigo, setCodigo] = useState("");
  const [nombre, setNombre] = useState("");
  const [capacidadKg, setCapacidadKg] = useState("");

  const title = useMemo(() => (editing ? "Editar tipo de envase" : "Nuevo tipo de envase"), [editing]);

  function openNew() {
    setEditing(null);
    setCodigo("");
    setNombre("");
    setCapacidadKg("");
    setShow(true);
  }

  function openEdit(row) {
    setEditing(row);
    setCodigo(row.codigo);
    setNombre(row.nombre);
    setCapacidadKg(normalizeNumber(row.capacidadKg));
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
      const { data } = await http.get("/tipos-envase", {
        params: {
          estado,
          search: search.trim() ? search.trim() : undefined,
        },
      });
      setItems(data);
    } catch (e) {
      setError("No se pudo cargar la lista.");
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [estado]);

  async function onSave(e) {
    e.preventDefault();
    setError(null);

    const payload = {
      codigo: codigo.trim(),
      nombre: nombre.trim(),
      capacidadKg: Number(capacidadKg),
    };

    if (!payload.codigo || !payload.nombre || !payload.capacidadKg || payload.capacidadKg <= 0) {
      setError("Completá código, nombre y capacidad (>0).");
      return;
    }

    setBusy(true);
    try {
      if (editing) {
        await http.put(`/tipos-envase/${editing.id}`, payload);
      } else {
        await http.post(`/tipos-envase`, payload);
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
      if (row.activo) {
        await http.patch(`/tipos-envase/${row.id}/desactivar`);
      } else {
        await http.patch(`/tipos-envase/${row.id}/activar`);
      }
      await load();
    } catch (e) {
      setError("No se pudo cambiar el estado.");
    } finally {
      setBusy(false);
    }
  }

  const filtered = useMemo(() => {
    const s = search.trim().toLowerCase();
    if (!s) return items;
    return items.filter(
      (x) =>
        (x.nombre || "").toLowerCase().includes(s) ||
        (x.codigo || "").toLowerCase().includes(s)
    );
  }, [items, search]);

  return (
    <div className="container py-4">
      <div className="d-flex align-items-center justify-content-between mb-3">
        <div className="d-flex align-items-center gap-2">
          <Link to="/" className="btn btn-outline-secondary btn-sm">
            ← Volver
          </Link>
          <h4 className="mb-0">Tipos de envase</h4>
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
                placeholder="Nombre o código…"
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
                  <th>Código</th>
                  <th>Nombre</th>
                  <th>Capacidad (kg)</th>
                  <th>Estado</th>
                  <th style={{ width: 220 }}></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((row) => (
                  <tr key={row.id}>
                    <td>{row.codigo}</td>
                    <td>{row.nombre}</td>
                    <td>{row.capacidadKg}</td>
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
                    <td colSpan={5} className="text-center text-muted py-4">
                      {busy ? "Cargando…" : "Sin registros"}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modal simple (sin react-bootstrap) */}
      {show && (
        <div className="modal d-block" tabIndex="-1" role="dialog" style={{ background: "rgba(0,0,0,.35)" }}>
          <div className="modal-dialog" role="document">
            <div className="modal-content">
              <form onSubmit={onSave}>
                <div className="modal-header">
                  <h5 className="modal-title">{title}</h5>
                  <button type="button" className="btn-close" onClick={closeModal} />
                </div>

                <div className="modal-body">
                  {error && <div className="alert alert-danger py-2">{error}</div>}

                  <div className="mb-3">
                    <label className="form-label">Código</label>
                    <input className="form-control" value={codigo} onChange={(e) => setCodigo(e.target.value)} />
                    <div className="form-text">Ej: G10, G15, C45</div>
                  </div>

                  <div className="mb-3">
                    <label className="form-label">Nombre</label>
                    <input className="form-control" value={nombre} onChange={(e) => setNombre(e.target.value)} />
                    <div className="form-text">Ej: Garrafa / Cilindro</div>
                  </div>

                  <div className="mb-3">
                    <label className="form-label">Capacidad (kg)</label>
                    <input
                      type="number"
                      step="0.01"
                      className="form-control"
                      value={capacidadKg}
                      onChange={(e) => setCapacidadKg(e.target.value)}
                    />
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