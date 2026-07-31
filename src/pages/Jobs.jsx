import { useState, useEffect, useMemo, useRef } from "react";
import { useOutletContext } from "react-router-dom";
import { apiClient } from "@/api/client";
import { ArrowUpDown, ArrowUp, ArrowDown, MapPin, Plus } from "lucide-react";
import StatusBadge, {
  STATUS_ORDER,
  STATUS_CONFIG,
} from "@/components/StatusBadge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import DeleteJobButton from "@/components/DeleteJobButton";

// ─── Column definitions ────────────────────────────────────────────────────────
const COLUMNS = [
  { key: "company",   label: "Company",      width: "w-[22%]",   sortable: true,  editable: true,  align: "left"   },
  { key: "job_title", label: "Role",         width: "w-[22%]",   sortable: true,  editable: true,  align: "left"   },
  { key: "status",    label: "Status",       width: "w-[14%]",   sortable: true,  editable: false, align: "left"   },
  { key: "location",  label: "Location",     width: "w-[16%]",   sortable: true,  editable: true,  align: "left"   },
  { key: "salary",    label: "Salary",       width: "w-[12%]",   sortable: false, editable: true,  align: "right"  },
  { key: "updated",   label: "Updated",      width: "w-[10%]",   sortable: true,  editable: false, align: "right"  },
  { key: "actions",   label: "",             width: "w-[4%]",    sortable: false, editable: false, align: "center" },
];

const EDITABLE_COLS = COLUMNS.filter(c => c.editable).map(c => c.key);

// ─── Helpers ───────────────────────────────────────────────────────────────────
const formatDate = (dateStr) => {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  if (isNaN(d)) return "—";
  const diff = Date.now() - d.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  if (days < 0)  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7)  return `${days}d ago`;
  if (days < 14) return "1w ago";
  if (days < 30) return `${Math.floor(days / 7)}w ago`;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
};

/**
 * Condenses a salary string to a short, single value for the table cell.
 * "₹50,000 – ₹80,000/month" → "₹50k/mo"
 * "$120,000 - $160,000" → "$120k"
 * "₹8 LPA – ₹12 LPA" → "₹8L"
 * Falls back to original if no number found.
 */
const condenseSalary = (raw) => {
  if (!raw) return "—";
  const s = raw.toString();

  // Detect period suffix
  let period = "";
  if (/\/?(month|mo|monthly)/i.test(s)) period = "/mo";
  else if (/\/?(year|yr|annual|annum|pa|lpa)/i.test(s)) period = "/yr";
  else if (/\/?(hour|hr)/i.test(s)) period = "/hr";

  // Detect currency symbol
  const currMatch = s.match(/[₹$€£¥]/);
  const curr = currMatch ? currMatch[0] : "";

  // Find the FIRST numeric value
  const numMatch = s.replace(/,/g, "").match(/(\d+(?:\.\d+)?)/);
  if (!numMatch) return s.length > 14 ? s.substring(0, 13) + "…" : s;

  const num = parseFloat(numMatch[1]);

  // LPA shorthand: numbers like 8, 12 paired with "LPA"
  if (/lpa/i.test(s)) {
    return `${curr}${num}L${period || "/yr"}`;
  }

  // Large numbers: convert to k / M
  if (num >= 1_000_000) return `${curr}${(num / 1_000_000).toFixed(1).replace(/\.0$/, "")}M${period}`;
  if (num >= 1_000)     return `${curr}${Math.round(num / 1_000)}k${period}`;
  return `${curr}${num}${period}`;
};

const getCompanyAvatar = (companyName) => {
  if (!companyName) return { initials: "?", color: "bg-muted text-muted-foreground" };
  const initials = companyName.substring(0, 2).toUpperCase();
  const hash = companyName.split("").reduce((acc, char) => char.charCodeAt(0) + ((acc << 5) - acc), 0);
  const palettes = [
    "bg-violet-500/15 text-violet-600 dark:text-violet-400",
    "bg-blue-500/15   text-blue-600   dark:text-blue-400",
    "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
    "bg-amber-500/15  text-amber-600  dark:text-amber-400",
    "bg-rose-500/15   text-rose-600   dark:text-rose-400",
    "bg-sky-500/15    text-sky-600    dark:text-sky-400",
    "bg-fuchsia-500/15 text-fuchsia-600 dark:text-fuchsia-400",
  ];
  return { initials, color: palettes[Math.abs(hash) % palettes.length] };
};

