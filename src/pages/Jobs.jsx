import { useState, useEffect, useMemo } from "react";
import { useOutletContext } from "react-router-dom";
import { apiClient } from "@/api/client";
import { ArrowUpDown, ArrowUp, ArrowDown, MapPin, Plus, X, Calendar as CalendarIcon, ExternalLink, Pen, FileText, Check } from "lucide-react";
import StatusBadge, {
  STATUS_ORDER,
  STATUS_CONFIG,
} from "@/components/StatusBadge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { Skeleton } from "@/components/ui/skeleton";

const COLUMNS = [
  { key: "company", label: "Company", sortable: true },
  { key: "job_title", label: "Role", sortable: true },
  { key: "status", label: "Status", sortable: true },
  { key: "location", label: "Location", sortable: true },
  { key: "salary", label: "Salary", sortable: true, align: "right" },
  { key: "updated", label: "Last Updated", sortable: true, align: "right" },
];

const formatDate = (dateStr) => {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  if (isNaN(d)) return "—";
  const diff = Date.now() - d.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  if (days < 0) {
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  }
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days}d ago`;
  if (days < 14) return `1w ago`;
  if (days < 30) return `${Math.floor(days / 7)}w ago`;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
};

// Generates a consistent monochrome color scheme based on the company name
const getCompanyAvatar = (companyName) => {
  if (!companyName) return { initials: "?", bg: "bg-muted", text: "text-muted-foreground" };
  const initials = companyName.substring(0, 2).toUpperCase();
  
  // Use a hash to pick a monochrome-ish or muted premium color
  const hash = companyName.split("").reduce((acc, char) => char.charCodeAt(0) + ((acc << 5) - acc), 0);
  const colors = [
    "bg-zinc-800 text-zinc-100 dark:bg-zinc-100 dark:text-zinc-800",
    "bg-slate-800 text-slate-100 dark:bg-slate-100 dark:text-slate-800",
    "bg-stone-800 text-stone-100 dark:bg-stone-100 dark:text-stone-800",
    "bg-neutral-800 text-neutral-100 dark:bg-neutral-100 dark:text-neutral-800",
    "bg-gray-800 text-gray-100 dark:bg-gray-100 dark:text-gray-800",
  ];
  const color = colors[Math.abs(hash) % colors.length];
  
  return { initials, color };
};

export default function Jobs() {
  const { searchQuery, openAddJob } = useOutletContext();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sortKey, setSortKey] = useState("created_date");
  const [sortDir, setSortDir] = useState("desc");
  const [statusFilter, setStatusFilter] = useState("all");
  
  // Side panel state
  const [selectedJobId, setSelectedJobId] = useState(null);

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

  const filtered = useMemo(() => {
    let result = [...jobs];
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter((j) =>
        [j.company, j.job_title, j.location, j.salary].some((v) =>
          (v || "").toLowerCase().includes(q),
        ),
      );
    }
    if (statusFilter !== "all")
      result = result.filter((j) => j.status === statusFilter);

    result.sort((a, b) => {
      // Use created_date if no specific update field exists for "updated" sort
      const k = sortKey === "updated" ? "created_date" : sortKey;
      const av = a[k] || "";
      const bv = b[k] || "";
      if (av < bv) return sortDir === "asc" ? -1 : 1;
      if (av > bv) return sortDir === "asc" ? 1 : -1;
      return 0;
    });
    return result;
  }, [jobs, searchQuery, statusFilter, sortKey, sortDir]);

  const handleSort = (key) => {
    if (sortKey === key) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  const updateJob = async (id, updates) => {
    setJobs((prev) =>
      prev.map((j) => (j.id === id ? { ...j, ...updates } : j)),
    );
    try {
      await apiClient.fetchApi(`/jobs/${id}`, {
        method: "PUT",
        body: JSON.stringify(updates),
      });
    } catch (err) {
      console.error(err);
    }
  };

  const SortIcon = ({ colKey }) => {
    if (sortKey !== colKey)
      return (
        <ArrowUpDown className="w-3 h-3 text-muted-foreground/0 group-hover:text-muted-foreground/50 inline-block ml-1.5 transition-colors" strokeWidth={1.5} />
      );
    return sortDir === "asc" ? (
      <ArrowUp className="w-3 h-3 text-foreground inline-block ml-1.5" strokeWidth={1.5} />
    ) : (
      <ArrowDown className="w-3 h-3 text-foreground inline-block ml-1.5" strokeWidth={1.5} />
    );
  };

  if (loading) {
    return (
      <div className="px-6 py-6 space-y-6 w-full">
        <div className="rounded-lg border border-border">
          <Skeleton className="h-10 w-full" />
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      </div>
    );
  }

  const statusCounts = {};
  jobs.forEach((j) => { statusCounts[j.status] = (statusCounts[j.status] || 0) + 1; });

  const selectedJob = jobs.find((j) => j.id === selectedJobId);

  return (
    <div className="flex h-full w-full overflow-hidden">
      {/* Main Table Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden px-6 lg:px-8 py-6 w-full max-w-[1600px] mx-auto">
        <div className="flex items-center justify-between mb-4 shrink-0">
          <h1 className="type-page-title text-foreground">Jobs</h1>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2 mb-4 shrink-0">
          <FilterChip active={statusFilter === "all"} onClick={() => setStatusFilter("all")} count={jobs.length}>
            All
          </FilterChip>
          {STATUS_ORDER.filter((s) => statusCounts[s] > 0).map((s) => (
            <FilterChip key={s} active={statusFilter === s} onClick={() => setStatusFilter(s)} count={statusCounts[s]}>
              {STATUS_CONFIG[s].label}
            </FilterChip>
          ))}
        </div>

        {/* Table / Cards Container */}
        <div className="flex-1 overflow-auto rounded-lg border border-border bg-card shadow-sm">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-center">
              <p className="text-[14px] text-muted-foreground mb-4">No jobs match your criteria.</p>
              <button
                onClick={openAddJob}
                className="inline-flex items-center gap-1.5 h-9 px-4 rounded-md bg-primary text-primary-foreground text-[13px] font-medium hover:opacity-90 transition-opacity shadow-sm"
              >
                <Plus className="w-4 h-4" strokeWidth={2} />
                Add Job
              </button>
            </div>
          ) : (
            <>
              {/* Desktop View (Table) */}
              <div className="hidden md:block min-w-[800px]">
                <table className="w-full text-left">
                  <thead className="sticky top-0 z-10 bg-muted/40 backdrop-blur-sm border-b border-border">
                    <tr>
                      {COLUMNS.map((col) => (
                        <th
                          key={col.key}
                          onClick={() => col.sortable && handleSort(col.key)}
                          className={cn(
                            "px-4 py-3 text-[11px] font-medium uppercase tracking-wider text-muted-foreground whitespace-nowrap group",
                            col.align === "right" ? "text-right" : "text-left",
                            col.sortable && "cursor-pointer select-none hover:text-foreground transition-colors",
                          )}
                        >
                          {col.label}
                          {col.sortable && <SortIcon colKey={col.key} />}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    <AnimatePresence initial={false}>
                      {filtered.map((job) => {
                        const avatar = getCompanyAvatar(job.company);
                        return (
                          <motion.tr
                            key={job.id}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setSelectedJobId(job.id)}
                            className={cn(
                              "group h-16 transition-colors duration-150 cursor-pointer",
                              selectedJobId === job.id ? "bg-muted/60" : "hover:bg-muted/40"
                            )}
                          >
                            <td className="px-4 py-2 whitespace-nowrap">
                              <div className="flex items-center gap-3">
                                <div className={cn("w-8 h-8 rounded-full flex items-center justify-center text-[12px] font-medium shrink-0", avatar.color)}>
                                  {avatar.initials}
                                </div>
                                <div className="flex flex-col min-w-0">
                                  <span className="text-[14px] font-medium text-foreground truncate max-w-[200px]">
                                    {job.company}
                                  </span>
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-2 whitespace-nowrap">
                              <div className="text-[13px] font-medium text-foreground truncate max-w-[220px]" title={job.job_title}>
                                {job.job_title || "—"}
                              </div>
                            </td>
                            <td className="px-4 py-2 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                              <Select
                                value={job.status}
                                onValueChange={(v) => updateJob(job.id, { status: v })}
                              >
                                <SelectTrigger className="h-auto w-auto border-0 p-0 bg-transparent hover:bg-transparent focus:ring-0 focus:ring-offset-0 shadow-none">
                                  <StatusBadge status={job.status} showChevron />
                                </SelectTrigger>
                                <SelectContent className="bg-popover border-border">
                                  {STATUS_ORDER.map((s) => (
                                    <SelectItem key={s} value={s} className="text-popover-foreground focus:bg-muted text-[12px]">
                                      {STATUS_CONFIG[s].label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </td>
                            <td className="px-4 py-2 whitespace-nowrap">
                              <div className="flex items-center gap-1.5 text-[13px] text-muted-foreground truncate max-w-[150px]">
                                {job.location && <MapPin className="w-3.5 h-3.5 shrink-0" strokeWidth={1.5} />}
                                {job.location || "—"}
                              </div>
                            </td>
                            <td className="px-4 py-2 whitespace-nowrap text-right">
                              <span className="text-[13px] text-foreground tnum font-medium">
                                {job.salary || "—"}
                              </span>
                            </td>
                            <td className="px-4 py-2 whitespace-nowrap text-right">
                              <span className="text-[13px] text-muted-foreground tnum">
                                {formatDate(job.created_date)}
                              </span>
                            </td>
                          </motion.tr>
                        );
                      })}
                    </AnimatePresence>
                  </tbody>
                </table>
              </div>

              {/* Mobile View (Cards) */}
              <div className="md:hidden divide-y divide-border">
                {filtered.map((job) => {
                  const avatar = getCompanyAvatar(job.company);
                  return (
                    <div
                      key={job.id}
                      onClick={() => setSelectedJobId(job.id)}
                      className="p-4 hover:bg-muted/30 active:bg-muted/50 cursor-pointer transition-colors space-y-3"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className={cn("w-10 h-10 rounded-full flex items-center justify-center text-[13px] font-medium shrink-0", avatar.color)}>
                            {avatar.initials}
                          </div>
                          <div className="min-w-0">
                            <h3 className="text-[15px] font-semibold text-foreground truncate">{job.company}</h3>
                            <p className="text-[13px] font-medium text-foreground/80 truncate">{job.job_title}</p>
                          </div>
                        </div>
                        <div onClick={(e) => e.stopPropagation()}>
                          <Select
                            value={job.status}
                            onValueChange={(v) => updateJob(job.id, { status: v })}
                          >
                            <SelectTrigger className="h-auto w-auto border-0 p-0 bg-transparent shadow-none focus:ring-0">
                              <StatusBadge status={job.status} />
                            </SelectTrigger>
                            <SelectContent className="bg-popover border-border">
                              {STATUS_ORDER.map((s) => (
                                <SelectItem key={s} value={s} className="text-[12px]">
                                  {STATUS_CONFIG[s].label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      
                      <div className="flex flex-wrap gap-x-4 gap-y-2 text-[12px] text-muted-foreground">
                        {job.location && (
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" /> {job.location}
                          </span>
                        )}
                        {job.salary && (
                          <span className="font-medium text-foreground/80 tnum">{job.salary}</span>
                        )}
                        <span className="tnum ml-auto">
                          Updated {formatDate(job.created_date)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Details Side Panel */}
      <AnimatePresence>
        {selectedJobId && (
          <>
            {/* Backdrop for mobile */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/20 z-40 lg:hidden"
              onClick={() => setSelectedJobId(null)}
            />
            {/* Panel */}
            <motion.div
              initial={{ x: "100%", boxShadow: "-4px 0 24px rgba(0,0,0,0)" }}
              animate={{ x: 0, boxShadow: "-4px 0 24px rgba(0,0,0,0.1)" }}
              exit={{ x: "100%", boxShadow: "-4px 0 24px rgba(0,0,0,0)" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed inset-y-0 right-0 w-full max-w-[400px] bg-card border-l border-border z-50 flex flex-col shadow-2xl dark:shadow-black/50"
            >
              {selectedJob ? (
                <>
                  <div className="flex items-center justify-between px-5 h-14 border-b border-border shrink-0">
                    <h2 className="text-[14px] font-semibold text-foreground">Job Details</h2>
                    <div className="flex items-center gap-1">
                      <button className="w-8 h-8 flex items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition-colors">
                        <Pen className="w-4 h-4" strokeWidth={1.5} />
                      </button>
                      <button
                        onClick={() => setSelectedJobId(null)}
                        className="w-8 h-8 flex items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                      >
                        <X className="w-4 h-4" strokeWidth={1.5} />
                      </button>
                    </div>
                  </div>
                  
                  <div className="flex-1 overflow-y-auto p-5 space-y-6">
                    <div className="flex items-center gap-4">
                      <div className={cn("w-14 h-14 rounded-full flex items-center justify-center text-[18px] font-semibold shrink-0", getCompanyAvatar(selectedJob.company).color)}>
                        {getCompanyAvatar(selectedJob.company).initials}
                      </div>
                      <div>
                        <h1 className="text-[20px] font-bold text-foreground leading-tight">{selectedJob.company}</h1>
                        <p className="text-[14px] text-foreground font-medium">{selectedJob.job_title}</p>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2 pt-2 border-t border-border">
                      <StatusBadge status={selectedJob.status} />
                      {selectedJob.remote && (
                        <span className="px-2.5 h-6 rounded-full inline-flex items-center justify-center text-[12px] font-medium bg-muted text-muted-foreground border border-transparent">
                          Remote
                        </span>
                      )}
                    </div>

                    <div className="space-y-4">
                      <DetailRow icon={MapPin} label="Location" value={selectedJob.location} />
                      <DetailRow icon={FileText} label="Salary" value={selectedJob.salary} isHighlight />
                      <DetailRow icon={CalendarIcon} label="Applied" value={selectedJob.applied_date ? new Date(selectedJob.applied_date).toLocaleDateString() : "—"} />
                      {selectedJob.interview_date && (
                        <DetailRow icon={CalendarIcon} label="Interview" value={new Date(selectedJob.interview_date).toLocaleDateString()} isHighlight />
                      )}
                      {selectedJob.job_url && (
                        <div className="flex items-start gap-3">
                          <ExternalLink className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" strokeWidth={1.5} />
                          <div>
                            <p className="text-[12px] text-muted-foreground font-medium mb-0.5">Job Posting</p>
                            <a href={selectedJob.job_url} target="_blank" rel="noreferrer" className="text-[13px] text-primary hover:underline break-all">
                              {selectedJob.job_url}
                            </a>
                          </div>
                        </div>
                      )}
                    </div>

                    {selectedJob.skills?.length > 0 && (
                      <div className="space-y-2 pt-4 border-t border-border">
                        <h3 className="text-[12px] font-medium uppercase tracking-wider text-muted-foreground">Skills</h3>
                        <div className="flex flex-wrap gap-1.5">
                          {selectedJob.skills.map(s => (
                            <span key={s} className="px-2 py-0.5 rounded-md bg-muted text-[12px] text-muted-foreground border border-border">
                              {s}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="space-y-2 pt-4 border-t border-border">
                      <h3 className="text-[12px] font-medium uppercase tracking-wider text-muted-foreground">Notes</h3>
                      <div className="text-[13px] text-foreground/90 leading-relaxed whitespace-pre-wrap bg-muted/30 p-3 rounded-md border border-border">
                        {selectedJob.notes || "No notes added for this application yet."}
                      </div>
                    </div>
                  </div>
                </>
              ) : null}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

function FilterChip({ children, active, onClick, count }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1.5 h-7 px-3 rounded-full text-[12px] font-medium transition-colors duration-150 border",
        active
          ? "bg-foreground text-background border-foreground shadow-sm"
          : "bg-transparent text-muted-foreground border-border hover:bg-muted hover:text-foreground",
      )}
    >
      {children}
      {count > 0 && (
        <span className={cn("tnum text-[11px]", active ? "opacity-80" : "opacity-50")}>{count}</span>
      )}
    </button>
  );
}

function DetailRow({ icon: Icon, label, value, isHighlight }) {
  if (!value) return null;
  return (
    <div className="flex items-start gap-3">
      <Icon className={cn("w-4 h-4 mt-0.5 shrink-0", isHighlight ? "text-foreground" : "text-muted-foreground")} strokeWidth={1.5} />
      <div>
        <p className="text-[12px] text-muted-foreground font-medium mb-0.5">{label}</p>
        <p className={cn("text-[13px]", isHighlight ? "text-foreground font-semibold tnum" : "text-foreground/90")}>{value}</p>
      </div>
    </div>
  );
}
