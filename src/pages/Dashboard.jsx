import { useOutletContext, useNavigate } from "react-router-dom";
import { apiClient } from "@/api/client";
import { cn, formatLocation } from "@/lib/utils";
import {
  Building2,
  Send,
  TrendingUp,
  Trophy,
  Camera,
  Link2,
  ClipboardPaste,
  CalendarX2, Inbox, Calendar,
} from "lucide-react";
import { motion } from "framer-motion";
import StatusBadge from "@/components/StatusBadge";
import CompanyAvatar from "@/components/CompanyAvatar";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery } from "@tanstack/react-query";

// ─── Interview date helpers ──────────────────────────────────────────────────
function daysUntil(dateStr) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.round((new Date(dateStr + "T00:00:00") - today) / 86400000);
}

function dayBadge(dateStr) {
  const d = daysUntil(dateStr);
  if (d < 0) return { label: "Missed", className: "bg-red-500/10 text-red-700 dark:text-red-400" };
  if (d === 0) return { label: "Today", className: "bg-amber-500/10 text-amber-700 dark:text-amber-400" };
  if (d === 1) return { label: "Tomorrow", className: "bg-blue-500/10 text-blue-700 dark:text-blue-400" };
  return null;
}

export default function Dashboard() {
  const { searchQuery, openAddJob } = useOutletContext();
  const navigate = useNavigate();
  const { data: jobs = [], isLoading: loading } = useQuery({
    queryKey: ['jobs'],
    queryFn: () => apiClient.fetchApi('/jobs'),
    staleTime: 1000 * 60 * 5, // 5 minutes cache
  });

  const filtered = searchQuery
    ? jobs.filter((j) =>
        [j.company, j.job_title, j.location, j.source, j.status].some((v) =>
          (v || "").toLowerCase().includes(searchQuery.toLowerCase()),
        ),
      )
    : jobs;

  if (loading) {
    return (
      <div className="p-4 md:p-6 lg:p-8">
        <SkeletonGrid />
      </div>
    );
  }

  // Onboarding — no jobs yet
  if (jobs.length === 0) {
    return <Onboarding openAddJob={openAddJob} />;
  }

  // Empty search state
  if (filtered.length === 0 && searchQuery) {
    return (
      <div className="p-4 md:p-6 lg:p-8 h-full flex flex-col items-center justify-center text-center max-w-[1200px] mx-auto">
        <div className="w-16 h-16 rounded-2xl bg-muted/50 flex items-center justify-center mb-4">
          <Inbox className="w-8 h-8 text-muted-foreground/50" strokeWidth={1.5} />
        </div>
        <h3 className="text-[15px] font-semibold text-foreground mb-1">No results found</h3>
        <p className="text-[13px] text-muted-foreground max-w-[260px]">
          We couldn't find any jobs matching "{searchQuery}".
        </p>
      </div>
    );
  }

  const stats = {
    applications: filtered.length,
    interviews: filtered.filter((j) =>
      ["interview", "offer"].includes(j.status),
    ).length,
    offers: filtered.filter((j) => j.status === "offer").length,
    responseRate:
      filtered.length > 0
        ? Math.round(
            (filtered.filter(
              (j) => j.reply_date || ["interview", "offer"].includes(j.status),
            ).length /
              filtered.length) *
              100,
          )
        : 0,
  };

  const recent = [...filtered]
    .sort((a, b) => new Date(b.created_date) - new Date(a.created_date))
    .slice(0, 6);
  const upcoming = filtered
    .filter((j) => j.interview_date && new Date(j.interview_date) >= new Date())
    .sort((a, b) => new Date(a.interview_date) - new Date(b.interview_date));

  const container = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.04 } }
  };
  const item = {
    hidden: { opacity: 0, y: 6 },
    show: { opacity: 1, y: 0, transition: { duration: 0.15 } }
  };

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="p-4 md:p-6 lg:p-8 space-y-6 max-w-[1200px]">
      <motion.div variants={item}>
        <h1 className="type-page-title text-foreground">Overview</h1>
      </motion.div>

      {/* Metrics */}
      <motion.div variants={item} className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <MetricCard label="Total" value={stats.applications} icon={Building2} />
        <MetricCard label="Interviews" value={stats.interviews} icon={TrendingUp} />
        <MetricCard label="Offers" value={stats.offers} icon={Trophy} />
        <MetricCard label="Response" value={`${stats.responseRate}%`} icon={Send} />
      </motion.div>

      {/* Bottom section */}
      <motion.div variants={item} className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {/* Recent Activity */}
        <div className="lg:col-span-3 rounded-lg border border-border bg-card">
          <div className="px-4 py-3 border-b border-border">
            <h3 className="type-card-title text-card-foreground">Recent Activity</h3>
          </div>
          <div className="divide-y divide-border">
            {recent.map((job) => (
              <div
                key={job.id}
                className="px-4 py-3 flex items-center justify-between"
              >
                <div className="min-w-0 flex-1 mr-3">
                  <p className="text-[13px] text-foreground font-medium truncate">
                    {job.company}
                    {job.job_title && (
                      <span className="text-muted-foreground font-normal">
                        {" "}· {job.job_title}
                      </span>
                    )}
                  </p>
                  {job.location && (
                    <p className="text-[12px] text-muted-foreground truncate" title={job.location}>
                      {formatLocation(job.location)}
                    </p>
                  )}
                </div>
                <StatusBadge status={job.status} />
              </div>
            ))}
          </div>
        </div>

        {/* Upcoming Interviews */}
        <div className="lg:col-span-2 rounded-lg border border-border bg-card flex flex-col">
          <div className="px-4 py-3 border-b border-border flex items-center justify-between">
            <h3 className="type-card-title text-card-foreground">Upcoming Interviews</h3>
            {upcoming.length > 0 && (
              <span className="text-[11px] font-medium text-muted-foreground tnum font-mono">
                {upcoming.length}
              </span>
            )}
          </div>
          <div className="p-4 flex-1 flex flex-col">
            {upcoming.length === 0 ? (
              <div className="flex-1 text-center flex flex-col items-center justify-center py-8">
                <div className="w-12 h-12 rounded-full bg-muted/50 flex items-center justify-center mb-3">
                  <CalendarX2 className="w-5 h-5 text-muted-foreground/50" strokeWidth={1.5} />
                </div>
                <p className="text-[13px] font-medium text-foreground">No interviews scheduled</p>
                <p className="text-[12px] text-muted-foreground mt-1 mb-4 max-w-[240px]">
                  Your next interview will appear here once you add a date to a job.
                </p>
                <button
                  onClick={() => navigate("/calendar")}
                  className="inline-flex items-center gap-1.5 h-8 px-3.5 rounded-md border border-border text-[12px] font-medium text-foreground hover:bg-muted transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                >
                  <Calendar className="w-3.5 h-3.5 text-muted-foreground" strokeWidth={1.5} />
                  Open Calendar
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                {upcoming.map((job, i) => {
                  const badge = dayBadge(job.interview_date);
                  return (
                    <motion.button
                      key={job.id}
                      type="button"
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.2, delay: i * 0.05 }}
                      onClick={() => navigate("/jobs")}
                      className={cn(
                        "w-full text-left flex items-center gap-3 rounded-lg border border-transparent px-2.5 py-2 transition-[background-color,border-color,box-shadow] duration-200",
                        "hover:bg-muted/40 hover:border-border hover:shadow-card dark:hover:shadow-card-dark",
                        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                      )}
                    >
                      <CompanyAvatar company={job.company} logo={job.logo} size={28} />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="text-[13px] font-medium text-foreground truncate">{job.company}</p>
                          {badge && (
                            <span className={cn("shrink-0 text-[10px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded", badge.className)}>
                              {badge.label}
                            </span>
                          )}
                        </div>
                        <p className="text-[12px] text-muted-foreground truncate mt-0.5">
                          {job.job_title || "Interview"}
                          {job.location && <> · {job.remote ? "Remote" : formatLocation(job.location)}</>}
                        </p>
                        {job.notes && (
                          <p className="text-[11px] text-muted-foreground/70 truncate mt-0.5 italic">
                            {job.notes}
                          </p>
                        )}
                      </div>
                      <div className="shrink-0 text-right">
                        <p className="text-[12px] font-medium text-foreground tnum font-mono">
                          {new Date(job.interview_date + "T00:00:00").toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </p>
                        {daysUntil(job.interview_date) > 1 && (
                          <p className="text-[10.5px] text-muted-foreground/70 tnum font-mono mt-0.5">
                            {daysUntil(job.interview_date)}d left
                          </p>
                        )}
                      </div>
                    </motion.button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

function Onboarding({ openAddJob }) {
  const actions = [
    { icon: Camera, label: "Upload Screenshot", desc: "Drop a screenshot of a job posting", tab: "screenshot" },
    { icon: Link2, label: "Paste Job URL", desc: "Paste a link to any job listing", tab: "url" },
    { icon: ClipboardPaste, label: "Paste Description", desc: "Copy and paste the job description", tab: "text" },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="flex-1 flex items-center justify-center p-6"
    >
      <div className="max-w-lg w-full text-center">
        <h1 className="text-page-title text-foreground mb-2">Track your job search</h1>
        <p className="text-[14px] text-muted-foreground mb-8">
          Add your first application to get started. AI will extract the details for you.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
          {actions.map((a) => {
            const Icon = a.icon;
            return (
              <motion.button
                key={a.tab}
                whileHover={{ y: -1 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => openAddJob(a.tab)}
                className="flex flex-col items-center gap-2 p-5 rounded-lg border border-border bg-card hover:bg-muted/40 transition-colors duration-150 cursor-pointer text-center"
              >
                <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center">
                  <Icon className="w-4 h-4 text-muted-foreground" strokeWidth={1.5} />
                </div>
                <span className="text-[13px] font-medium text-foreground">{a.label}</span>
                <span className="text-[12px] text-muted-foreground leading-snug">{a.desc}</span>
              </motion.button>
            );
          })}
        </div>

        <button
          onClick={() => openAddJob()}
          className="text-[13px] text-muted-foreground hover:text-foreground transition-colors"
        >
          Or create manually →
        </button>
      </div>
    </motion.div>
  );
}

function MetricCard({ label, value, icon: Icon }) {
  return (
    <div className="rounded-lg border border-border bg-card p-4 shadow-card dark:shadow-card-dark hover:shadow-card-hover dark:hover:shadow-card-dark-hover transition-shadow duration-150">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[12px] font-medium text-muted-foreground">{label}</span>
        <Icon className="w-3.5 h-3.5 text-muted-foreground/60" strokeWidth={1.5} />
      </div>
      <p className="text-[22px] font-semibold text-foreground tracking-tight tnum font-mono">{value}</p>
    </div>
  );
}

function SkeletonGrid() {
  return (
    <div className="space-y-6 max-w-[1200px]">
      <Skeleton className="h-7 w-28" />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-[88px] rounded-lg" />
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        <Skeleton className="lg:col-span-3 h-[280px] rounded-lg" />
        <Skeleton className="lg:col-span-2 h-[280px] rounded-lg" />
      </div>
    </div>
  );
}
