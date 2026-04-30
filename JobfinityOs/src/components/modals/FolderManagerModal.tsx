// components/modals/FolderManagerModal.tsx
import { useState, useEffect } from "react";
import { folderApi } from "../../services/folders";
import { X, Pencil, Trash2, Plus, FolderOpen, Folder, Loader2 } from "lucide-react";

interface FolderType {
  id: string;
  name: string;
}

interface Props {
  open: boolean;
  onClose: () => void;
  onFoldersChange: () => void; // tells KanbanBoard to refetch
}

export default function FolderManagerModal({
  open,
  onClose,
  onFoldersChange,
}: Props) {
  const [folders, setFolders] = useState<FolderType[]>([]);
  const [newName, setNewName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(false);

  useEffect(() => {
    if (open) fetchFolders();
  }, [open]);

  async function fetchFolders() {
    try {
      setIsFetching(true); 
      const res = await folderApi.getAll();
      setFolders(res.data.data);
    } catch {
      console.log("error");
    } finally {
      setIsFetching(false);
    }
  }

  async function handleCreate() {
    if (!newName.trim()) return;
    try {
      setIsLoading(true);
      await folderApi.create(newName.trim());
      setNewName("");
      await fetchFolders();
      onFoldersChange();
    } catch {
      console.log("error");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleRename(id: string) {
    if (!editingName.trim()) return;
    try {
      await folderApi.rename(id, editingName.trim());
      setEditingId(null);
      setEditingName("");
      await fetchFolders();
      onFoldersChange();
    } catch {
      console.log("error");
    }
  }

  async function handleDelete(id: string) {
    try {
      await folderApi.delete(id);
      await fetchFolders();
      onFoldersChange();
    } catch {
      console.log("error");
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-500 flex items-center justify-center p-4"
         style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(8px)" }}>
      <div 
        className="w-full max-w-md rounded-2xl text-white shadow-2xl overflow-hidden flex flex-col"
        style={{
          background: "linear-gradient(145deg, #0d1f38 0%, #0a1628 60%, #0c1a30 100%)",
          border: "1px solid rgba(255,255,255,0.08)",
          boxShadow: "0 0 0 1px rgba(59,130,246,0.15), 0 32px 80px rgba(0,0,0,0.6)",
        }}
      >
        {/* Header */}
        <div className="flex justify-between items-center px-6 py-5 border-b border-white/8 bg-white/[0.02]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center">
              <FolderOpen size={16} className="text-blue-400" />
            </div>
            <div>
              <h2 className="text-base font-bold tracking-tight">Manage Folders</h2>
              <p className="text-[11px] text-white/40 font-medium">Organize your leads with folders</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/50 hover:text-white transition-all"
          >
            <X size={16} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 flex flex-col gap-6">
          
          {/* Create new folder */}
          <div className="flex gap-2">
            <input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleCreate()}
              placeholder="New folder name..."
              className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-blue-500/60 focus:bg-white/8 transition-all"
            />
            <button
              onClick={handleCreate}
              disabled={isLoading || !newName.trim()}
              className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 rounded-xl text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-blue-500/20 flex items-center justify-center min-w-[50px]"
            >
              {isLoading ? <Loader2 size={16} className="animate-spin" /> : <Plus size={18} />}
            </button>
          </div>

          {/* Folder list */}
          <div className="flex flex-col gap-2 min-h-[150px] max-h-[300px] overflow-y-auto custom-scroll pr-1">
            {isFetching ? (
              // Skeleton Loader
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3 bg-white/[0.03] border border-white/5 rounded-xl px-4 py-3 animate-pulse">
                  <div className="w-5 h-5 bg-white/10 rounded-md"></div>
                  <div className="flex-1 h-3 bg-white/10 rounded"></div>
                  <div className="w-5 h-5 bg-white/10 rounded"></div>
                </div>
              ))
            ) : folders.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 h-full text-center bg-white/[0.02] rounded-xl border border-white/5 border-dashed">
                <div className="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center mb-3">
                  <Folder size={20} className="text-blue-400" />
                </div>
                <p className="text-sm font-semibold text-white/80">No folders yet</p>
                <p className="text-xs text-white/40 mt-1 max-w-[200px]">Create your first folder above to start organizing your leads.</p>
              </div>
            ) : (
              folders.map((folder) => (
                <div
                  key={folder.id}
                  className="group flex items-center gap-3 bg-white/[0.03] hover:bg-white/[0.05] border border-white/5 hover:border-white/10 rounded-xl px-4 py-3 transition-all"
                >
                  <Folder size={16} className="text-blue-400 shrink-0" />

                  {editingId === folder.id ? (
                    <input
                      autoFocus
                      value={editingName}
                      onChange={(e) => setEditingName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleRename(folder.id);
                        if (e.key === "Escape") setEditingId(null);
                      }}
                      className="flex-1 bg-transparent text-sm text-white focus:outline-none border-b border-blue-500 pb-0.5"
                    />
                  ) : (
                    <span className="flex-1 text-sm font-medium text-white/90 truncate">
                      {folder.name}
                    </span>
                  )}

                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => {
                        setEditingId(folder.id);
                        setEditingName(folder.name);
                      }}
                      className="p-1.5 text-white/40 hover:text-white hover:bg-white/10 rounded-lg transition"
                    >
                      <Pencil size={14} />
                    </button>

                    <button
                      onClick={() => handleDelete(folder.id)}
                      className="p-1.5 text-white/40 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
