"use client";

import {
  FileText, Folder, Maximize2, Minimize2, Upload, Loader2, X, Trash2,
  FileEdit, Send, Download, Bold, Italic, Underline as UnderlineIcon,
  Heading1, Heading2, List, ListOrdered, AlignLeft, AlignCenter, AlignRight, Mail,
  Link as LinkIcon, Image as ImageIcon, PenTool
} from "lucide-react";
import { useState, useEffect, useRef, useCallback } from "react";
import { Rnd } from "react-rnd";
import { useWindowManager } from "@/context/WindowManagerContext";
import { leadService } from "@/services/leadService";
import type { Lead } from "@/services/leadService";
import { api } from "@/api/axios";
import toast from "react-hot-toast";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import TextAlign from "@tiptap/extension-text-align";
import Placeholder from "@tiptap/extension-placeholder";
import Link from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";
import { Table } from "@tiptap/extension-table";
import { TableRow } from "@tiptap/extension-table-row";
import { TableCell } from "@tiptap/extension-table-cell";
import { TableHeader } from "@tiptap/extension-table-header";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import SignaturePad from "signature_pad";

// ─── TYPES ────────────────────────────────────────────────────────────────────

interface LeadFile {
  id: string;
  name: string;
  url: string;
  created_at: string;
  leads?: { lead_folders?: { id: string; name: string } };
}

interface FolderType { id: string; name: string; }
type TabType = "documents" | "proposal";

// ─── TOOLBAR BUTTON ───────────────────────────────────────────────────────────

function ToolbarBtn({
  onClick, active, title, children,
}: {
  onClick: () => void; active?: boolean; title: string; children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onMouseDown={(e) => { e.preventDefault(); onClick(); }}
      title={title}
      className={`p-1.5 rounded-md transition-all select-none ${active
        ? "bg-blue-500/20 text-blue-400"
        : "text-slate-500 hover:bg-white/5 hover:text-slate-200"
        }`}
    >
      {children}
    </button>
  );
}

// ─── PROPOSAL EDITOR ─────────────────────────────────────────────────────────

