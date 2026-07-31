import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export const STATUS_CONFIG = {
  saved: { label: "Saved", className: "bg-muted text-muted-foreground" },
  applying: { label: "Applying", className: "bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400" },
  applied: { label: "Applied", className: "bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400" },
  online_assessment: {
    label: "Assessment",
    className: "bg-indigo-50 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-400",
  },
  interview: {
    label: "Interview",
    className: "bg-purple-50 text-purple-700 dark:bg-purple-500/10 dark:text-purple-400",
  },
  offer: { label: "Offer", className: "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400" },
  rejected: { label: "Rejected", className: "bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-400" },
  ghosted: { label: "Ghosted", className: "bg-orange-50 text-orange-700 dark:bg-orange-500/10 dark:text-orange-400" },
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
        "relative flex items-center justify-center w-[104px] h-6 rounded-full text-[12px] font-medium transition-colors duration-150",
        config.className,
        onClick ? "hover:brightness-110 cursor-pointer" : ""
      )}
    >
      <span>{config.label}</span>
      {showChevron && (
        <div className="absolute right-2 flex items-center justify-center h-full">
          <ChevronDown className="w-3.5 h-3.5 opacity-60" strokeWidth={2} />
        </div>
      )}
    </div>
  );
}
