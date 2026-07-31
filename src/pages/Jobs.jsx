import { useState, useEffect, useMemo, useRef } from "react";
import { useOutletContext } from "react-router-dom";
import { apiClient } from "@/api/client";
import {
  ArrowUpDown, ArrowUp, ArrowDown,
  Plus, MoreHorizontal,
  Pencil, Trash2, Copy, ExternalLink
} from "lucide-react";
import StatusBadge, { STATUS_ORDER, STATUS_CONFIG } from "@/components/StatusBadge";
import {
  Select, SelectContent, SelectItem, SelectTrigger,
} from "@/components/ui/select";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

// ─── Columns: exactly 6 data + 1 actions ─────────────────────────────────────
// Fixed pixel widths so nothing shifts regardless of content length
const COLS = [
  { key: "company",   label: "Company",  w: "w-[28%]", sort: true,  edit: true  },
  { key: "job_title", label: "Role",     w: "w-[22%]", sort: true,  edit: true  },
  { key: "location",  label: "Location", w: "w-[17%]", sort: true,  edit: true  },
  { key: "salary",    label: "Salary",   w: "w-[9%]",  sort: false, edit: true,  align: "right" },
  { key: "status",    label: "Status",   w: "w-[14%]", sort: true,  edit: false },
  { key: "source",    label: "Source",   w: "w-[7%]",  sort: false, edit: false },
  { key: "_actions",  label: "",         w: "w-[3%]",  sort: false, edit: false },
];

const EDIT_COLS = COLS.filter(c => c.edit).map(c => c.key);

