import Navbar from "@/layouts/Navbar";
import Footer from "@/layouts/Footer";
import { Outlet } from "react-router-dom";
import { WindowManagerProvider } from "@/context/WindowManagerProvider";
import { DocumentsModal } from "@/features/documents/DocumentsModal";
import AgentMoniter from "@/features/agent/AgentMonitor";

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
        <AgentMoniter />
      </div>
    </WindowManagerProvider>
  );
};

export default Layout;