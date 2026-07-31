import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export const STATUS_CONFIG = {
  saved: { label: "Saved", className: "bg-neutral-800 text-neutral-300" },
  applying: { label: "Applying", className: "bg-indigo-950 text-indigo-400" },
  applied: { label: "Applied", className: "bg-indigo-950 text-indigo-400" },
  online_assessment: {
    label: "Online Assessment",
    className: "bg-orange-950 text-orange-400",
  },
  interview: {
    label: "Interview",
    className: "bg-emerald-950 text-emerald-400",
  },
  offer: { label: "Offer", className: "bg-emerald-950 text-emerald-400" },
  rejected: { label: "Rejected", className: "bg-red-950 text-red-400" },
  ghosted: { label: "Ghosted", className: "bg-stone-900 text-stone-400" },
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
        "inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold tracking-[0.01em] transition-colors duration-200",
        config.className,
        onClick && "hover:opacity-80 cursor-pointer",
      )}
    >
      {config.label}
      {showChevron && <ChevronDown className="w-3 h-3" strokeWidth={1.5} />}
    </button>
  );
}
