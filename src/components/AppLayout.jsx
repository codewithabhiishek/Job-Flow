import { Outlet } from "react-router-dom";
import { useState, useEffect } from "react";
import Sidebar from "./Sidebar";
import Header from "./Header";
import AddJobDialog from "./AddJobDialog";

export default function AppLayout() {
  const [addJobOpen, setAddJobOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    document.documentElement.classList.add("dark");
  }, []);

  const openAddJob = () => setAddJobOpen(true);

  return (
    <div className="flex h-screen overflow-hidden bg-neutral-950 text-neutral-100">
      <Sidebar onAddJob={openAddJob} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header
          onAddJob={openAddJob}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
        />
        <main className="flex-1 overflow-auto bg-neutral-950">
          <Outlet context={{ searchQuery, openAddJob }} />
        </main>
      </div>
      <AddJobDialog open={addJobOpen} onOpenChange={setAddJobOpen} />
    </div>
  );
}
