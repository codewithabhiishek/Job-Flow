import { useState, useEffect } from "react";
import { useOutletContext } from "react-router-dom";
import { apiClient } from "@/api/client";
import {
  Building2,
  Send,
  TrendingUp,
  Trophy,
  Activity,
  Calendar,
  Ghost,
  CalendarX2,
} from "lucide-react";
import { motion } from "framer-motion";
import StatusBadge from "@/components/StatusBadge";
import { Skeleton } from "@/components/ui/skeleton";

export default function Dashboard() {
  const { searchQuery } = useOutletContext();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await apiClient.fetchApi('/jobs');
        setJobs(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const filtered = searchQuery
    ? jobs.filter((j) =>
        [j.company, j.job_title, j.location].some((v) =>
          (v || "").toLowerCase().includes(searchQuery.toLowerCase()),
        ),
      )
    : jobs;

  const stats = {
    applications: filtered.length,
    applied: filtered.filter((j) =>
      [
        "applied",
        "online_assessment",
        "interview",
        "offer",
        "rejected",
        "ghosted",
      ].includes(j.status),
    ).length,
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
    offerRate:
      filtered.length > 0
        ? Math.round(
            (filtered.filter((j) => j.status === "offer").length /
              filtered.length) *
              100,
          )
        : 0,
  };

  const recent = [...filtered]
    .sort((a, b) => new Date(b.created_date) - new Date(a.created_date))
    .slice(0, 5);
  const upcoming = filtered
    .filter((j) => j.interview_date && new Date(j.interview_date) >= new Date())
    .sort((a, b) => new Date(a.interview_date) - new Date(b.interview_date));

  if (loading) {
    return (
      <div className="p-8">
        <SkeletonGrid />
      </div>
    );
  }

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.05 }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 10 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
  };

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="p-8 space-y-8 max-w-[1400px]">
      <motion.div variants={item}>
        <h2 className="type-label mb-1.5 text-muted-foreground">Overview</h2>
        <h1 className="type-page-title text-foreground">
          Your job hunt at a glance
        </h1>
      </motion.div>

      {/* Metrics */}
      <motion.div variants={item} className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <MetricCard
          label="Applications"
          value={stats.applications}
          icon={Building2}
        />
        <MetricCard label="Applied" value={stats.applied} icon={Send} />
        <MetricCard
          label="Interviews"
          value={stats.interviews}
          icon={TrendingUp}
        />
        <MetricCard label="Offers" value={stats.offers} icon={Trophy} />
        <MetricCard
          label="Response Rate"
          value={`${stats.responseRate}%`}
          icon={Activity}
        />
        <MetricCard
          label="Offer Rate"
          value={`${stats.offerRate}%`}
          icon={Trophy}
        />
      </motion.div>

      {/* Bottom section */}
      <motion.div variants={item} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activity */}
        <div className="lg:col-span-2 rounded-[16px] border border-border/60 bg-card shadow-premium dark:shadow-premium-dark">
          <div className="px-6 py-5 border-b border-border/60 flex items-center justify-between">
            <h3 className="type-card-title text-card-foreground">
              Recent Activity
            </h3>
          </div>
          <div className="divide-y divide-border/40">
            {recent.length === 0 ? (
              <div className="px-6 py-16 flex flex-col items-center justify-center text-center">
                <div className="w-12 h-12 rounded-2xl bg-muted/50 flex items-center justify-center mb-4 border border-border/40 text-muted-foreground/50 shadow-sm">
                  <Ghost className="w-6 h-6 text-muted-foreground" />
                </div>
                <h4 className="text-[15px] font-semibold tracking-tight text-foreground mb-1">It's quiet in here</h4>
                <p className="text-[14px] text-muted-foreground mb-6 leading-relaxed max-w-[250px]">Start tracking your applications to see recent activity appear here.</p>
              </div>
            ) : (
              recent.map((job) => (
                <div
                  key={job.id}
                  className="px-6 py-4 flex items-center justify-between hover:bg-muted/30 transition-colors duration-200"
                >
                  <div>
                    <p className="text-[14px] text-foreground font-medium mb-0.5">
                      {job.company}
                      {job.job_title && (
                        <span className="text-muted-foreground font-normal">
                          {" "}
                          · {job.job_title}
                        </span>
                      )}
                    </p>
                    {job.location && (
                      <p className="text-[13px] text-muted-foreground">
                        {job.location}
                      </p>
                    )}
                  </div>
                  <StatusBadge status={job.status} />
                </div>
              ))
            )}
          </div>
        </div>

        {/* Upcoming Interviews */}
        <div className="rounded-[16px] border border-border/60 bg-card shadow-premium dark:shadow-premium-dark">
          <div className="px-6 py-5 border-b border-border/60 flex items-center justify-between">
            <h3 className="type-card-title text-card-foreground">
              Upcoming Interviews
            </h3>
          </div>
          <div className="p-6">
            {upcoming.length === 0 ? (
              <div className="text-center py-12 flex flex-col items-center justify-center">
                <div className="w-12 h-12 rounded-2xl bg-muted/50 flex items-center justify-center mb-4 border border-border/40 text-muted-foreground/50 shadow-sm">
                  <CalendarX2
                    className="w-6 h-6 text-muted-foreground"
                    strokeWidth={1.5}
                  />
                </div>
                <h4 className="text-[15px] font-semibold tracking-tight text-foreground mb-1">No interviews scheduled</h4>
                <p className="text-[14px] text-muted-foreground leading-relaxed">
                  Set an interview date to see it here.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {upcoming.map((job) => (
                  <div
                    key={job.id}
                    className="flex items-center justify-between group cursor-default"
                  >
                    <div>
                      <p className="text-[14px] font-medium text-foreground group-hover:text-primary transition-colors">
                        {job.company}
                      </p>
                      <p className="text-[13px] text-muted-foreground mt-0.5">
                        {job.job_title}
                      </p>
                    </div>
                    <div className="bg-primary/10 text-primary px-3 py-1.5 rounded-[6px] text-[12px] font-medium tracking-wide">
                      {new Date(job.interview_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </div>
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

function MetricCard({ label, value, icon: Icon }) {
  return (
    <motion.div 
      whileHover={{ y: -2 }}
      className="rounded-[12px] border border-border/60 bg-card p-5 shadow-sm hover:shadow-md transition-all duration-300"
    >
      <div className="flex items-center justify-between mb-3">
        <span className="text-[13px] font-medium text-muted-foreground">{label}</span>
        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
          <Icon className="w-4 h-4 text-primary" strokeWidth={2} />
        </div>
      </div>
      <p className="text-[28px] font-[700] text-foreground tracking-tight tnum">{value}</p>
    </motion.div>
  );
}

function SkeletonGrid() {
  return (
    <div className="space-y-8 max-w-[1400px]">
      <div className="space-y-2">
        <Skeleton className="h-5 w-24" />
        <Skeleton className="h-10 w-64" />
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-[110px] rounded-[12px]" />
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Skeleton className="lg:col-span-2 h-[300px] rounded-[16px]" />
        <Skeleton className="h-[300px] rounded-[16px]" />
      </div>
    </div>
  );
}
