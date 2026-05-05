// KanbanBoard.tsx
import { useState, useEffect, useRef } from "react";
import AddLeadModal from "@/components/modals/AddLeadModal";
import FolderManagerModal from "@/components/modals/FolderManagerModal";
import CompanyDetailPanel from "@/features/company/CompanyDetailPanel";
import { useWindowManager } from "@/context/WindowManagerContext";
import { api } from "@/api/axios";
import { leadService } from "@/services/leadService";
import type { Lead } from "@/services/leadService";
import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  pointerWithin,
  useDroppable,
} from "@dnd-kit/core";
import type { DragEndEvent, UniqueIdentifier } from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  Plus,
  Maximize2,
  Minimize2,
  FolderOpen,
  Check,
  MapPin,
  Hash,
  Mail,
  User,
  Crown,
  FileText,
} from "lucide-react";
import { Rnd } from "react-rnd";

// ─── WINDOW EXTENSION ─────────────────────────────────

declare global {
  interface Window {
    openFolderManager?: () => void;
  }
}

// ─── TYPES ─────────────────────────────────────────────

interface CardItem extends Lead {
  folderName: string | null;
}

interface Column {
  label: string;
  dotColor: string;
  badgeBg: string;
  badgeText: string;
  items: CardItem[];
}

interface FolderType {
  id: string;
  name: string;
}

type ColumnKey = "newLeads" | "potential" | "contacted";
type BoardData = Record<ColumnKey, Column>;

// ─── INITIAL DATA ─────────────────────────────────────

const initialData: BoardData = {
  newLeads: {
    label: "NEW LEADS",
    dotColor: "bg-[#1E6FD9]",
    badgeBg: "bg-[#1E6FD9]/20",
    badgeText: "text-[#1E6FD9]",
    items: [],
  },
  potential: {
    label: "POTENTIAL",
    dotColor: "bg-[#6366F1]",
    badgeBg: "bg-[#6366F1]/20",
    badgeText: "text-[#6366F1]",
    items: [],
  },
  contacted: {
    label: "CONTACTED",
    dotColor: "bg-[#F59E0B]",
    badgeBg: "bg-[#F59E0B]/20",
    badgeText: "text-[#F59E0B]",
    items: [],
  },
};

// ─── FOLDER COLORS ────────────────────────────────────

const FOLDER_COLORS = [
  { bg: "bg-violet-500/15", text: "text-violet-400", dot: "bg-violet-400", ring: "ring-violet-500/30" },
  { bg: "bg-sky-500/15",    text: "text-sky-400",    dot: "bg-sky-400",    ring: "ring-sky-500/30"    },
  { bg: "bg-emerald-500/15",text: "text-emerald-400",dot: "bg-emerald-400",ring: "ring-emerald-500/30"},
  { bg: "bg-amber-500/15",  text: "text-amber-400",  dot: "bg-amber-400",  ring: "ring-amber-500/30"  },
  { bg: "bg-rose-500/15",   text: "text-rose-400",   dot: "bg-rose-400",   ring: "ring-rose-500/30"   },
  { bg: "bg-cyan-500/15",   text: "text-cyan-400",   dot: "bg-cyan-400",   ring: "ring-cyan-500/30"   },
];

function getFolderColor(index: number) {
  return FOLDER_COLORS[index % FOLDER_COLORS.length];
}

// ─── FOLDER ASSIGNMENT POPUP ──────────────────────────

