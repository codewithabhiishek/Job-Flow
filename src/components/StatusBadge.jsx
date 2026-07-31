import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export const STATUS_CONFIG = {
  saved: { label: "Saved", className: "bg-muted text-muted-foreground border-transparent" },
  applying: { label: "Applying", className: "bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400 border-transparent" },
  applied: { label: "Applied", className: "bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400 border-transparent" },
  online_assessment: {
    label: "Assessment",
    className: "bg-indigo-50 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-400 border-transparent",
  },
  interview: {
    label: "Interview",
    className: "bg-purple-50 text-purple-700 dark:bg-purple-500/10 dark:text-purple-400 border-transparent",
  },
  offer: { label: "Offer", className: "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 border-transparent" },
  rejected: { label: "Rejected", className: "bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-400 border-transparent" },
  ghosted: { label: "Ghosted", className: "bg-orange-50 text-orange-700 dark:bg-orange-500/10 dark:text-orange-400 border-transparent" },
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
        "inline-flex items-center justify-center gap-1.5 px-2.5 h-6 rounded-full text-[12px] font-medium transition-colors duration-150 border",
        config.className,
        onClick ? "hover:brightness-110 cursor-pointer" : "cursor-default",
      )}
    >
      {config.label}
      {showChevron && <ChevronDown className="w-3.5 h-3.5 opacity-60 shrink-0" strokeWidth={2} />}
    </button>
  );
}
