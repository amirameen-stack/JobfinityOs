import { useEffect, useReducer } from "react";
import { X, Building2, Calendar, Factory, Users, Mail, Globe, Box, Cpu } from "lucide-react";
import { leadService } from "@/services/leadService";
import type { Lead } from "@/services/leadService";

interface EnrichedData {
  companyType: string;
  founded: string;
  sectors: string[];
  employees: string;
  email: string;
  timezone: string;
  coreFocus: string[];
  website: string;
  description: string;
}

interface Props {
  lead: Lead | null;
  onClose: () => void;
}

// ── reducer ──────────────────────────────────────────────────────────────────

type State = { data: EnrichedData | null; loading: boolean; error: string | null };
type Action =
  | { type: "loading" }
  | { type: "success"; payload: EnrichedData }
  | { type: "error"; message: string };

function reducer(_state: State, action: Action): State {
  switch (action.type) {
    case "loading": return { data: null,           loading: true,  error: null };
    case "success": return { data: action.payload,  loading: false, error: null };
    case "error":   return { data: null,           loading: false, error: action.message };
  }
}

const initialState: State = { data: null, loading: false, error: null };

// ── sub-components ────────────────────────────────────────────────────────────

const Chip = ({ label }: { label: string }) => (
  <span className="px-2.5 py-1 rounded-md text-[11px] font-semibold bg-[#1e293b]/50 text-[#c8ddf2] border border-[#162438]">
    {label}
  </span>
);

// ── main component ────────────────────────────────────────────────────────────