function FolderAssignmentPopup({
  leadId,
  currentFolderId,
  folders,
  onAssign,
  onClose,
}: {
  leadId: string;
  currentFolderId: string | null;
  folders: FolderType[];
  onAssign: (leadId: string, folderId: string | null) => void;
  onClose: () => void;
}) {
  const popupRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (popupRef.current && !popupRef.current.contains(event.target as Node)) {
        onClose();
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onClose]);

  return (
    <div
      ref={popupRef}
      className="absolute top-full mt-1.5 right-0 z-50 w-56 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.5)] overflow-hidden border border-white/5 bg-[#0a1525]/95 backdrop-blur-xl"
      onClick={(e) => e.stopPropagation()}
    >
      {/* Label */}
      <div className="px-4 pt-3 pb-2 flex justify-between items-center">
        <p className="text-[10px] font-semibold text-[#3a5a7a] uppercase tracking-widest">Move to folder</p>
        <button
          onClick={(e) => {
            e.stopPropagation();
            window.openFolderManager?.();
            onClose();
          }}
          className="p-1 rounded-full text-[10px] font-bold text-blue-400/80 hover:bg-blue-500/10 hover:text-blue-400 transition-all uppercase tracking-wider"
        >
          <Plus size={12} />
        </button>
      </div>

      {/* Options */}
      <div className="px-2 pb-2 space-y-0.5 max-h-52 overflow-y-auto custom-scroll">
        {/* No folder chip */}
        <button
          onClick={(e) => { e.stopPropagation(); onAssign(leadId, null); onClose(); }}
          className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs text-left transition-all group ${
            currentFolderId === null
              ? "bg-white/8 text-[#c0d4e8]"
              : "text-[#4a6a8a] hover:bg-white/5 hover:text-[#8ab0cc]"
          }`}
        >
          <span className={`w-2 h-2 rounded-full shrink-0 ${currentFolderId === null ? "bg-[#3a5a7a]" : "bg-[#1e3a5a]"}`} />
          <span className="flex-1 font-medium">No folder</span>
          {currentFolderId === null && <Check size={11} className="text-[#60a5fa] shrink-0" />}
        </button>

        {folders.length > 0 && <div className="h-px bg-white/5 mx-1 my-1.5" />}

        {/* Folder chips */}
        {folders.map((folder, i) => {
          const color = getFolderColor(i);
          const isActive = currentFolderId === folder.id;
          return (
            <button
              key={folder.id}
              onClick={(e) => { e.stopPropagation(); onAssign(leadId, folder.id); onClose(); }}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs text-left transition-all group ${
                isActive ? `${color.bg} ${color.text}` : "text-[#4a6a8a] hover:bg-white/5 hover:text-[#8ab0cc]"
              }`}
            >
              <span className={`w-2 h-2 rounded-full shrink-0 ${isActive ? color.dot : "bg-[#1e3a5a] group-hover:bg-[#2a4a6a]"}`} />
              <span className="flex-1 truncate font-medium">{folder.name}</span>
              {isActive && <Check size={11} className="shrink-0" />}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── CARD ─────────────────────────────────────────────

