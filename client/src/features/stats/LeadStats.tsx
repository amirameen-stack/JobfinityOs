import { useState, useEffect, useCallback, useMemo } from "react";
import { Rnd } from "react-rnd";
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  LineChart,
  Line,
  BarChart,
  Bar,
} from "recharts";
import {
  Maximize2,
  Minimize2,
  X,
  FileText,
  Clock,
  Activity,
  TrendingUp,
  PieChart as PieIcon,
} from "lucide-react";
import { useWindowManager } from "@/context/WindowManagerContext";
import { leadService } from "@/services/leadService";
import { schedulerService } from "@/services/schedulerService";

// --- THEME COLORS (Jobfinity Dark Premium) ---
const COLORS = {
  primary: "#1E6FD9",
  success: "#25C03C",
  warning: "#F59E0B",
  danger: "#F35B52",
  pink: "#F35B52",
  text: "#c8ddf2",
  muted: "#4a6a8a",
  bg: "#08182b",
  card: "#0c1928",
  border: "#162438",
};

const PIE_COLORS = [COLORS.primary, COLORS.danger, COLORS.success];

// --- DYNAMIC DATA HELPERS ---
const daysList = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

type LeadItem = {
  name: string;
  duration: number;
};

const formatDuration = (seconds: number) => {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
};

