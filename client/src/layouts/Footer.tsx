import { NavLink } from "react-router-dom";
import {
  House, FolderOpen, CircleCheck, MessageSquareText,
  ChartNoAxesCombined, Mail, Globe, Settings, CircleUser,
} from "lucide-react";
import { useWindowManager } from "@/context/WindowManagerContext";

const activeClass =
  "text-white bg-[#1E6FD9]/40 ring-1 ring-[#3b82f6]/80 rounded-lg p-1.5 transition-all";
const inactiveClass =
  "text-[#3a5a7a] hover:text-[#7a9ab5] hover:bg-[#1e3a5a]/25 transition-all p-1.5 rounded-lg";

const Footer = () => {
  const {
    openDocs,
    openAgent,
    toggleDocs,
    toggleAgent,
    focusWindow,
  } = useWindowManager();

  // UK time clock
  const now    = new Date();
  const ukTime = now.toLocaleTimeString("en-GB", { timeZone: "Europe/London", hour: "2-digit", minute: "2-digit" });
  const ukDate = now.toLocaleDateString("en-GB",  { timeZone: "Europe/London", day: "2-digit", month: "2-digit", year: "numeric" });

  return (
    <footer className="m-2 bg-[#08182b] px-4 py-1.5 text-[#4a6a8a] flex self-center justify-between items-center rounded-xl border border-[#1e3a5a] shadow-[0_0_20px_rgba(14,30,55,0.6)]">
      <div className="flex pr-5">
        <NavLink to="/" className={({ isActive }) => (isActive ? activeClass : inactiveClass)}>
          <CircleUser size={22} />
        </NavLink>
      </div>

      <div className="flex justify-center items-center gap-3">
        <span className="text-[#1e3a5a]">|</span>

        {/* Home */}
        <NavLink
          to="/"
          onClick={() => focusWindow("kanban")}
          className={({ isActive }) => (isActive ? activeClass : inactiveClass)}
        >
          <House size={22} />
        </NavLink>

        {/* Documents */}
        <button
          onClick={() => toggleDocs()}
          className={openDocs ? activeClass : inactiveClass}
        >
          <FolderOpen size={22} />
        </button>

        <NavLink
          to="/timeline"
          className={({ isActive }) => (isActive ? activeClass : inactiveClass)}
        >
          <CircleCheck size={22} />
        </NavLink>

        {/* Agent monitor */}
        <button
          onClick={() => toggleAgent()}
          className={openAgent ? activeClass : inactiveClass}
        >
          <ChartNoAxesCombined size={22} />
        </button>
        <NavLink
          to="/analytics"
          className={({ isActive }) => (isActive ? activeClass : inactiveClass)}
        >
          <MessageSquareText size={22} />
        </NavLink>

        <NavLink to="/mail" className={({ isActive }) => (isActive ? activeClass : inactiveClass)}>
          <Mail size={22} />
        </NavLink>

        <NavLink to="/web" className={({ isActive }) => (isActive ? activeClass : inactiveClass)}>
          <Globe size={22} />
        </NavLink>

        <span className="text-[#1e3a5a]">|</span>
      </div>

      <div className="flex pl-5 justify-center items-center gap-4">
        {/* live UK clock — replaces hardcoded time */}
        <div className="flex flex-col items-end">
          <div className="text-xs font-semibold text-[#7a9ab5]">{ukTime}</div>
          <div className="text-[10px] text-[#3a5570]">{ukDate}</div>
        </div>
        <NavLink to="/settings" className={({ isActive }) => (isActive ? activeClass : inactiveClass)}>
          <Settings size={22} />
        </NavLink>
        <NavLink to="/profile" className={({ isActive }) => (isActive ? activeClass : inactiveClass)}>
          <CircleUser size={22} />
        </NavLink>
      </div>
    </footer>
  );
};

export default Footer;