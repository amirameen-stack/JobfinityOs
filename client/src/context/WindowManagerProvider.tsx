import { useState } from "react";
import { WindowManagerContext } from "./WindowManagerContext";
import type { WindowId } from "./WindowManagerContext";

export function WindowManagerProvider({ children }: { children: React.ReactNode }) {
  const [openDocs, setOpenDocs]   = useState(false);
  const [openAgent, setOpenAgent] = useState(false);
  const [openStats, setOpenStats] = useState(false);
  const [openDashboard, setOpenDashboard] = useState(false);
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
  const [selectedDashboardAgentId, setSelectedDashboardAgentId] = useState<string | null>(null);
  const [zStack, setZStack] = useState<WindowId[]>(["docs", "agent", "kanban", "stats", "dashboard"]);

  function bringToTop(id: WindowId) {
    setZStack(prev => [...prev.filter(w => w !== id), id]);
  }

  function getZIndex(id: WindowId): number {
    return 10 + zStack.indexOf(id) * 10;
  }

  function focusWindow(id: WindowId) {
    bringToTop(id);
  }

  function toggleDocs(leadId?: string) {
    if (leadId) {
      setSelectedLeadId(leadId);
      setOpenDocs(true);
      bringToTop("docs");
      return;
    }
    if (!openDocs) {
      setOpenDocs(true);
      bringToTop("docs");
    } else {
      setOpenDocs(false);
      setSelectedLeadId(null);
    }
  }

  function toggleAgent() {
    if (!openAgent) {
      setOpenAgent(true);
      bringToTop("agent");
    } else {
      setOpenAgent(false);
    }
  }

  function toggleStats() {
    if (!openStats) {
      setOpenStats(true);
      bringToTop("stats");
    } else {
      setOpenStats(false);
    }
  }

  function toggleDashboard(agentId?: string) {
    if (agentId) {
      setSelectedDashboardAgentId(agentId);
      setOpenDashboard(true);
      bringToTop("dashboard");
      return;
    }

    if (!openDashboard) {
      setOpenDashboard(true);
      bringToTop("dashboard");
    } else {
      setOpenDashboard(false);
      setSelectedDashboardAgentId(null);
    }
  }

  return (
    <WindowManagerContext.Provider
      value={{
        openDocs,
        openAgent,
        openStats,
        openDashboard,
        selectedLeadId,
        selectedDashboardAgentId,
        setSelectedDashboardAgentId,
        toggleDocs,
        toggleAgent,
        toggleStats,
        toggleDashboard,
        focusWindow,
        getZIndex,
      }}
    >
      {children}
    </WindowManagerContext.Provider>
  );
}