import { useState } from "react";
import { WindowManagerContext } from "./WindowManagerContext";
import type { WindowId } from "./WindowManagerContext";

export function WindowManagerProvider({ children }: { children: React.ReactNode }) {
  const [openDocs, setOpenDocs]   = useState(false);
  const [openAgent, setOpenAgent] = useState(false);
  const [openStats, setOpenStats] = useState(false);
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
  const [zStack, setZStack] = useState<WindowId[]>(["docs", "agent", "kanban", "stats"]);

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

  return (
    <WindowManagerContext.Provider
      value={{
        openDocs,
        openAgent,
        openStats,
        selectedLeadId,
        toggleDocs,
        toggleAgent,
        toggleStats,
        focusWindow,
        getZIndex,
      }}
    >
      {children}
    </WindowManagerContext.Provider>
  );
}