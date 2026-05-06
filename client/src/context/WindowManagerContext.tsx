import { createContext, useContext } from "react";

export type WindowId = "kanban" | "docs" | "agent" | "stats";

export interface WindowManagerContextValue {
  openDocs: boolean;
  openAgent: boolean;
  openStats: boolean;
  selectedLeadId: string | null;
  toggleDocs: (leadId?: string) => void;
  toggleAgent: () => void;
  toggleStats: () => void;
  focusWindow: (id: WindowId) => void;
  getZIndex: (id: WindowId) => number;
}

export const WindowManagerContext = createContext<WindowManagerContextValue | null>(null);

export function useWindowManager() {
  const ctx = useContext(WindowManagerContext);
  if (!ctx) throw new Error("useWindowManager must be used inside WindowManagerProvider");
  return ctx;
}