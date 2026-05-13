import Navbar from "@/layouts/Navbar";
import Footer from "@/layouts/Footer";
import { Outlet } from "react-router-dom";
import { WindowManagerProvider } from "@/context/WindowManagerProvider";
import { DocumentsModal } from "@/features/documents/DocumentsModal";
import AgentMonitor from "@/features/agent/AgentMonitor";
import LeadStats from "@/features/stats/LeadStats";
import DashboardModal from "@/features/dashboard/DashboardModal";

const Layout = () => {
  return (
    <WindowManagerProvider>
      <div className="min-h-screen flex flex-col bg-[#071325] main">
        <Navbar />
        <main className="flex-1">
          <Outlet />
        </main>
        <Footer />
        <DocumentsModal />
        <AgentMonitor />
        <LeadStats />
        <DashboardModal />
      </div>
    </WindowManagerProvider>
  );
};

export default Layout;