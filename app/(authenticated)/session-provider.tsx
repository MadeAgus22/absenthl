"use client"

import type React from "react"
import { createContext, useContext } from "react"

// Tipe data untuk sesi, bisa Anda kembangkan nanti
type Session = {
  user?: {
    id: string;
    name: string;
    role: string;
  }
}

// Buat Context
const SessionContext = createContext<Session | null>(null);

// Buat Provider
export function SessionProvider({ children, value }: { children: React.ReactNode, value: Session | null }) {
  return (
    <SessionContext.Provider value={value}>
      {children}
    </SessionContext.Provider>
  );
}

// Buat custom hook untuk mempermudah penggunaan
export function useSession() {
  const context = useContext(SessionContext);
  if (context === undefined) {
    throw new Error("useSession must be used within a SessionProvider");
  }
  return context;
}