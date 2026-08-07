import { Search, Plus, Menu } from "lucide-react";
import { useAuth } from "@/lib/AuthContext";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { useTheme } from "@/components/ThemeProvider";
import ThemeSwitch from "@/components/ThemeSwitch";

export default function Header({ onAddJob, searchQuery, setSearchQuery, onToggleMobileSidebar }) {
  const { user } = useAuth();
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();

  const initials = (user?.full_name || user?.email || "U")
    .split(" ")
    .map((s) => s[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const [isSearchFocused, setIsSearchFocused] = useState(false);

  const isDark = theme === "dark";
  const cycleTheme = () => {
    setTheme(isDark ? "light" : "dark");
  };

  return (
    <header className="h-14 shrink-0 border-b border-border bg-background flex items-center justify-between px-4 lg:px-8 gap-2 sm:gap-4">
      {/* Mobile hamburger */}
      <button
        onClick={onToggleMobileSidebar}
        aria-label="Open navigation menu"
        className="lg:hidden w-11 h-11 -ml-2 flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      >
        <Menu className="w-4 h-4" strokeWidth={1.5} />
      </button>

      {/* Search */}
      <div className="flex-1 min-w-0 max-w-md">
        <div className="relative">
          <Search
            className={cn("absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 transition-colors", isSearchFocused ? "text-foreground" : "text-muted-foreground")}
            strokeWidth={1.5}
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => setIsSearchFocused(true)}
            onBlur={() => setIsSearchFocused(false)}
            placeholder="Search..."
            aria-label="Search jobs"
            className="w-full h-8 pl-8 pr-3 rounded-md bg-muted/50 border border-transparent text-[13px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/60 focus:border-border focus:bg-background transition-all duration-150"
          />
        </div>
      </div>

      {/* Right actions */}
      <div className="flex items-center gap-1.5">
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={() => onAddJob("screenshot")}
          className="hidden sm:inline-flex items-center gap-1.5 h-8 px-3 rounded-md bg-primary text-primary-foreground text-button-text font-medium hover:opacity-90 transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        >
          <Plus className="w-3.5 h-3.5" strokeWidth={2} />
          Add Job
        </motion.button>
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={() => onAddJob("screenshot")}
          aria-label="Add job"
          className="sm:hidden w-11 h-11 -mr-1 flex items-center justify-center rounded-md bg-primary text-primary-foreground hover:opacity-90 transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        >
          <Plus className="w-4 h-4" strokeWidth={2} />
        </motion.button>

        <div className="w-px h-5 bg-border mx-1" />

        <ThemeSwitch 
          checked={isDark} 
          onChange={cycleTheme} 
        />

        <button
          onClick={() => navigate("/settings")}
          aria-label="Open settings"
          className="rounded-full cursor-pointer hover:opacity-90 transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        >
          {user?.imageUrl || user?.avatar_url ? (
            <img
              src={user.imageUrl || user.avatar_url}
              alt=""
              className="w-8 h-8 rounded-full object-cover border border-border/20"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-[11px] font-medium text-foreground overflow-hidden border border-border/20">
              {initials}
            </div>
          )}
        </button>
      </div>
    </header>
  );
}
