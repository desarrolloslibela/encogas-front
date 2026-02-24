import React, { useContext } from "react";
import { Navigate } from "react-router-dom";
import { AuthContext } from "./AuthContext.jsx";

export default function RequireAuth({ children }) {
  const { token, loading } = useContext(AuthContext);

  if (loading) return <div className="p-4">Cargando...</div>;
  if (!token) return <Navigate to="/login" replace />;
  return children;
}