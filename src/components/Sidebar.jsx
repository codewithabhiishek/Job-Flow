import { Link, useLocation } from "react-router-dom";
import Logo from "./Logo";
import {
  LayoutDashboard,
  Briefcase,
  Columns3,
  Calendar,
  BarChart3,
  Settings,
  Plus,
} from "lucide-react";
import { motion } from "framer-motion";
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
    <aside className="w-[240px] shrink-0 border-r border-border/60 bg-sidebar flex flex-col">
      <div className="h-16 flex items-center px-6 border-b border-border/60">
        <Logo size="md" />
      </div>

      <nav className="flex-1 px-4 py-6 space-y-1.5">
        {NAV_ITEMS.map((item) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "group relative flex items-center gap-3 px-3 py-2.5 rounded-[8px] text-[14px] font-medium transition-all duration-200",
                isActive
                  ? "bg-primary/10 text-primary shadow-sm"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50",
              )}
            >
              {isActive && (
                <motion.div
                  layoutId="sidebar-active"
                  className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-primary rounded-r-full"
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                />
              )}
              <Icon className={cn("w-4 h-4 transition-transform duration-200 group-hover:scale-110", isActive ? "text-primary" : "opacity-70")} strokeWidth={isActive ? 2 : 1.5} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 mt-auto">
        <motion.button
          whileTap={{ scale: 0.98 }}
          onClick={onAddJob}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-[10px] bg-primary text-primary-foreground shadow-premium hover:shadow-premium-hover hover:-translate-y-[1px] transition-all duration-200 text-[14px] font-[600]"
        >
          <Plus className="w-4 h-4" strokeWidth={2} />
          Add Job
        </motion.button>
      </div>
    </aside>
  );
}
