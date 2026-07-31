import { Link, useLocation } from "react-router-dom";
import Logo from "./Logo";
import {
  LayoutDashboard,
  Briefcase,
  Columns3,
  Calendar,
  BarChart3,
  Settings,
  ChevronsLeft,
  ChevronsRight,
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

export default function Sidebar({ isCollapsed, onToggleCollapse }) {
  const location = useLocation();

  return (
    <aside
      className={cn(
        "shrink-0 border-r border-border bg-sidebar flex flex-col transition-[width] duration-200 ease-in-out",
        isCollapsed ? "w-[56px]" : "w-[220px]"
      )}
    >
      {/* Logo */}
      <Link 
        to="/dashboard"
        className={cn(
          "h-14 flex items-center border-b border-border transition-colors duration-300 group hover:bg-muted/30 cursor-pointer",
          isCollapsed ? "justify-center px-0" : "px-5"
        )}
      >
        <div className="flex items-center transition-transform duration-300 ease-out group-hover:scale-[1.04]">
          <Logo 
            size="md" 
            iconOnly={isCollapsed} 
            className="text-foreground/90 group-hover:text-foreground group-hover:drop-shadow-[0_0_12px_rgba(255,255,255,0.2)] transition-all duration-300 gap-2.5"
          />
        </div>
      </Link>

      {/* Navigation */}
      <nav className={cn("flex-1 py-3 space-y-0.5", isCollapsed ? "px-2" : "px-2")}>
        {NAV_ITEMS.map((item) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;
          return (
            <Link
              key={item.path}
              to={item.path}
              title={isCollapsed ? item.label : undefined}
              className={cn(
                "relative flex items-center gap-2.5 rounded-md text-sidebar-item transition-colors duration-150",
                isCollapsed ? "justify-center px-0 py-2" : "px-2.5 py-[7px]",
                isActive
                  ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                  : "text-sidebar-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground",
              )}
            >
              <Icon className="w-4 h-4 shrink-0" strokeWidth={1.5} />
              {!isCollapsed && (
                <span className="truncate">{item.label}</span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Collapse toggle */}
      <div className={cn("py-3 border-t border-border", isCollapsed ? "px-2" : "px-2")}>
        <button
          onClick={onToggleCollapse}
          className="w-full flex items-center justify-center gap-2 rounded-md px-2.5 py-[7px] text-sidebar-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground transition-colors duration-150 text-sidebar-item"
        >
          {isCollapsed ? (
            <ChevronsRight className="w-4 h-4" strokeWidth={1.5} />
          ) : (
            <>
              <ChevronsLeft className="w-4 h-4" strokeWidth={1.5} />
              <span className="truncate">Collapse</span>
            </>
          )}
        </button>
      </div>
    </aside>
  );
}