function ProposalEditor({
  leadId, lead, onFileSaved,
}: {
  leadId: string; lead: Lead | null; onFileSaved: () => void;
}) {
  const [isSending, setIsSending] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [showSignModal, setShowSignModal] = useState(false);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const signaturePadRef = useRef<SignaturePad | null>(null);

  useEffect(() => {
    if (showSignModal && canvasRef.current) {
      signaturePadRef.current = new SignaturePad(canvasRef.current, {
        penColor: 'rgb(0, 0, 0)'
      });
    }
    return () => {
      if (signaturePadRef.current) {
        signaturePadRef.current.off();
      }
    };
  }, [showSignModal]);

  const buildDefaultContent = (l: Lead | null) =>
    l
      ? `<h1>Business Proposal</h1><p>Prepared for: <strong>${l.company_name}</strong><br>Attention: ${l.contact_name}</p><h2>Executive Summary</h2><p>We are pleased to present this proposal for ${l.company_name}. This document outlines our approach, scope of work, and investment required to achieve your objectives.</p><h2>Scope of Work</h2><p>The following services will be delivered:</p><ul><li>Service item 1</li><li>Service item 2</li><li>Service item 3</li></ul><h2>Pricing &amp; Investment</h2><p>Based on your requirements, the total investment is outlined below.</p><h2>Timeline</h2><p>We propose the following timeline to deliver this project successfully.</p><h2>Next Steps</h2><p>Please review this proposal and reach out at your earliest convenience. We look forward to partnering with ${l.company_name}.</p><table class="signature-table" style="width: 100%; border-collapse: collapse; margin-top: 25px;"><tbody><tr><td style="width: 45%; padding-bottom: 6px;"><p style="font-size: 11px; font-weight: bold; margin: 0;">Authorized Signature</p><p style="font-size: 9px; margin: 0;">On behalf of JobfinityOS</p></td><td style="width: 10%;"></td><td style="width: 45%; padding-bottom: 6px;"><p style="font-size: 11px; font-weight: bold; margin: 0;">Client Signature</p><p style="font-size: 9px; margin: 0;">${l.contact_name} · ${l.company_name}</p></td></tr><tr><td style="width: 45%; border-bottom: 2px solid #333; height: 35px; vertical-align: bottom;"></td><td></td><td style="width: 45%; border-bottom: 2px solid #333; height: 35px; vertical-align: bottom;"></td></tr></tbody></table>`
      : "<h1>Business Proposal</h1><p>Start writing your proposal here...</p>";

  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      Placeholder.configure({ placeholder: "Start writing your proposal..." }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-blue-500 underline cursor-pointer',
        },
      }),
      Image.configure({
        allowBase64: true,
        HTMLAttributes: {
          class: 'max-w-60 h-10 rounded-lg my-1',
        },
      }),
      Table.configure({
        resizable: true,
        HTMLAttributes: {
          class: 'border-collapse table-auto w-full',
        },
      }),
      TableRow,
      TableHeader,
      TableCell,
    ],
    content: localStorage.getItem(`proposal-${leadId}`) || buildDefaultContent(lead),
    onUpdate: ({ editor }) => {
      localStorage.setItem(`proposal-${leadId}`, editor.getHTML());
    },
  });

  // Reset content when leadId or lead changes
  useEffect(() => {
    if (!editor) return;
    const saved = localStorage.getItem(`proposal-${leadId}`);
    editor.commands.setContent(saved || buildDefaultContent(lead), { emitUpdate: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [leadId]);

  const generatePDF = useCallback(async () => {
    if (!editor) return null;
    const html = editor.getHTML();

    const wrapper = document.createElement("div");
    wrapper.style.cssText = "position:absolute;top:-9999px;left:-9999px;width:794px;background:#fff;";

    const inner = document.createElement("div");
    inner.style.cssText = "font-family:Arial,sans-serif;padding:48px 56px;color:#1a1a1a;font-size:13px;line-height:1.7;";
    inner.innerHTML = `
      <div style="background:linear-gradient(135deg,#1E6FD9,#0d4fa0);padding:24px 30px;border-radius:10px;margin-bottom:32px;">
        <div style="color:white;font-size:22px;font-weight:700;">Business Proposal</div>
        ${lead ? `<div style="color:rgba(255,255,255,0.75);font-size:13px;margin-top:6px;">Prepared for: ${lead.company_name}</div>` : ""}
      </div>
      <style>
        h1{font-size:20px;color:#1E6FD9;margin:24px 0 8px;font-weight:700;}
        h2{font-size:15px;color:#1E6FD9;margin:20px 0 8px;border-bottom:1px solid #e5e7eb;padding-bottom:5px;font-weight:600;}
        p{margin:8px 0;color:#374151;}
        ul{list-style-type:disc;padding-left:20px;margin:8px 0;}
        ol{list-style-type:decimal;padding-left:20px;margin:8px 0;}
        li{margin:4px 0;color:#374151;}
        strong{color:#111827;font-weight:600;}
        em{font-style:italic;}
        .signature-section{margin-top:60px;border-top:1px solid #eee;padding-top:30px;}
        .signature-table{width:100%;border-collapse:collapse;}
        .signature-cell{width:50%;vertical-align:top;padding:0 10px;}
        .signature-line{border-bottom:1px solid #333;height:40px;margin-bottom:8px;}
        img{max-width:60%;height:40px;border-radius:8px;margin:16px 0;}
        a{color:#1E6FD9;text-decoration:underline;}
      </style>
      ${html}
      <div style="margin-top:48px;padding-top:16px;border-top:1px solid #e5e7eb;color:#9ca3af;font-size:11px;text-align:center;">
        Generated by JobfinityOS CRM · ${new Date().toLocaleDateString()}
      </div>
    `;

    wrapper.appendChild(inner);
    document.body.appendChild(wrapper);

    try {
      const canvas = await html2canvas(inner, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#ffffff",
        width: 794,
        windowWidth: 794,
      });

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
      const pdfW = pdf.internal.pageSize.getWidth();
      const pdfH = pdf.internal.pageSize.getHeight();
      const imgH = (canvas.height * pdfW) / canvas.width;

      let remaining = imgH;
      let posY = 0;
      pdf.addImage(imgData, "PNG", 0, posY, pdfW, imgH);
      remaining -= pdfH;

      while (remaining > 0) {
        posY -= pdfH;
        pdf.addPage();
        pdf.addImage(imgData, "PNG", 0, posY, pdfW, imgH);
        remaining -= pdfH;
      }

      return pdf;
    } finally {
      document.body.removeChild(wrapper);
    }
  }, [editor, lead]);

  const handleExportPDF = async () => {
    try {
      setIsExporting(true);
      const pdf = await generatePDF();
      if (!pdf) return;

      // 1. Download locally
      pdf.save(lead ? `Proposal - ${lead.company_name}.pdf` : "Proposal.pdf");

      // 2. Save to backend (without sending email)
      if (lead) {
        const pdfBase64 = pdf.output("datauristring").split(",")[1];
        await api.post("/proposals/send", {
          leadId,
          html: editor.getHTML(),
          pdfBase64,
          subject: `Proposal for ${lead.company_name}`,
          sendEmail: false
        });
        onFileSaved(); // Refresh documents list
      }

      toast.success("PDF exported and saved to documents!");
    } catch (err: any) {
      console.error(err);
      toast.error("Failed to export/save PDF.");
    } finally {
      setIsExporting(false);
    }
  };

  const handleSendToClient = async () => {
    if (!lead) { toast.error("No lead selected."); return; }
    if (!editor) return;
    try {
      setIsSending(true);
      const pdf = await generatePDF();
      const pdfBase64 = pdf ? pdf.output("datauristring").split(",")[1] : undefined;
      const res = await api.post("/proposals/send", {
        leadId,
        html: editor.getHTML(),
        pdfBase64,
        subject: `Proposal for ${lead.company_name}`,
      });
      toast.success(res.data.message || "Proposal sent!");
      onFileSaved();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to send proposal.");
    } finally {
      setIsSending(false);
    }
  };

  if (!editor) return null;

  return (
    <div className="flex flex-col h-full w-full overflow-hidden">

      {/* Action bar */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-slate-800/60 bg-[#0E1E32] shrink-0">
        <div className="flex items-center gap-2">
          {lead && (
            <div className="flex items-center gap-1.5 text-[10px] text-slate-500 bg-[#071220]/80 px-2.5 py-1 rounded-full ring-1 ring-white/5">
              <Mail size={9} />
              <span className="truncate max-w-36">{lead.email}</span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleExportPDF}
            disabled={isExporting}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-[10px] font-bold text-slate-300 hover:text-white transition-all border border-white/8 disabled:opacity-50"
          >
            {isExporting ? <Loader2 size={10} className="animate-spin" /> : <Download size={10} />}
            EXPORT PDF
          </button>
          <button
            onClick={handleSendToClient}
            disabled={isSending || !lead}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-[10px] font-bold text-white transition-all shadow-lg shadow-blue-500/20 disabled:opacity-50"
          >
            {isSending ? <Loader2 size={10} className="animate-spin" /> : <Send size={10} />}
            SEND TO CLIENT
          </button>
        </div>
      </div>

      {/* Formatting toolbar */}
      <div className="flex items-center gap-0.5 px-2 py-1.5 border-b border-slate-800/50 bg-[#0E1E32] shrink-0 flex-wrap">
        <ToolbarBtn onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive("bold")} title="Bold">
          <Bold size={12} />
        </ToolbarBtn>
        <ToolbarBtn onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive("italic")} title="Italic">
          <Italic size={12} />
        </ToolbarBtn>
        <ToolbarBtn onClick={() => editor.chain().focus().toggleUnderline().run()} active={editor.isActive("underline")} title="Underline">
          <UnderlineIcon size={12} />
        </ToolbarBtn>

        <div className="w-px h-4 bg-slate-700/60 mx-1" />

        <ToolbarBtn onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} active={editor.isActive("heading", { level: 1 })} title="Heading 1">
          <Heading1 size={12} />
        </ToolbarBtn>
        <ToolbarBtn onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} active={editor.isActive("heading", { level: 2 })} title="Heading 2">
          <Heading2 size={12} />
        </ToolbarBtn>

        <div className="w-px h-4 bg-slate-700/60 mx-1" />

        <ToolbarBtn onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive("bulletList")} title="Bullet List">
          <List size={12} />
        </ToolbarBtn>
        <ToolbarBtn onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive("orderedList")} title="Ordered List">
          <ListOrdered size={12} />
        </ToolbarBtn>

        <div className="w-px h-4 bg-slate-700/60 mx-1" />

        <ToolbarBtn onClick={() => editor.chain().focus().setTextAlign("left").run()} active={editor.isActive({ textAlign: "left" })} title="Align Left">
          <AlignLeft size={12} />
        </ToolbarBtn>
        <ToolbarBtn onClick={() => editor.chain().focus().setTextAlign("center").run()} active={editor.isActive({ textAlign: "center" })} title="Align Center">
          <AlignCenter size={12} />
        </ToolbarBtn>
        <ToolbarBtn onClick={() => editor.chain().focus().setTextAlign("right").run()} active={editor.isActive({ textAlign: "right" })} title="Align Right">
          <AlignRight size={12} />
        </ToolbarBtn>

        <div className="w-px h-4 bg-slate-700/60 mx-1" />

        <ToolbarBtn
          onClick={() => {
            const url = window.prompt('Enter the URL');
            if (url) {
              editor.chain().focus().setLink({ href: url }).run();
            } else if (url === '') {
              editor.chain().focus().unsetLink().run();
            }
          }}
          active={editor.isActive('link')}
          title="Add/Remove Link"
        >
          <LinkIcon size={12} />
        </ToolbarBtn>

        <ToolbarBtn
          onClick={() => imageInputRef.current?.click()}
          title="Add Image"
        >
          <ImageIcon size={12} />
        </ToolbarBtn>
        <input
          type="file"
          ref={imageInputRef}
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) {
              const reader = new FileReader();
              reader.onload = (readerEvent) => {
                const base64 = readerEvent.target?.result as string;
                editor.chain().focus().setImage({ src: base64 }).run();
              };
              reader.readAsDataURL(file);
            }
            e.target.value = ''; // Reset for same file selection
          }}
        />

        <div className="w-px h-4 bg-slate-700/60 mx-1" />

        <ToolbarBtn
          onClick={() => {
            editor.chain().focus().insertContent(`
              <table class="signature-table" style="width: 100%; table-layout: fixed; border-collapse: collapse; margin-top: 25px; overflow: hidden;">
                <tbody>
                  <tr>
                    <td style="width: 45%; padding-bottom: 6px; overflow: hidden;">
                      <p style="font-size: 11px; font-weight: bold; margin: 0;">Authorized Signature</p>
                      <p style="font-size: 9px; margin: 0;">On behalf of JobfinityOS</p>
                    </td>
                    <td style="width: 10%;"></td>
                    <td style="width: 45%; padding-bottom: 6px; overflow: hidden;">
                      <p style="font-size: 11px; font-weight: bold; margin: 0;">Client Signature</p>
                      <p style="font-size: 9px; margin: 0;">${lead?.contact_name || 'Client'} · ${lead?.company_name || 'Company'}</p>
                    </td>
                  </tr>
                  <tr>
                    <td style="width: 45%; border-bottom: 2px solid #333; height: 40px; vertical-align: bottom; text-align: center; overflow: hidden;"></td>
                    <td></td>
                    <td style="width: 45%; border-bottom: 2px solid #333; height: 40px; vertical-align: bottom; text-align: center; overflow: hidden;"></td>
                  </tr>
                </tbody>
              </table>
              <p></p>
            `).run();
          }}
          title="Insert Signature Section (Labels & Lines)"
        >
          <FileText size={12} />
        </ToolbarBtn>

        <ToolbarBtn
          onClick={() => setShowSignModal(true)}
          title="Draw & Insert Your Signature Image"
        >
          <PenTool size={12} />
        </ToolbarBtn>

        <div className="ml-auto text-[9px] text-slate-700 pr-1">Auto-saved</div>
      </div>

      {/* Editor area */}
      <div className="flex-1 overflow-auto custom-scroll bg-[#0E1E32]">
        <EditorContent editor={editor} className="tiptap-proposal-editor h-full" />
      </div>

      {/* Signature Modal */}
      {showSignModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-[#0a1828] border border-slate-800 rounded-xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="px-4 py-3 border-b border-slate-800 flex justify-between items-center bg-[#10213E]">
              <h3 className="text-sm font-semibold text-white">Draw Your Signature</h3>
              <button onClick={() => setShowSignModal(false)} className="text-slate-400 hover:text-white">
                <X size={18} />
              </button>
            </div>
            <div className="p-4 bg-white/5">
              <div className="border border-slate-700 rounded-lg bg-white overflow-hidden" style={{ height: '150px' }}>
                <canvas
                  ref={canvasRef}
                  width={400}
                  height={150}
                  style={{ width: '100%', height: '100%', cursor: 'crosshair' }}
                />
              </div>
              <div className="flex justify-between mt-4">
                <button
                  onClick={() => signaturePadRef.current?.clear()}
                  className="px-3 py-1.5 text-[11px] font-medium text-slate-400 hover:text-white transition-colors"
                >
                  Clear
                </button>
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowSignModal(false)}
                    className="px-4 py-1.5 rounded-lg bg-white/5 text-[11px] font-bold text-slate-300 hover:bg-white/10"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      if (!signaturePadRef.current || signaturePadRef.current.isEmpty()) {
                        toast.error("Please provide a signature first.");
                        return;
                      }

                      // Trim the signature to remove whitespace
                      const trimCanvas = (canvas: HTMLCanvasElement) => {
                        const ctx = canvas.getContext('2d');
                        if (!ctx) return canvas;
                        const copy = document.createElement('canvas');
                        const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height);
                        const l = pixels.data.length;
                        let i;
                        const bound = { top: null as any, left: null as any, right: null as any, bottom: null as any };
                        let x, y;

                        for (i = 0; i < l; i += 4) {
                          if (pixels.data[i + 3] !== 0) {
                            x = (i / 4) % canvas.width;
                            y = ~~((i / 4) / canvas.width);

                            if (bound.top === null) bound.top = y;
                            if (bound.left === null) bound.left = x;
                            else if (x < bound.left) bound.left = x;
                            if (bound.right === null) bound.right = x;
                            else if (x > bound.right) bound.right = x;
                            if (bound.bottom === null) bound.bottom = y;
                            else if (y > bound.bottom) bound.bottom = y;
                          }
                        }

                        if (bound.top === null) return canvas;

                        const trimHeight = bound.bottom - bound.top + 1;
                        const trimWidth = bound.right - bound.left + 1;
                        const trimmed = ctx.getImageData(bound.left, bound.top, trimWidth, trimHeight);

                        copy.width = trimWidth;
                        copy.height = trimHeight;
                        copy.getContext('2d')?.putImageData(trimmed, 0, 0);
                        return copy;
                      };

                      if (!canvasRef.current) return;
                      const trimmedCanvas = trimCanvas(canvasRef.current);
                      const dataUrl = trimmedCanvas.toDataURL('image/png');

                      if (dataUrl) {
                        try {
                          // Insert ONLY the signature image at the current cursor position
                          editor.chain().focus().insertContent(`
                            <img src="${dataUrl}" class="signature-img" style="max-height: 35px; width: auto; vertical-align: bottom; display: inline-block; margin: 0 auto;" />
                          `).run();

                          setShowSignModal(false);
                          toast.success("Signature image inserted!");
                        } catch (err) {
                          console.error("Signature insertion error:", err);
                          toast.error("Failed to insert signature.");
                        }
                      }
                    }}
                    className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-[11px] font-bold text-white shadow-lg shadow-blue-500/20"
                  >
                    Insert Signature
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── DOCUMENTS MODAL ─────────────────────────────────────────────────────────

