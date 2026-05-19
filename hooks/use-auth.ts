"use client";

import { useState, useEffect } from "react";

interface AuthUser {
  id?: string;
  email?: string;
  name?: string;
  mobile?: string;
}

interface AuthState {
  isAuthenticated: boolean;
  user: AuthUser | null;
  upstoxTokenValid: boolean;
  loading: boolean;
}

export function useAuth(): AuthState {
  const [state, setState] = useState<AuthState>({
    isAuthenticated: false,
    user: null,
    upstoxTokenValid: false,
    loading: true,
  });

  useEffect(() => {
    fetch("/api/auth/session")
      .then((res) => {
        if (res.ok) return res.json();
        throw new Error("Not authenticated");
      })
      .then((data) => {
        setState({
          isAuthenticated: data.authenticated,
          user: data.user || null,
          upstoxTokenValid: data.upstoxTokenValid ?? false,
          loading: false,
        });
      })
      .catch(() => {
        setState({
          isAuthenticated: false,
          user: null,
          upstoxTokenValid: false,
          loading: false,
        });
      });
  }, []);

  return state;
}
