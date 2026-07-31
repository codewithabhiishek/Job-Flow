import { useState, useEffect, useMemo } from "react";
import { useOutletContext } from "react-router-dom";
import { apiClient } from "@/api/client";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

export default function Analytics() {
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

  const stats = useMemo(() => {
    const total = filtered.length;
    const responded = filtered.filter(
      (j) => j.reply_date || ["interview", "offer"].includes(j.status),
    ).length;
    const interviewed = filtered.filter((j) =>
      ["interview", "offer"].includes(j.status),
    ).length;
    const offered = filtered.filter((j) => j.status === "offer").length;
    return {
      responseRate: total > 0 ? Math.round((responded / total) * 100) : 0,
      interviewRate: total > 0 ? Math.round((interviewed / total) * 100) : 0,
      offerRate: total > 0 ? Math.round((offered / total) * 100) : 0,
    };
  }, [filtered]);

  const timelineData = useMemo(() => {
    const byMonth = {};
    filtered.forEach((j) => {
      const d = new Date(j.created_date);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      byMonth[key] = (byMonth[key] || 0) + 1;
    });
    return Object.entries(byMonth)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, count]) => ({ month, count }));
  }, [filtered]);

  const pipelineData = useMemo(() => {
    const counts = {};
    filtered.forEach((j) => {
      counts[j.status] = (counts[j.status] || 0) + 1;
    });
    return Object.entries(counts).map(([status, count]) => ({
      status: status.replace(/_/g, " "),
      count,
    }));
  }, [filtered]);

  const topCompanies = useMemo(() => {
    const counts = {};
    filtered.forEach((j) => {
      counts[j.company] = (counts[j.company] || 0) + 1;
    });
    return Object.entries(counts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5);
  }, [filtered]);

  const topLocations = useMemo(() => {
    const counts = {};
    filtered.forEach((j) => {
      if (j.location) counts[j.location] = (counts[j.location] || 0) + 1;
    });
    return Object.entries(counts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5);
  }, [filtered]);

  const topSkills = useMemo(() => {
    const counts = {};
    filtered.forEach((j) => {
      (j.skills || []).forEach((s) => {
        if (s) counts[s] = (counts[s] || 0) + 1;
      });
    });
    return Object.entries(counts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5);
  }, [filtered]);

  if (loading) {
    return (
      <div className="p-6">
        <div className="h-96 bg-neutral-900 rounded-lg animate-pulse" />
      </div>
    );
  }

  const tooltipStyle = {
    backgroundColor: "#0a0a0a",
    border: "1px solid #262626",
    borderRadius: "6px",
    fontSize: "12px",
    color: "#a1a1aa",
  };

  return (
    <div className="p-8 space-y-8 max-w-[1400px]">
      <div>
        <h2 className="type-label mb-1.5">Insights</h2>
        <h1 className="type-page-title text-neutral-100">Analytics</h1>
      </div>

      {/* Rate cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <RateCard label="Response Rate" value={`${stats.responseRate}%`} />
        <RateCard label="Interview Rate" value={`${stats.interviewRate}%`} />
        <RateCard label="Offer Rate" value={`${stats.offerRate}%`} />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <ChartCard title="Applications Over Time">
          {timelineData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={timelineData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1a1a1a" />
                <XAxis dataKey="month" stroke="#737373" fontSize={11} />
                <YAxis stroke="#737373" fontSize={11} allowDecimals={false} />
                <Tooltip contentStyle={tooltipStyle} />
                <Line
                  type="monotone"
                  dataKey="count"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  dot={{ fill: "#3b82f6", r: 3 }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <EmptyChart />
          )}
        </ChartCard>

        <ChartCard title="Pipeline Distribution">
          {pipelineData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={pipelineData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1a1a1a" />
                <XAxis
                  dataKey="status"
                  stroke="#737373"
                  fontSize={10}
                  angle={-15}
                  textAnchor="end"
                  height={50}
                />
                <YAxis stroke="#737373" fontSize={11} allowDecimals={false} />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <EmptyChart />
          )}
        </ChartCard>
      </div>

      {/* Lists */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <ListCard title="Top Companies" items={topCompanies} />
        <ListCard title="Top Locations" items={topLocations} />
        <ListCard title="Most Common Skills" items={topSkills} />
      </div>
    </div>
  );
}

function RateCard({ label, value }) {
  return (
    <div className="rounded-xl border border-white/[0.06] bg-neutral-950 p-6">
      <p className="type-label mb-2.5">{label}</p>
      <p className="text-[32px] font-bold text-neutral-100 tnum">{value}</p>
    </div>
  );
}

function ChartCard({ title, children }) {
  return (
    <div className="rounded-xl border border-white/[0.06] bg-neutral-950 p-5">
      <h3 className="type-card-title text-neutral-200 mb-4">{title}</h3>
      {children}
    </div>
  );
}

function ListCard({ title, items }) {
  return (
    <div className="rounded-xl border border-white/[0.06] bg-neutral-950 p-5">
      <h3 className="type-card-title text-neutral-200 mb-3">{title}</h3>
      {items.length === 0 ? (
        <p className="text-xs text-neutral-500 py-4 text-center">No data yet</p>
      ) : (
        <div className="space-y-2">
          {items.map(([name, count], i) => (
            <div key={i} className="flex items-center justify-between text-sm">
              <span className="text-neutral-400 truncate">{name}</span>
              <span className="text-neutral-200 font-medium ml-2 shrink-0">
                {count}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function EmptyChart() {
  return (
    <div className="h-[220px] flex items-center justify-center text-sm text-neutral-500">
      No data yet
    </div>
  );
}
