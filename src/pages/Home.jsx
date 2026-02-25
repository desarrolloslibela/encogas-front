import React, { useContext } from "react";
import { AuthContext } from "../auth/AuthContext.jsx";
import { Link } from "react-router-dom";

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

      <div className="card mb-3">
        <div className="card-body">
          <div><b>Usuario:</b> {me?.email}</div>
          <div><b>Empresa:</b> {me?.empresaNombre} (ID {me?.empresaId})</div>
          <div><b>Roles:</b> {(me?.roles || []).join(", ")}</div>
          <hr />
          <div className="d-flex gap-2 flex-wrap">
            <Link className="btn btn-primary btn-sm" to="/tipos-envase">
              Tipos de envase
            </Link>
            <Link className="btn btn-primary btn-sm" to="/clientes">
              Clientes
            </Link>
            <Link className="btn btn-primary btn-sm" to="/puntos-operativos">
              Puntos operativos
            </Link>
            <Link className="btn btn-primary btn-sm" to="/stock">
              Stock (puntos)
            </Link>
            <Link className="btn btn-primary btn-sm" to="/vehiculos">
              Vehículos
            </Link>
            <Link className="btn btn-primary btn-sm" to="/jornadas">
              Jornadas
            </Link>
          </div>
        </div>
      </div>

      <div className="text-muted">
        Iteración 1: Tipos de Envase (este módulo) → luego Clientes, Puntos Operativos, Stock base.
      </div>
    </div>
  );
}