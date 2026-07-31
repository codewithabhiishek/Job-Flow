import { Search, Sun, Plus, Bell } from "lucide-react";
import { useAuth } from "@/lib/AuthContext";
import { useState } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export default function Header({ onAddJob, searchQuery, setSearchQuery }) {
  const { user } = useAuth();

  const initials = (user?.full_name || user?.email || "U")
    .split(" ")
    .map((s) => s[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const [isSearchFocused, setIsSearchFocused] = useState(false);

  return (
    <header className="h-16 shrink-0 border-b border-border/60 bg-background/80 backdrop-blur-md flex items-center justify-between px-6 sticky top-0 z-20">
      <div className="relative flex items-center">
        <motion.div 
          animate={{ width: isSearchFocused ? 360 : 280 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="relative"
        >
          <Search
            className={cn("absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors", isSearchFocused ? "text-primary" : "text-muted-foreground")}
            strokeWidth={1.5}
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => setIsSearchFocused(true)}
            onBlur={() => setIsSearchFocused(false)}
            placeholder="Search company, role, location..."
            className="w-full h-10 pl-10 pr-4 rounded-[10px] bg-muted/30 border border-border/40 text-[14px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 focus:bg-background transition-all duration-300 shadow-sm"
          />
        </motion.div>
      </div>

      <div className="flex items-center gap-3 ml-auto">
        <button className="w-9 h-9 flex items-center justify-center rounded-full text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors duration-200">
          <Bell className="w-4 h-4" strokeWidth={1.5} />
        </button>
        <button className="w-9 h-9 flex items-center justify-center rounded-full text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors duration-200">
          <Sun className="w-4 h-4" strokeWidth={1.5} />
        </button>
        <div className="w-[1px] h-6 bg-border mx-1"></div>
        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-[12px] font-semibold text-white shadow-sm ring-2 ring-background cursor-pointer hover:opacity-90 transition-opacity">
          {initials}
        </div>
      </div>
    </header>
  );
}