export function DocumentsModal() {
  const { openDocs, selectedLeadId, getZIndex, focusWindow, toggleDocs } = useWindowManager();
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>("documents");
  const [files, setFiles] = useState<LeadFile[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [allFolders, setAllFolders] = useState<FolderType[]>([]);
  const [currentLead, setCurrentLead] = useState<Lead | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const filteredFiles = selectedFolderId
    ? files.filter(f => f.leads?.lead_folders?.id === selectedFolderId)
    : files;

  const refetchFiles = useCallback(async () => {
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
  }, [selectedLeadId]);

  useEffect(() => {
    if (!openDocs) return;
    refetchFiles();

    if (!selectedLeadId) {
      api.get("/folders").then(r => setAllFolders(r.data.data)).catch(() => { });
    }
  }, [openDocs, selectedLeadId, refetchFiles]);

  // Fetch lead details when a specific lead is selected
  useEffect(() => {
    if (!selectedLeadId) { setCurrentLead(null); return; }
    leadService.getById(selectedLeadId)
      .then(setCurrentLead)
      .catch(() => setCurrentLead(null));
  }, [selectedLeadId]);

  // Reset tab when switching leads
  useEffect(() => {
    setActiveTab("documents");
  }, [selectedLeadId]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedLeadId) return;
    try {
      setIsUploading(true);
      await leadService.uploadFile(selectedLeadId, file);
      toast.success("File uploaded!");
      await refetchFiles();
    } catch {
      toast.error("Upload failed.");
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
    } catch {
      toast.error("Failed to delete file.");
    } finally {
      setDeletingId(null);
    }
  };

  const handleDownload = (url: string, filename: string) => {
    const link = document.createElement("a");
    link.href = `${url}?download=${encodeURIComponent(filename)}`;
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
        default={{ x: 180, y: 0, width: 700, height: 500 }}
        size={isFullScreen ? { width: window.innerWidth - 20, height: window.innerHeight - 120 } : undefined}
        position={isFullScreen ? { x: 10, y: 10 } : undefined}
        minWidth={500}
        minHeight={380}
        bounds="window"
        dragHandleClassName="drag-header"
        disableDragging={isFullScreen}
        enableResizing={!isFullScreen}
      >
        <div className="w-full h-full border border-[#14407B] rounded-xl bg-[#07111e] flex flex-col overflow-hidden shadow-2xl">

          {/* ── Window header ── */}
          <div className="drag-header flex items-center justify-between px-4 py-2.5 border-b border-slate-800 bg-[#10213E] rounded-t-xl cursor-move shrink-0">
            <div className="flex items-center gap-3">
              <Folder className="w-4 h-4 text-slate-400" />
              <h2 className="text-sm font-semibold text-white truncate max-w-52">
                {selectedLeadId && currentLead
                  ? currentLead.company_name
                  : selectedLeadId
                    ? `Lead #${selectedLeadId.slice(0, 8)}`
                    : "All Documents"}
              </h2>
            </div>
            <div className="flex items-center gap-1.5">
              {activeTab === "documents" && (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={!selectedLeadId || isUploading}
                  className="p-1.5 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white transition-colors disabled:opacity-30"
                  title="Upload file"
                >
                  {isUploading ? <Loader2 size={15} className="animate-spin" /> : <Upload size={15} />}
                </button>
              )}
              <input type="file" ref={fileInputRef} onChange={handleUpload} className="hidden" />
              <button onClick={() => setIsFullScreen(!isFullScreen)} className="p-1.5 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white transition-colors">
                {isFullScreen ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
              </button>
              <button onClick={() => toggleDocs()} className="p-1.5 hover:bg-red-500/20 rounded-lg text-slate-400 hover:text-red-400 transition-colors">
                <X size={15} />
              </button>
            </div>
          </div>

          {/* ── Tab bar ── */}
          <div className="flex border-b border-slate-800 bg-[#0c1d35] shrink-0">
            <button
              onClick={() => setActiveTab("documents")}
              className={`flex items-center gap-1.5 px-4 py-2 text-[11px] font-semibold transition-all border-b-2 ${activeTab === "documents"
                ? "border-blue-500 text-blue-400 bg-blue-500/5"
                : "border-transparent text-slate-500 hover:text-slate-300 hover:bg-white/3"
                }`}
            >
              <FileText size={11} />
              Documents
            </button>

            {selectedLeadId && (
              <button
                onClick={() => setActiveTab("proposal")}
                className={`flex items-center gap-1.5 px-4 py-2 text-[11px] font-semibold transition-all border-b-2 ${activeTab === "proposal"
                  ? "border-violet-500 text-violet-400 bg-violet-500/5"
                  : "border-transparent text-slate-500 hover:text-slate-300 hover:bg-white/3"
                  }`}
              >
                <FileEdit size={11} />
                Proposal Editor
              </button>
            )}
          </div>

          {/* ── Content area ── */}
          <div className="flex flex-1 overflow-hidden">

            {activeTab === "documents" ? (
              <>
                {/* Sidebar (folder list) — only when no specific lead */}
                {!selectedLeadId && (
                  <div className="w-36 border-r border-slate-800/80 bg-[#0a1628]/60 flex flex-col p-3 gap-1 shrink-0">
                    <h3 className="text-[9px] font-bold text-slate-600 uppercase tracking-widest mb-2">Folders</h3>
                    <button
                      onClick={() => setSelectedFolderId(null)}
                      className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs transition-all ${!selectedFolderId ? "bg-blue-500/10 text-blue-400 font-medium" : "text-slate-500 hover:bg-white/5 hover:text-slate-300"}`}
                    >
                      <Folder size={12} />All
                    </button>
                    {allFolders.map(folder => (
                      <button
                        key={folder.id}
                        onClick={() => setSelectedFolderId(folder.id)}
                        className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs transition-all ${selectedFolderId === folder.id ? "bg-blue-500/10 text-blue-400 font-medium" : "text-slate-500 hover:bg-white/5 hover:text-slate-300"}`}
                      >
                        <FileText size={12} />
                        <span className="truncate">{folder.name}</span>
                      </button>
                    ))}
                  </div>
                )}

                {/* File list */}
                <div className="flex-1 overflow-auto p-4 custom-scroll space-y-2.5 bg-[#060f1c]/40">
                  {isLoading ? (
                    <div className="flex flex-col items-center justify-center h-full gap-3 text-slate-500">
                      <Loader2 size={22} className="animate-spin text-blue-500" />
                      <p className="text-xs">Loading documents...</p>
                    </div>
                  ) : filteredFiles.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full gap-3 text-slate-600 text-center px-6">
                      <FileText className="w-10 h-10 opacity-10" />
                      <p className="text-sm font-medium text-slate-500">No documents yet</p>
                      <p className="text-[11px] opacity-60">
                        {selectedLeadId ? "Upload files or send a proposal to generate one." : "No documents found."}
                      </p>
                    </div>
                  ) : (
                    filteredFiles.map(file => (
                      <div key={file.id} className="group border border-slate-700/40 rounded-xl p-3 bg-slate-800/15 hover:bg-slate-800/35 hover:border-blue-500/25 transition-all">
                        <div className="flex justify-between gap-3">
                          <div className="flex gap-3 min-w-0">
                            <div className="w-9 h-9 rounded-lg bg-blue-500/10 flex items-center justify-center shrink-0 group-hover:bg-blue-500/20 transition-colors">
                              <FileText className="w-4 h-4 text-blue-400" />
                            </div>
                            <div className="min-w-0">
                              <h3 className="text-sm font-medium text-slate-200 truncate group-hover:text-blue-200 transition-colors">{file.name}</h3>
                              <div className="flex items-center gap-2 mt-0.5">
                                <p className="text-[10px] text-slate-600">
                                  {new Date(file.created_at).toLocaleDateString()}
                                </p>
                                {file.leads?.lead_folders?.name && (
                                  <>
                                    <span className="text-slate-700">·</span>
                                    <span className="text-[10px] text-blue-400/60 uppercase tracking-tight">{file.leads.lead_folders.name}</span>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <button
                              onClick={() => handleDownload(file.url, file.name)}
                              className="px-2.5 py-1 rounded-full bg-white/5 hover:bg-blue-500 text-[10px] font-bold text-slate-400 hover:text-white transition-all"
                            >
                              DOWNLOAD
                            </button>
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
                                className="p-1.5 rounded-lg text-slate-700 hover:text-red-400 hover:bg-red-400/10 transition-all opacity-0 group-hover:opacity-100"
                                title="Delete"
                              >
                                <Trash2 size={13} />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </>
            ) : (
              <ProposalEditor
                leadId={selectedLeadId!}
                lead={currentLead}
                onFileSaved={() => {
                  refetchFiles();
                  setActiveTab("documents");
                }}
              />
            )}
          </div>
        </div>
      </Rnd>
    </div>
  );
}