function Card({
  item,
  folders,
  onAssignFolder,
  toggleDocs,
  onSelect,
}: {
  item: CardItem;
  folders: FolderType[];
  onAssignFolder: (leadId: string, folderId: string | null) => void;
  toggleDocs: (leadId: string) => void;
  onSelect: (item: CardItem) => void;
}) {
  const {
    setNodeRef,
    attributes,
    listeners,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id });

  const [showPopup, setShowPopup] = useState(false);

  const dragAttributes = {
    ...attributes,
    onPointerDown: undefined,
    onKeyDown: undefined,
  };

  const dragListeners = {
    onPointerDown: (e: React.PointerEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest(".folder-selector") && !target.closest(".folder-popup")) {
        listeners?.onPointerDown?.(e);
      }
    },
  };

  const folderIndex = folders.findIndex((f) => f.id === item.folder_id);
  const folderColor = folderIndex >= 0 ? getFolderColor(folderIndex) : null;

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      {...dragAttributes}
      {...dragListeners}
      onClick={() => onSelect(item)}
      className={`flex flex-col w-full rounded-2xl gap-3 p-4 border cursor-grab active:cursor-grabbing relative transition-all ${
        isDragging
          ? "opacity-40 scale-95 border-[#1E6FD9]/40 bg-[#0c1928]"
          : "bg-[#0c1928] border-[#162438] hover:border-[#1E3A5F] hover:bg-[#0e1e32] hover:shadow-[0_6px_24px_rgba(0,0,0,0.45)]"
      }`}
    >
      {/* Header: Crown + Folder tag */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="bg-[#1E6FD9]/10 ring-1 ring-[#1E6FD9]/25 rounded-lg p-1.5">
            <Crown size={13} className="text-[#4a9eff]" />
          </div>
          <span className="flex items-center gap-0.5 text-[10px] font-semibold text-[#2a4a6a] font-mono">
            <Hash size={9} />{item.id.slice(0, 6)}
          </span>
        </div>

        {/* Folder tag — click to open picker */}
        <div className="relative folder-selector">
          <button
            onClick={(e) => { e.stopPropagation(); setShowPopup(!showPopup); }}
            onPointerDown={(e) => { e.stopPropagation(); e.preventDefault(); }}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold ring-1 transition-all cursor-pointer ${
              folderColor
                ? `${folderColor.bg} ${folderColor.text} ${folderColor.ring}`
                : "bg-white/4 text-[#3a5a7a] ring-white/8 hover:bg-white/8 hover:text-[#5a8aaa]"
            }`}
          >
            <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${folderColor ? folderColor.dot : "bg-[#2a4a6a]"}`} />
            <span className="max-w-24 truncate">
              {item.folderName ?? "No folder"}
            </span>
          </button>

          {showPopup && (
            <div className="folder-popup">
              <FolderAssignmentPopup
                leadId={item.id}
                currentFolderId={item.folder_id || null}
                folders={folders}
                onAssign={(leadId, folderId) => {
                  onAssignFolder(leadId, folderId);
                  setShowPopup(false);
                }}
                onClose={() => setShowPopup(false)}
              />
            </div>
          )}
        </div>
      </div>

      {/* Company & Contact Info */}
      <div className="space-y-1.5">
        <h3 className="text-sm font-semibold text-[#c8ddf2] leading-tight">{item.company_name}</h3>

        <div className="flex items-center gap-1.5 text-xs text-[#4a6a8a]">
          <User size={11} />
          <span>{item.contact_name}</span>
        </div>

        {(item.city || item.country) && (
          <div className="flex items-center gap-1.5 text-xs text-[#4a6a8a]">
            <MapPin size={11} />
            <span>{item.city}</span>
          </div>
        )}
      </div>

      {/* Footer: email + files */}
      <div className="flex items-center justify-between pt-2 border-t border-[#162438]">
        <div className="flex items-center gap-1.5 text-[11px] text-[#3a5a7a] bg-[#081520] px-2.5 py-1 rounded-full ring-1 ring-white/5">
          <Mail size={10} />
          <span className="truncate max-w-30">{item.email}</span>
        </div>

        {/* File count indicator */}
        <div
          onClick={(e) => { e.stopPropagation(); toggleDocs(item.id); }}
          className="flex items-center gap-1 text-[10px] font-semibold text-[#4a6a8a] hover:text-[#60a5fa] cursor-pointer transition-colors group"
        >
          <FileText size={12} className="group-hover:scale-110 transition-transform" />
          <span>{item.file_count ?? 0}</span>
        </div>
      </div>
    </div>
  );
}

// ─── DROPPABLE COLUMN ─────────────────────────────────

function ColumnContainer({
  id,
  children,
}: {
  id: string;
  children: React.ReactNode;
}) {
  const { setNodeRef } = useDroppable({ id });
  return (
    <div
      ref={setNodeRef}
      className="flex flex-col gap-3 min-h-12.5 p-2 rounded-lg"
    >
      {children}
    </div>
  );
}

// ─── SKELETON CARD ────────────────────────────────────

function SkeletonCard() {
  return (
    <div className="flex flex-col w-full rounded-2xl gap-3 p-4 border border-[#1a3150] bg-[#0d1e30] animate-pulse">
      <div className="flex justify-between items-center">
        <div className="w-8 h-8 rounded-xl bg-[#142840]" />
        <div className="w-16 h-4 rounded-full bg-[#142840]" />
      </div>
      <div className="space-y-2">
        <div className="w-3/4 h-4 rounded bg-[#142840]" />
        <div className="w-1/2 h-3 rounded bg-[#142840]" />
        <div className="w-2/3 h-3 rounded bg-[#142840]" />
      </div>
      <div className="flex justify-between items-center pt-2 border-t border-[#1a3150]/60">
        <div className="w-20 h-5 rounded-full bg-[#142840]" />
        <div className="w-24 h-5 rounded-lg bg-[#142840]" />
      </div>
    </div>
  );
}

// ─── MAIN BOARD ───────────────────────────────────────