// ─── Component ─────────────────────────────────────────────────────────────────
export default function Jobs() {
  const { searchQuery, openAddJob } = useOutletContext();
  const [jobs, setJobs]               = useState([]);
  const [loading, setLoading]         = useState(true);
  const [sortKey, setSortKey]         = useState("created_date");
  const [sortDir, setSortDir]         = useState("desc");
  const [statusFilter, setStatusFilter] = useState("all");

  const [selectedRowId, setSelectedRowId] = useState(null);
  const [editingCell, setEditingCell]     = useState(null);
  const [editValue, setEditValue]         = useState("");
  const tableRef = useRef(null);

  // ── Data fetching ────────────────────────────────────────────────────────────
  useEffect(() => {
    console.log("[Jobs] mounted");
    let isMounted = true;
    const load = async () => {
      console.log("[Jobs] fetching jobs");
      try {
        const data = await apiClient.fetchApi('/jobs');
        if (!isMounted) return;
        console.log(`[Jobs] API response status: 200, job count: ${data.length}`);
        setJobs(data);
      } catch (err) {
        console.error("[Jobs] Error fetching jobs:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    load();
    return () => { isMounted = false; };
  }, []);

  // ── Filtering & sorting ──────────────────────────────────────────────────────
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
    if (statusFilter !== "all") result = result.filter((j) => j.status === statusFilter);
    result.sort((a, b) => {
      const k  = sortKey === "updated" ? "created_date" : sortKey;
      const av = a[k] || "";
      const bv = b[k] || "";
      if (av < bv) return sortDir === "asc" ? -1 : 1;
      if (av > bv) return sortDir === "asc" ?  1 : -1;
      return 0;
    });
    console.log(`[Jobs] raw: ${jobs.length} | filtered: ${result.length}`);
    return result;
  }, [jobs, searchQuery, statusFilter, sortKey, sortDir]);

  // ── Handlers ─────────────────────────────────────────────────────────────────
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

  const removeJob = (jobId) => setJobs(prev => prev.filter(j => j.id !== jobId));

  // ── Keyboard nav ─────────────────────────────────────────────────────────────
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

  const startEdit = (id, col, currentValue) => {
    setSelectedRowId(id);
    setEditingCell({ id, col });
    setEditValue(currentValue || "");
  };
  const saveEdit = (id, col) => {
    const job = jobs.find(j => j.id === id);
    if (job && job[col] !== editValue) updateJob(id, { [col]: editValue });
    setEditingCell(null);
  };
  const handleInputKeyDown = (e, id, col) => {
    if (e.key === "Enter")  { e.preventDefault(); saveEdit(id, col); return; }
    if (e.key === "Escape") { e.preventDefault(); setEditingCell(null); return; }
    if (e.key === "Tab") {
      e.preventDefault();
      saveEdit(id, col);
      const colIdx = EDITABLE_COLS.indexOf(col);
      if (!e.shiftKey) {
        if (colIdx < EDITABLE_COLS.length - 1) {
          const nextCol = EDITABLE_COLS[colIdx + 1];
          startEdit(id, nextCol, jobs.find(j => j.id === id)?.[nextCol]);
        } else {
          const rowIdx = filtered.findIndex(j => j.id === id);
          if (rowIdx < filtered.length - 1) {
            const nid = filtered[rowIdx + 1].id;
            startEdit(nid, EDITABLE_COLS[0], jobs.find(j => j.id === nid)?.[EDITABLE_COLS[0]]);
          }
        }
      } else {
        if (colIdx > 0) {
          const prevCol = EDITABLE_COLS[colIdx - 1];
          startEdit(id, prevCol, jobs.find(j => j.id === id)?.[prevCol]);
        } else {
          const rowIdx = filtered.findIndex(j => j.id === id);
          if (rowIdx > 0) {
            const nid = filtered[rowIdx - 1].id;
            const lastCol = EDITABLE_COLS[EDITABLE_COLS.length - 1];
            startEdit(nid, lastCol, jobs.find(j => j.id === nid)?.[lastCol]);
          }
        }
      }
    }
  };

  // ── Sort icon ────────────────────────────────────────────────────────────────
  const SortIcon = ({ colKey }) => {
    if (sortKey !== colKey) return <ArrowUpDown className="w-3 h-3 opacity-0 group-hover:opacity-40 inline-block ml-1 transition-opacity" strokeWidth={1.5} />;
    return sortDir === "asc"
      ? <ArrowUp   className="w-3 h-3 opacity-70 inline-block ml-1" strokeWidth={1.5} />
      : <ArrowDown className="w-3 h-3 opacity-70 inline-block ml-1" strokeWidth={1.5} />;
  };

  // ── Loading skeleton ──────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="px-6 py-6 space-y-6 w-full">
        <div className="rounded-lg border border-border overflow-hidden">
          <div className="h-9 bg-muted/30 border-b border-border/70" />
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className="h-[46px] flex items-center px-4 gap-4 border-b border-border/40 last:border-0">
              <Skeleton className="w-6 h-6 rounded-full shrink-0" />
              <Skeleton className="h-3.5 w-[18%]" />
              <Skeleton className="h-3.5 w-[18%]" />
              <Skeleton className="h-5 w-[80px] rounded-full" />
              <Skeleton className="h-3.5 w-[14%]" />
              <Skeleton className="h-3.5 w-[10%] ml-auto" />
              <Skeleton className="h-3.5 w-[8%]" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  const statusCounts = {};
  jobs.forEach(j => { statusCounts[j.status] = (statusCounts[j.status] || 0) + 1; });

  return (
    <div
      className="flex flex-col min-h-full px-6 lg:px-8 py-7 w-full max-w-full mx-auto"
      onClick={() => setSelectedRowId(null)}
    >
      {/* Page header */}
      <div className="flex items-center justify-between mb-5 shrink-0">
        <h1 className="text-[20px] font-semibold tracking-tight text-foreground">Jobs</h1>
      </div>

      {/* Filter chips */}
      <div className="flex flex-wrap gap-1.5 mb-4 shrink-0" onClick={e => e.stopPropagation()}>
        <FilterChip active={statusFilter === "all"} onClick={() => setStatusFilter("all")} count={jobs.length}>
          All
        </FilterChip>
        {STATUS_ORDER.filter(s => statusCounts[s] > 0).map(s => (
          <FilterChip key={s} active={statusFilter === s} onClick={() => setStatusFilter(s)} count={statusCounts[s]}>
            {STATUS_CONFIG[s].label}
          </FilterChip>
        ))}
      </div>

      {/* Table container */}
      <div
        className="overflow-x-auto rounded-[8px] border border-border/70 bg-card"
        onClick={e => e.stopPropagation()}
      >
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-56 text-center">
            <p className="text-[13.5px] text-muted-foreground mb-4">No jobs match your criteria.</p>
            <button
              onClick={openAddJob}
              className="inline-flex items-center gap-1.5 h-8 px-4 rounded-md bg-primary text-primary-foreground text-[12.5px] font-medium hover:opacity-90 transition-opacity"
            >
              <Plus className="w-3.5 h-3.5" strokeWidth={2} />
              Add Job
            </button>
          </div>
        ) : (
          <>
            {/* ── Desktop table ────────────────────────────────────────────── */}
            <div className="hidden md:block min-w-[900px]">
              <table className="w-full text-left table-fixed" ref={tableRef}>
                {/* Header */}
                <thead>
                  <tr className="bg-muted/20 border-b border-border/70">
                    {COLUMNS.map(col => (
                      <th
                        key={col.key}
                        onClick={() => col.sortable && handleSort(col.key)}
                        className={cn(
                          "px-4 py-2.5 text-[11px] font-medium uppercase tracking-widest text-muted-foreground/70 group select-none",
                          col.width,
                          col.align === "right"  && "text-right",
                          col.align === "center" && "text-center",
                          col.sortable && "cursor-pointer hover:text-muted-foreground transition-colors",
                        )}
                      >
                        {col.label}
                        {col.sortable && <SortIcon colKey={col.key} />}
                      </th>
                    ))}
                  </tr>
                </thead>

                {/* Body */}
                <tbody>
                  {filtered.map((job) => {
                    const avatar     = getCompanyAvatar(job.company);
                    const isSelected = selectedRowId === job.id;
                    return (
                      <tr
                        key={job.id}
                        onClick={() => setSelectedRowId(job.id)}
                        className={cn(
                          "group h-[46px] border-b border-border/40 last:border-0 transition-colors duration-75 select-none",
                          isSelected ? "bg-muted/60" : "hover:bg-muted/30",
                        )}
                      >
                        {COLUMNS.map(col => {
                          const isEditing = editingCell?.id === job.id && editingCell?.col === col.key;

                          /* ── Company ── */
                          if (col.key === "company") {
                            return (
                              <td
                                key={col.key}
                                className="px-4 py-0"
                                onDoubleClick={() => startEdit(job.id, col.key, job[col.key])}
                              >
                                <div className="flex items-center gap-2.5 min-w-0">
                                  <div className={cn(
                                    "w-[22px] h-[22px] rounded-[5px] flex items-center justify-center text-[9px] font-bold shrink-0",
                                    avatar.color,
                                  )}>
                                    {avatar.initials}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    {isEditing ? (
                                      <input
                                        autoFocus
                                        value={editValue}
                                        onChange={e => setEditValue(e.target.value)}
                                        onKeyDown={e => handleInputKeyDown(e, job.id, col.key)}
                                        onBlur={() => saveEdit(job.id, col.key)}
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
                            );
                          }

                          /* ── Status ── */
                          if (col.key === "status") {
                            return (
                              <td key={col.key} className="px-4 py-0" onClick={e => e.stopPropagation()}>
                                <Select value={job.status} onValueChange={v => updateJob(job.id, { status: v })}>
                                  <SelectTrigger className="h-auto w-auto border-0 p-0 bg-transparent hover:bg-transparent focus:ring-0 focus:ring-offset-0 shadow-none">
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
                            );
                          }

                          /* ── Updated ── */
                          if (col.key === "updated") {
                            return (
                              <td key={col.key} className="px-4 py-0 text-right">
                                <span className="text-[12px] tabular-nums text-muted-foreground/60">
                                  {formatDate(job.created_date)}
                                </span>
                              </td>
                            );
                          }

                          /* ── Salary ── */
                          if (col.key === "salary") {
                            return (
                              <td
                                key={col.key}
                                className="px-4 py-0 text-right"
                                onDoubleClick={() => startEdit(job.id, col.key, job[col.key])}
                              >
                                {isEditing ? (
                                  <input
                                    autoFocus
                                    value={editValue}
                                    onChange={e => setEditValue(e.target.value)}
                                    onKeyDown={e => handleInputKeyDown(e, job.id, col.key)}
                                    onBlur={() => saveEdit(job.id, col.key)}
                                    className="w-full bg-transparent border-none outline-none p-0 text-[12.5px] tabular-nums text-foreground text-right"
                                  />
                                ) : (
                                  <span className="text-[12.5px] tabular-nums text-muted-foreground">
                                    {condenseSalary(job.salary)}
                                  </span>
                                )}
                              </td>
                            );
                          }

                          /* ── Actions ── */
                          if (col.key === "actions") {
                            return (
                              <td key={col.key} className="px-3 py-0 text-center">
                                <DeleteJobButton jobId={job.id} jobTitle={job.company} onDeleteSuccess={removeJob} />
                              </td>
                            );
                          }

                          /* ── Default: Role, Location ── */
                          return (
                            <td
                              key={col.key}
                              className="px-4 py-0"
                              onDoubleClick={() => startEdit(job.id, col.key, job[col.key])}
                            >
                              <div className="flex items-center gap-1.5 min-w-0">
                                {col.key === "location" && !isEditing && job.location && (
                                  <MapPin className="w-3 h-3 shrink-0 text-muted-foreground/40" strokeWidth={1.5} />
                                )}
                                {isEditing ? (
                                  <input
                                    autoFocus
                                    value={editValue}
                                    onChange={e => setEditValue(e.target.value)}
                                    onKeyDown={e => handleInputKeyDown(e, job.id, col.key)}
                                    onBlur={() => saveEdit(job.id, col.key)}
                                    className="w-full bg-transparent border-none outline-none p-0 text-[13px] text-foreground"
                                  />
                                ) : (
                                  <span className={cn(
                                    "truncate block text-[13px]",
                                    col.key === "job_title"
                                      ? "text-foreground/80 font-medium"
                                      : "text-muted-foreground/70 font-normal",
                                    !job[col.key] && "text-muted-foreground/25",
                                  )}>
                                    {job[col.key] || "—"}
                                  </span>
                                )}
                              </div>
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* ── Mobile cards ─────────────────────────────────────────────── */}
            <div className="md:hidden divide-y divide-border/50">
              {filtered.map(job => {
                const avatar = getCompanyAvatar(job.company);
                return (
                  <div key={job.id} className="p-4 bg-card space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={cn("w-8 h-8 rounded-[6px] flex items-center justify-center text-[11px] font-bold shrink-0", avatar.color)}>
                          {avatar.initials}
                        </div>
                        <div className="min-w-0">
                          <h3 className="text-[14px] font-semibold text-foreground truncate leading-snug">{job.company}</h3>
                          <p className="text-[12.5px] text-foreground/70 truncate leading-snug">{job.job_title}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0" onClick={e => e.stopPropagation()}>
                        <Select value={job.status} onValueChange={v => updateJob(job.id, { status: v })}>
                          <SelectTrigger className="h-auto w-auto border-0 p-0 bg-transparent shadow-none focus:ring-0">
                            <StatusBadge status={job.status} />
                          </SelectTrigger>
                          <SelectContent className="bg-popover border-border">
                            {STATUS_ORDER.map(s => (
                              <SelectItem key={s} value={s} className="text-[12px]">
                                {STATUS_CONFIG[s].label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <DeleteJobButton jobId={job.id} jobTitle={job.company} onDeleteSuccess={removeJob} />
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-x-3 gap-y-1.5 text-[12px] text-muted-foreground">
                      {job.location && (
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3 opacity-50" /> {job.location}
                        </span>
                      )}
                      {job.salary && (
                        <span className="tabular-nums">{condenseSalary(job.salary)}</span>
                      )}
                      <span className="ml-auto tabular-nums opacity-60">{formatDate(job.created_date)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
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
          : "bg-transparent text-muted-foreground border-border/60 hover:bg-muted hover:text-foreground hover:border-border",
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