export default function CompanyDetailPanel({ lead, onClose }: Props) {
  const [{ data, loading, error }, dispatch] = useReducer(reducer, initialState);

  useEffect(() => {
    if (!lead) return;

    let cancelled = false;
    dispatch({ type: "loading" });

    leadService.enrichLead(lead.id, lead.company_name)
      .then((result) => {
        if (!cancelled) dispatch({ type: "success", payload: result });
      })
      .catch(() => {
        if (!cancelled)
          dispatch({ type: "error", message: "Failed to fetch company details. Check your Gemini API key." });
      });

    return () => { cancelled = true; };
  },[lead]);

  if (!lead) return null;

  return (
    <>
      {/* backdrop */}
      <div
        className="fixed inset-0 z-40"
        style={{ background: "rgba(0,0,0,0.3)" }}
        onClick={onClose}
      />

      {/* panel */}
      <div
        className="fixed right-0 top-0 h-full z-50 flex flex-col overflow-hidden"
        style={{
          width: "480px",
          background: "linear-gradient(160deg, #0d1f38 0%, #08182b 100%)",
          borderLeft: "1px solid rgba(30,111,217,0.2)",
          boxShadow: "-12px 0 48px rgba(0,0,0,0.5)",
        }}
      >
        {/* panel header */}
        <div className="flex items-start justify-between p-5 border-b border-[#162438] shrink-0">
          <div className="flex items-center gap-3">
            <div className="bg-[#1E6FD9]/10 ring-1 ring-[#1E6FD9]/25 rounded-xl p-2.5">
              <Building2 size={18} className="text-[#4a9eff]" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-[#c8ddf2] leading-tight">
                {lead.company_name}
              </h2>
              <p className="text-[10px] text-[#3a5a7a] mt-0.5">
                {lead.contact_name} · {lead.job_title ?? "—"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-white/5 text-[#3a5a7a] hover:text-white transition-all"
          >
            <X size={16} />
          </button>
        </div>

        {/* panel body */}
        <div className="flex-1 overflow-auto p-6 space-y-6 custom-scroll">

          {/* loading state */}
          {loading && (
            <div className="flex flex-col items-center justify-center py-16 gap-4">
              <div className="relative">
                <div className="w-10 h-10 rounded-full border-2 border-[#1E6FD9]/20 border-t-[#1E6FD9] animate-spin" />
                <Cpu size={14} className="text-[#1E6FD9] absolute inset-0 m-auto" />
              </div>
              <div className="text-center">
                <p className="text-xs text-[#7a9ab5] font-medium">Analysing with Gemini</p>
                <p className="text-[10px] text-[#3a5a7a] mt-1">Fetching company intelligence...</p>
              </div>
            </div>
          )}

          {/* error state */}
          {error && !loading && (
            <div className="bg-[#3D1A1A] border border-[#F35B52]/30 rounded-xl px-4 py-3">
              <p className="text-xs text-[#F35B52]">{error}</p>
            </div>
          )}

          {/* data */}
          {data && !loading && (
            <div className="space-y-6">

              {/* Row 1: Company Type */}
              <div className="grid grid-cols-[120px_1fr] gap-4 items-start">
                <div className="flex items-center gap-2 text-xs font-bold text-[#c8ddf2]">
                  <Building2 size={14} className="text-[#7a9ab5]" />
                  <span>Company type</span>
                </div>
                <div className="text-xs text-[#c8ddf2]">{data.companyType || "—"}</div>
              </div>

              {/* Row 2: Founded */}
              <div className="grid grid-cols-[120px_1fr] gap-4 items-start">
                <div className="flex items-center gap-2 text-xs font-bold text-[#c8ddf2]">
                  <Calendar size={14} className="text-[#7a9ab5]" />
                  <span>Founded</span>
                </div>
                <div className="text-xs text-[#c8ddf2]">{data.founded || "—"}</div>
              </div>

              {/* Row 3: Sectors */}
              <div className="grid grid-cols-[120px_1fr] gap-4 items-start">
                <div className="flex items-center gap-2 text-xs font-bold text-[#c8ddf2] mt-0.5">
                  <Factory size={14} className="text-[#7a9ab5]" />
                  <span>Sectors</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {data.sectors?.length > 0 ? (
                    data.sectors.map((sector, i) => <Chip key={i} label={sector} />)
                  ) : (
                    <span className="text-xs text-[#7a9ab5]">—</span>
                  )}
                </div>
              </div>

              {/* Row 4: Employees */}
              <div className="grid grid-cols-[120px_1fr] gap-4 items-start">
                <div className="flex items-center gap-2 text-xs font-bold text-[#c8ddf2]">
                  <Users size={14} className="text-[#b48acc]" />
                  <span>Employees</span>
                </div>
                <div className="text-xs text-[#c8ddf2]">{data.employees || "—"}</div>
              </div>

              {/* Row 5: Email */}
              <div className="grid grid-cols-[120px_1fr] gap-4 items-start">
                <div className="flex items-center gap-2 text-xs font-bold text-[#c8ddf2] mt-0.5">
                  <Mail size={14} className="text-[#7a9ab5]" />
                  <span>Email</span>
                </div>
                <div className="flex flex-col gap-2">
                  {data.email ? (
                    <Chip label={data.email} />
                  ) : (
                    <span className="text-xs text-[#7a9ab5]">—</span>
                  )}
                </div>
              </div>

              {/* Row 6: Timezone */}
              <div className="grid grid-cols-[120px_1fr] gap-4 items-start">
                <div className="flex items-center gap-2 text-xs font-bold text-[#c8ddf2]">
                  <Globe size={14} className="text-[#56a88b]" />
                  <span>Timezone</span>
                </div>
                <div className="text-xs text-[#c8ddf2]">{data.timezone || "—"}</div>
              </div>

              {/* Row 7: Core Focus */}
              <div className="grid grid-cols-[120px_1fr] gap-4 items-start">
                <div className="flex items-center gap-2 text-xs font-bold text-[#c8ddf2] mt-0.5">
                  <Box size={14} className="text-[#cc9c7a]" />
                  <span>Core Focus</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {data.coreFocus?.length > 0 ? (
                    data.coreFocus.map((focus, i) => <Chip key={i} label={focus} />)
                  ) : (
                    <span className="text-xs text-[#7a9ab5]">—</span>
                  )}
                </div>
              </div>

              {/* Row 8: Website */}
              <div className="grid grid-cols-[120px_1fr] gap-4 items-start">
                <div className="flex items-center gap-2 text-xs font-bold text-[#c8ddf2]">
                  <Globe size={14} className="text-[#4b9cdb]" />
                  <span>Website</span>
                </div>
                <div className="text-xs">
                  {data.website ? (
                    <a
                      href={data.website.startsWith("http") ? data.website : `https://${data.website}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#4a9eff] hover:text-[#7bbfff] hover:underline"
                    >
                      {data.website}
                    </a>
                  ) : (
                    <span className="text-[#7a9ab5]">—</span>
                  )}
                </div>
              </div>

              {/* Description */}
              <div className="pt-4 mt-2">
                <p className="text-xs text-[#8aabcc] leading-relaxed bg-[#0c1928] p-4 rounded-xl border border-[#162438]">
                  {data.description || "No description available."}
                </p>
              </div>

            </div>
          )}
        </div>

        {/* panel footer */}
        <div className="p-4 border-t border-[#162438] shrink-0">
          <p className="text-[10px] text-[#2a4560] text-center">
            Powered by Gemini · Data may not reflect real-time information
          </p>
        </div>

      </div>
    </>
  );
}