export default function KanbanBoard() {
  const { getZIndex, focusWindow, toggleDocs } = useWindowManager();
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [openModal, setOpenModal] = useState(false);
  const [isFolderModalOpen, setIsFolderModalOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [folders, setFolders] = useState<FolderType[]>([]);

  useEffect(() => {
    window.openFolderManager = () => setIsFolderModalOpen(true);
    return () => {
      delete window.openFolderManager;
    };
  }, []);

  const [board, setBoard] = useState<BoardData>({
    newLeads: { ...initialData.newLeads, items: [] },
    potential: { ...initialData.potential, items: [] },
    contacted: { ...initialData.contacted, items: [] },
  });

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    })
  );

  // ── helpers ──────────────────────────────────────────

  function findCardLocation(id: UniqueIdentifier) {
    for (const colKey of Object.keys(board) as ColumnKey[]) {
      const col = board[colKey];
      const itemIdx = col.items.findIndex((i) => i.id === id);
      if (itemIdx !== -1) return { colKey, itemIdx };
    }
    return null;
  }

  function totalItems(col: Column) {
    return col.items.length;
  }

  // ── add lead ─────────────────────────────────────────

  function handleAddLead(newLead: Lead) {
    setBoard((prev) => {
      const next = structuredClone(prev);
      next.newLeads.items.push({
        id: newLead.id,
        company_name: newLead.company_name,
        contact_name: newLead.contact_name,
        email: newLead.email,
        phone: newLead.phone,
        job_title: newLead.job_title,
        job_department: newLead.job_department,
        job_level: newLead.job_level,
        company_size: newLead.company_size,
        revenue_range: newLead.revenue_range,
        city: newLead.city,
        country: newLead.country,
        folder_id: newLead.folder_id || null,
        folderName: newLead.lead_folders?.name || null,
      });
      return next;
    });
    void fetchLeads();
  }

  // ── assign folder to lead ───────────────────────────

  async function handleAssignFolder(leadId: string, folderId: string | null) {
    try {
      await leadService.assignFolder(leadId, folderId);

      setBoard((prev) => {
        const next = structuredClone(prev);
        for (const colKey of Object.keys(next) as ColumnKey[]) {
          const item = next[colKey].items.find((i) => i.id === leadId);
          if (item) {
            const folder = folders.find((f) => f.id === folderId);
            item.folder_id = folderId;
            item.folderName = folder?.name || null;
            break;
          }
        }
        return next;
      });
    } catch (err) {
      console.error("Failed to assign folder:", err);
    }
  }

  // ── drag end ─────────────────────────────────────────

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over) return;

    const from = findCardLocation(active.id);
    if (!from) return;

    let overColKey: ColumnKey | undefined;
    const loc = findCardLocation(over.id);
    if (loc) {
      overColKey = loc.colKey;
    } else if ((Object.keys(board) as string[]).includes(over.id as string)) {
      overColKey = over.id as ColumnKey;
    }
    if (!overColKey) return;

    if (from.colKey !== overColKey) {
      try {
        await leadService.updateStatus(active.id as string, overColKey);
      } catch (err) {
        console.log(err);
      }
    }

    setBoard((prev) => {
      const next = structuredClone(prev);
      const fromItems = next[from.colKey].items;
      const [moved] = fromItems.splice(from.itemIdx, 1);

      if (from.colKey === overColKey) {
        const toItemIdx = fromItems.findIndex((i) => i.id === over.id);
        fromItems.splice(
          toItemIdx === -1 ? fromItems.length : toItemIdx,
          0,
          moved
        );
      } else {
        next[overColKey!].items.push(moved);
      }
      return next;
    });
  }

  // ── fetch folders ────────────────────────────────────

  async function fetchFolders() {
    try {
      const res = await api.get("/folders");
      setFolders(res.data.data || []);
    } catch (err) {
      console.error("Failed to fetch folders:", err);
    }
  }

  // ── fetch leads ──────────────────────────────────────

  async function fetchLeads() {
    try {
      setIsLoading(true);
      const leads = await leadService.getAll();

      const newBoard: BoardData = {
        newLeads: { ...initialData.newLeads, items: [] },
        potential: { ...initialData.potential, items: [] },
        contacted: { ...initialData.contacted, items: [] },
      };

      leads.forEach((lead) => {
        const status = (lead.status || "newLeads") as ColumnKey;
        const col = newBoard[status];

        col.items.push({
          ...lead,
          folderName: lead.lead_folders?.name || null,
        });
      });

      setBoard(newBoard);
    } catch (err) {
      console.log(err);
    } finally {
      setIsLoading(false);
    }
  }

  // ── combined initial fetch ───────────────────────────

  useEffect(() => {
    (async () => {
      await Promise.all([fetchLeads(), fetchFolders()]);
    })();
  }, []);

  // ─── RENDER ───────────────────────────────────────────

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={pointerWithin}
      onDragEnd={handleDragEnd}
    >
      <Rnd
        default={{ x: 30, y: 10, width: 580, height: 436 }}
        size={
          isFullScreen
            ? {
                width: window.innerWidth - 20,
                height: window.innerHeight - 120,
              }
            : undefined
        }
        position={isFullScreen ? { x: 10, y: 10 } : undefined}
        minWidth={800}
        minHeight={300}
        bounds="window"
        dragHandleClassName="drag-header"
        disableDragging={isFullScreen}
        enableResizing={!isFullScreen}
        style={{ zIndex: getZIndex("kanban") }}
      >
        <div
          className="h-full border border-[#14407B] rounded-xl bg-[#08182b] flex flex-col"
          onMouseDown={() => focusWindow("kanban")}
        >
          {/* HEADER */}
          <header className="drag-header bg-[#10213E] flex text-white p-3 justify-between items-center rounded-t-xl cursor-move">
            <span className="font-semibold text-sm">JobfinityOS CRM - Kanban Board</span>
            <div className="flex gap-3 items-center">
              <FolderOpen
                size={16}
                onClick={() => setIsFolderModalOpen(true)}
                className="cursor-pointer hover:text-[#1E6FD9] transition-colors text-[#7a9ab5]"
              />
              <Plus
                size={16}
                onClick={() => setOpenModal(true)}
                className="cursor-pointer hover:text-[#1E6FD9] transition-colors text-[#7a9ab5]"
              />
              <button
                onClick={() => setIsFullScreen(!isFullScreen)}
                className="text-[#7a9ab5] hover:text-white transition-colors"
              >
                {isFullScreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
              </button>
            </div>
          </header>

          {/* BOARD */}
          <main className="flex gap-4 p-4 overflow-x-auto flex-1 custom-scroll">
            {(Object.entries(board) as [ColumnKey, Column][]).map(([key, col]) => (
              <div
                key={key}
                className="flex flex-col gap-3 flex-1 min-w-70 max-w-[320px]"
              >
                {/* COLUMN HEADER */}
                <div className="flex items-center gap-2 px-1">
                  <span className={`${col.dotColor} w-2 h-2 rounded-full shadow-lg`} />
                  <span className="text-xs font-semibold text-[#7a9ab5] uppercase tracking-wide">
                    {col.label}
                  </span>
                  <span
                    className={`${col.badgeBg} ${col.badgeText} text-xs px-1.5 py-0.5 rounded-full ml-auto font-medium`}
                  >
                    {isLoading ? "—" : totalItems(col)}
                  </span>
                </div>

                {/* COLUMN BODY */}
                <SortableContext
                  items={col.items.map((i) => i.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <ColumnContainer id={key}>
                    {isLoading ? (
                      Array.from({ length: 2 }).map((_, i) => <SkeletonCard key={i} />)
                    ) : col.items.length === 0 ? (
                      <div className="flex flex-col w-full rounded-2xl gap-2 p-6 border border-dashed border-[#1a3150] bg-[#0d1e30]/50 text-center">
                        <p className="text-xs text-[#2a4560]">No leads yet</p>
                        <p className="text-[10px] text-[#1e3450]">Drag or add new leads</p>
                      </div>
                    ) : (
                      col.items.map((item) => (
                        <Card
                          key={item.id}
                          item={item}
                          folders={folders}
                          onAssignFolder={handleAssignFolder}
                          toggleDocs={toggleDocs}
                          onSelect={setSelectedLead}
                        />
                      ))
                    )}
                  </ColumnContainer>
                </SortableContext>
              </div>
            ))}
          </main>
        </div>
      </Rnd>

      <AddLeadModal
        open={openModal}
        onClose={() => setOpenModal(false)}
        onAdd={handleAddLead}
      />
      <FolderManagerModal
        open={isFolderModalOpen}
        onClose={() => setIsFolderModalOpen(false)}
        onFoldersChange={() => {
          void fetchLeads();
          void fetchFolders();
        }}
      />
      <CompanyDetailPanel
        lead={selectedLead}
        onClose={() => setSelectedLead(null)}
      />
    </DndContext>
  );
}