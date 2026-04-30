import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { Outlet } from "react-router-dom";
import { WindowManagerProvider } from "../context/WindowManagerProvider";
import { DocumentsModal } from "../pages/components/ui/DocumentsModal";
import AgentMoniter from "../pages/components/ui/AgentMonitor";

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