export default function LeadStats() {
  const { openStats, toggleStats, getZIndex, focusWindow } = useWindowManager();
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [selectedDay, setSelectedDay] = useState(() => {
    const nowUK = new Date(
      new Date().toLocaleString("en-US", { timeZone: "Europe/London" }),
    );
    const dayIdx = nowUK.getDay();
    return daysList[dayIdx === 0 ? 6 : dayIdx - 1];
  });
  const [loading, setLoading] = useState(true);

  const [stats, setStats] = useState({
    totalLeads: 0,
    callsMade: 0,
    remaining: 0,
    callsToday: 0,
    todayDuration: 0,
    weeklyCalls: 0,
    weeklyDuration: 0,
    callsMissed: 0,
  });

  const [trends, setTrends] = useState({
    weekly: daysList.map((d) => ({ day: d, automated: 0, conversions: 0 })),
    failed: daysList.map((d) => ({ day: d, failed: 0 })),
    success: daysList.map((d) => ({ day: d, success: 0 })),
    outcomes: daysList.map((d) => ({
      day: d,
      success: 0,
      converted: 0,
      denied: 0,
    })),
  });

  const [recentLeads, setRecentLeads] = useState<LeadItem[]>([]);

  const availableDays = useMemo(() => {
    const nowUK = new Date(
      new Date().toLocaleString("en-US", { timeZone: "Europe/London" }),
    );
    const currentDayIdx = nowUK.getDay();
    const mappedIdx = currentDayIdx === 0 ? 6 : currentDayIdx - 1;
    return daysList.filter((_, i) => i <= mappedIdx);
  }, []);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [leads, calls] = await Promise.all([
        leadService.getAll(),
        schedulerService.getAllCalls(),
      ]);

      const totalLeadsCount = leads.length;
      const uniqueLeadsCalled = new Set(calls.map((c) => c.lead_id)).size;
      const remainingLeads = Math.max(0, totalLeadsCount - uniqueLeadsCalled);

      const now = new Date();
      const startOfToday = new Date();
      startOfToday.setHours(0, 0, 0, 0);

      const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const weeklyCalls = calls.filter(
        (c) => new Date(c.created_at) > oneWeekAgo,
      );
      const weeklyDuration = weeklyCalls.reduce(
        (acc, c) => acc + (c.duration || 0),
        0,
      );

      const todaysCalls = calls.filter(
        (c) => new Date(c.created_at) > startOfToday,
      );
      const todayDuration = todaysCalls.reduce(
        (acc, c) => acc + (c.duration || 0),
        0,
      );

      // --- CALCULATE TRENDS ---
      const weeklyT = daysList.map((d) => ({
        day: d,
        automated: 0,
        conversions: 0,
      }));
      const failedT = daysList.map((d) => ({ day: d, failed: 0 }));
      const successT = daysList.map((d) => ({ day: d, success: 0 }));
      const outcomesT = daysList.map((d) => ({
        day: d,
        success: 0,
        converted: 0,
        denied: 0,
      }));

      calls.forEach((call) => {
        const callDate = new Date(call.created_at);
        if (callDate < oneWeekAgo) return;

        const dayIdx = callDate.getDay();
        const mappedIdx = dayIdx === 0 ? 6 : dayIdx - 1;

        if (mappedIdx >= 0 && mappedIdx < 7) {
          const outcome = call.outcome || "";

          // Weekly Trends
          weeklyT[mappedIdx].automated++;
          if (["demo_booked", "info_sent"].includes(outcome)) {
            weeklyT[mappedIdx].conversions++;
          }

          // Failed Trends
          if (["failed", "busy", "no-answer", "no_answer"].includes(outcome)) {
            failedT[mappedIdx].failed++;
          }

          // Success Trends
          if (
            [
              "demo_booked",
              "info_sent",
              "callback_requested",
              "completed",
            ].includes(outcome)
          ) {
            successT[mappedIdx].success++;
          }

          // Outcomes Trends
          if (
            [
              "demo_booked",
              "info_sent",
              "callback_requested",
              "completed",
            ].includes(outcome)
          ) {
            outcomesT[mappedIdx].success++;
          }
          if (["demo_booked", "info_sent"].includes(outcome)) {
            outcomesT[mappedIdx].converted++;
          }
          if (
            [
              "not_interested",
              "do_not_call",
              "failed",
              "busy",
              "no-answer",
              "no_answer",
            ].includes(outcome)
          ) {
            outcomesT[mappedIdx].denied++;
          }
        }
      });

      setTrends({
        weekly: weeklyT,
        failed: failedT,
        success: successT,
        outcomes: outcomesT,
      });

      // Calculate missed calls for selected day
      const selectedDayIdx = daysList.indexOf(selectedDay);
      const missedCount = failedT[selectedDayIdx]?.failed || 0;

      // Filter calls for the selected day to show in the grid
      const selectedDayCalls = calls
        .filter((call) => {
          const callDate = new Date(call.created_at);
          if (callDate < oneWeekAgo) return false;
          const dayIdx = callDate.getDay();
          const mappedIdx = dayIdx === 0 ? 6 : dayIdx - 1;
          return daysList[mappedIdx] === selectedDay;
        })
        .slice(0, 9); // Show up to 9 leads for that day

      const dayLeads = selectedDayCalls.map((c) => ({
        name:
          c.leads?.contact_name ||
          `Lead "${c.leads?.company_name || "Prospect"}"`,
        duration: c.duration || 0,
      }));

      setRecentLeads(dayLeads);

      setStats({
        totalLeads: totalLeadsCount,
        callsMade: uniqueLeadsCalled,
        remaining: remainingLeads,
        callsToday: todaysCalls.length,
        todayDuration: Math.round(todayDuration / 60),
        weeklyCalls: weeklyCalls.length,
        weeklyDuration: Math.round(weeklyDuration / 60),
        callsMissed: missedCount,
      });
    } catch (err) {
      console.error("Failed to fetch stats:", err);
    } finally {
      setLoading(false);
    }
  }, [selectedDay]);

  useEffect(() => {
    if (!openStats) return;

    const run = async () => {
      await fetchData();
    };

    run();
  }, [openStats, fetchData]);

  useEffect(() => {
    const WS_URL = import.meta.env.VITE_WS_URL ?? "ws://localhost:5000/ws";
    const ws = new WebSocket(WS_URL);

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
          fetchData();
        }
      } catch {
        // ignore
      }
    };

    return () => ws.close();
  }, [fetchData]);

  if (!openStats) return null;

  const distributionData = [
    { name: "Leads Called", value: stats.callsMade },
    { name: "Remaining", value: stats.remaining },
  ];

  const snapshotData = [
    { name: "Total Leads", value: stats.totalLeads },
    { name: "Leads Called", value: stats.callsMade },
    { name: "Uncalled", value: stats.remaining },
  ];

  return (
    <div
      className="fixed inset-0 pointer-events-none"
      style={{ zIndex: getZIndex("stats") }}
    >
      <Rnd
        style={{ pointerEvents: "auto" }}
        onMouseDown={() => focusWindow("stats")}
        default={{ x: 200, y: 30, width: 550, height: 430 }}
        size={
          isFullScreen
            ? {
                width: window.innerWidth - 40,
                height: window.innerHeight - 100,
              }
            : undefined
        }
        position={isFullScreen ? { x: 20, y: 20 } : undefined}
        minWidth={850}
        minHeight={495}
        bounds="window"
        dragHandleClassName="drag-header"
        disableDragging={isFullScreen}
        enableResizing={!isFullScreen}
      >
        <div className="w-full h-full border border-[#14407B] rounded-xl bg-[#08182b] flex flex-col overflow-hidden shadow-2xl backdrop-blur-md">
          <div className="drag-header flex items-center justify-between px-6 py-3 border-b border-white/5 bg-[#10213E]">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-blue-600 rounded flex items-center justify-center text-[10px] font-bold text-white">
                JI
              </div>
              <span className="text-[10px] font-bold text-[#ffff] tracking-[0.2em] uppercase">
                Jobfinity-OS CRM
              </span>
            </div>
            <div className="flex items-center gap-4">
              <button className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-600/10 border border-blue-500/20 text-blue-400 text-[10px] font-bold">
                <Clock size={12} />
                STATISTICS
              </button>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsFullScreen(!isFullScreen)}
                  className="p-1 hover:bg-white/5 rounded text-[#4a6a8a] hover:text-white"
                >
                  {isFullScreen ? (
                    <Minimize2 size={14} />
                  ) : (
                    <Maximize2 size={14} />
                  )}
                </button>
                <button
                  onClick={toggleStats}
                  className="p-1 hover:bg-white/5 rounded text-[#4a6a8a] hover:text-red-400"
                >
                  <X size={16} />
                </button>
              </div>
            </div>
          </div>

          <main className="flex-1 overflow-auto custom-scroll bg-[#08182B]">
            <div className="flex flex-col items-center pt-8 pb-4 text-center">
              <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mb-4 shadow-[0_0_30px_rgba(30,111,217,0.3)]">
                <FileText size={32} className="text-white" />
              </div>
              <h1 className="text-2xl font-bold text-white tracking-tight">
                {selectedDay} Leads
              </h1>
              <p className="text-xs text-[#4a6a8a] mt-1 font-medium">
                Daily lead activity
              </p>
            </div>

            <div className="flex justify-center gap-2 py-6">
              {daysList.map((day) => {
                const isEnabled = availableDays.includes(day);
                return (
                  <button
                    key={day}
                    disabled={!isEnabled}
                    onClick={() => setSelectedDay(day)}
                    className={`px-6 py-2 rounded-xl text-xs font-bold transition-all ${
                      selectedDay === day
                        ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20"
                        : isEnabled
                          ? "bg-[#0f243d] text-[#4a6a8a] hover:bg-[#142d4d]"
                          : "bg-[#0a1525] text-[#2a3a4a] cursor-not-allowed"
                    }`}
                  >
                    {day}
                  </button>
                );
              })}
            </div>

            <div className="px-8 mb-8">
              <div className="grid grid-cols-5 gap-0.5 bg-[#142d4d]/30 border border-white/5 rounded-xl overflow-hidden backdrop-blur-sm">
                <div className="p-4 flex flex-col items-center justify-center text-center border-r border-white/5">
                  <span className="text-[10px] font-bold text-[#4a6a8a] uppercase mb-1">
                    Calls Today
                  </span>
                  <span className="text-lg font-bold text-white">
                    {stats.callsToday}
                  </span>
                </div>
                <div className="p-4 flex flex-col items-center justify-center text-center border-r border-white/5">
                  <span className="text-[10px] font-bold text-[#4a6a8a] uppercase mb-1">
                    Today Duration
                  </span>
                  <span className="text-lg font-bold text-white">
                    {stats.todayDuration} mins
                  </span>
                </div>
                <div className="p-4 flex flex-col items-center justify-center text-center border-r border-white/5">
                  <span className="text-[10px] font-bold text-[#4a6a8a] uppercase mb-1">
                    Weekly Calls Made
                  </span>
                  <span className="text-lg font-bold text-white">
                    {stats.weeklyCalls}
                  </span>
                </div>
                <div className="p-4 flex flex-col items-center justify-center text-center border-r border-white/5">
                  <span className="text-[10px] font-bold text-[#4a6a8a] uppercase mb-1">
                    Weekly Duration
                  </span>
                  <span className="text-lg font-bold text-white">
                    {stats.weeklyDuration} mins
                  </span>
                </div>
                <div className="p-4 flex flex-col items-center justify-center text-center">
                  <span className="text-[10px] font-bold text-[#4a6a8a] uppercase mb-1">
                    Calls Missed
                  </span>
                  <span className="text-lg font-bold text-rose-500">
                    {stats.callsMissed}
                  </span>
                </div>
              </div>
            </div>

            {loading ? (
              <div className="text-center py-10 text-[#4a6a8a] text-sm">
                Loading data...
              </div>
            ) : (
              <div className="px-8 mb-10 grid grid-cols-3 gap-4">
                {recentLeads.length > 0 ? (
                  recentLeads.map((lead, idx) => (
                    <div
                      key={idx}
                      className="bg-[#0c1928]/60 border border-white/5 rounded-xl p-4 hover:border-white/10 transition-colors"
                    >
                      <h4 className="text-[11px] font-bold text-white tracking-tight leading-tight mb-1">
                        {lead.name}
                      </h4>
                      <p className="text-[9px] text-[#4a6a8a] font-medium uppercase tracking-wider">
                        Duration: {formatDuration(lead.duration)}
                      </p>
                    </div>
                  ))
                ) : (
                  <div className="col-span-3 text-center py-6 bg-[#0c1928]/30 border border-dashed border-white/5 rounded-xl text-[10px] font-bold text-[#4a6a8a] uppercase tracking-widest">
                    No activity recorded for {selectedDay}
                  </div>
                )}
              </div>
            )}

            <div className="px-8 mb-10">
              <div className="bg-[#0c1928] border border-white/5 rounded-xl p-8">
                <div className="mb-8">
                  <h2 className="text-lg font-bold text-white mb-1">
                    Lead & Call Performance
                  </h2>
                  <p className="text-xs text-[#4a6a8a] font-medium tracking-tight">
                    Tracking total leads, outbound calls, and weekly
                    performance.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-8">
                  <div className="bg-[#0a1525] border border-white/5 rounded-xl p-6 flex flex-col shadow-xl">
                    <div className="flex justify-between items-center mb-6">
                      <h3 className="text-xs font-bold text-white flex items-center gap-2">
                        <TrendingUp size={14} className="text-emerald-500" />
                        Leads vs Calls
                      </h3>
                      <span className="px-3 py-1 rounded-full bg-blue-600/10 text-blue-400 text-[9px] font-bold uppercase tracking-widest">
                        Snapshot
                      </span>
                    </div>
                    <div className="h-60 mt-4">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart
                          data={snapshotData}
                          margin={{ top: 20, right: 30, left: -20, bottom: 0 }}
                        >
                          <CartesianGrid
                            strokeDasharray="3 3"
                            vertical={false}
                            stroke="rgba(255,255,255,0.03)"
                          />
                          <XAxis
                            dataKey="name"
                            axisLine={false}
                            tickLine={false}
                            tick={{
                              fill: "#3a5a7a",
                              fontSize: 10,
                              fontWeight: 700,
                            }}
                            dy={10}
                          />
                          <YAxis
                            axisLine={false}
                            tickLine={false}
                            tick={{
                              fill: "#3a5a7a",
                              fontSize: 10,
                              fontWeight: 700,
                            }}
                          />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: "#0a1525",
                              border: "1px solid rgba(255,255,255,0.1)",
                              borderRadius: "12px",
                            }}
                          />
                          <Line
                            type="monotone"
                            dataKey="value"
                            stroke={COLORS.success}
                            strokeWidth={3}
                            dot={{
                              fill: COLORS.success,
                              strokeWidth: 2,
                              r: 5,
                              stroke: "#0a1525",
                            }}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  <div className="bg-[#0a1525] border border-white/5 rounded-xl p-6 flex flex-col shadow-xl">
                    <div className="flex justify-between items-center mb-6">
                      <h3 className="text-xs font-bold text-white flex items-center gap-2">
                        <PieIcon size={14} className="text-blue-500" />
                        Lead Distribution
                      </h3>
                      <span className="px-3 py-1 rounded-full bg-emerald-600/10 text-emerald-400 text-[9px] font-bold uppercase tracking-widest">
                        Breakdown
                      </span>
                    </div>
                    <div className="h-50 relative">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={distributionData}
                            cx="50%"
                            cy="50%"
                            innerRadius={70}
                            outerRadius={95}
                            paddingAngle={8}
                            dataKey="value"
                          >
                            {distributionData.map((_entry, index) => (
                              <Cell
                                key={`cell-${index}`}
                                fill={PIE_COLORS[index % PIE_COLORS.length]}
                                stroke="none"
                              />
                            ))}
                          </Pie>
                          <Tooltip
                            contentStyle={{
                              backgroundColor: "#0a1525",
                              border: "1px solid rgba(255,255,255,0.1)",
                              borderRadius: "12px",
                            }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="flex flex-wrap gap-x-6 gap-y-3 justify-center mt-6">
                      {distributionData.map((entry, i) => (
                        <div key={i} className="flex items-center gap-2">
                          <span
                            className="w-2.5 h-2.5 rounded-full"
                            style={{ backgroundColor: PIE_COLORS[i] }}
                          />
                          <span className="text-[11px] text-[#4a6a8a] font-bold uppercase tracking-tight">
                            {entry.name} ({entry.value})
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="px-8 mb-8">
              <div className="bg-[#0c1928] border border-white/5 rounded-xl p-7">
                <div className="flex justify-between items-center mb-10">
                  <h2 className="text-lg font-bold text-white mb-1">
                    Performance Trends – Multiple Metrics
                  </h2>
                  <span className="px-3 py-1 rounded-full bg-blue-600/10 text-blue-400 text-[10px] font-bold uppercase tracking-widest">
                    Weekly
                  </span>
                </div>
                <div className="h-60">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                      data={trends.weekly}
                      margin={{ top: 10, right: 30, left: -20, bottom: 0 }}
                    >
                      <defs>
                        <linearGradient
                          id="colorAuto"
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="1"
                        >
                          <stop
                            offset="5%"
                            stopColor={COLORS.primary}
                            stopOpacity={0.4}
                          />
                          <stop
                            offset="95%"
                            stopColor={COLORS.primary}
                            stopOpacity={0}
                          />
                        </linearGradient>
                      </defs>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        vertical={false}
                        stroke="rgba(255,255,255,0.03)"
                      />
                      <XAxis
                        dataKey="day"
                        axisLine={false}
                        tickLine={false}
                        tick={{
                          fill: "#3a5a7a",
                          fontSize: 11,
                          fontWeight: 700,
                        }}
                        dy={10}
                      />
                      <YAxis
                        axisLine={false}
                        tickLine={false}
                        tick={{
                          fill: "#3a5a7a",
                          fontSize: 11,
                          fontWeight: 700,
                        }}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#0a1525",
                          border: "1px solid rgba(255,255,255,0.1)",
                          borderRadius: "12px",
                        }}
                      />
                      <Area
                        type="monotone"
                        dataKey="automated"
                        stroke={COLORS.primary}
                        strokeWidth={2}
                        fill="url(#colorAuto)"
                      />
                      <Line
                        type="monotone"
                        dataKey="conversions"
                        stroke={COLORS.success}
                        strokeWidth={2}
                        dot={{ fill: COLORS.success, r: 0 }}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            <div className="px-8 mb-8">
              <div className="bg-[#0c1928] border border-white/5 rounded-xl p-8">
                <div className="flex justify-between items-center mb-10">
                  <h2 className="text-lg font-bold text-white mb-1">
                    Calls Failed
                  </h2>
                  <span className="px-3 py-1 rounded-full bg-blue-600/10 text-blue-400 text-[10px] font-bold uppercase tracking-widest">
                    Weekly
                  </span>
                </div>
                <div className="h-60">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                      data={trends.failed}
                      margin={{ top: 10, right: 30, left: -20, bottom: 0 }}
                    >
                      <defs>
                        <linearGradient
                          id="colorFailed"
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="1"
                        >
                          <stop
                            offset="5%"
                            stopColor={COLORS.warning}
                            stopOpacity={0.4}
                          />
                          <stop
                            offset="95%"
                            stopColor={COLORS.warning}
                            stopOpacity={0}
                          />
                        </linearGradient>
                      </defs>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        vertical={false}
                        stroke="rgba(255,255,255,0.03)"
                      />
                      <XAxis
                        dataKey="day"
                        axisLine={false}
                        tickLine={false}
                        tick={{
                          fill: "#3a5a7a",
                          fontSize: 11,
                          fontWeight: 700,
                        }}
                        dy={10}
                      />
                      <YAxis
                        axisLine={false}
                        tickLine={false}
                        tick={{
                          fill: "#3a5a7a",
                          fontSize: 11,
                          fontWeight: 700,
                        }}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#0a1525",
                          border: "1px solid rgba(255,255,255,0.1)",
                          borderRadius: "12px",
                        }}
                      />
                      <Area
                        type="monotone"
                        dataKey="failed"
                        stroke={COLORS.warning}
                        strokeWidth={2}
                        fill="url(#colorFailed)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex justify-center mt-6">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-[#F59E0B]" />
                    <span className="text-[11px] font-bold text-[#4a6a8a] uppercase tracking-wide">
                      Calls Failed
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="px-8 mb-8">
              <div className="bg-[#0c1928] border border-white/5 rounded-xl p-8">
                <div className="flex justify-between items-center mb-10">
                  <h2 className="text-lg font-bold text-white mb-1">
                    Call Success
                  </h2>
                  <span className="px-3 py-1 rounded-full bg-blue-600/10 text-blue-400 text-[10px] font-bold uppercase tracking-widest">
                    Weekly
                  </span>
                </div>
                <div className="h-60">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                      data={trends.success}
                      margin={{ top: 10, right: 30, left: -20, bottom: 0 }}
                    >
                      <defs>
                        <linearGradient
                          id="colorSuccess"
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="1"
                        >
                          <stop
                            offset="5%"
                            stopColor={COLORS.success}
                            stopOpacity={0.2}
                          />
                          <stop
                            offset="95%"
                            stopColor={COLORS.success}
                            stopOpacity={0}
                          />
                        </linearGradient>
                      </defs>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        vertical={false}
                        stroke="rgba(255,255,255,0.03)"
                      />
                      <XAxis
                        dataKey="day"
                        axisLine={false}
                        tickLine={false}
                        tick={{
                          fill: "#3a5a7a",
                          fontSize: 11,
                          fontWeight: 700,
                        }}
                        dy={10}
                      />
                      <YAxis
                        axisLine={false}
                        tickLine={false}
                        tick={{
                          fill: "#3a5a7a",
                          fontSize: 11,
                          fontWeight: 700,
                        }}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#0a1525",
                          border: "1px solid rgba(255,255,255,0.1)",
                          borderRadius: "12px",
                        }}
                      />
                      <Area
                        type="monotone"
                        dataKey="success"
                        stroke={COLORS.success}
                        strokeWidth={2}
                        fill="url(#colorSuccess)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex justify-center mt-6">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-emerald-500" />
                    <span className="text-[11px] font-bold text-[#4a6a8a] uppercase tracking-wide">
                      Call Success
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="px-8 mb-16">
              <div className="bg-[#0c1928] border border-white/5 rounded-xl p-8">
                <div className="flex justify-between items-center mb-10">
                  <h2 className="text-lg font-bold text-white mb-1">
                    Clustered Bar – Call Outcomes
                  </h2>
                  <span className="px-3 py-1 rounded-full bg-blue-600/10 text-blue-400 text-[10px] font-bold uppercase tracking-widest">
                    Weekly
                  </span>
                </div>
                <div className="h-60">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={trends.outcomes}
                      margin={{ top: 10, right: 30, left: -20, bottom: 0 }}
                      barGap={3}
                    >
                      <CartesianGrid
                        strokeDasharray="3 3"
                        vertical={false}
                        stroke="rgba(255,255,255,0.03)"
                      />
                      <XAxis
                        dataKey="day"
                        axisLine={false}
                        tickLine={false}
                        tick={{
                          fill: "#3a5a7a",
                          fontSize: 11,
                          fontWeight: 700,
                        }}
                        dy={10}
                      />
                      <YAxis
                        axisLine={false}
                        tickLine={false}
                        tick={{
                          fill: "#3a5a7a",
                          fontSize: 11,
                          fontWeight: 700,
                        }}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#0a1525",
                          border: "1px solid rgba(255,255,255,0.1)",
                          borderRadius: "12px",
                        }}
                      />
                      <Bar
                        dataKey="success"
                        fill={COLORS.success}
                        radius={[4, 4, 0, 0]}
                        barSize={25}
                      />
                      <Bar
                        dataKey="denied"
                        fill={COLORS.pink}
                        radius={[4, 4, 0, 0]}
                        barSize={25}
                      />
                      <Bar
                        dataKey="converted"
                        fill={COLORS.primary}
                        radius={[4, 4, 0, 0]}
                        barSize={25}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex justify-center gap-8 mt-6">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-emerald-500" />
                    <span className="text-[11px] font-bold text-[#4a6a8a] uppercase tracking-wide">
                      Call Success
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-blue-600" />
                    <span className="text-[11px] font-bold text-[#4a6a8a] uppercase tracking-wide">
                      Calls Converted
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-rose-500" />
                    <span className="text-[11px] font-bold text-[#4a6a8a] uppercase tracking-wide">
                      Calls Denied
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </main>

          <footer className="px-6 py-4 border-t border-white/5 bg-[#10213E] flex justify-between items-center shrink-0">
            <div className="flex items-center gap-2">
              <Activity size={14} className="text-emerald-500 animate-pulse" />
              <span className="text-[10px] font-bold text-[#ffff] uppercase tracking-widest">
                AI Engine: Online
              </span>
            </div>
            {/* <div className="flex gap-4">
              <p className="text-[9px] text-[#ffff] font-bold uppercase tracking-tight">
                Data synchronized with UK Scheduler
              </p>
              <p className="text-[9px] text-blue-500/50 font-bold uppercase tracking-tight">
                v1.2.0-stable
              </p>
            </div> */}
          </footer>
        </div>
      </Rnd>
    </div>
  );
}
