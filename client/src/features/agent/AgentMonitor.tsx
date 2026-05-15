import {
  ChartNoAxesCombined,
  Maximize2,
  Minimize2,
  PhoneOff,
  Wifi,
  WifiOff,
  Calendar,
  PhoneCall,
  PhoneMissed,
  Clock,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { useEffect, useState, useCallback, useRef } from "react";
import { Rnd } from "react-rnd";
import { useWindowManager } from "@/context/WindowManagerContext";
import { useCallAgent } from "@/hooks/useCallAgent";
import { leadService, type Lead } from "@/services/leadService";
import { schedulerService, type CallReport } from "@/services/schedulerService";

const statusColor: Record<string, string> = {
  initiated: "#F4B52C",
  ringing: "#F4B52C",
  "in-progress": "#25C03C",
  completed: "#5769d0",
  failed: "#F35B52",
  busy: "#F35B52",
  "no-answer": "#F35B52",
};

const outcomeConfig: Record<
  string,
  { label: string; color: string; icon: React.ReactNode }
> = {
  demo_booked: {
    label: "Demo Booked",
    color: "#25C03C",
    icon: <PhoneCall size={11} />,
  },
  callback_requested: {
    label: "Callback Requested",
    color: "#F4B52C",
    icon: <Clock size={11} />,
  },
  not_interested: {
    label: "Not Interested",
    color: "#F35B52",
    icon: <PhoneOff size={11} />,
  },
  info_sent: {
    label: "Info Sent",
    color: "#5769d0",
    icon: <PhoneCall size={11} />,
  },
  do_not_call: {
    label: "Do Not Call",
    color: "#F35B52",
    icon: <PhoneMissed size={11} />,
  },
  no_answer: {
    label: "No Answer",
    color: "#8899AA",
    icon: <PhoneMissed size={11} />,
  },
  "no-answer": {
    label: "No Answer",
    color: "#8899AA",
    icon: <PhoneMissed size={11} />,
  },
  busy: { label: "Busy", color: "#F4B52C", icon: <Clock size={11} /> },
  failed: {
    label: "Failed",
    color: "#F35B52",
    icon: <PhoneMissed size={11} />,
  },
  canceled: {
    label: "Canceled",
    color: "#8899AA",
    icon: <PhoneMissed size={11} />,
  },
  completed: {
    label: "Completed",
    color: "#5769d0",
    icon: <PhoneCall size={11} />,
  },
  pending: { label: "Pending", color: "#F4B52C", icon: <Clock size={11} /> },
};

const formatTime = (iso: string) =>
  new Date(iso).toLocaleTimeString("en-GB", {
    timeZone: "Europe/London",
    hour: "2-digit",
    minute: "2-digit",
  });

const formatDuration = (seconds: number | null) => {
  if (!seconds) return "—";
  const m = Math.floor(seconds / 60)
    .toString()
    .padStart(2, "0");
  const s = (seconds % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
};

function CallCard({ call }: { call: CallReport }) {
  const [expanded, setExpanded] = useState(false);
  const cfg = outcomeConfig[call.outcome] ?? outcomeConfig.pending;

  return (
    <div className="bg-[#0c1928] border border-[#162438] rounded-xl overflow-hidden mb-2">
      <div
        className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-[#0e1e32] transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-3 min-w-0">
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
            style={{ background: `${cfg.color}18`, color: cfg.color }}
          >
            {cfg.icon}
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold text-[#c8ddf2] truncate">
              {call.leads?.contact_name ?? "Unknown"}
            </p>
            <p className="text-[10px] text-[#3a5a7a] truncate">
              {call.leads?.company_name ?? "—"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <div className="text-right">
            <p
              className="text-[10px] font-semibold"
              style={{ color: cfg.color }}
            >
              {cfg.label}
            </p>
            <p className="text-[10px] text-[#3a5a7a]">
              {formatTime(call.created_at)} · {formatDuration(call.duration)}
            </p>
          </div>
          {expanded ? (
            <ChevronUp size={13} className="text-[#3a5a7a]" />
          ) : (
            <ChevronDown size={13} className="text-[#3a5a7a]" />
          )}
        </div>
      </div>

      {expanded && (
        <div className="border-t border-[#162438] bg-[#030E20] p-3 space-y-2 max-h-48 overflow-auto">
          {call.transcript?.length === 0 && (
            <p className="text-[10px] text-[#334455] italic">
              No transcript available
            </p>
          )}
          {call.transcript?.map((entry, i) => (
            <div key={i} className="flex flex-col gap-0.5">
              <span
                className="text-[10px] font-medium"
                style={{
                  color: entry.role === "agent" ? "#54DF7E" : "#5769d0",
                }}
              >
                {entry.role === "agent" ? "Agent (Sarah)" : "Prospect"}
              </span>
              <p
                className="text-[11px] leading-relaxed pl-1"
                style={{
                  color: entry.role === "agent" ? "#2BAC67" : "#8899CC",
                }}
              >
                {entry.text}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const Skeleton = ({ className }: { className?: string }) => (
  <div className={`animate-pulse bg-[#1E3050]/50 rounded-lg ${className}`} />
);

const AgentMoniter = () => {
  const { openAgent, getZIndex, focusWindow } = useWindowManager();
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loadingLeads, setLoadingLeads] = useState(true);
  const [activeTab, setActiveTab] = useState<"dialer" | "reports">("dialer");

  // Reports state
  const [calls, setCalls] = useState<CallReport[]>([]);
  const [loadingCalls, setLoadingCalls] = useState(false);
  const [reportTab, setReportTab] = useState<"today" | "all">("today");
  const wsRef = useRef<WebSocket | null>(null);

  const { activeCall, isConnected, error, endCall } = useCallAgent();

  // fetch real leads from backend
  const fetchLeads = useCallback(() => {
    setLoadingLeads(true);
    leadService
      .getAll()
      .then(setLeads)
      .catch(console.error)
      .finally(() => setLoadingLeads(false));
  }, []);

  useEffect(() => {
    const run = async () => {
      setLoadingLeads(true);
      try {
        const data = await leadService.getAll();
        setLeads(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingLeads(false);
      }
    };

    run();
  }, []);

  const fetchCalls = useCallback(async () => {
    setLoadingCalls(true);
    try {
      const data =
        reportTab === "today"
          ? await schedulerService.getTodaysCalls()
          : await schedulerService.getAllCalls();
      setCalls(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingCalls(false);
    }
  }, [reportTab]);

  useEffect(() => {
    if (activeTab !== "reports") return;

    const run = async () => {
      setLoadingCalls(true);
      try {
        const data =
          reportTab === "today"
            ? await schedulerService.getTodaysCalls()
            : await schedulerService.getAllCalls();

        setCalls(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingCalls(false);
      }
    };

    run();
  }, [activeTab, reportTab]);

  useEffect(() => {
    const WS_URL = import.meta.env.VITE_WS_URL ?? "ws://localhost:5001/ws";
    const ws = new WebSocket(WS_URL);
    wsRef.current = ws;

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        if (
          [
            "CALL_OUTCOME",
            "SCHEDULED_CALL_FIRED",
            "SCHEDULER_STARTED",
          ].includes(msg.type)
        ) {
          fetchCalls();
          fetchLeads();
        }
      } catch {
        // ignore
      }
    };

    return () => ws.close();
  }, [fetchCalls, fetchLeads]);

  const callStatus = activeCall?.status ?? null;
  const callColor = callStatus ? (statusColor[callStatus] ?? "#888") : null;
  const callableLeads = leads.filter((l) => !!l.phone);

  const demoBooked = calls.filter((c) => c.outcome === "demo_booked").length;
  const noAnswer = calls.filter((c) =>
    ["no_answer", "no-answer", "failed", "canceled"].includes(c.outcome),
  ).length;
  const notInterested = calls.filter((c) =>
    ["not_interested", "busy"].includes(c.outcome),
  ).length;

  return (
    <div
      className="fixed inset-0 pointer-events-none"
      style={{ zIndex: openAgent ? getZIndex("agent") : -1 }}
    >
      <Rnd
        style={{ pointerEvents: "auto" }}
        onMouseDown={() => focusWindow("agent")}
        default={{ x: 780, y: 10, width: 500, height: 400 }}
        size={
          isFullScreen
            ? {
              width: window.innerWidth - 20,
              height: window.innerHeight - 120,
            }
            : undefined
        }
        position={isFullScreen ? { x: 10, y: 10 } : undefined}
        minWidth={400}
        minHeight={400}
        bounds="window"
        dragHandleClassName="drag-header"
        disableDragging={isFullScreen}
        enableResizing={!isFullScreen}
      >
        <div className="w-full h-full border border-[#14407B] rounded-xl text-sm shadow-2xl bg-[#08182B] flex flex-col overflow-hidden">
          {/* HEADER */}
          <header className="drag-header bg-[#10213E] flex justify-between rounded-t-xl text-white p-1 px-4 items-center cursor-move shrink-0">
            <div className="flex items-center gap-2">
              <ChartNoAxesCombined size={18} className="text-[#54DF7E]" />
              <span className="text-sm sm:text-base">Agent Monitor</span>
              <span title={isConnected ? "Connected" : "Reconnecting..."}>
                {isConnected ? (
                  <Wifi size={12} className="text-[#25C03C]" />
                ) : (
                  <WifiOff size={12} className="text-[#F35B52]" />
                )}
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
                {isFullScreen ? (
                  <Minimize2 size={16} />
                ) : (
                  <Maximize2 size={16} />
                )}
              </button>
            </div>
          </header>

          {/* TABS */}
          <div className="flex bg-[#10213E] px-4 gap-4 border-b border-[#14407B]">
            <button
              onClick={() => setActiveTab("dialer")}
              className={`py-2 px-1 text-xs font-semibold border-b-2 transition-colors ${activeTab === "dialer"
                  ? "border-[#25C03C] text-white"
                  : "border-transparent text-[#8899AA] hover:text-white"
                }`}
            >
              AUTO DIALER
            </button>
            <button
              onClick={() => setActiveTab("reports")}
              className={`py-2 px-1 text-xs font-semibold border-b-2 transition-colors ${activeTab === "reports"
                  ? "border-[#25C03C] text-white"
                  : "border-transparent text-[#8899AA] hover:text-white"
                }`}
            >
              CALL REPORTS
            </button>
          </div>

          {/* BODY */}
          <main className="flex flex-col gap-3 p-3 flex-1 overflow-hidden text-white">
            {/* error banner */}
            {error && (
              <div className="bg-[#3D1A1A] border border-[#F35B52] rounded-lg px-3 py-2 text-[#F35B52] text-xs">
                {error}
              </div>
            )}

            {activeTab === "dialer" && (
              <>
                {/* STATS */}
                <div className="flex gap-3">
                  <div className="bg-[#1F2A3D] rounded-2xl p-2 flex-1 border border-[#1E3050]">
                    <p className="text-[10px] text-[#8899AA]">TOTAL LEADS</p>
                    <p className="text-lg font-bold">{leads.length}</p>
                  </div>
                  <div className="bg-[#1F2A3D] rounded-2xl p-2 flex-1 border border-[#1E3050]">
                    <p className="text-[10px] text-[#8899AA]">CALLABLE</p>
                    <p className="text-lg font-bold">{callableLeads.length}</p>
                  </div>
                  {activeCall && (
                    <div className="bg-[#1F2A3D] rounded-2xl p-2 flex-1 border border-[#25C03C]/30 animate-pulse">
                      <p className="text-[10px] text-[#8899AA]">ON CALL</p>
                      <p
                        className="text-lg font-bold"
                        style={{ color: callColor ?? "#fff" }}
                      >
                        {formatDuration(activeCall.duration)}
                      </p>
                    </div>
                  )}
                </div>

                <div className="h-px bg-[#1E3050] my-1" />

                <div className="flex flex-col gap-2 flex-1 overflow-auto custom-scroll pr-1">
                  <p className="text-[10px] text-[#8899AA] tracking-widest font-bold uppercase">
                    Ready to Call
                  </p>
                  {loadingLeads && (
                    <div className="space-y-2">
                      {[1, 2, 3, 4, 5].map((i) => (
                        <div
                          key={i}
                          className="flex justify-between items-center bg-[#101C2E] px-4 py-2.5 rounded-lg border border-[#1E3050]"
                        >
                          <div className="flex items-center gap-3 flex-1">
                            <Skeleton className="w-2 h-2 rounded-full" />
                            <div className="space-y-1 flex-1">
                              <Skeleton className="h-3 w-24" />
                              <Skeleton className="h-2 w-32" />
                            </div>
                          </div>
                          <Skeleton className="w-8 h-8 rounded-lg" />
                        </div>
                      ))}
                    </div>
                  )}
                  {!loadingLeads && callableLeads.length === 0 && (
                    <p className="text-center py-4 text-[#445566]">
                      No leads available for calling.
                    </p>
                  )}
                  {callableLeads.map((lead) => {
                    const isThisLeadOnCall = activeCall?.lead_id === lead.id;
                    return (
                      <div
                        key={lead.id}
                        className="flex justify-between items-center bg-[#101C2E] px-4 py-2.5 rounded-lg border border-[#1E3050] hover:border-[#1E6FD9]/50 transition-colors"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <span
                            style={{
                              color: isThisLeadOnCall
                                ? (callColor ?? "#25C03C")
                                : "#5769d0",
                            }}
                          >
                            ●
                          </span>
                          <div className="min-w-0">
                            <p className="text-sm font-medium truncate">
                              {lead.contact_name}
                            </p>
                            <p className="text-[10px] text-[#8899AA] truncate">
                              {lead.company_name} · {lead.phone}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span
                            className="text-[10px] font-semibold"
                            style={{
                              color: isThisLeadOnCall
                                ? (callColor ?? "#25C03C")
                                : "#3a5a7a",
                            }}
                          >
                            {isThisLeadOnCall
                              ? callStatus?.replace("-", " ").toUpperCase()
                              : "READY"}
                          </span>
                          {isThisLeadOnCall && (
                            <button
                              onClick={endCall}
                              className="p-2 rounded-lg bg-[#3D1A1A] hover:bg-[#5A2020] transition-colors"
                            >
                              <PhoneOff size={14} className="text-[#F35B52]" />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}

            {activeTab === "reports" && (
              <>
                <div className="flex gap-2 shrink-0">
                  <div className="bg-[#1F2A3D] rounded-xl p-2 flex-1 text-center border border-[#1E3050]">
                    <p className="text-[10px] text-[#8899AA]">TOTAL</p>
                    <p className="text-lg font-bold">{calls.length}</p>
                  </div>
                  <div className="bg-[#1F2A3D] rounded-xl p-2 flex-1 text-center border border-[#25C03C]/20">
                    <p className="text-[10px] text-[#25C03C]">DEMOS</p>
                    <p className="text-lg font-bold text-[#25C03C]">
                      {demoBooked}
                    </p>
                  </div>
                  <div className="bg-[#1F2A3D] rounded-xl p-2 flex-1 text-center border border-[#1E3050]">
                    <p className="text-[10px] text-[#8899AA]">NO ANS</p>
                    <p className="text-lg font-bold text-[#8899AA]">
                      {noAnswer}
                    </p>
                  </div>
                  <div className="bg-[#1F2A3D] rounded-xl p-2 flex-1 text-center border border-[#F35B52]/20">
                    <p className="text-[10px] text-[#F35B52]">DECLINED</p>
                    <p className="text-lg font-bold text-[#F35B52]">
                      {notInterested}
                    </p>
                  </div>
                </div>

                <div className="flex gap-1 shrink-0">
                  {(["today", "all"] as const).map((t) => (
                    <button
                      key={t}
                      onClick={() => setReportTab(t)}
                      className={`px-3 py-1 rounded-lg text-[10px] font-bold transition-colors ${reportTab === t
                          ? "bg-[#1E6FD9] text-white"
                          : "text-[#3a5a7a] hover:bg-[#1E3050]"
                        }`}
                    >
                      {t === "today" ? "TODAY" : "HISTORY"}
                    </button>
                  ))}
                  <button
                    onClick={fetchCalls}
                    className="ml-auto text-[10px] text-[#3a5a7a] hover:text-white"
                  >
                    Refresh
                  </button>
                </div>

                <div className="flex-1 overflow-auto custom-scroll pr-1">
                  {loadingCalls && (
                    <div className="space-y-2">
                      {[1, 2, 3].map((i) => (
                        <div
                          key={i}
                          className="bg-[#0c1928] border border-[#162438] rounded-xl p-4 flex justify-between items-center"
                        >
                          <div className="flex items-center gap-3 flex-1">
                            <Skeleton className="w-7 h-7 rounded-lg" />
                            <div className="space-y-1 flex-1">
                              <Skeleton className="h-3 w-24" />
                              <Skeleton className="h-2 w-32" />
                            </div>
                          </div>
                          <div className="space-y-1 items-end flex flex-col">
                            <Skeleton className="h-2 w-16" />
                            <Skeleton className="h-2 w-12" />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  {!loadingCalls && calls.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-10 opacity-30">
                      <Calendar size={32} />
                      <p className="text-xs mt-2">No calls recorded</p>
                    </div>
                  )}
                  {calls.map((call) => (
                    <CallCard key={call.id} call={call} />
                  ))}
                </div>
              </>
            )}
          </main>
        </div>
      </Rnd>
    </div>
  );
};

export default AgentMoniter;
