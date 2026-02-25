import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login.jsx";
import Home from "./pages/Home.jsx";
import RequireAuth from "./auth/RequireAuth.jsx";
import TiposEnvase from "./pages/TiposEnvase.jsx";
import Clientes from "./pages/Clientes.jsx";
import PuntosOperativos from "./pages/PuntosOperativos.jsx";
import StockEnvases from "./pages/StockEnvases.jsx";
import Vehiculos from "./pages/Vehiculos.jsx";
import Jornadas from "./pages/Jornadas.jsx";


export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      <Route
        path="/"
        element={
          <RequireAuth>
            <Home />
          </RequireAuth>
        }
      />

      <Route
        path="/tipos-envase"
        element={
          <RequireAuth>
            <TiposEnvase />
          </RequireAuth>
        }
      />
      <Route
        path="/clientes"
        element={
          <RequireAuth>
            <Clientes />
          </RequireAuth>
        }
      />
      <Route
        path="/puntos-operativos"
        element={
          <RequireAuth>
            <PuntosOperativos />
          </RequireAuth>
        }
      />
      <Route
        path="/stock"
        element={
          <RequireAuth>
            <StockEnvases />
          </RequireAuth>
        }
      />
      <Route
        path="/vehiculos"
        element={
          <RequireAuth>
            <Vehiculos />
          </RequireAuth>
        }
      />
      <Route path="/jornadas" element={<RequireAuth><Jornadas /></RequireAuth>} />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}