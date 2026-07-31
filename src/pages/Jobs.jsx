import { useState, useEffect, useMemo, useRef } from "react";
import { useOutletContext } from "react-router-dom";
import { apiClient } from "@/api/client";
import {
  ArrowUpDown, ArrowUp, ArrowDown,
  MapPin, Plus, MoreHorizontal,
  Pencil, Trash2, Copy, ExternalLink
} from "lucide-react";
import StatusBadge, { STATUS_ORDER, STATUS_CONFIG } from "@/components/StatusBadge";
import {
  Select, SelectContent, SelectItem, SelectTrigger,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

// ─── Column definitions ────────────────────────────────────────────────────────
const COLUMNS = [
  { key: "company",   label: "Company",   width: "w-[24%]",  sortable: true,  editable: true  },
  { key: "job_title", label: "Role",      width: "w-[22%]",  sortable: true,  editable: true  },
  { key: "status",    label: "Status",    width: "w-[12%]",  sortable: true,  editable: false  },
  { key: "location",  label: "Location",  width: "w-[18%]",  sortable: true,  editable: true  },
  { key: "salary",    label: "Salary",    width: "w-[11%]",  sortable: false, editable: true, align: "right" },
  { key: "source",    label: "Source",    width: "w-[9%]",   sortable: false, editable: false },
  { key: "actions",   label: "",          width: "w-[4%]",   sortable: false, editable: false },
];

const EDITABLE_COLS = COLUMNS.filter(c => c.editable).map(c => c.key);

// ─── Source badge config ───────────────────────────────────────────────────────
const SOURCE_CONFIG = {
  linkedin:   { label: "LinkedIn",   color: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/15" },
  wellfound:  { label: "Wellfound",  color: "bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/15" },
  indeed:     { label: "Indeed",     color: "bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-500/15" },
  glassdoor:  { label: "Glassdoor",  color: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/15" },
  naukri:     { label: "Naukri",     color: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/15" },
  referral:   { label: "Referral",   color: "bg-fuchsia-500/10 text-fuchsia-600 dark:text-fuchsia-400 border-fuchsia-500/15" },
  careers:    { label: "Careers",    color: "bg-muted text-muted-foreground border-border/50" },
  unstop:     { label: "Unstop",     color: "bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/15" },
  other:      { label: "Other",      color: "bg-muted text-muted-foreground border-border/50" },
};

const getSourceConfig = (source) => {
  if (!source) return null;
  const key = source.toLowerCase().trim();
  return SOURCE_CONFIG[key] || { label: source, color: "bg-muted text-muted-foreground border-border/50" };
};

// ─── Work-mode chip ────────────────────────────────────────────────────────────
const WORK_MODE_COLORS = {
  remote:  "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/15",
  hybrid:  "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/15",
  "on-site": "bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/15",
  onsite:  "bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/15",
};

const getWorkModeColor = (mode) => {
  if (!mode) return null;
  return WORK_MODE_COLORS[mode.toLowerCase()] || null;
};

// ─── Salary condensation ───────────────────────────────────────────────────────
const condenseSalary = (raw) => {
  if (!raw) return null;
  const s = raw.toString().trim();
  if (!s || s.toLowerCase() === "not disclosed") return "Not disclosed";

  let period = "";
  if (/\/?(month|mo|monthly)/i.test(s))         period = "/mo";
  else if (/\/?(year|yr|annual|annum|pa)/i.test(s)) period = "/yr";
  else if (/lpa/i.test(s))                         period = "";
  else if (/\/?(hour|hr)/i.test(s))               period = "/hr";

  const currMatch = s.match(/[₹$€£¥]/);
  const curr = currMatch ? currMatch[0] : "";

  if (/lpa/i.test(s)) {
    const n = s.replace(/,/g, "").match(/(\d+(?:\.\d+)?)/);
    if (n) return `${curr}${parseFloat(n[1])}L${period || "/yr"}`;
  }

  const numMatch = s.replace(/,/g, "").match(/(\d+(?:\.\d+)?)/);
  if (!numMatch) return s.length > 14 ? s.substring(0, 13) + "…" : s;

  const num = parseFloat(numMatch[1]);
  if (num >= 1_000_000) return `${curr}${(num / 1_000_000).toFixed(1).replace(/\.0$/, "")}M${period}`;
  if (num >= 1_000)     return `${curr}${Math.round(num / 1_000)}k${period}`;
  return `${curr}${num}${period}`;
};

// ─── Company avatar ────────────────────────────────────────────────────────────
const getCompanyAvatar = (name) => {
  if (!name) return { initials: "?", color: "bg-muted text-muted-foreground" };
  const initials = name.substring(0, 2).toUpperCase();
  const hash = name.split("").reduce((a, c) => c.charCodeAt(0) + ((a << 5) - a), 0);
  const palettes = [
    "bg-violet-500/20 text-violet-600 dark:text-violet-300",
    "bg-blue-500/20   text-blue-600   dark:text-blue-300",
    "bg-emerald-500/20 text-emerald-600 dark:text-emerald-300",
    "bg-amber-500/20  text-amber-600  dark:text-amber-300",
    "bg-rose-500/20   text-rose-600   dark:text-rose-300",
    "bg-sky-500/20    text-sky-600    dark:text-sky-300",
    "bg-fuchsia-500/20 text-fuchsia-600 dark:text-fuchsia-300",
    "bg-teal-500/20   text-teal-600   dark:text-teal-300",
  ];
  return { initials, color: palettes[Math.abs(hash) % palettes.length] };
};

// ─── Main component ────────────────────────────────────────────────────────────
export default function Jobs() {
  const { searchQuery, openAddJob } = useOutletContext();
  const [jobs, setJobs]             = useState([]);
  const [loading, setLoading]       = useState(true);
  const [sortKey, setSortKey]       = useState("created_date");
  const [sortDir, setSortDir]       = useState("desc");
  const [statusFilter, setStatusFilter] = useState("all");
  const [deleteTarget, setDeleteTarget] = useState(null); // { id, company }

  // Inline editing state
  const [selectedRowId, setSelectedRowId] = useState(null);
  const [editingCell, setEditingCell]     = useState(null);
  const [editValue, setEditValue]         = useState("");
  const tableRef = useRef(null);

  // ── Data fetch ───────────────────────────────────────────────────────────────
  useEffect(() => {
    console.log("[Jobs] mounted");
    let alive = true;
    (async () => {
      console.log("[Jobs] fetching jobs");
      try {
        const data = await apiClient.fetchApi("/jobs");
        if (!alive) return;
        console.log(`[Jobs] fetched ${data.length} jobs`);
        setJobs(data);
      } catch (err) {
        console.error("[Jobs] fetch error:", err);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, []);

  // ── Filter + sort ────────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    let result = [...jobs];
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(j =>
        [j.company, j.job_title, j.location, j.salary, j.source].some(v =>
          (v || "").toLowerCase().includes(q)
        )
      );
    }
    if (statusFilter !== "all") result = result.filter(j => j.status === statusFilter);
    result.sort((a, b) => {
      const k  = sortKey === "updated" ? "created_date" : sortKey;
      const av = a[k] || "", bv = b[k] || "";
      if (av < bv) return sortDir === "asc" ? -1 : 1;
      if (av > bv) return sortDir === "asc" ?  1 : -1;
      return 0;
    });
    return result;
  }, [jobs, searchQuery, statusFilter, sortKey, sortDir]);

  // ── Mutations ────────────────────────────────────────────────────────────────
  const handleSort = (key) => {
    if (sortKey === key) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortKey(key); setSortDir("asc"); }
  };

  const updateJob = async (id, updates) => {
    setJobs(prev => prev.map(j => j.id === id ? { ...j, ...updates } : j));
    try {
      await apiClient.fetchApi(`/jobs/${id}`, { method: "PUT", body: JSON.stringify(updates) });
    } catch (err) { console.error(err); }
  };

  const removeJob = async (id) => {
    try {
      await apiClient.fetchApi(`/jobs/${id}`, { method: "DELETE" });
      setJobs(prev => prev.filter(j => j.id !== id));
      toast.success("Job deleted");
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete job");
    } finally {
      setDeleteTarget(null);
    }
  };

  const duplicateJob = async (job) => {
    try {
      const { id, created_date, ...rest } = job;
      const created = await apiClient.fetchApi("/jobs", {
        method: "POST",
        body: JSON.stringify({ ...rest, company: `${rest.company} (copy)` }),
      });
      setJobs(prev => [created, ...prev]);
      toast.success("Job duplicated");
    } catch (err) {
      console.error(err);
      toast.error("Failed to duplicate job");
    }
  };

  // ── Inline edit ──────────────────────────────────────────────────────────────
  const startEdit = (id, col, val) => { setSelectedRowId(id); setEditingCell({ id, col }); setEditValue(val || ""); };
  const saveEdit  = (id, col) => {
    const job = jobs.find(j => j.id === id);
    if (job && job[col] !== editValue) updateJob(id, { [col]: editValue });
    setEditingCell(null);
  };

  // ── Keyboard navigation ──────────────────────────────────────────────────────
  const handleKeyDown = (e) => {
    if (!selectedRowId && !editingCell) return;
    if (!editingCell) {
      const idx = filtered.findIndex(j => j.id === selectedRowId);
      if (e.key === "ArrowDown" && idx < filtered.length - 1) { e.preventDefault(); setSelectedRowId(filtered[idx + 1].id); }
      if (e.key === "ArrowUp"   && idx > 0)                   { e.preventDefault(); setSelectedRowId(filtered[idx - 1].id); }
    }
  };
  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedRowId, editingCell, filtered]);

  const handleInputKeyDown = (e, id, col) => {
    if (e.key === "Enter")  { e.preventDefault(); saveEdit(id, col); }
    if (e.key === "Escape") { e.preventDefault(); setEditingCell(null); }
    if (e.key === "Tab") {
      e.preventDefault();
      saveEdit(id, col);
      const ci = EDITABLE_COLS.indexOf(col);
      if (!e.shiftKey) {
        if (ci < EDITABLE_COLS.length - 1) startEdit(id, EDITABLE_COLS[ci + 1], jobs.find(j => j.id === id)?.[EDITABLE_COLS[ci + 1]]);
        else {
          const ri = filtered.findIndex(j => j.id === id);
          if (ri < filtered.length - 1) { const nid = filtered[ri + 1].id; startEdit(nid, EDITABLE_COLS[0], jobs.find(j => j.id === nid)?.[EDITABLE_COLS[0]]); }
        }
      } else {
        if (ci > 0) startEdit(id, EDITABLE_COLS[ci - 1], jobs.find(j => j.id === id)?.[EDITABLE_COLS[ci - 1]]);
        else {
          const ri = filtered.findIndex(j => j.id === id);
          if (ri > 0) { const nid = filtered[ri - 1].id; const lc = EDITABLE_COLS[EDITABLE_COLS.length - 1]; startEdit(nid, lc, jobs.find(j => j.id === nid)?.[lc]); }
        }
      }
    }
  };

  // ── Sub-components ───────────────────────────────────────────────────────────
  const SortIcon = ({ colKey }) => {
    if (sortKey !== colKey) return <ArrowUpDown className="w-2.5 h-2.5 opacity-0 group-hover:opacity-40 inline-block ml-1 transition-opacity shrink-0" strokeWidth={1.5} />;
    return sortDir === "asc"
      ? <ArrowUp   className="w-2.5 h-2.5 opacity-60 inline-block ml-1 shrink-0" strokeWidth={1.5} />
      : <ArrowDown className="w-2.5 h-2.5 opacity-60 inline-block ml-1 shrink-0" strokeWidth={1.5} />;
  };

  // ── Loading skeleton ──────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="px-6 py-6 w-full">
        <div className="rounded-[8px] border border-border/60 overflow-hidden">
          <div className="h-9 bg-muted/20 border-b border-border/60" />
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-[48px] flex items-center px-4 gap-3 border-b border-border/40 last:border-0">
              <Skeleton className="w-7 h-7 rounded-[6px] shrink-0" />
              <Skeleton className="h-3 w-[18%]" />
              <Skeleton className="h-3 w-[16%] opacity-60" />
              <Skeleton className="h-5 w-[72px] rounded-full" />
              <Skeleton className="h-3 w-[14%] opacity-60" />
              <Skeleton className="h-3 w-[8%] ml-auto opacity-40" />
              <Skeleton className="h-5 w-[52px] rounded-full opacity-40" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  const statusCounts = {};
  jobs.forEach(j => { statusCounts[j.status] = (statusCounts[j.status] || 0) + 1; });

  return (
    <div className="flex flex-col min-h-full px-6 lg:px-8 py-7 w-full max-w-full" onClick={() => setSelectedRowId(null)}>

      {/* Header */}
      <div className="flex items-center justify-between mb-5 shrink-0">
        <h1 className="text-[20px] font-semibold tracking-tight text-foreground">Jobs</h1>
      </div>

      {/* Filter chips */}
      <div className="flex flex-wrap gap-1.5 mb-4 shrink-0" onClick={e => e.stopPropagation()}>
        <FilterChip active={statusFilter === "all"} onClick={() => setStatusFilter("all")} count={jobs.length}>All</FilterChip>
        {STATUS_ORDER.filter(s => statusCounts[s] > 0).map(s => (
          <FilterChip key={s} active={statusFilter === s} onClick={() => setStatusFilter(s)} count={statusCounts[s]}>
            {STATUS_CONFIG[s].label}
          </FilterChip>
        ))}
      </div>

      {/* Table */}
      <div
        className="overflow-x-auto rounded-[8px] border border-border/60 bg-card"
        onClick={e => e.stopPropagation()}
      >
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-56 text-center gap-4">
            <p className="text-[13px] text-muted-foreground">No jobs match your criteria.</p>
            <button
              onClick={openAddJob}
              className="inline-flex items-center gap-1.5 h-8 px-3.5 rounded-md bg-primary text-primary-foreground text-[12.5px] font-medium hover:opacity-90 transition-opacity"
            >
              <Plus className="w-3.5 h-3.5" strokeWidth={2} />
              Add Job
            </button>
          </div>
        ) : (
          <>
            {/* ── Desktop table ─────────────────────────────────────────────── */}
            <div className="hidden md:block min-w-[860px]">
              <table className="w-full text-left table-fixed" ref={tableRef}>

                {/* thead */}
                <thead>
                  <tr className="border-b border-border/60 bg-muted/10">
                    {COLUMNS.map(col => (
                      <th
                        key={col.key}
                        onClick={() => col.sortable && handleSort(col.key)}
                        className={cn(
                          "px-4 py-2.5 text-[10.5px] font-medium uppercase tracking-widest text-muted-foreground/50 group select-none",
                          col.width,
                          col.align === "right"  && "text-right",
                          col.align === "center" && "text-center",
                          col.sortable && "cursor-pointer hover:text-muted-foreground/80 transition-colors",
                        )}
                      >
                        {col.label}
                        {col.sortable && <SortIcon colKey={col.key} />}
                      </th>
                    ))}
                  </tr>
                </thead>

                {/* tbody */}
                <tbody>
                  {filtered.map(job => {
                    const avatar     = getCompanyAvatar(job.company);
                    const isSelected = selectedRowId === job.id;
                    const salaryStr  = condenseSalary(job.salary);
                    const sourceConf = getSourceConfig(job.source);
                    const workMode   = job.work_mode || (job.remote ? "Remote" : null);
                    const modeColor  = getWorkModeColor(workMode);

                    return (
                      <tr
                        key={job.id}
                        onClick={() => setSelectedRowId(job.id)}
                        className={cn(
                          "group h-[48px] border-b border-border/40 last:border-0 cursor-pointer",
                          "transition-colors duration-75 select-none",
                          isSelected ? "bg-primary/5" : "hover:bg-muted/25",
                        )}
                      >
                        {/* Company */}
                        <td
                          className="px-4 py-0"
                          onDoubleClick={() => startEdit(job.id, "company", job.company)}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className={cn("w-[26px] h-[26px] rounded-[6px] flex items-center justify-center text-[9.5px] font-bold shrink-0", avatar.color)}>
                              {avatar.initials}
                            </div>
                            <div className="flex-1 min-w-0">
                              {editingCell?.id === job.id && editingCell?.col === "company" ? (
                                <input autoFocus value={editValue}
                                  onChange={e => setEditValue(e.target.value)}
                                  onKeyDown={e => handleInputKeyDown(e, job.id, "company")}
                                  onBlur={() => saveEdit(job.id, "company")}
                                  className="w-full bg-transparent border-none outline-none p-0 text-[13px] font-semibold text-foreground"
                                />
                              ) : (
                                <span className="text-[13px] font-semibold text-foreground truncate block leading-none">
                                  {job.company || "—"}
                                </span>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Role */}
                        <td
                          className="px-4 py-0"
                          onDoubleClick={() => startEdit(job.id, "job_title", job.job_title)}
                        >
                          {editingCell?.id === job.id && editingCell?.col === "job_title" ? (
                            <input autoFocus value={editValue}
                              onChange={e => setEditValue(e.target.value)}
                              onKeyDown={e => handleInputKeyDown(e, job.id, "job_title")}
                              onBlur={() => saveEdit(job.id, "job_title")}
                              className="w-full bg-transparent border-none outline-none p-0 text-[13px] text-foreground"
                            />
                          ) : (
                            <span className="text-[13px] text-foreground/75 font-medium truncate block">
                              {job.job_title || "—"}
                            </span>
                          )}
                        </td>

                        {/* Status */}
                        <td className="px-4 py-0" onClick={e => e.stopPropagation()}>
                          <Select value={job.status} onValueChange={v => updateJob(job.id, { status: v })}>
                            <SelectTrigger className="h-auto w-auto border-0 p-0 bg-transparent hover:bg-transparent focus:ring-0 focus:ring-offset-0 shadow-none [&>svg]:hidden">
                              <StatusBadge status={job.status} showChevron />
                            </SelectTrigger>
                            <SelectContent className="bg-popover border-border">
                              {STATUS_ORDER.map(s => (
                                <SelectItem key={s} value={s} className="text-popover-foreground focus:bg-muted text-[12px]">
                                  {STATUS_CONFIG[s].label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </td>

                        {/* Location + work mode */}
                        <td
                          className="px-4 py-0"
                          onDoubleClick={() => startEdit(job.id, "location", job.location)}
                        >
                          <div className="flex items-center gap-1.5 min-w-0">
                            {job.location && !editingCell?.id === job.id && (
                              <MapPin className="w-3 h-3 shrink-0 text-muted-foreground/30" strokeWidth={1.5} />
                            )}
                            {editingCell?.id === job.id && editingCell?.col === "location" ? (
                              <input autoFocus value={editValue}
                                onChange={e => setEditValue(e.target.value)}
                                onKeyDown={e => handleInputKeyDown(e, job.id, "location")}
                                onBlur={() => saveEdit(job.id, "location")}
                                className="w-full bg-transparent border-none outline-none p-0 text-[12.5px] text-foreground"
                              />
                            ) : (
                              <div className="flex items-center gap-1.5 min-w-0 flex-wrap">
                                <span className="text-[12.5px] text-muted-foreground/70 truncate">
                                  {job.location || "—"}
                                </span>
                                {workMode && modeColor && (
                                  <span className={cn(
                                    "shrink-0 text-[10px] font-medium px-1.5 py-0.5 rounded-[4px] border",
                                    modeColor
                                  )}>
                                    {workMode}
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        </td>

                        {/* Salary */}
                        <td
                          className="px-4 py-0 text-right"
                          onDoubleClick={() => startEdit(job.id, "salary", job.salary)}
                        >
                          {editingCell?.id === job.id && editingCell?.col === "salary" ? (
                            <input autoFocus value={editValue}
                              onChange={e => setEditValue(e.target.value)}
                              onKeyDown={e => handleInputKeyDown(e, job.id, "salary")}
                              onBlur={() => saveEdit(job.id, "salary")}
                              className="w-full bg-transparent border-none outline-none p-0 text-[12.5px] text-foreground text-right tabular-nums"
                            />
                          ) : (
                            <span className={cn(
                              "text-[12.5px] tabular-nums",
                              salaryStr ? "text-muted-foreground/80" : "text-muted-foreground/25"
                            )}>
                              {salaryStr || "—"}
                            </span>
                          )}
                        </td>

                        {/* Source badge */}
                        <td className="px-4 py-0">
                          {sourceConf ? (
                            <span className={cn(
                              "inline-flex items-center text-[10.5px] font-medium px-1.5 py-0.5 rounded-[4px] border truncate max-w-full",
                              sourceConf.color
                            )}>
                              {sourceConf.label}
                            </span>
                          ) : (
                            <span className="text-muted-foreground/25 text-[12px]">—</span>
                          )}
                        </td>

                        {/* Actions kebab menu */}
                        <td className="px-3 py-0" onClick={e => e.stopPropagation()}>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <button className={cn(
                                "w-7 h-7 rounded-md flex items-center justify-center",
                                "text-muted-foreground/30 hover:text-foreground hover:bg-muted",
                                "transition-all duration-150",
                                "opacity-0 group-hover:opacity-100",
                                "focus:opacity-100 focus:outline-none",
                              )}>
                                <MoreHorizontal className="w-4 h-4" strokeWidth={1.8} />
                              </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-44 bg-popover border-border">
                              <DropdownMenuItem
                                className="text-[12.5px] gap-2 cursor-pointer"
                                onSelect={() => startEdit(job.id, "company", job.company)}
                              >
                                <Pencil className="w-3.5 h-3.5 opacity-60" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="text-[12.5px] gap-2 cursor-pointer"
                                onSelect={() => duplicateJob(job)}
                              >
                                <Copy className="w-3.5 h-3.5 opacity-60" />
                                Duplicate
                              </DropdownMenuItem>
                              {job.job_url && (
                                <DropdownMenuItem
                                  className="text-[12.5px] gap-2 cursor-pointer"
                                  onSelect={() => window.open(job.job_url, "_blank")}
                                >
                                  <ExternalLink className="w-3.5 h-3.5 opacity-60" />
                                  Open URL
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className="text-[12.5px] gap-2 cursor-pointer text-red-500 focus:text-red-500 focus:bg-red-500/10"
                                onSelect={() => setDeleteTarget({ id: job.id, company: job.company })}
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* ── Mobile list rows ───────────────────────────────────────────── */}
            <div className="md:hidden divide-y divide-border/40">
              {filtered.map(job => {
                const avatar     = getCompanyAvatar(job.company);
                const salaryStr  = condenseSalary(job.salary);
                const sourceConf = getSourceConfig(job.source);
                const workMode   = job.work_mode || (job.remote ? "Remote" : null);
                const modeColor  = getWorkModeColor(workMode);
                return (
                  <div key={job.id} className="p-4 space-y-3 cursor-pointer hover:bg-muted/20 transition-colors">
                    <div className="flex items-start gap-3">
                      <div className={cn("w-8 h-8 rounded-[7px] flex items-center justify-center text-[11px] font-bold shrink-0", avatar.color)}>
                        {avatar.initials}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <h3 className="text-[13.5px] font-semibold text-foreground truncate leading-snug">{job.company}</h3>
                            <p className="text-[12.5px] text-foreground/65 truncate leading-snug">{job.job_title}</p>
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0" onClick={e => e.stopPropagation()}>
                            <Select value={job.status} onValueChange={v => updateJob(job.id, { status: v })}>
                              <SelectTrigger className="h-auto w-auto border-0 p-0 bg-transparent shadow-none focus:ring-0 [&>svg]:hidden">
                                <StatusBadge status={job.status} />
                              </SelectTrigger>
                              <SelectContent className="bg-popover border-border">
                                {STATUS_ORDER.map(s => (
                                  <SelectItem key={s} value={s} className="text-[12px]">{STATUS_CONFIG[s].label}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <button className="w-7 h-7 rounded-md flex items-center justify-center text-muted-foreground/50 hover:text-foreground hover:bg-muted transition-colors">
                                  <MoreHorizontal className="w-4 h-4" strokeWidth={1.8} />
                                </button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-44 bg-popover border-border">
                                <DropdownMenuItem className="text-[12.5px] gap-2" onSelect={() => duplicateJob(job)}>
                                  <Copy className="w-3.5 h-3.5 opacity-60" />Duplicate
                                </DropdownMenuItem>
                                {job.job_url && (
                                  <DropdownMenuItem className="text-[12.5px] gap-2" onSelect={() => window.open(job.job_url, "_blank")}>
                                    <ExternalLink className="w-3.5 h-3.5 opacity-60" />Open URL
                                  </DropdownMenuItem>
                                )}
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  className="text-[12.5px] gap-2 text-red-500 focus:text-red-500 focus:bg-red-500/10"
                                  onSelect={() => setDeleteTarget({ id: job.id, company: job.company })}
                                >
                                  <Trash2 className="w-3.5 h-3.5" />Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[12px] text-muted-foreground/60 pl-11">
                      {job.location && (
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3 opacity-50" /> {job.location}
                        </span>
                      )}
                      {workMode && modeColor && (
                        <span className={cn("text-[10px] font-medium px-1.5 py-0.5 rounded border", modeColor)}>
                          {workMode}
                        </span>
                      )}
                      {salaryStr && <span className="tabular-nums">{salaryStr}</span>}
                      {sourceConf && (
                        <span className={cn("text-[10.5px] font-medium px-1.5 py-0.5 rounded border", sourceConf.color)}>
                          {sourceConf.label}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* Global delete confirmation dialog */}
      <AlertDialog open={!!deleteTarget} onOpenChange={open => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this job?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the application for{" "}
              <strong className="text-foreground">{deleteTarget?.company}</strong>. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteTarget && removeJob(deleteTarget.id)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </div>
  );
}

// ─── FilterChip ────────────────────────────────────────────────────────────────
function FilterChip({ children, active, onClick, count }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1.5 h-7 px-3 rounded-md text-[12px] font-medium transition-colors duration-150 border",
        active
          ? "bg-foreground text-background border-foreground/80"
          : "bg-transparent text-muted-foreground border-border/50 hover:bg-muted hover:text-foreground hover:border-border",
      )}
    >
      {children}
      {count > 0 && (
        <span className={cn("tabular-nums text-[10.5px]", active ? "opacity-70" : "opacity-40")}>
          {count}
        </span>
      )}
    </button>
  );
}
