import { useMemo, useState } from "react";
import { Rnd } from "react-rnd";
import {
  FileText,
  Maximize2,
  MessageSquareText,
  Minimize2,
  PhoneCall,
  RefreshCcw,
  Ticket,
  X,
} from "lucide-react";
import { useWindowManager } from "@/context/WindowManagerContext";
import {
  DASHBOARD_AGENTS,
  getDashboardAgentById,
} from "@/features/dashboard/staticAgents";

type AgentTab = "chat" | "script" | "tickets" | "calls";

function TabButton({
  isActive,
  onClick,
  icon,
  label,
}: {
  isActive: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 h-12 rounded-full px-5 inline-flex items-center justify-center gap-2 text-sm font-medium transition-colors ${
        isActive
          ? "bg-[#1E6FD9] text-white shadow-[0_10px_30px_rgba(30,111,217,0.25)]"
          : "text-[#6FA3B8] hover:bg-[#162438]"
      }`}
    >
      {icon}
      {label}
    </button>
  );
}

export default function DashboardModal() {
  const {
    openDashboard,
    toggleDashboard,
    selectedDashboardAgentId,
    setSelectedDashboardAgentId,
    getZIndex,
    focusWindow,
  } = useWindowManager();

  const [isFullScreen, setIsFullScreen] = useState(false);
  const [activeTab, setActiveTab] = useState<AgentTab>("chat");

  const selectedAgent = useMemo(
    () => getDashboardAgentById(selectedDashboardAgentId),
    [selectedDashboardAgentId]
  );

  if (!openDashboard) return null;

  return (
    <div
      className="fixed inset-0 pointer-events-none"
      style={{ zIndex: openDashboard ? getZIndex("dashboard") : -1 }}
    >
      <Rnd
        style={{ pointerEvents: "auto" }}
        onMouseDown={() => focusWindow("dashboard")}
        default={{ x: 120, y: 30, width: 900, height: 450 }}
        size={
          isFullScreen
            ? {
                width: window.innerWidth - 40,
                height: window.innerHeight - 100,
              }
            : undefined
        }
        position={isFullScreen ? { x: 20, y: 20 } : undefined}
        minWidth={750}
        minHeight={420}
        bounds="window"
        dragHandleClassName="drag-header"
        disableDragging={isFullScreen}
        enableResizing={!isFullScreen}
      >
        <div className="w-full h-full border border-[#162438] rounded-2xl bg-[#0d1f38] flex flex-col overflow-hidden shadow-2xl">
          <header className="drag-header flex items-center justify-between px-5 py-3 border-b border-[#162438] bg-[#08182b] cursor-move shrink-0">
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-sm font-semibold text-[#c8ddf2] truncate">
                {selectedAgent ? selectedAgent.name : "Select an Agent"}
              </span>
              {selectedAgent ? (
                <span className="text-xs text-[#6b7280] truncate">
                  · {selectedAgent.subtitle}
                </span>
              ) : null}
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => setIsFullScreen(!isFullScreen)}
                className="p-1.5 hover:bg-[#162438] rounded-lg text-[#6FA3B8] hover:text-[#c8ddf2] transition-colors"
              >
                {isFullScreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
              </button>
              <button
                onClick={() => {
                  toggleDashboard();
                  setActiveTab("chat");
                }}
                className="p-1.5 hover:bg-[#162438] rounded-lg text-[#6FA3B8] hover:text-[#ef4444] transition-colors"
              >
                <X size={14} />
              </button>
            </div>
          </header>

          <main className="flex-1 overflow-auto custom-scroll px-8 py-8 bg-[#0d1f38]">
            {!selectedAgent ? (
              <div className="max-w-5xl mx-auto">
                <div className="text-center">
                  <h1 className="text-3xl font-semibold text-[#c8ddf2] tracking-tight">
                    Select an Agent
                  </h1>
                  <p className="text-sm text-[#9aa6b2] mt-1">
                    Choose the agent workspace you want to open.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-10">
                  {DASHBOARD_AGENTS.map((agent) => (
                    <div
                      key={agent.id}
                      className="bg-[#162438] rounded-2xl border border-[#1E6FD9]/20 shadow-[0_10px_40px_rgba(15,23,42,0.05)] overflow-hidden"
                    >
                      <div className="flex min-h-41.25">
                        <div className="flex-1 p-6">
                          <h3 className="text-lg font-semibold text-[#c8ddf2]">
                            {agent.name}
                          </h3>
                          <p className="text-[11px] text-[#6FA3B8] mt-1 line-clamp-2">
                            {agent.description}
                          </p>
                          <button
                            onClick={() => toggleDashboard(agent.id)}
                            className="mt-6 inline-flex items-center justify-center h-9 px-4 rounded-lg border border-[#c8ddf2] text-xs font-medium text-[#c8ddf2] hover:bg-[#162438] transition-colors"
                          >
                            Select Agent
                          </button>
                        </div>

                        <div className="w-42.5 border-l border-[#1E6FD9]/20 flex items-center justify-center bg-linear-to-b from-[#0d1f38] to-[#08182b]">
                          <div
                            className="w-30 h-30 rounded-xl flex items-center justify-center"
                            style={{
                              background: `linear-gradient(135deg, ${agent.accent} 0%, rgba(99,102,241,0.9) 100%)`,
                            }}
                          >
                            <span className="text-white text-5xl font-semibold select-none">
                              ∞
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="max-w-6xl mx-auto">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div className="w-16 h-16 rounded-full bg-[#1E6FD9]/10 flex items-center justify-center border border-[#1E6FD9]/25">
                      <span
                        className="text-3xl font-semibold"
                        style={{ color: selectedAgent.accent }}
                      >
                        ∞
                      </span>
                    </div>
                    <div className="pt-1">
                      <h2 className="text-3xl font-semibold text-[#c8ddf2] tracking-tight">
                        {selectedAgent.name}
                      </h2>
                      <p className="text-sm text-[#6FA3B8] mt-1 max-w-xl">
                        {selectedAgent.description}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setSelectedDashboardAgentId(null);
                      setActiveTab("chat");
                    }}
                    className="h-10 px-4 rounded-lg border border-[#c8ddf2] text-xs font-medium text-[#c8ddf2] hover:bg-[#162438] transition-colors inline-flex items-center gap-2"
                  >
                    <RefreshCcw size={14} />
                    Change Agent
                  </button>
                </div>

                <div className="mt-8 bg-[#162438] rounded-full px-2 py-2 flex items-center gap-2">
                  <TabButton
                    isActive={activeTab === "chat"}
                    onClick={() => setActiveTab("chat")}
                    icon={<MessageSquareText size={16} />}
                    label="Chat"
                  />
                  <TabButton
                    isActive={activeTab === "script"}
                    onClick={() => setActiveTab("script")}
                    icon={<FileText size={16} />}
                    label="Script"
                  />
                  <TabButton
                    isActive={activeTab === "tickets"}
                    onClick={() => setActiveTab("tickets")}
                    icon={<Ticket size={16} />}
                    label="Tickets"
                  />
                  <TabButton
                    isActive={activeTab === "calls"}
                    onClick={() => setActiveTab("calls")}
                    icon={<PhoneCall size={16} />}
                    label="Calls"
                  />
                </div>

                <div className="mt-8">
                  {activeTab === "chat" && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      {[
                        {
                          title: 'Lead "I-Intro"',
                          email: "1st@i-intro.com",
                          phone: "+441132305601",
                          name: "Plamen Ivanoff",
                        },
                        {
                          title: 'Lead "Phase 3"',
                          email: "a.ahmed@phase3consulting.com",
                          phone: "+448003213032",
                          name: "Assad Ahmed",
                        },
                        {
                          title: 'Lead "jccproperties.co.uk"',
                          email: "a.amadi@jccproperties.co.uk",
                          phone: "+447405245637",
                          name: "Athina Amadi",
                        },
                      ].map((c) => (
                        <div
                          key={c.title}
                          className="bg-[#162438] rounded-2xl border border-[#1E6FD9]/20 shadow-[0_10px_40px_rgba(15,23,42,0.05)] p-6"
                        >
                          <div className="flex items-start justify-between">
                            <p className="text-sm font-semibold text-[#c8ddf2]">
                              ✦ {c.title}
                            </p>
                            <span className="w-2.5 h-2.5 rounded-full bg-[#ef4444]" />
                          </div>

                          <div className="mt-4 space-y-2 text-xs text-[#6FA3B8]">
                            <div>
                              <span className="font-medium text-[#c8ddf2]">
                                Email:
                              </span>{" "}
                              {c.email}
                            </div>
                            <div>
                              <span className="font-medium text-[#c8ddf2]">
                                Phone:
                              </span>{" "}
                              {c.phone}
                            </div>
                            <div>
                              <span className="font-medium text-[#c8ddf2]">
                                Name:
                              </span>{" "}
                              {c.name}
                            </div>
                          </div>

                          <button className="mt-6 w-full h-10 rounded-lg border border-[#1E6FD9] text-xs font-medium text-[#1E6FD9] hover:bg-[#162438] transition-colors">
                            Get Recording
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {activeTab === "script" && (
                    <div className="bg-[#162438] rounded-2xl border border-[#1E6FD9]/20 shadow-[0_10px_40px_rgba(15,23,42,0.05)] p-8">
                      <h3 className="text-xl font-semibold text-[#c8ddf2]">
                        Create New Script for Outsourcing
                      </h3>
                      <p className="text-sm text-[#9aa6b2] mt-1">
                        Fill in the details below to create a script.
                      </p>

                      <div className="mt-8 space-y-6">
                        <div>
                          <label className="text-xs font-medium text-[#c8ddf2]">
                            Call Type (e.g., Billing Inquiry, Marketing Outreach)
                          </label>
                          <input
                            className="mt-2 w-full h-12 rounded-lg border border-[#1E6FD9]/30 bg-[#0d1f38] px-4 text-sm text-[#c8ddf2] outline-none focus:ring-2 focus:ring-[#1E6FD9]/30"
                            defaultValue="AI Outsourcing Consultation, Service Partnership Inquiry"
                          />
                        </div>
                        <div>
                          <label className="text-xs font-medium text-[#c8ddf2]">
                            Product/Service (e.g., Premium Subscription)
                          </label>
                          <input
                            className="mt-2 w-full h-12 rounded-lg border border-[#1E6FD9]/30 bg-[#0d1f38] px-4 text-sm text-[#c8ddf2] outline-none focus:ring-2 focus:ring-[#1E6FD9]/30"
                            defaultValue="AI Model Development, AI Team Augmentation, End-to-End AI Solutions"
                          />
                        </div>
                        <div>
                          <label className="text-xs font-medium text-[#c8ddf2]">
                            Customer Persona (e.g., Frustrated, Potential Client)
                          </label>
                          <input
                            className="mt-2 w-full h-12 rounded-lg border border-[#1E6FD9]/30 bg-[#0d1f38] px-4 text-sm text-[#c8ddf2] outline-none focus:ring-2 focus:ring-[#1E6FD9]/30"
                            defaultValue="Tech Founder scaling product, Enterprise Innovation Manager, Resource-constrained CTO"
                          />
                        </div>
                        <button className="h-11 px-5 rounded-lg bg-[#1E6FD9] text-white text-sm font-medium">
                          Generate Script
                        </button>
                      </div>
                    </div>
                  )}

                  {activeTab === "tickets" && (
                    <div className="bg-[#162438] rounded-2xl border border-[#1E6FD9]/20 shadow-[0_10px_40px_rgba(15,23,42,0.05)] p-8">
                      <h3 className="text-xl font-semibold text-[#c8ddf2]">
                        Create New Ticket for Outsourcing
                      </h3>
                      <p className="text-sm text-[#6FA3B8] mt-1">
                        Fill in the details below to create a ticket.
                      </p>

                      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="text-xs font-medium text-[#c8ddf2]">
                            Customer Name
                          </label>
                          <input
                            className="mt-2 w-full h-12 rounded-lg border border-[#1E6FD9]/30 bg-[#0d1f38] px-4 text-sm text-[#c8ddf2] outline-none focus:ring-2 focus:ring-[#1E6FD9]/30"
                            defaultValue="Carl Randle"
                          />
                        </div>
                        <div>
                          <label className="text-xs font-medium text-[#c8ddf2]">
                            Contact Info (Email/Phone)
                          </label>
                          <input
                            className="mt-2 w-full h-12 rounded-lg border border-[#1E6FD9]/30 bg-[#0d1f38] px-4 text-sm text-[#c8ddf2] outline-none focus:ring-2 focus:ring-[#1E6FD9]/30"
                            defaultValue="admin@jobfinitygroup.com"
                          />
                        </div>
                        <div className="md:col-span-2">
                          <label className="text-xs font-medium text-[#c8ddf2]">
                            Issue Description
                          </label>
                          <textarea
                            className="mt-2 w-full min-h-35 rounded-lg border border-[#1E6FD9]/30 bg-[#0d1f38] px-4 py-3 text-sm text-[#c8ddf2] outline-none focus:ring-2 focus:ring-[#1E6FD9]/30"
                            placeholder="Describe the issue here..."
                          />
                        </div>
                        <div>
                          <label className="text-xs font-medium text-[#c8ddf2]">
                            Product/Service (Optional)
                          </label>
                          <input className="mt-2 w-full h-12 rounded-lg border border-[#1E6FD9]/30 bg-[#0d1f38] px-4 text-sm text-[#c8ddf2] outline-none focus:ring-2 focus:ring-[#1E6FD9]/30" />
                        </div>
                        <div>
                          <label className="text-xs font-medium text-[#c8ddf2]">
                            Status
                          </label>
                          <select className="mt-2 w-full h-12 rounded-lg border border-[#1E6FD9]/30 bg-[#0d1f38] px-4 text-sm text-[#c8ddf2] outline-none focus:ring-2 focus:ring-[#1E6FD9]/30">
                            <option>Open</option>
                            <option>In Progress</option>
                            <option>Closed</option>
                          </select>
                        </div>
                        <div className="md:col-span-2">
                          <label className="text-xs font-medium text-[#c8ddf2]">
                            Agent Notes (Optional)
                          </label>
                          <textarea
                            className="mt-2 w-full min-h-30 rounded-lg border border-[#1E6FD9]/30 bg-[#0d1f38] px-4 py-3 text-sm text-[#c8ddf2] outline-none focus:ring-2 focus:ring-[#1E6FD9]/30"
                            placeholder="Internal Notes about the ticket..."
                          />
                        </div>
                        <div className="md:col-span-2 flex items-center gap-3">
                          <button className="h-11 px-6 rounded-lg bg-[#1E6FD9] text-white text-sm font-medium">
                            Create Ticket
                          </button>
                          <button className="h-11 px-6 rounded-lg border border-[#c8ddf2] text-sm font-medium text-[#c8ddf2]">
                            Clear All
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {activeTab === "calls" && (
                    <div className="bg-[#162438] rounded-2xl border border-[#1E6FD9]/20 shadow-[0_10px_40px_rgba(15,23,42,0.05)] p-8">
                      <h3 className="text-xl font-semibold text-[#c8ddf2]">
                        Call Simulation & Initiation
                      </h3>
                      <p className="text-sm text-[#6FA3B8] mt-1">
                        Lorem ipsum is a dummy or placeholder.
                      </p>

                      <div className="mt-6 bg-[#1E6FD9]/10 border border-[#1E6FD9]/20 text-[#4a9eff] rounded-lg px-4 py-3 text-sm">
                        <span className="font-semibold">Action Required</span>
                        <div className="text-xs mt-1">
                          Please generate Lorem ipsum is a dummy or placeholder.
                        </div>
                      </div>

                      <div className="mt-6">
                        <label className="text-xs font-medium text-[#c8ddf2]">
                          Phone No. (for Outbound calls)
                        </label>
                        <input className="mt-2 w-full h-12 rounded-lg border border-[#1E6FD9]/30 bg-[#0d1f38] px-4 text-sm text-[#c8ddf2] outline-none focus:ring-2 focus:ring-[#1E6FD9]/30" />
                      </div>

                      <div className="mt-8 flex items-center gap-3">
                        <button className="h-11 px-6 rounded-lg bg-[#1E6FD9] text-white text-sm font-medium">
                          Start Real Outbound Call
                        </button>
                        <button className="h-11 px-6 rounded-lg border border-[#c8ddf2] text-sm font-medium text-[#c8ddf2]">
                          Simulate Inbound Call
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </main>
        </div>
      </Rnd>
    </div>
  );
}

