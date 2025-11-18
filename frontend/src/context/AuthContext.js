import React, { createContext, useState, useEffect } from "react";

export const AuthContext = createContext();

// Read API URL from Vite env var
export const API_BASE = import.meta.env.VITE_API_URL || "https://fastpitch-quiz.onrender.com";

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem("fp_token") || null);
  const [user, setUser] = useState(() => {
    const raw = localStorage.getItem("fp_user");
    return raw ? JSON.parse(raw) : null;
  });

  useEffect(() => {
    if (token) {
      localStorage.setItem("fp_token", token);
    } else {
      localStorage.removeItem("fp_token");
    }
  }, [token]);

  useEffect(() => {
    if (user) {
      localStorage.setItem("fp_user", JSON.stringify(user));
    } else {
      localStorage.removeItem("fp_user");
    }
  }, [user]);

  const login = (newToken, userInfo) => {
    setToken(newToken);
    setUser(userInfo || null);
  };

  const logout = () => {
    setToken(null);
    setUser(null);
  };

  const getAuthHeader = () => (token ? { Authorization: `Bearer ${token}` } : {});

  return (
    <AuthContext.Provider value={{ token, user, login, logout, getAuthHeader, API_BASE }}>
      {children}
    </AuthContext.Provider>
  );
}
