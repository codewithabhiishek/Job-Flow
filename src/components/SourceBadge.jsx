import { Linkedin, Briefcase, Globe, Building2, Users } from "lucide-react";
import { cn } from "@/lib/utils";

const SOURCE_CONFIG = {
  linkedin: { label: "LinkedIn", icon: Linkedin, className: "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20" },
  wellfound: { label: "Wellfound", icon: Globe, className: "bg-orange-500/10 text-orange-700 dark:text-orange-400 border-orange-500/20" },
  indeed: { label: "Indeed", icon: Briefcase, className: "bg-violet-500/10 text-violet-700 dark:text-violet-400 border-violet-500/20" },
  glassdoor: { label: "Glassdoor", icon: Building2, className: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20" },
  naukri: { label: "Naukri", icon: Briefcase, className: "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20" },
  instahyre: { label: "Instahyre", icon: Briefcase, className: "bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/20" },
  referral: { label: "Referral", icon: Users, className: "bg-fuchsia-500/10 text-fuchsia-700 dark:text-fuchsia-400 border-fuchsia-500/20" },
  "google careers": { label: "Google", icon: Globe, className: "bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20" },
  "amazon jobs": { label: "Amazon", icon: Globe, className: "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20" },
  lever: { label: "Lever", icon: Briefcase, className: "bg-slate-500/10 text-slate-700 dark:text-slate-400 border-slate-500/20" },
  greenhouse: { label: "Greenhouse", icon: Briefcase, className: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20" },
  workday: { label: "Workday", icon: Briefcase, className: "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20" },
  "company website": { label: "Company Site", icon: Globe, className: "bg-sky-500/10 text-sky-700 dark:text-sky-400 border-sky-500/20" },
  "y combinator": { label: "Y Combinator", icon: Briefcase, className: "bg-orange-500/10 text-orange-700 dark:text-orange-400 border-orange-500/20" },
  "careers page": { label: "Careers Page", icon: Globe, className: "bg-slate-500/10 text-slate-700 dark:text-slate-400 border-slate-500/20" },
  ashby: { label: "Ashby", icon: Briefcase, className: "bg-cyan-500/10 text-cyan-700 dark:text-cyan-400 border-cyan-500/20" },
  smartrecruiters: { label: "SmartRecruiters", icon: Briefcase, className: "bg-pink-500/10 text-pink-700 dark:text-pink-400 border-pink-500/20" },
  manual: { label: "Manual", icon: Briefcase, className: "bg-muted/80 text-muted-foreground border-border/60" },
  unknown: { label: "Unknown", icon: Briefcase, className: "bg-muted/80 text-muted-foreground border-border/60" }
};

export default function SourceBadge({ source }) {
  let key = (source || "unknown").toLowerCase().trim();
  
  if (["screenshot", "text", "url", "description"].includes(key)) {
    key = "unknown";
  }

  const config = SOURCE_CONFIG[key] || {
    label: source.length > 15 ? source.substring(0, 12) + "..." : source,
    icon: Briefcase,
    className: "bg-muted/80 text-muted-foreground border-border/60"
  };

  const Icon = config.icon;

  return (
    <div
      className={cn(
        "inline-flex items-center justify-start w-[104px] h-[22px] px-1.5 rounded-[5px] border gap-1.5",
        "text-[11px] font-medium tracking-[0.01em] shrink-0",
        config.className
      )}
      title={config.label}
    >
      <Icon className="w-[11px] h-[11px] shrink-0 opacity-80" strokeWidth={2.5} />
      <span className="flex-1 truncate text-left">{config.label}</span>
    </div>
  );
}
