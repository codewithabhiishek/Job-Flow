import { useOutletContext } from "react-router-dom";
import { apiClient } from "@/api/client";
import { formatLocation } from "@/lib/utils";
import {
  Building2,
  Send,
  TrendingUp,
  Trophy,
  Camera,
  Link2,
  ClipboardPaste,
  CalendarX2, Inbox,
} from "lucide-react";
import { motion } from "framer-motion";
import StatusBadge from "@/components/StatusBadge";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery } from "@tanstack/react-query";

export default function Dashboard() {
  const { searchQuery, openAddJob } = useOutletContext();
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
        <div className="lg:col-span-2 rounded-lg border border-border bg-card">
          <div className="px-4 py-3 border-b border-border">
            <h3 className="type-card-title text-card-foreground">Upcoming Interviews</h3>
          </div>
          <div className="p-4">
            {upcoming.length === 0 ? (
              <div className="text-center py-8 flex flex-col items-center">
                <CalendarX2 className="w-5 h-5 text-muted-foreground/40 mb-2" strokeWidth={1.5} />
                <p className="text-[13px] text-muted-foreground">No interviews scheduled</p>
              </div>
            ) : (
              <div className="space-y-3">
                {upcoming.map((job) => (
                  <div key={job.id} className="flex items-center justify-between">
                    <div className="min-w-0 flex-1 mr-3">
                      <p className="text-[13px] font-medium text-foreground truncate">{job.company}</p>
                      <p className="text-[12px] text-muted-foreground truncate">{job.job_title}</p>
                    </div>
                    <span className="text-[12px] font-medium text-foreground bg-muted px-2 py-1 rounded-md shrink-0 tnum">
                      {new Date(job.interview_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </span>
                  </div>
                ))}
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
