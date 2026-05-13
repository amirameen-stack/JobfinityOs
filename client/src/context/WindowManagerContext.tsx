import { createContext, useContext } from "react";

export type WindowId = "kanban" | "docs" | "agent" | "stats" | "dashboard";

export interface WindowManagerContextValue {
  openDocs: boolean;
  openAgent: boolean;
  openStats: boolean;
  openDashboard: boolean;
  selectedLeadId: string | null;
  selectedDashboardAgentId: string | null;
  setSelectedDashboardAgentId: (agentId: string | null) => void;
  toggleDocs: (leadId?: string) => void;
  toggleAgent: () => void;
  toggleStats: () => void;
  toggleDashboard: (agentId?: string) => void;
  focusWindow: (id: WindowId) => void;
  getZIndex: (id: WindowId) => number;
}

export const WindowManagerContext = createContext<WindowManagerContextValue | null>(null);

export function useWindowManager() {
  const ctx = useContext(WindowManagerContext);
  if (!ctx) throw new Error("useWindowManager must be used inside WindowManagerProvider");
  return ctx;
}