// ─── Source lookup ────────────────────────────────────────────────────────────
const SOURCES = {
  linkedin:   { label: "LinkedIn",   cls: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20" },
  wellfound:  { label: "Wellfound",  cls: "bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20" },
  indeed:     { label: "Indeed",     cls: "bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-500/20" },
  glassdoor:  { label: "Glassdoor",  cls: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20" },
  naukri:     { label: "Naukri",     cls: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20" },
  referral:   { label: "Referral",   cls: "bg-fuchsia-500/10 text-fuchsia-600 dark:text-fuchsia-400 border-fuchsia-500/20" },
  careers:    { label: "Careers",    cls: "bg-muted/80 text-muted-foreground border-border/60" },
  unstop:     { label: "Unstop",     cls: "bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20" },
  screenshot: { label: "Screenshot", cls: "bg-muted/80 text-muted-foreground border-border/60" },
  other:      { label: "Other",      cls: "bg-muted/80 text-muted-foreground border-border/60" },
};

const resolveSource = (src) => {
  if (!src) return null;
  const k = src.toLowerCase().trim();
  return SOURCES[k] ?? { label: src.charAt(0).toUpperCase() + src.slice(1), cls: "bg-muted/80 text-muted-foreground border-border/60" };
};

// ─── Salary → single condensed token ─────────────────────────────────────────
const condenseSalary = (raw) => {
  if (!raw) return null;
  const s = raw.toString().trim();
  if (!s || /not\s*disclosed/i.test(s)) return null;

  let period = "";
  if (/\/(month|mo|monthly)/i.test(s))              period = "/mo";
  else if (/\/(year|yr|annual|annum|pa)/i.test(s))  period = "/yr";
  else if (/\/(hour|hr)/i.test(s))                  period = "/hr";

  const cur = (s.match(/[₹$€£¥]/) ?? [""])[0];

  if (/lpa/i.test(s)) {
    const m = s.replace(/,/g, "").match(/(\d+(?:\.\d+)?)/);
    return m ? `${cur}${parseFloat(m[1])}L` : null;
  }

  const m = s.replace(/,/g, "").match(/(\d+(?:\.\d+)?)/);
  if (!m) return s.length > 12 ? s.slice(0, 11) + "…" : s;

  const n = parseFloat(m[1]);
  if (n >= 1_000_000) return `${cur}${(n / 1_000_000).toFixed(1).replace(/\.0$/, "")}M${period}`;
  if (n >= 1_000)     return `${cur}${Math.round(n / 1_000)}k${period}`;
  return `${cur}${n}${period}`;
};

// ─── Deterministic company avatar ─────────────────────────────────────────────
const AVATAR_PALETTES = [
  "bg-violet-500/15 text-violet-600 dark:text-violet-300",
  "bg-blue-500/15   text-blue-600   dark:text-blue-300",
  "bg-emerald-500/15 text-emerald-600 dark:text-emerald-300",
  "bg-amber-500/15  text-amber-600  dark:text-amber-300",
  "bg-rose-500/15   text-rose-600   dark:text-rose-300",
  "bg-sky-500/15    text-sky-600    dark:text-sky-300",
  "bg-fuchsia-500/15 text-fuchsia-600 dark:text-fuchsia-300",
  "bg-teal-500/15   text-teal-600   dark:text-teal-300",
];

const avatar = (name) => {
  if (!name) return { initials: "?", cls: "bg-muted text-muted-foreground" };
  const h = name.split("").reduce((a, c) => c.charCodeAt(0) + ((a << 5) - a), 0);
  return {
    initials: name.substring(0, 2).toUpperCase(),
    cls: AVATAR_PALETTES[Math.abs(h) % AVATAR_PALETTES.length],
  };
};

// ─── Inline text cell ─────────────────────────────────────────────────────────
function EditableText({ isEditing, value, editValue, onChange, onKeyDown, onBlur, textCls }) {
  if (isEditing) {
    return (
      <input
        autoFocus
        value={editValue}
        onChange={e => onChange(e.target.value)}
        onKeyDown={onKeyDown}
        onBlur={onBlur}
        className="w-full bg-transparent border-none outline-none p-0 text-[13px] text-foreground"
      />
    );
  }
  return (
    <span className={cn("truncate block leading-none", textCls)}>
      {value || "—"}
    </span>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function Jobs() {
  const { searchQuery, openAddJob } = useOutletContext();
  const [jobs, setJobs]             = useState([]);
  const [loading, setLoading]       = useState(true);
  const [sortKey, setSortKey]       = useState("created_date");
  const [sortDir, setSortDir]       = useState("desc");
  const [statusFilter, setStatusFilter] = useState("all");
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [selectedRow, setSelectedRow]   = useState(null);
  const [editingCell, setEditingCell]   = useState(null); // { id, col }
  const [editValue, setEditValue]       = useState("");
  const tableRef = useRef(null);

  // ── Fetch ────────────────────────────────────────────────────────────────────
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const data = await apiClient.fetchApi("/jobs");
        if (alive) setJobs(data);
      } catch (e) { console.error("[Jobs]", e); }
      finally     { if (alive) setLoading(false); }
    })();
    return () => { alive = false; };
  }, []);

  // ── Computed list ─────────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    let r = [...jobs];
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      r = r.filter(j => [j.company, j.job_title, j.location, j.salary, j.source]
        .some(v => (v || "").toLowerCase().includes(q)));
    }
    if (statusFilter !== "all") r = r.filter(j => j.status === statusFilter);
    r.sort((a, b) => {
      const k = sortKey === "updated" ? "created_date" : sortKey;
      if ((a[k] || "") < (b[k] || "")) return sortDir === "asc" ? -1 :  1;
      if ((a[k] || "") > (b[k] || "")) return sortDir === "asc" ?  1 : -1;
      return 0;
    });
    return r;
  }, [jobs, searchQuery, statusFilter, sortKey, sortDir]);

  // ── CRUD ──────────────────────────────────────────────────────────────────────
  const updateJob = async (id, patch) => {
    setJobs(prev => prev.map(j => j.id === id ? { ...j, ...patch } : j));
    try { await apiClient.fetchApi(`/jobs/${id}`, { method: "PUT", body: JSON.stringify(patch) }); }
    catch (e) { console.error(e); }
  };

  const removeJob = async (id) => {
    try {
      await apiClient.fetchApi(`/jobs/${id}`, { method: "DELETE" });
      setJobs(prev => prev.filter(j => j.id !== id));
      toast.success("Job deleted");
    } catch (e) { toast.error("Failed to delete"); }
    finally { setDeleteTarget(null); }
  };

  const duplicateJob = async (job) => {
    try {
      const { id, created_date, ...rest } = job;
      const created = await apiClient.fetchApi("/jobs", {
        method: "POST", body: JSON.stringify({ ...rest, company: `${rest.company} (copy)` }),
      });
      setJobs(prev => [created, ...prev]);
      toast.success("Duplicated");
    } catch (e) { toast.error("Failed to duplicate"); }
  };

  // ── Edit ──────────────────────────────────────────────────────────────────────
  const startEdit = (id, col, val) => { setSelectedRow(id); setEditingCell({ id, col }); setEditValue(val || ""); };
  const saveEdit  = (id, col) => {
    const j = jobs.find(x => x.id === id);
    if (j && j[col] !== editValue) updateJob(id, { [col]: editValue });
    setEditingCell(null);
  };
  const cellEditing = (id, col) => editingCell?.id === id && editingCell?.col === col;

  const onInputKey = (e, id, col) => {
    if (e.key === "Enter")  { e.preventDefault(); saveEdit(id, col); return; }
    if (e.key === "Escape") { e.preventDefault(); setEditingCell(null); return; }
    if (e.key !== "Tab")    return;
    e.preventDefault();
    saveEdit(id, col);
    const ci = EDIT_COLS.indexOf(col);
    const ri = filtered.findIndex(j => j.id === id);
    if (!e.shiftKey) {
      if (ci < EDIT_COLS.length - 1) startEdit(id, EDIT_COLS[ci + 1], jobs.find(j => j.id === id)?.[EDIT_COLS[ci + 1]]);
      else if (ri < filtered.length - 1) { const nid = filtered[ri + 1].id; startEdit(nid, EDIT_COLS[0], jobs.find(j => j.id === nid)?.[EDIT_COLS[0]]); }
    } else {
      if (ci > 0) startEdit(id, EDIT_COLS[ci - 1], jobs.find(j => j.id === id)?.[EDIT_COLS[ci - 1]]);
      else if (ri > 0) { const nid = filtered[ri - 1].id; const lc = EDIT_COLS[EDIT_COLS.length - 1]; startEdit(nid, lc, jobs.find(j => j.id === nid)?.[lc]); }
    }
  };

  // ── Keyboard nav ──────────────────────────────────────────────────────────────
  useEffect(() => {
    const handler = (e) => {
      if (!selectedRow || editingCell) return;
      const idx = filtered.findIndex(j => j.id === selectedRow);
      if (e.key === "ArrowDown" && idx < filtered.length - 1) { e.preventDefault(); setSelectedRow(filtered[idx + 1].id); }
      if (e.key === "ArrowUp"   && idx > 0)                   { e.preventDefault(); setSelectedRow(filtered[idx - 1].id); }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [selectedRow, editingCell, filtered]);

  // ── Sort icon ─────────────────────────────────────────────────────────────────
  const SortIcon = ({ k }) => {
    if (sortKey !== k) return <ArrowUpDown className="inline w-2.5 h-2.5 ml-1 opacity-0 group-hover:opacity-35 transition-opacity" strokeWidth={1.5} />;
    return sortDir === "asc"
      ? <ArrowUp   className="inline w-2.5 h-2.5 ml-1 opacity-50" strokeWidth={1.5} />
      : <ArrowDown className="inline w-2.5 h-2.5 ml-1 opacity-50" strokeWidth={1.5} />;
  };

  // ── Status counts ─────────────────────────────────────────────────────────────
  const counts = {};
  jobs.forEach(j => { counts[j.status] = (counts[j.status] || 0) + 1; });

  // ── Skeleton ──────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="px-6 lg:px-8 py-7 w-full">
        <div className="mb-5 h-6 w-16"><Skeleton className="h-full w-full rounded" /></div>
        <div className="mb-4 flex gap-1.5">
          {[48, 64, 60, 56, 72].map(w => <Skeleton key={w} className={`h-7 rounded-md`} style={{ width: w }} />)}
        </div>
        <div className="rounded-[8px] border border-border/60 overflow-hidden">
          <div className="h-9 bg-muted/15 border-b border-border/60" />
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className="h-[44px] flex items-center px-4 gap-4 border-b border-border/40 last:border-0">
              <Skeleton className="w-6 h-6 rounded-[5px] shrink-0" />
              <Skeleton className="h-3 w-[18%]" />
              <Skeleton className="h-3 w-[16%] opacity-70" />
              <Skeleton className="h-3 w-[12%] opacity-60" />
              <Skeleton className="h-3 w-[7%] ml-auto opacity-40" />
              <Skeleton className="h-5 w-[80px] rounded-full opacity-60" />
              <Skeleton className="h-5 w-14 rounded opacity-40" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div
      className="flex flex-col min-h-full px-6 lg:px-8 py-7 w-full max-w-full"
      onClick={() => setSelectedRow(null)}
    >
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between mb-5 shrink-0">
        <h1 className="text-[19px] font-semibold tracking-tight text-foreground">Jobs</h1>
      </div>

      {/* ── Filter chips ───────────────────────────────────────────────────── */}
      <div className="flex flex-wrap gap-1.5 mb-4 shrink-0" onClick={e => e.stopPropagation()}>
        <Chip active={statusFilter === "all"} onClick={() => setStatusFilter("all")} count={jobs.length}>All</Chip>
        {STATUS_ORDER.filter(s => counts[s] > 0).map(s => (
          <Chip key={s} active={statusFilter === s} onClick={() => setStatusFilter(s)} count={counts[s]}>
            {STATUS_CONFIG[s].label}
          </Chip>
        ))}
      </div>

      {/* ── Table container ────────────────────────────────────────────────── */}
      <div
        className="overflow-x-auto rounded-[8px] border border-border/60 bg-card"
        onClick={e => e.stopPropagation()}
      >
        {filtered.length === 0 ? (
          /* Empty state */
          <div className="flex flex-col items-center justify-center h-52 gap-3">
            <p className="text-[13px] text-muted-foreground">No jobs match your criteria.</p>
            <button
              onClick={openAddJob}
              className="inline-flex items-center gap-1.5 h-8 px-3.5 rounded-md bg-primary text-primary-foreground text-[12.5px] font-medium hover:opacity-90 transition-opacity"
            >
              <Plus className="w-3.5 h-3.5" strokeWidth={2} /> Add Job
            </button>
          </div>
        ) : (
          <>
            {/* ── Desktop table ─────────────────────────────────────────── */}
            <div className="hidden md:block min-w-[780px]">
              <table className="w-full text-left table-fixed" ref={tableRef}>

                {/* thead */}
                <thead>
                  <tr className="border-b border-border/60">
                    {COLS.map(col => (
                      <th
                        key={col.key}
                        onClick={() => col.sort && (sortKey === col.key ? setSortDir(d => d === "asc" ? "desc" : "asc") : (setSortKey(col.key), setSortDir("asc")))}
                        className={cn(
                          col.w,
                          "group px-4 py-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/45 select-none bg-muted/10",
                          col.align === "right" && "text-right",
                          col.sort && "cursor-pointer hover:text-muted-foreground/70 transition-colors",
                        )}
                      >
                        {col.label}
                        {col.sort && <SortIcon k={col.key} />}
                      </th>
                    ))}
                  </tr>
                </thead>

                {/* tbody */}
                <tbody>
                  {filtered.map(job => {
                    const av  = avatar(job.company);
                    const src = resolveSource(job.source);
                    const sal = condenseSalary(job.salary);
                    const sel = selectedRow === job.id;

                    return (
                      <tr
                        key={job.id}
                        onClick={() => setSelectedRow(job.id)}
                        className={cn(
                          "group h-[44px] border-b border-border/35 last:border-0 cursor-pointer select-none",
                          "transition-colors duration-75",
                          sel ? "bg-accent/40" : "hover:bg-muted/20",
                        )}
                      >
                        {/* Company */}
                        <td
                          className="px-4 py-0"
                          onDoubleClick={() => startEdit(job.id, "company", job.company)}
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            {/* Avatar */}
                            <div className={cn(
                              "shrink-0 w-[24px] h-[24px] rounded-[5px] flex items-center justify-center text-[9px] font-bold",
                              av.cls,
                            )}>
                              {av.initials}
                            </div>
                            <div className="flex-1 min-w-0">
                              {cellEditing(job.id, "company") ? (
                                <input autoFocus value={editValue}
                                  onChange={e => setEditValue(e.target.value)}
                                  onKeyDown={e => onInputKey(e, job.id, "company")}
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
                          {cellEditing(job.id, "job_title") ? (
                            <input autoFocus value={editValue}
                              onChange={e => setEditValue(e.target.value)}
                              onKeyDown={e => onInputKey(e, job.id, "job_title")}
                              onBlur={() => saveEdit(job.id, "job_title")}
                              className="w-full bg-transparent border-none outline-none p-0 text-[13px] text-foreground"
                            />
                          ) : (
                            <span className="text-[13px] text-foreground/70 font-medium truncate block leading-none">
                              {job.job_title || "—"}
                            </span>
                          )}
                        </td>

                        {/* Location */}
                        <td
                          className="px-4 py-0"
                          onDoubleClick={() => startEdit(job.id, "location", job.location)}
                        >
                          {cellEditing(job.id, "location") ? (
                            <input autoFocus value={editValue}
                              onChange={e => setEditValue(e.target.value)}
                              onKeyDown={e => onInputKey(e, job.id, "location")}
                              onBlur={() => saveEdit(job.id, "location")}
                              className="w-full bg-transparent border-none outline-none p-0 text-[12.5px] text-foreground"
                            />
                          ) : (
                            <span className="text-[12.5px] text-muted-foreground/60 truncate block leading-none">
                              {job.location || "—"}
                            </span>
                          )}
                        </td>

                        {/* Salary */}
                        <td
                          className="px-4 py-0 text-right"
                          onDoubleClick={() => startEdit(job.id, "salary", job.salary)}
                        >
                          {cellEditing(job.id, "salary") ? (
                            <input autoFocus value={editValue}
                              onChange={e => setEditValue(e.target.value)}
                              onKeyDown={e => onInputKey(e, job.id, "salary")}
                              onBlur={() => saveEdit(job.id, "salary")}
                              className="w-full bg-transparent border-none outline-none p-0 text-[12.5px] text-foreground text-right tabular-nums"
                            />
                          ) : (
                            <span className={cn(
                              "text-[12.5px] tabular-nums font-medium leading-none",
                              sal ? "text-muted-foreground/75" : "text-muted-foreground/25",
                            )}>
                              {sal ?? "—"}
                            </span>
                          )}
                        </td>

                        {/* Status — fixed-width pill, no resize */}
                        <td className="px-4 py-0" onClick={e => e.stopPropagation()}>
                          <Select value={job.status} onValueChange={v => updateJob(job.id, { status: v })}>
                            <SelectTrigger className="h-auto w-auto border-0 p-0 bg-transparent hover:bg-transparent focus:ring-0 focus:ring-offset-0 shadow-none [&>svg]:hidden">
                              <StatusBadge status={job.status} showChevron />
                            </SelectTrigger>
                            <SelectContent className="bg-popover border-border">
                              {STATUS_ORDER.map(s => (
                                <SelectItem key={s} value={s} className="text-[12px] text-popover-foreground focus:bg-muted">
                                  {STATUS_CONFIG[s].label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </td>

                        {/* Source badge */}
                        <td className="px-4 py-0">
                          {src ? (
                            <span className={cn(
                              "inline-block text-[10px] font-semibold tracking-wide px-1.5 py-0.5 rounded-[4px] border truncate max-w-full leading-tight",
                              src.cls,
                            )}>
                              {src.label}
                            </span>
                          ) : (
                            <span className="text-muted-foreground/20 text-[12px]">—</span>
                          )}
                        </td>

                        {/* Actions */}
                        <td className="px-2 py-0" onClick={e => e.stopPropagation()}>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <button
                                className={cn(
                                  "w-6 h-6 rounded flex items-center justify-center",
                                  "text-muted-foreground/25 hover:text-foreground hover:bg-muted",
                                  "transition-all duration-100",
                                  "opacity-0 group-hover:opacity-100 focus:opacity-100 focus:outline-none",
                                )}
                              >
                                <MoreHorizontal className="w-3.5 h-3.5" strokeWidth={2} />
                              </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" sideOffset={4} className="w-40 bg-popover border-border">
                              <DropdownMenuItem className="text-[12px] gap-2 cursor-pointer" onSelect={() => startEdit(job.id, "company", job.company)}>
                                <Pencil className="w-3 h-3 opacity-50" /> Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem className="text-[12px] gap-2 cursor-pointer" onSelect={() => duplicateJob(job)}>
                                <Copy className="w-3 h-3 opacity-50" /> Duplicate
                              </DropdownMenuItem>
                              {job.job_url && (
                                <DropdownMenuItem className="text-[12px] gap-2 cursor-pointer" onSelect={() => window.open(job.job_url, "_blank")}>
                                  <ExternalLink className="w-3 h-3 opacity-50" /> Open URL
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className="text-[12px] gap-2 cursor-pointer text-destructive focus:text-destructive focus:bg-destructive/10"
                                onSelect={() => setDeleteTarget({ id: job.id, company: job.company })}
                              >
                                <Trash2 className="w-3 h-3" /> Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {/* Row count footer */}
              <div className="px-4 py-2 border-t border-border/40 flex items-center">
                <span className="text-[11px] text-muted-foreground/40 tabular-nums">
                  {filtered.length} {filtered.length === 1 ? "job" : "jobs"}
                  {statusFilter !== "all" && " · filtered"}
                </span>
              </div>
            </div>

            {/* ── Mobile cards ───────────────────────────────────────────── */}
            <div className="md:hidden divide-y divide-border/40">
              {filtered.map(job => {
                const av  = avatar(job.company);
                const src = resolveSource(job.source);
                const sal = condenseSalary(job.salary);
                return (
                  <div key={job.id} className="px-4 py-3.5 hover:bg-muted/15 transition-colors cursor-pointer">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={cn("shrink-0 w-8 h-8 rounded-[7px] flex items-center justify-center text-[11px] font-bold", av.cls)}>
                        {av.initials}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="text-[13px] font-semibold text-foreground truncate leading-snug">{job.company}</p>
                            <p className="text-[12px] text-foreground/60 truncate leading-snug">{job.job_title}</p>
                          </div>
                          <div onClick={e => e.stopPropagation()} className="shrink-0 flex items-center gap-2">
                            <Select value={job.status} onValueChange={v => updateJob(job.id, { status: v })}>
                              <SelectTrigger className="h-auto w-auto border-0 p-0 bg-transparent shadow-none focus:ring-0 [&>svg]:hidden">
                                <StatusBadge status={job.status} />
                              </SelectTrigger>
                              <SelectContent className="bg-popover border-border">
                                {STATUS_ORDER.map(s => <SelectItem key={s} value={s} className="text-[12px]">{STATUS_CONFIG[s].label}</SelectItem>)}
                              </SelectContent>
                            </Select>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <button className="w-7 h-7 rounded flex items-center justify-center text-muted-foreground/40 hover:text-foreground hover:bg-muted transition-colors">
                                  <MoreHorizontal className="w-4 h-4" strokeWidth={1.8} />
                                </button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-40 bg-popover border-border">
                                <DropdownMenuItem className="text-[12px] gap-2" onSelect={() => duplicateJob(job)}><Copy className="w-3 h-3 opacity-50" />Duplicate</DropdownMenuItem>
                                {job.job_url && <DropdownMenuItem className="text-[12px] gap-2" onSelect={() => window.open(job.job_url, "_blank")}><ExternalLink className="w-3 h-3 opacity-50" />Open URL</DropdownMenuItem>}
                                <DropdownMenuSeparator />
                                <DropdownMenuItem className="text-[12px] gap-2 text-destructive focus:text-destructive focus:bg-destructive/10" onSelect={() => setDeleteTarget({ id: job.id, company: job.company })}><Trash2 className="w-3 h-3" />Delete</DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>
                        <div className="flex items-center gap-2.5 mt-1.5 flex-wrap">
                          {job.location && <span className="text-[11.5px] text-muted-foreground/50">{job.location}</span>}
                          {sal && <span className="text-[11.5px] tabular-nums text-muted-foreground/50">{sal}</span>}
                          {src && <span className={cn("text-[10px] font-semibold px-1.5 py-0.5 rounded border", src.cls)}>{src.label}</span>}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* ── Delete confirmation ────────────────────────────────────────────── */}
      <AlertDialog open={!!deleteTarget} onOpenChange={open => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this job?</AlertDialogTitle>
            <AlertDialogDescription>
              Permanently remove <strong className="text-foreground">{deleteTarget?.company}</strong>. This cannot be undone.
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

// ─── FilterChip ───────────────────────────────────────────────────────────────
function Chip({ children, active, onClick, count }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1.5 h-7 px-2.5 rounded-md text-[11.5px] font-medium transition-colors duration-100 border",
        active
          ? "bg-foreground text-background border-foreground/80"
          : "bg-transparent text-muted-foreground border-border/50 hover:bg-muted hover:text-foreground hover:border-border/80",
      )}
    >
      {children}
      {count > 0 && (
        <span className={cn("tabular-nums text-[10px]", active ? "opacity-65" : "opacity-40")}>
          {count}
        </span>
      )}
    </button>
  );
}
