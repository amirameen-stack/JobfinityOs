import { useState } from "react";
import { WindowManagerContext } from "./WindowManagerContext";
import type { WindowId } from "./WindowManagerContext";

export function WindowManagerProvider({ children }: { children: React.ReactNode }) {
  const [openDocs, setOpenDocs] = useState(false);
  const [openAgent, setOpenAgent] = useState(false);
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
  // rightmost = highest z-index
  const [zStack, setZStack] = useState<WindowId[]>(["docs", "agent", "kanban"]);

  function bringToTop(id: WindowId) {
    setZStack((prev) => [...prev.filter((w) => w !== id), id]);
  }

  function getZIndex(id: WindowId): number {
    return 10 + zStack.indexOf(id) * 10; // 10, 20, 30
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

  return (
    <WindowManagerContext.Provider
      value={{
        openDocs,
        openAgent,
        selectedLeadId,
        toggleDocs,
        toggleAgent,
        focusWindow,
        getZIndex,
      }}
    >
      {children}
    </WindowManagerContext.Provider>
  );
}
