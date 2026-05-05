"use client";

import { FileText, Folder, Maximize2, Minimize2, Upload, Loader2, X, Trash2 } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { Rnd } from "react-rnd";
import { useWindowManager } from "@/context/WindowManagerContext";
import { leadService } from "@/services/leadService";
import { api } from "@/api/axios";
import toast from "react-hot-toast";

interface LeadFolder {
  id: string;
  name: string;
}

interface LeadFile {
  id: string;
  name: string;
  url: string;
  created_at: string;
  leads?: {
    lead_folders?: LeadFolder;
  };
}

interface Folder {
  id: string;
  name: string;
}

export function DocumentsModal() {
  const { openDocs, selectedLeadId, getZIndex, focusWindow, toggleDocs } = useWindowManager();
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [files, setFiles] = useState<LeadFile[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [allFolders, setAllFolders] = useState<Folder[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const filteredFiles = selectedFolderId
    ? files.filter(f => f.leads?.lead_folders?.id === selectedFolderId)
    : files;

  const refetchFiles = async () => {
    try {
      setIsLoading(true);
      const data = selectedLeadId
        ? await leadService.getFiles(selectedLeadId)
        : await leadService.getAllFiles();
      setFiles(data);
    } catch (err) {
      console.error("Failed to fetch files:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!openDocs) return;

    const fetchFiles = async () => {
      try {
        setIsLoading(true);
        const data = selectedLeadId
          ? await leadService.getFiles(selectedLeadId)
          : await leadService.getAllFiles();
        setFiles(data);
      } catch (err) {
        console.error("Failed to fetch files:", err);
      } finally {
        setIsLoading(false);
      }
    };

    const fetchFolders = async () => {
      try {
        const res = await api.get("/folders");
        setAllFolders(res.data.data);
      } catch (err) {
        console.error("Failed to fetch folders:", err);
      }
    };

    fetchFiles();
    if (!selectedLeadId) fetchFolders();
  }, [openDocs, selectedLeadId]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedLeadId) return;

    try {
      setIsUploading(true);
      await leadService.uploadFile(selectedLeadId, file);
      toast.success("File uploaded successfully!");
      await refetchFiles();
    } catch (err) {
      toast.error("Upload failed.");
      console.error("Upload failed:", err);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleDeleteFile = async (fileId: string) => {
    try {
      setDeletingId(fileId);
      await leadService.deleteFile(fileId);
      setFiles(prev => prev.filter(f => f.id !== fileId));
      setConfirmDeleteId(null);
      toast.success("File deleted.");
    } catch (err) {
      toast.error("Failed to delete file.");
      console.error("Delete failed:", err);
    } finally {
      setDeletingId(null);
    }
  };

  const handleDownload = (url: string, filename: string) => {
    const downloadUrl = `${url}?download=${encodeURIComponent(filename)}`;
    const link = document.createElement("a");
    link.href = downloadUrl;
    link.target = "_blank";
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div
      className="fixed inset-0 pointer-events-none"
      style={{ zIndex: openDocs ? getZIndex("docs") : -1 }}
    >
      <Rnd
        style={{ pointerEvents: "auto" }}
        onMouseDown={() => focusWindow("docs")}
        default={{ x: 750, y: 200, width: 520, height: 300 }}
        size={isFullScreen ? { width: window.innerWidth - 20, height: window.innerHeight - 120 } : undefined}
        position={isFullScreen ? { x: 10, y: 10 } : undefined}
        minWidth={380}
        minHeight={240}
        bounds="window"
        dragHandleClassName="drag-header"
        disableDragging={isFullScreen}
        enableResizing={!isFullScreen}
      >
        <div className="w-full h-full border border-[#14407B] rounded-xl bg-slate-900 flex flex-col overflow-hidden shadow-2xl">

          <div className="drag-header flex items-center justify-between px-4 py-2 border-b border-slate-800 bg-[#10213E] rounded-t-xl cursor-move">
            <div className="flex items-center gap-3">
              <Folder className="w-5 h-5 text-slate-300" />
              <h2 className="text-base font-semibold text-white truncate max-w-50">
                {typeof selectedLeadId === "string"
                  ? `Documents - ${selectedLeadId.slice(0, 8)}`
                  : "All Documents"}
              </h2>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={!selectedLeadId || isUploading}
                className="p-1.5 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white transition-colors disabled:opacity-30"
                title="Upload file"
              >
                {isUploading ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
              </button>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleUpload}
                className="hidden"
              />
              <button onClick={() => setIsFullScreen(!isFullScreen)} className="text-white hover:text-blue-400 transition-colors">
                {isFullScreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
              </button>
              <button onClick={() => toggleDocs()} className="text-white hover:text-red-400 transition-colors ml-1">
                <X size={16} />
              </button>
            </div>
          </div>

          <div className="flex flex-1 overflow-hidden">
            {!selectedLeadId && (
              <div className="w-36 border-r border-slate-800 bg-[#0A1628]/50 flex flex-col p-3 gap-4">
                <div>
                  <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-3">Folders</h3>
                  <div className="space-y-1">
                    <button
                      onClick={() => setSelectedFolderId(null)}
                      className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs transition-all ${!selectedFolderId ? "bg-blue-500/10 text-blue-400 font-medium" : "text-slate-400 hover:bg-white/5"}`}
                    >
                      <Folder size={14} />
                      <span>All</span>
                    </button>
                    {allFolders.map(folder => (
                      <button
                        key={folder.id}
                        onClick={() => setSelectedFolderId(folder.id)}
                        className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs transition-all ${selectedFolderId === folder.id ? "bg-blue-500/10 text-blue-400 font-medium" : "text-slate-400 hover:bg-white/5"}`}
                      >
                        <FileText size={14} />
                        <span className="truncate">{folder.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            <div className="flex-1 overflow-auto p-4 custom-scroll space-y-3 bg-[#081221]/30">
              {isLoading ? (
                <div className="flex flex-col items-center justify-center h-full gap-3 text-slate-500">
                  <Loader2 size={24} className="animate-spin text-blue-500" />
                  <p className="text-xs">Loading documents...</p>
                </div>
              ) : filteredFiles.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full gap-3 text-slate-500 text-center px-6">
                  <FileText className="w-12 h-12 opacity-10" />
                  <p className="text-sm font-medium">No documents found</p>
                  <p className="text-[11px] opacity-60">
                    {selectedLeadId
                      ? "This lead doesn't have any attached documents yet."
                      : "You haven't uploaded any documents to the system yet."}
                  </p>
                </div>
              ) : (
                filteredFiles.map((file) => (
                  <div key={file.id} className="group border border-slate-700/50 rounded-xl p-3 bg-slate-800/20 hover:bg-slate-800/40 hover:border-blue-500/30 transition-all shadow-lg">
                    <div className="flex justify-between gap-3">
                      <div className="flex gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center shrink-0 group-hover:bg-blue-500/20 transition-colors">
                          <FileText className="w-5 h-5 text-blue-400" />
                        </div>
                        <div className="min-w-0">
                          <h3 className="text-sm font-medium text-white truncate group-hover:text-blue-200 transition-colors">{file.name}</h3>
                          <div className="flex items-center gap-2 mt-0.5">
                            <p className="text-[10px] text-slate-500">
                              Added {new Date(file.created_at).toLocaleDateString()}
                            </p>
                            {file.leads?.lead_folders?.name && (
                              <>
                                <span className="text-slate-700">•</span>
                                <span className="text-[10px] text-blue-400/60 uppercase tracking-tighter">{file.leads.lead_folders.name}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {/* Download */}
                        <button
                          onClick={() => handleDownload(file.url, file.name)}
                          className="px-3 py-1 rounded-full bg-white/5 hover:bg-blue-500 text-[10px] font-bold text-slate-400 hover:text-white transition-all shadow-sm"
                        >
                          DOWNLOAD
                        </button>

                        {/* Delete — two-step confirm */}
                        {confirmDeleteId === file.id ? (
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handleDeleteFile(file.id)}
                              disabled={deletingId === file.id}
                              className="px-2 py-1 rounded-full bg-red-500/20 hover:bg-red-500 text-[10px] font-bold text-red-400 hover:text-white transition-all"
                            >
                              {deletingId === file.id ? <Loader2 size={10} className="animate-spin" /> : "YES"}
                            </button>
                            <button
                              onClick={() => setConfirmDeleteId(null)}
                              className="px-2 py-1 rounded-full bg-white/5 text-[10px] font-bold text-slate-400 hover:text-white transition-all"
                            >
                              NO
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setConfirmDeleteId(file.id)}
                            className="p-1.5 rounded-lg text-slate-600 hover:text-red-400 hover:bg-red-400/10 transition-all opacity-0 group-hover:opacity-100"
                            title="Delete file"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </Rnd>
    </div>
  );
}