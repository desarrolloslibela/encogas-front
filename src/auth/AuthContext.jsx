import React, { createContext, useEffect, useMemo, useState } from "react";
import { http, setAuthToken } from "../api/http.js";

export const AuthContext = createContext(null);

const LS_KEY = "encogas_auth";

export function AuthProvider({ children }) {
  const [token, setToken] = useState(null);
  const [me, setMe] = useState(null);
  const [loading, setLoading] = useState(true);

  async function fetchMe(tk) {
    setAuthToken(tk);
    const { data } = await http.get("/auth/me");
    return data;
  }

  useEffect(() => {
    (async () => {
      try {
        const raw = localStorage.getItem(LS_KEY);
        if (!raw) return;
        const parsed = JSON.parse(raw);
        if (parsed?.token) {
          setToken(parsed.token);
          const meData = await fetchMe(parsed.token);
          setMe(meData);
        }
      } catch (e) {
        localStorage.removeItem(LS_KEY);
        setAuthToken(null);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  async function login(email, password) {
    const { data } = await http.post("/auth/login", { email, password });
    const tk = data.accessToken;
    setToken(tk);
    localStorage.setItem(LS_KEY, JSON.stringify({ token: tk }));
    const meData = await fetchMe(tk);
    setMe(meData);
    return meData;
  }

  function logout() {
    setToken(null);
    setMe(null);
    localStorage.removeItem(LS_KEY);
    setAuthToken(null);
  }

  const value = useMemo(
    () => ({ token, me, loading, login, logout }),
    [token, me, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}