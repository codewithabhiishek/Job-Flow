import { Search, Sun, Plus } from "lucide-react";
import { useAuth } from "@/lib/AuthContext";

export default function Header({ onAddJob, searchQuery, setSearchQuery }) {
  const { user } = useAuth();

  const initials = (user?.full_name || user?.email || "U")
    .split(" ")
    .map((s) => s[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <header className="h-14 shrink-0 border-b border-white/[0.06] bg-neutral-950 flex items-center gap-3 px-4">
      <div className="relative flex-1 max-w-md">
        <Search
          className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-600"
          strokeWidth={1.5}
        />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search company, role, location..."
          className="w-full h-9 pl-9 pr-3 rounded-md bg-neutral-900 border border-white/[0.08] text-[13px] text-neutral-200 placeholder:text-neutral-600 focus:outline-none focus:border-neutral-700 transition-colors duration-200"
        />
      </div>

      <div className="flex items-center gap-2 ml-auto">
        <button className="w-9 h-9 flex items-center justify-center rounded-md text-neutral-500 hover:text-neutral-200 hover:bg-neutral-900 transition-colors duration-200">
          <Sun className="w-4 h-4" strokeWidth={1.5} />
        </button>
        <button
          onClick={onAddJob}
          className="flex items-center gap-1.5 px-3.5 h-9 rounded-md border border-white/[0.08] text-neutral-200 text-[14px] font-semibold tracking-[-0.005em] hover:bg-neutral-900 transition-colors duration-200"
        >
          <Plus className="w-4 h-4" strokeWidth={2} />
          Add Job
        </button>
        <div className="w-8 h-8 rounded-full bg-neutral-800 flex items-center justify-center text-[11px] font-medium text-neutral-300">
          {initials}
        </div>
      </div>
    </header>
  );
}
