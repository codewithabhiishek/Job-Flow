import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Briefcase,
  Columns3,
  Calendar,
  BarChart3,
  Settings,
  Plus,
} from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { label: "Dashboard", icon: LayoutDashboard, path: "/dashboard" },
  { label: "Jobs", icon: Briefcase, path: "/jobs" },
  { label: "Kanban", icon: Columns3, path: "/kanban" },
  { label: "Calendar", icon: Calendar, path: "/calendar" },
  { label: "Analytics", icon: BarChart3, path: "/analytics" },
  { label: "Settings", icon: Settings, path: "/settings" },
];

export default function Sidebar({ onAddJob }) {
  const location = useLocation();

  return (
    <aside className="w-[220px] shrink-0 border-r border-white/[0.06] bg-neutral-950 flex flex-col">
      <div className="h-14 flex items-center gap-2 px-4 border-b border-white/[0.06]">
        <div className="w-7 h-7 rounded-md bg-white flex items-center justify-center">
          <span className="text-neutral-950 font-bold text-xs">JF</span>
        </div>
        <span className="font-semibold text-sm tracking-[-0.01em] text-neutral-100">
          JobFlow
        </span>
      </div>

      <nav className="flex-1 px-2.5 py-4 space-y-1">
        {NAV_ITEMS.map((item) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "flex items-center gap-2.5 px-3 py-2 rounded-md text-[14px] font-medium tracking-[-0.005em] transition-colors duration-200",
                isActive
                  ? "bg-neutral-900 text-neutral-100"
                  : "text-neutral-500 hover:text-neutral-200 hover:bg-neutral-900/50",
              )}
            >
              <Icon className="w-4 h-4" strokeWidth={1.5} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="p-2.5">
        <button
          onClick={onAddJob}
          className="w-full flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-md bg-white text-neutral-950 text-[14px] font-semibold tracking-[-0.005em] hover:bg-neutral-200 transition-colors duration-200"
        >
          <Plus className="w-4 h-4" strokeWidth={2} />
          Add Job
        </button>
      </div>
    </aside>
  );
}
