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
} from "lucide-react";
import StatusBadge from "@/components/StatusBadge";

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
      <div className="p-6">
        <SkeletonGrid />
      </div>
    );
  }

  return (
    <div className="p-8 space-y-8 max-w-[1400px]">
      <div>
        <h2 className="type-label mb-1.5">Overview</h2>
        <h1 className="type-page-title text-neutral-100">
          Your job hunt at a glance
        </h1>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
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
      </div>

      {/* Bottom section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Recent Activity */}
        <div className="lg:col-span-2 rounded-xl border border-white/[0.06] bg-neutral-950">
          <div className="px-6 py-4 border-b border-white/[0.06]">
            <h3 className="type-card-title text-neutral-200">
              Recent Activity
            </h3>
          </div>
          <div className="divide-y divide-white/[0.06]">
            {recent.length === 0 ? (
              <div className="px-5 py-10 text-center text-sm text-neutral-500">
                No jobs yet. Add your first job to get started.
              </div>
            ) : (
              recent.map((job) => (
                <div
                  key={job.id}
                  className="px-5 py-3 flex items-center justify-between"
                >
                  <div>
                    <p className="text-sm text-neutral-200">
                      <span className="font-medium">{job.company}</span>
                      {job.job_title && (
                        <span className="text-neutral-500">
                          {" "}
                          · {job.job_title}
                        </span>
                      )}
                    </p>
                    {job.location && (
                      <p className="text-xs text-neutral-500 mt-0.5">
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
        <div className="rounded-xl border border-white/[0.06] bg-neutral-950">
          <div className="px-6 py-4 border-b border-white/[0.06]">
            <h3 className="type-card-title text-neutral-200">
              Upcoming Interviews
            </h3>
          </div>
          <div className="p-5">
            {upcoming.length === 0 ? (
              <div className="text-center py-6">
                <Calendar
                  className="w-6 h-6 text-neutral-700 mx-auto mb-2"
                  strokeWidth={1.5}
                />
                <p className="text-sm text-neutral-500">
                  No interviews scheduled
                </p>
                <p className="text-xs text-neutral-700 mt-1">
                  Set an interview date to see it here.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {upcoming.map((job) => (
                  <div
                    key={job.id}
                    className="flex items-center justify-between text-sm"
                  >
                    <div>
                      <p className="text-neutral-200 font-medium">
                        {job.company}
                      </p>
                      <p className="text-xs text-neutral-500">
                        {job.job_title}
                      </p>
                    </div>
                    <span className="text-xs text-neutral-400">
                      {new Date(job.interview_date).toLocaleDateString()}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function MetricCard({ label, value, icon: Icon }) {
  return (
    <div className="rounded-xl border border-white/[0.06] bg-neutral-950 p-6">
      <div className="flex items-center justify-between mb-2.5">
        <span className="type-label">{label}</span>
        <Icon className="w-3.5 h-3.5 text-neutral-500" strokeWidth={1.5} />
      </div>
      <p className="text-[28px] font-bold text-neutral-100 tnum">{value}</p>
    </div>
  );
}

function SkeletonGrid() {
  return (
    <div className="space-y-6">
      <div className="h-16 w-48 bg-neutral-900 rounded-lg animate-pulse" />
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="h-20 bg-neutral-900 rounded-xl animate-pulse"
          />
        ))}
      </div>
    </div>
  );
}
