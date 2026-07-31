import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export const STATUS_CONFIG = {
  saved: { label: "Saved", className: "border-neutral-700/60 bg-neutral-800/40 text-neutral-300" },
  applying: { label: "Applying", className: "border-blue-700/50 bg-blue-900/30 text-blue-300" },
  applied: { label: "Applied", className: "border-blue-700/50 bg-blue-900/30 text-blue-300" },
  online_assessment: {
    label: "Online Assessment",
    className: "border-orange-700/50 bg-orange-900/30 text-orange-300",
  },
  interview: {
    label: "Interview",
    className: "border-purple-700/50 bg-purple-900/30 text-purple-300",
  },
  offer: { label: "Offer", className: "border-emerald-700/50 bg-emerald-900/30 text-emerald-400" },
  rejected: { label: "Rejected", className: "border-red-700/50 bg-red-900/30 text-red-400" },
  ghosted: { label: "Ghosted", className: "border-stone-700/50 bg-stone-900/30 text-stone-400" },
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
        "inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-[12px] font-medium tracking-wide transition-all duration-200",
        config.className,
        onClick ? "hover:brightness-125 cursor-pointer shadow-sm hover:shadow-md hover:-translate-y-px" : "cursor-default",
      )}
    >
      {config.label}
      {showChevron && <ChevronDown className="w-3.5 h-3.5 opacity-70" strokeWidth={2} />}
    </button>
  );
}
