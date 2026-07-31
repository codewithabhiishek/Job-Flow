import { Outlet, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import Sidebar from "./Sidebar";
import Header from "./Header";
import AddJobDialog from "./AddJobDialog";
import { AnimatePresence, motion } from "framer-motion";

export default function AppLayout() {
  const [addJobOpen, setAddJobOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const location = useLocation();


  const openAddJob = () => setAddJobOpen(true);

  return (
    <div className="flex h-screen overflow-hidden bg-background text-foreground transition-colors duration-300">
      <Sidebar onAddJob={openAddJob} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header
          onAddJob={openAddJob}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
        />
        <main className="flex-1 overflow-auto bg-background transition-colors duration-300 relative">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
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
