import { useState, useEffect, useMemo } from "react";
import { useOutletContext } from "react-router-dom";
import { apiClient } from "@/api/client";
import { formatLocation } from "@/lib/utils";
import {
  LineChart, Line, BarChart, Bar,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from "recharts";
import { motion, useMotionValue, useTransform, animate } from "framer-motion";
import { Skeleton } from "@/components/ui/skeleton";
import { STATUS_CONFIG } from "@/components/StatusBadge";
import { useQuery } from "@tanstack/react-query";

function AnimatedCounter({ value, suffix = "" }) {
  const count = useMotionValue(0);
  const rounded = useTransform(count, (v) => Math.round(v));
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    const num = typeof value === "number" ? value : parseInt(value) || 0;
    const controls = animate(count, num, { duration: 0.6, ease: "easeOut" });
    const unsub = rounded.on("change", (v) => setDisplay(v));
    return () => { controls.stop(); unsub(); };
  }, [value]);

  return <span className="tnum font-mono">{display}{suffix}</span>;
}

export default function Analytics() {
  const { searchQuery } = useOutletContext();
  const { data: jobs = [], isLoading: loading } = useQuery({
    queryKey: ['jobs'],
    queryFn: () => apiClient.fetchApi('/jobs'),
    staleTime: 1000 * 60 * 5,
  });

  const filtered = searchQuery
    ? jobs.filter((j) =>
        [j.company, j.job_title, j.location, j.source, j.status].some((v) =>
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
      total,
      responseRate: total > 0 ? Math.round((responded / total) * 100) : 0,
      interviewRate: total > 0 ? Math.round((interviewed / total) * 100) : 0,
      offerRate: total > 0 ? Math.round((offered / total) * 100) : 0,
    };
  }, [filtered]);

  const timelineData = useMemo(() => {
    // Jobs arrive sorted newest-first, so a plain insertion-ordered map would plot
    // the line chart in reverse-chronological order. Key by the week's timestamp and
    // sort ascending so the x-axis runs oldest → newest regardless of input order.
    const byWeek = new Map();
    filtered.forEach((j) => {
      const d = new Date(j.created_date);
      if (Number.isNaN(d.getTime())) return;
      const weekStart = new Date(d.getFullYear(), d.getMonth(), d.getDate() - d.getDay());
      const ts = weekStart.getTime();
      if (!byWeek.has(ts)) {
        byWeek.set(ts, {
          week: weekStart.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
          count: 0,
        });
      }
      byWeek.get(ts).count += 1;
    });
    return [...byWeek.entries()]
      .sort((a, b) => a[0] - b[0])
      .map(([, v]) => v);
  }, [filtered]);

  const pipelineData = useMemo(() => {
    const order = ["saved", "applying", "applied", "online_assessment", "interview", "offer", "rejected", "ghosted"];
    const counts = {};
    filtered.forEach((j) => { counts[j.status] = (counts[j.status] || 0) + 1; });
    return order
      .filter((s) => counts[s])
      .map((status) => ({
        status: STATUS_CONFIG[status]?.label || status,
        count: counts[status] || 0,
      }));
  }, [filtered]);

  const topCompanies = useMemo(() => {
    const counts = {};
    filtered.forEach((j) => { counts[j.company] = (counts[j.company] || 0) + 1; });
    return Object.entries(counts).sort(([, a], [, b]) => b - a).slice(0, 6);
  }, [filtered]);

  const topLocations = useMemo(() => {
    const counts = {};
    // Aggregate by the FULL location so counts stay accurate; only the
    // displayed label is shortened via formatLocation.
    filtered.forEach((j) => { if (j.location) counts[j.location] = (counts[j.location] || 0) + 1; });
    return Object.entries(counts).sort(([, a], [, b]) => b - a).slice(0, 5)
      .map(([loc, count]) => [formatLocation(loc), count]);
  }, [filtered]);

  const topSkills = useMemo(() => {
    const counts = {};
    filtered.forEach((j) => {
      (j.skills || []).forEach((s) => { if (s) counts[s] = (counts[s] || 0) + 1; });
    });
    return Object.entries(counts).sort(([, a], [, b]) => b - a).slice(0, 6);
  }, [filtered]);

  if (loading) {
    return (
      <div className="p-4 md:p-6 lg:p-8  space-y-6 max-w-[1200px]">
        <Skeleton className="h-7 w-28" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-[80px] rounded-lg" />
          ))}
        </div>
        <Skeleton className="h-[260px] rounded-lg" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Skeleton className="h-[240px] rounded-lg" />
          <Skeleton className="h-[240px] rounded-lg" />
        </div>
      </div>
    );
  }

  const container = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.04 } }
  };
  const item = {
    hidden: { opacity: 0, y: 6 },
    show: { opacity: 1, y: 0, transition: { duration: 0.15 } }
  };

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="p-4 md:p-6 lg:p-8  space-y-5 max-w-[1200px]">
      <motion.div variants={item}>
        <h1 className="type-page-title text-foreground">Analytics</h1>
      </motion.div>

      {/* Summary cards */}
      <motion.div variants={item} className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="Applications" value={stats.total} />
        <StatCard label="Response Rate" value={stats.responseRate} suffix="%" />
        <StatCard label="Interview Rate" value={stats.interviewRate} suffix="%" />
        <StatCard label="Offer Rate" value={stats.offerRate} suffix="%" />
      </motion.div>

      {/* Timeline */}
      <motion.div variants={item}>
        <ChartCard title="Applications Over Time">
          {timelineData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={timelineData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="week" stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} allowDecimals={false} tickLine={false} axisLine={false} width={30} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--popover))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "6px",
                    fontSize: "12px",
                    color: "hsl(var(--popover-foreground))",
                  }}
                />
                <Line type="monotone" dataKey="count" stroke="hsl(var(--chart-1))" strokeWidth={2} dot={{ fill: "hsl(var(--chart-1))", r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <EmptyChart />
          )}
        </ChartCard>
      </motion.div>

      {/* Two-col charts */}
      <motion.div variants={item} className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <ChartCard title="Pipeline">
          {pipelineData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={pipelineData} layout="vertical" margin={{ left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
                <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} allowDecimals={false} />
                <YAxis dataKey="status" type="category" stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} width={90} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--popover))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "6px",
                    fontSize: "12px",
                    color: "hsl(var(--popover-foreground))",
                  }}
                />
                <Bar dataKey="count" fill="hsl(var(--chart-1))" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <EmptyChart />
          )}
        </ChartCard>

        <ChartCard title="Top Companies">
          {topCompanies.length > 0 ? (
            <div className="space-y-2.5">
              {topCompanies.map(([name, count], i) => {
                const max = topCompanies[0][1];
                return (
                  <div key={i}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[13px] text-foreground truncate">{name}</span>
                      <span className="text-[12px] text-muted-foreground tnum ml-2 shrink-0 font-mono">{count}</span>
                    </div>
                    <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${(count / max) * 100}%` }}
                        transition={{ duration: 0.5, delay: i * 0.05 }}
                        className="h-full bg-chart-1 rounded-full"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <EmptyChart />
          )}
        </ChartCard>
      </motion.div>

      {/* Three-col lists */}
      <motion.div variants={item} className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <ListCard title="Top Locations" items={topLocations} />
        <ListCard title="Skills" items={topSkills} />
        <div className="rounded-lg border border-border bg-card p-4">
          <h3 className="type-card-title text-card-foreground mb-3">Quick Stats</h3>
          <div className="space-y-2 text-[13px]">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Avg. response time</span>
              <span className="text-foreground font-medium">—</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Remote jobs</span>
              <span className="text-foreground font-medium tnum font-mono">{filtered.filter((j) => j.remote).length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Active (non-rejected)</span>
              <span className="text-foreground font-medium tnum font-mono">{filtered.filter((j) => !["rejected", "ghosted"].includes(j.status)).length}</span>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

function StatCard({ label, value, suffix = "" }) {
  return (
    <div className="rounded-lg border border-border bg-card p-4 shadow-card dark:shadow-card-dark">
      <p className="text-[12px] font-medium text-muted-foreground mb-1">{label}</p>
      <p className="text-[22px] font-semibold text-foreground tracking-tight">
        <AnimatedCounter value={value} suffix={suffix} />
      </p>
    </div>
  );
}

function ChartCard({ title, children }) {
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <h3 className="type-card-title text-card-foreground mb-3">{title}</h3>
      {children}
    </div>
  );
}

function ListCard({ title, items }) {
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <h3 className="type-card-title text-card-foreground mb-3">{title}</h3>
      {items.length === 0 ? (
        <p className="text-[12px] text-muted-foreground py-4 text-center">No data yet</p>
      ) : (
        <div className="space-y-2">
          {items.map(([name, count], i) => (
            <div key={i} className="flex items-center justify-between text-[13px]">
              <span className="text-foreground/80 truncate font-table">{name}</span>
              <span className="text-foreground font-medium ml-2 shrink-0 tnum font-mono">{count}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function EmptyChart() {
  return (
    <div className="h-[200px] flex items-center justify-center text-[13px] text-muted-foreground">
      No data yet
    </div>
  );
}
