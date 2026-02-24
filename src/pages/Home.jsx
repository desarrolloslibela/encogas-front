import React, { useContext } from "react";
import { AuthContext } from "../auth/AuthContext.jsx";

export default function Home() {
  const { me, logout } = useContext(AuthContext);

  return (
    <div className="container py-4">
      <div className="d-flex align-items-center justify-content-between mb-3">
        <h4 className="mb-0">Dashboard</h4>
        <button className="btn btn-outline-secondary btn-sm" onClick={logout}>
          Salir
        </button>
      </div>

      <div className="card">
        <div className="card-body">
          <div><b>Usuario:</b> {me?.email}</div>
          <div><b>Empresa:</b> {me?.empresaNombre} (ID {me?.empresaId})</div>
          <div><b>Roles:</b> {(me?.roles || []).join(", ")}</div>
          <hr />
          <div className="text-muted">
            Iteración 1: ABM Clientes + Tipos de Envase + Puntos Operativos + Stock base.
          </div>
        </div>
      </div>
    </div>
  );
}