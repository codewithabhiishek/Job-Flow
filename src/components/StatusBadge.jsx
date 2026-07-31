import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export const STATUS_CONFIG = {
  saved: { label: "Saved", className: "border-border bg-muted text-muted-foreground" },
  applying: { label: "Applying", className: "border-blue-200 dark:border-blue-800/50 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300" },
  applied: { label: "Applied", className: "border-blue-200 dark:border-blue-800/50 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300" },
  online_assessment: {
    label: "Assessment",
    className: "border-orange-200 dark:border-orange-800/50 bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-300",
  },
  interview: {
    label: "Interview",
    className: "border-purple-200 dark:border-purple-800/50 bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300",
  },
  offer: { label: "Offer", className: "border-emerald-200 dark:border-emerald-800/50 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400" },
  rejected: { label: "Rejected", className: "border-red-200 dark:border-red-800/50 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400" },
  ghosted: { label: "Ghosted", className: "border-border bg-muted/50 text-muted-foreground" },
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
    <button
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1 px-2 py-0.5 rounded-md border text-[11px] font-medium transition-colors duration-150",
        config.className,
        onClick ? "hover:brightness-110 cursor-pointer" : "cursor-default",
      )}
    >
      {config.label}
      {showChevron && <ChevronDown className="w-3 h-3 opacity-50" strokeWidth={2} />}
    </button>
  );
}
