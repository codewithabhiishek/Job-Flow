import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export const STATUS_CONFIG = {
  saved: { label: "Saved", className: "bg-muted/80 text-muted-foreground border-transparent" },
  applying: { label: "Applying", className: "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20" },
  applied: { label: "Applied", className: "bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border-indigo-500/20" },
  online_assessment: {
    label: "Assessment",
    className: "bg-violet-500/10 text-violet-700 dark:text-violet-400 border-violet-500/20",
  },
  interview: {
    label: "Interview",
    className: "bg-fuchsia-500/10 text-fuchsia-700 dark:text-fuchsia-400 border-fuchsia-500/20",
  },
  offer: { label: "Offer", className: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20" },
  rejected: { label: "Rejected", className: "bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20" },
  ghosted: { label: "Ghosted", className: "bg-orange-500/10 text-orange-700 dark:text-orange-400 border-orange-500/20" },
};

export const STATUS_ORDER = [
  "saved",
  "applying",
  "applied",
  "online_assessment",
  "interview",
  "offer",
  "rejected",
  "ghosted",
];

export default function StatusBadge({ status, onClick, showChevron = false }) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.saved;
  return (
    <div
      onClick={onClick}
      className={cn(
        // Fixed dimensions — never let content or status change shift the layout
        "inline-flex items-center justify-between w-[96px] h-[22px] px-2 rounded-[5px] border",
        "text-[11px] font-medium tracking-[0.01em] transition-[background-color,color,transform] duration-150 shrink-0",
        config.className,
        onClick ? "hover:brightness-110 hover:scale-[1.02] cursor-pointer" : "",
      )}
    >
      <span className="flex-1 text-center truncate">{config.label}</span>
      {showChevron && (
        <ChevronDown className="w-3 h-3 opacity-40 shrink-0 ml-0.5" strokeWidth={2.5} />
      )}
    </div>
  );
}
