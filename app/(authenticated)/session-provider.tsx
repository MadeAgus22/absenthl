"use client"

import type React from "react"
import { createContext, useContext } from "react"

type Session = {
  user?: {
    id: string;
    name: string;
    role: string;
  }
}

const SessionContext = createContext<Session | null>(null);

export function SessionProvider({ children, value }: { children: React.ReactNode, value: Session | null }) {
  return (
    <SessionContext.Provider value={value}>
      {children}
    </SessionContext.Provider>
  );
}

export function useSession() {
  const context = useContext(SessionContext);
  if (context === undefined) {
    throw new Error("useSession must be used within a SessionProvider");
  }
  return context;
}