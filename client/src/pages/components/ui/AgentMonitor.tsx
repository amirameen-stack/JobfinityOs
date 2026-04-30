// src/pages/components/ui/AgentMonitor.tsx
import {
  ChartNoAxesCombined,
  Maximize2,
  Minimize2,
  Phone,
  PhoneOff,
  Wifi,
  WifiOff,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Rnd } from "react-rnd";
import { useWindowManager } from "../../../context/WindowManagerContext";
import { useCallAgent } from "../../../hooks/useCallAgent";
import { leadService, type Lead } from "../../../services/leadService";

const statusColor: Record<string, string> = {
  initiated:    "#F4B52C",
  ringing:      "#F4B52C",
  "in-progress":"#25C03C",
  completed:    "#5769d0",
  failed:       "#F35B52",
  busy:         "#F35B52",
  "no-answer":  "#F35B52",
};

// const formatTime = (iso: string) =>
//   new Date(iso).toLocaleTimeString("en-US", {
//     hour:   "2-digit",
//     minute: "2-digit",
//     second: "2-digit",
//     hour12: false,
//   });

const formatDuration = (seconds: number | null) => {
  if (!seconds) return "—";
  const m = Math.floor(seconds / 60).toString().padStart(2, "0");
  const s = (seconds % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
};

const AgentMoniter = () => {
  const { openAgent, getZIndex, focusWindow } = useWindowManager();
  const [isFullScreen, setIsFullScreen]       = useState(false);
  const [leads, setLeads]                     = useState<Lead[]>([]);
  const [loadingLeads, setLoadingLeads]       = useState(true);
  const transcriptEndRef                      = useRef<HTMLDivElement>(null);

  const {
    activeCall,
    transcript,
    isConnected,
    isStarting,
    error,
    startCall,
    endCall,
  } = useCallAgent();

  // fetch real leads from backend
  useEffect(() => {
    leadService.getAll()
      .then(setLeads)
      .catch(console.error)
      .finally(() => setLoadingLeads(false));
  }, []);

  // auto-scroll transcript
  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [transcript]);

  const callStatus = activeCall?.status ?? null;
  const callColor  = callStatus ? (statusColor[callStatus] ?? "#888") : null;
  // const isLive     = callStatus === "in-progress";
  // const isPending  = callStatus === "initiated" || callStatus === "ringing";

  // only show leads that have a phone number
  const callableLeads = leads.filter(l => !!l.phone);

  return (
    <div
      className="fixed inset-0 pointer-events-none"
      style={{ zIndex: openAgent ? getZIndex("agent") : -1 }}
    >
      <Rnd
        style={{ pointerEvents: "auto" }}
        onMouseDown={() => focusWindow("agent")}
        default={{ x: 780, y: 10, width: 480, height: 200 }}
        size={
          isFullScreen
            ? { width: window.innerWidth - 20, height: window.innerHeight - 120 }
            : undefined
        }
        position={isFullScreen ? { x: 10, y: 10 } : undefined}
        minWidth={340}
        minHeight={300}
        bounds="window"
        dragHandleClassName="drag-header"
        disableDragging={isFullScreen}
        enableResizing={!isFullScreen}
      >
        <div className="w-full h-full border border-[#14407B] rounded-xl text-sm shadow-2xl bg-[#142032] flex flex-col overflow-hidden">

          {/* HEADER */}
          <header className="drag-header bg-[#10213E] flex justify-between rounded-t-xl text-white p-1 px-4 items-center cursor-move shrink-0">
            <div className="flex items-center gap-2">
              <ChartNoAxesCombined size={18} className="text-[#54DF7E]" />
              <span className="text-sm sm:text-base">Agent Monitor</span>
              <span title={isConnected ? "Connected" : "Reconnecting..."}>
                {isConnected
                  ? <Wifi size={12} className="text-[#25C03C]" />
                  : <WifiOff size={12} className="text-[#F35B52]" />
                }
              </span>
            </div>
            <div className="flex gap-2 items-center">
              <span className="text-[#F35B52]">●</span>
              <span className="text-[#F4B52C]">●</span>
              <span className="text-[#25C03C]">●</span>
              <button
                onClick={() => setIsFullScreen(!isFullScreen)}
                className="ml-1 text-white"
              >
                {isFullScreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
              </button>
            </div>
          </header>

          {/* BODY */}
          <main className="flex flex-col gap-3 p-2 sm:px-4 flex-1 overflow-auto text-white">

            {/* error banner */}
            {error && (
              <div className="bg-[#3D1A1A] border border-[#F35B52] rounded-lg px-3 py-2 text-[#F35B52] text-xs">
                {error}
              </div>
            )}

            {/* STATS */}
            <div className="flex gap-3">
              <div className="bg-[#1F2A3D] rounded-2xl p-2 flex-1">
                <p className="text-[10px] text-[#8899AA]">TOTAL LEADS</p>
                <p className="text-lg font-bold">{leads.length}</p>
              </div>
              <div className="bg-[#1F2A3D] rounded-2xl p-2 flex-1">
                <p className="text-[10px] text-[#8899AA]">CALLABLE</p>
                <p className="text-lg font-bold">{callableLeads.length}</p>
              </div>
              {activeCall && (
                <div className="bg-[#1F2A3D] rounded-2xl p-2 flex-1">
                  <p className="text-[10px] text-[#8899AA]">DURATION</p>
                  <p
                    className="text-lg font-bold"
                    style={{ color: callColor ?? "#fff" }}
                  >
                    {formatDuration(activeCall.duration)}
                  </p>
                </div>
              )}
            </div>

            {/* LIVE TRANSCRIPT */}
            {/* <div className="bg-[#1F2A3D] rounded-xl flex flex-col overflow-hidden"
              style={{ minHeight: "140px", maxHeight: "220px" }}
            >
              <div className="flex justify-between items-center px-3 py-2 shrink-0 border-b border-[#1E3050]">
                <span className="text-[10px] text-[#8899AA] tracking-widest">
                  LIVE TRANSCRIPT
                </span>
                <div className="flex items-center gap-2">
                  {isLive && (
                    <span className="flex items-center gap-1 text-[#F35B52] text-[10px]">
                      <span className="animate-pulse">●</span> LIVE
                    </span>
                  )}
                  {isPending && (
                    <span className="text-[#F4B52C] text-[10px] animate-pulse">
                      ● {callStatus?.replace("-", " ").toUpperCase()}
                    </span>
                  )}
                  {!activeCall && (
                    <span className="text-[#8899AA] text-[10px]">IDLE</span>
                  )}
                </div>
              </div>

              <div className="overflow-auto bg-[#030E20] p-3 space-y-2 flex-1">
                {transcript.length === 0 && (
                  <p className="text-[#334455] text-xs italic">
                    {activeCall
                      ? "Waiting for call to connect..."
                      : "No active call — press the green phone button below."}
                  </p>
                )}
                {transcript.map((entry, i) => (
                  <div key={i} className="flex flex-col gap-0.5">
                    <div className="flex items-center gap-2">
                      <span className="text-[#445566] text-[10px]">
                        [{formatTime(entry.timestamp)}]
                      </span>
                      <span
                        className="text-[10px] font-medium"
                        style={{
                          color: entry.role === "agent" ? "#54DF7E" : "#5769d0",
                        }}
                      >
                        {entry.role === "agent" ? "Agent" : "Prospect"}
                      </span>
                    </div>
                    <p
                      className="text-xs pl-1"
                      style={{
                        color: entry.role === "agent" ? "#2BAC67" : "#8899CC",
                      }}
                    >
                      {entry.text}
                    </p>
                  </div>
                ))}
                <div ref={transcriptEndRef} />
              </div>
            </div> */}

            {/* LEADS / AGENTS */}
            <div className="flex flex-col gap-2 shrink-0 overflow-auto custom-scroll"
              style={{ maxHeight: "180px" }}
            >
              {loadingLeads && (
                <p className="text-[#445566] text-xs text-center py-2">
                  Loading leads...
                </p>
              )}

              {!loadingLeads && callableLeads.length === 0 && (
                <p className="text-[#445566] text-xs text-center py-2">
                  No leads with phone numbers found.
                </p>
              )}

              {callableLeads.map(lead => {
                const isThisLeadOnCall = activeCall?.lead_id === lead.id;

                return (
                  <div
                    key={lead.id}
                    className="flex justify-between items-center bg-[#101C2E] px-4 py-2 rounded-lg shrink-0"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span
                        style={{
                          color: isThisLeadOnCall
                            ? callColor ?? "#25C03C"
                            : "#5769d0",
                          flexShrink: 0,
                        }}
                      >
                        ●
                      </span>
                      <div className="min-w-0">
                        <p className="text-sm truncate">{lead.contact_name}</p>
                        <p className="text-[10px] text-[#8899AA] truncate">
                          {lead.company_name} · {lead.phone}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 ml-2">
                      <span
                        className="text-xs"
                        style={{
                          color: isThisLeadOnCall
                            ? callColor ?? "#25C03C"
                            : "#5769d0",
                        }}
                      >
                        {isThisLeadOnCall
                          ? callStatus?.replace("-", " ")
                          : "Available"}
                      </span>

                      {isThisLeadOnCall ? (
                        <button
                          onClick={endCall}
                          title="End call"
                          className="p-1.5 rounded-lg bg-[#3D1A1A] hover:bg-[#5A2020] transition-colors"
                        >
                          <PhoneOff size={13} className="text-[#F35B52]" />
                        </button>
                      ) : (
                        <button
                          onClick={() => startCall(lead.id, lead.phone!)}
                          disabled={isStarting || !!activeCall}
                          title={
                            activeCall
                              ? "Another call is active"
                              : `Call ${lead.contact_name}`
                          }
                          className="p-1.5 rounded-lg bg-[#0F2A1A] hover:bg-[#1A3D25] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                          <Phone
                            size={13}
                            className={
                              isStarting
                                ? "animate-pulse text-[#F4B52C]"
                                : "text-[#25C03C]"
                            }
                          />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

          </main>
        </div>
      </Rnd>
    </div>
  );
};

export default AgentMoniter;