import { Outlet, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import Sidebar from "./Sidebar";
import Header from "./Header";
import AddJobDialog from "./AddJobDialog";
import { AnimatePresence, motion } from "framer-motion";

export default function AppLayout() {
  const [addJobOpen, setAddJobOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const location = useLocation();

  // Close mobile sidebar on route change
  useEffect(() => {
    setMobileSidebarOpen(false);
  }, [location.pathname]);

  // Auto-collapse on smaller screens
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 1023px)");
    const handler = (e) => {
      if (e.matches) setSidebarCollapsed(true);
    };
    handler(mq);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  const openAddJob = (tab) => {
    setAddJobOpen(true);
  };

  return (
    <div className="flex h-screen overflow-hidden bg-background text-foreground">
      {/* Mobile overlay */}
      <AnimatePresence>
        {mobileSidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-40 bg-black/40 lg:hidden"
            onClick={() => setMobileSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar — desktop: normal flow; mobile: fixed overlay */}
      <div className={mobileSidebarOpen ? "fixed inset-y-0 left-0 z-50 lg:relative lg:z-auto" : "hidden lg:flex"}>
        <Sidebar
          isCollapsed={sidebarCollapsed && !mobileSidebarOpen}
          onToggleCollapse={() => {
            if (mobileSidebarOpen) {
              setMobileSidebarOpen(false);
            } else {
              setSidebarCollapsed(!sidebarCollapsed);
            }
          }}
        />
      </div>

      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <Header
          onAddJob={openAddJob}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          onToggleMobileSidebar={() => setMobileSidebarOpen(!mobileSidebarOpen)}
        />
        <main className="flex-1 overflow-auto relative">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15, ease: [0.25, 0.1, 0.25, 1] }}
              className="h-full"
            >
              <Outlet context={{ searchQuery, openAddJob }} />
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
      <AddJobDialog open={addJobOpen} onOpenChange={setAddJobOpen} />
    </div>
  );
}
