import { useState, useMemo, useRef, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useOutletContext } from "react-router-dom";
import { apiClient } from "@/api/client";
import {
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Plus,
  MoreHorizontal,
  Pencil,
  Trash2,
  Copy,
  ExternalLink,
  Search,
  ChevronDown,
  ChevronUp,
  Clock,
  GripVertical,
  Image as ImageIcon,
  MapPin,
  Building2,
  MoreVertical,
  Edit2,
  AlertCircle,
  FileText,
  Inbox,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { memo } from "react";
import StatusBadge, {
  STATUS_ORDER,
  STATUS_CONFIG,
} from "@/components/StatusBadge";
import SourceBadge from "@/components/SourceBadge";
import CompanyAvatar from "@/components/CompanyAvatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
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

// ─── Columns: exactly 6 data + 1 actions ─────────────────────────────────────
// Fixed pixel widths so nothing shifts regardless of content length
const COLS = [
  { key: "company", label: "Company", w: "w-[25%]", sort: true, edit: true },
  { key: "job_title", label: "Role", w: "w-[22%]", sort: true, edit: true },
  { key: "location", label: "Location", w: "w-[16%]", sort: true, edit: true },
  {
    key: "salary",
    label: "Salary",
    w: "w-[10%]",
    sort: false,
    edit: true,
    align: "right",
  },
  { key: "status", label: "Status", w: "w-[12%]", sort: true, edit: false },
  { key: "source", label: "Source", w: "w-[11%]", sort: false, edit: false },
  { key: "_actions", label: "", w: "w-[4%]", sort: false, edit: false },
];

const EDIT_COLS = COLS.filter((c) => c.edit).map((c) => c.key);

// ─── Salary → single condensed token ─────────────────────────────────────────
const condenseSalary = (raw) => {
  if (!raw) return null;
  const s = raw.toString().trim();
  if (!s || /not\s*disclosed/i.test(s)) return null;

  let period = "";
  if (/\/(month|mo|monthly)/i.test(s)) period = "/mo";
  else if (/\/(year|yr|annual|annum|pa)/i.test(s)) period = "/yr";
  else if (/\/(hour|hr)/i.test(s)) period = "/hr";

  const cur = (s.match(/[₹$€£¥]/) ?? [""])[0];

  if (/lpa/i.test(s)) {
    const m = s.replace(/,/g, "").match(/(\d+(?:\.\d+)?)/);
    return m ? `${cur}${parseFloat(m[1])}L` : null;
  }

  const m = s.replace(/,/g, "").match(/(\d+(?:\.\d+)?)/);
  if (!m) return s.length > 12 ? s.slice(0, 11) + "…" : s;

  const n = parseFloat(m[1]);
  if (n >= 1_000_000)
    return `${cur}${(n / 1_000_000).toFixed(1).replace(/\.0$/, "")}M${period}`;
  if (n >= 1_000) return `${cur}${Math.round(n / 1_000)}k${period}`;
  return `${cur}${n}${period}`;
};

// ─── Inline text cell ─────────────────────────────────────────────────────────
function EditableText({
  isEditing,
  value,
  editValue,
  onChange,
  onKeyDown,
  onBlur,
  textCls,
}) {
  if (isEditing) {
    return (
      <input
        autoFocus
        value={editValue}
        onChange={(e) => onChange(e.target.value)}
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
  const queryClient = useQueryClient();
  const { data: jobs = [], isLoading: loading } = useQuery({
    queryKey: ["jobs"],
    queryFn: () => apiClient.fetchApi("/jobs"),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  const [sortKey, setSortKey] = useState("created_date");
  const [sortDir, setSortDir] = useState("desc");
  const [statusFilter, setStatusFilter] = useState("all");
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [selectedRow, setSelectedRow] = useState(null);
  const [editingCell, setEditingCell] = useState(null); // { id, col }
  const [editValue, setEditValue] = useState("");
  const tableRef = useRef(null);

  // ── Computed list ─────────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    let r = [...jobs];
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      r = r.filter((j) =>
        [j.company, j.job_title, j.location, j.salary, j.source, j.status].some(
          (v) => (v || "").toLowerCase().includes(q),
        ),
      );
    }
    if (statusFilter !== "all") r = r.filter((j) => j.status === statusFilter);
    r.sort((a, b) => {
      const k = sortKey === "updated" ? "created_date" : sortKey;
      if ((a[k] || "") < (b[k] || "")) return sortDir === "asc" ? -1 : 1;
      if ((a[k] || "") > (b[k] || "")) return sortDir === "asc" ? 1 : -1;
      return 0;
    });
    return r;
  }, [jobs, searchQuery, statusFilter, sortKey, sortDir]);

  // ── CRUD Mutations ────────────────────────────────────────────────────────────
  const updateMutation = useMutation({
    mutationFn: ({ id, patch }) =>
      apiClient.fetchApi(`/jobs/${id}`, {
        method: "PUT",
        body: JSON.stringify(patch),
      }),
    onMutate: async ({ id, patch }) => {
      await queryClient.cancelQueries({ queryKey: ["jobs"] });
      const previousJobs = queryClient.getQueryData(["jobs"]);
      queryClient.setQueryData(
        ["jobs"],
        (old) => old?.map((j) => (j.id === id ? { ...j, ...patch } : j)) || [],
      );
      return { previousJobs };
    },
    onError: (err, newTodo, context) => {
      queryClient.setQueryData(["jobs"], context.previousJobs);
      toast.error("Failed to update job");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["jobs"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => apiClient.fetchApi(`/jobs/${id}`, { method: "DELETE" }),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ["jobs"] });
      const previousJobs = queryClient.getQueryData(["jobs"]);
      queryClient.setQueryData(
        ["jobs"],
        (old) => old?.filter((j) => j.id !== id) || [],
      );
      return { previousJobs };
    },
    onError: (err, id, context) => {
      queryClient.setQueryData(["jobs"], context.previousJobs);
      toast.error("Failed to delete job");
    },
    onSuccess: () => {
      toast.success("Job deleted");
      setDeleteTarget(null);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["jobs"] });
    },
  });

  const duplicateMutation = useMutation({
    mutationFn: (job) => {
      const { id, created_date, ...rest } = job;
      return apiClient.fetchApi("/jobs", {
        method: "POST",
        body: JSON.stringify({ ...rest, company: `${rest.company} (copy)` }),
      });
    },
    onSuccess: (created) => {
      queryClient.setQueryData(["jobs"], (old) => [created, ...(old || [])]);
      toast.success("Duplicated");
    },
    onError: () => toast.error("Failed to duplicate"),
  });

  const updateJob = (id, patch) => updateMutation.mutate({ id, patch });
  const removeJob = (id) => deleteMutation.mutate(id);
  const duplicateJob = (job) => duplicateMutation.mutate(job);

  // ── Edit ──────────────────────────────────────────────────────────────────────
  const startEdit = (id, col, val) => {
    setSelectedRow(id);
    setEditingCell({ id, col });
    setEditValue(val || "");
  };
  const saveEdit = (id, col) => {
    const j = jobs.find((x) => x.id === id);
    if (j && j[col] !== editValue) updateJob(id, { [col]: editValue });
    setEditingCell(null);
  };
  const cellEditing = (id, col) =>
    editingCell?.id === id && editingCell?.col === col;

  const onInputKey = (e, id, col) => {
    if (e.key === "Enter") {
      e.preventDefault();
      saveEdit(id, col);
      return;
    }
    if (e.key === "Escape") {
      e.preventDefault();
      setEditingCell(null);
      return;
    }
    if (e.key !== "Tab") return;
    e.preventDefault();
    saveEdit(id, col);
    const ci = EDIT_COLS.indexOf(col);
    const ri = filtered.findIndex((j) => j.id === id);
    if (!e.shiftKey) {
      if (ci < EDIT_COLS.length - 1)
        startEdit(
          id,
          EDIT_COLS[ci + 1],
          jobs.find((j) => j.id === id)?.[EDIT_COLS[ci + 1]],
        );
      else if (ri < filtered.length - 1) {
        const nid = filtered[ri + 1].id;
        startEdit(
          nid,
          EDIT_COLS[0],
          jobs.find((j) => j.id === nid)?.[EDIT_COLS[0]],
        );
      }
    } else {
      if (ci > 0)
        startEdit(
          id,
          EDIT_COLS[ci - 1],
          jobs.find((j) => j.id === id)?.[EDIT_COLS[ci - 1]],
        );
      else if (ri > 0) {
        const nid = filtered[ri - 1].id;
        const lc = EDIT_COLS[EDIT_COLS.length - 1];
        startEdit(nid, lc, jobs.find((j) => j.id === nid)?.[lc]);
      }
    }
  };

  // ── Keyboard nav ──────────────────────────────────────────────────────────────
  useEffect(() => {
    const handler = (e) => {
      if (!selectedRow || editingCell) return;
      const idx = filtered.findIndex((j) => j.id === selectedRow);
      if (e.key === "ArrowDown" && idx < filtered.length - 1) {
        e.preventDefault();
        setSelectedRow(filtered[idx + 1].id);
      }
      if (e.key === "ArrowUp" && idx > 0) {
        e.preventDefault();
        setSelectedRow(filtered[idx - 1].id);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [selectedRow, editingCell, filtered]);

  // ── Sort icon ─────────────────────────────────────────────────────────────────
  const SortIcon = ({ k }) => {
    if (sortKey !== k)
      return (
        <ArrowUpDown
          className="inline w-2.5 h-2.5 ml-1 opacity-0 group-hover:opacity-35 transition-opacity"
          strokeWidth={1.5}
        />
      );
    return sortDir === "asc" ? (
      <ArrowUp
        className="inline w-2.5 h-2.5 ml-1 opacity-50"
        strokeWidth={1.5}
      />
    ) : (
      <ArrowDown
        className="inline w-2.5 h-2.5 ml-1 opacity-50"
        strokeWidth={1.5}
      />
    );
  };

  // ── Status counts ─────────────────────────────────────────────────────────────
  const counts = {};
  jobs.forEach((j) => {
    counts[j.status] = (counts[j.status] || 0) + 1;
  });

  // ── Skeleton ──────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="px-6 lg:px-8 py-7 w-full flex flex-col h-full">
        <div className="mb-5 h-6 w-16">
          <Skeleton className="h-full w-full rounded" />
        </div>
        <div className="mb-4 flex gap-1.5">
          {[48, 64, 60, 56, 72].map((w) => (
            <Skeleton key={w} className="h-7 rounded-md" style={{ width: w }} />
          ))}
        </div>
        <div className="rounded-[8px] border border-border/60 overflow-hidden bg-card flex-1">
          <div className="h-9 bg-muted/10 border-b border-border/60 flex items-center px-4 gap-4">
            {COLS.map((c) => (
              <Skeleton key={c.key} className={cn("h-3", c.w)} />
            ))}
          </div>
          {Array.from({ length: 12 }).map((_, i) => (
            <div
              key={i}
              className="h-10 flex items-center px-4 gap-4 border-b border-border/40 last:border-0"
            >
              <div className={cn("flex items-center gap-2", COLS[0].w)}>
                <Skeleton className="w-6 h-6 rounded-[5px] shrink-0" />
                <Skeleton className="h-3 w-2/3" />
              </div>
              <Skeleton className={cn("h-3 opacity-70", COLS[1].w)} />
              <Skeleton className={cn("h-3 opacity-60", COLS[2].w)} />
              <div className={cn("flex justify-end", COLS[3].w)}>
                <Skeleton className="h-3 w-1/2 opacity-40" />
              </div>
              <Skeleton
                className={cn("h-5 rounded-full opacity-60", COLS[4].w)}
              />
              <Skeleton className={cn("h-5 rounded opacity-40", COLS[5].w)} />
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
        <h1 className="text-[19px] font-semibold tracking-tight text-foreground">
          Jobs
        </h1>
      </div>

      {/* ── Filter chips ───────────────────────────────────────────────────── */}
      <div
        className="flex flex-wrap gap-1.5 mb-4 shrink-0"
        onClick={(e) => e.stopPropagation()}
      >
        <Chip
          active={statusFilter === "all"}
          onClick={() => setStatusFilter("all")}
          count={jobs.length}
        >
          All
        </Chip>
        {STATUS_ORDER.filter((s) => counts[s] > 0).map((s) => (
          <Chip
            key={s}
            active={statusFilter === s}
            onClick={() => setStatusFilter(s)}
            count={counts[s]}
          >
            {STATUS_CONFIG[s].label}
          </Chip>
        ))}
      </div>

      {/* ── Table container ────────────────────────────────────────────────── */}
      <div
        className="overflow-x-auto rounded-[8px] border border-border/60 bg-card"
        onClick={(e) => e.stopPropagation()}
      >
        {filtered.length === 0 ? (
          /* Empty state */
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center h-64 gap-4 text-center"
          >
            <div className="w-12 h-12 rounded-full bg-muted/30 flex items-center justify-center mb-1">
              <Inbox
                className="w-5 h-5 text-muted-foreground/60"
                strokeWidth={1.5}
              />
            </div>
            <div>
              <p className="text-[14px] font-medium text-foreground">
                No jobs found
              </p>
              <p className="text-[13px] text-muted-foreground mt-1">
                Try adjusting your filters or add a new job to track.
              </p>
            </div>
            <button
              onClick={openAddJob}
              className="inline-flex items-center gap-1.5 h-8 px-4 mt-2 rounded-md bg-primary text-primary-foreground text-[12.5px] font-medium hover:opacity-90 transition-opacity shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" strokeWidth={2} /> Add Job
            </button>
          </motion.div>
        ) : (
          <>
            {/* ── Desktop table ─────────────────────────────────────────── */}
            <div className="hidden md:block min-w-[780px]">
              <table className="w-full text-left table-fixed" ref={tableRef}>
                {/* thead */}
                <thead>
                  <tr className="border-b border-border/60">
                    {COLS.map((col) => (
                      <th
                        key={col.key}
                        onClick={() =>
                          col.sort &&
                          (sortKey === col.key
                            ? setSortDir((d) => (d === "asc" ? "desc" : "asc"))
                            : (setSortKey(col.key), setSortDir("asc")))
                        }
                        className={cn(
                          col.w,
                          "group px-3 py-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/45 select-none bg-muted/10",
                          col.align === "right" && "text-right",
                          col.sort &&
                            "cursor-pointer hover:text-muted-foreground/70 transition-colors",
                        )}
                      >
                        {col.label}
                        {col.sort && <SortIcon k={col.key} />}
                      </th>
                    ))}
                  </tr>
                </thead>

                {/* tbody */}
                <tbody className="align-middle">
                  <AnimatePresence initial={false}>
                    {filtered.map((job) => (
                      <JobTableRow
                        key={job.id}
                        job={job}
                        sal={condenseSalary(job.salary)}
                        sel={selectedRow === job.id}
                        cellEditing={cellEditing}
                        editValue={editValue}
                        setEditValue={setEditValue}
                        startEdit={startEdit}
                        onInputKey={onInputKey}
                        saveEdit={saveEdit}
                        setSelectedRow={setSelectedRow}
                        updateJob={updateJob}
                        duplicateJob={duplicateJob}
                        setDeleteTarget={setDeleteTarget}
                      />
                    ))}
                  </AnimatePresence>
                </tbody>
              </table>

              {/* Row count & Hints footer */}
              <div className="px-4 py-3 border-t border-border/40 flex items-center justify-between bg-muted/5 rounded-b-[8px]">
                <div className="flex items-center gap-3 text-[12px] text-muted-foreground/60 font-medium tracking-tight">
                  <span className="flex items-center gap-1.5"><Pencil className="w-3 h-3 opacity-70" /> Double-click any cell to edit</span>
                  <span className="opacity-30">•</span>
                  <span>Click company to open job posting</span>
                  <span className="opacity-30">•</span>
                  <span>Use ⋯ for more actions</span>
                  <span className="opacity-30">•</span>
                  <span>Press <kbd className="font-sans px-1.5 py-0.5 bg-muted rounded border border-border/50 text-[10px]">Enter</kbd> to edit</span>
                </div>
                <span className="text-[11.5px] text-muted-foreground/40 tabular-nums font-medium">
                  {filtered.length} {filtered.length === 1 ? "job" : "jobs"}
                  {statusFilter !== "all" && " · filtered"}
                </span>
              </div>
            </div>

            {/* ── Mobile cards ───────────────────────────────────────────── */}
            <div className="md:hidden divide-y divide-border/40">
              <AnimatePresence initial={false}>
                {filtered.map((job) => {
                  const sal = condenseSalary(job.salary);
                  return (
                    <motion.div
                      key={job.id}
                      layout
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.2 }}
                      className="px-4 py-3.5 hover:bg-muted/15 transition-colors cursor-pointer"
                      onClick={(e) => {
                        if (job.job_url) {
                          window.open(job.job_url, "_blank");
                        }
                      }}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <CompanyAvatar
                          company={job.company}
                          logo={job.logo}
                          size={32}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <p
                                className={cn(
                                  "text-[13px] font-semibold text-foreground truncate leading-snug",
                                  job.job_url &&
                                    "hover:underline hover:text-primary transition-colors",
                                )}
                              >
                                {job.company}
                              </p>
                              <p
                                className={cn(
                                  "text-[12px] text-foreground/60 font-medium truncate leading-snug",
                                  job.job_url &&
                                    "hover:underline hover:text-primary transition-colors",
                                )}
                              >
                                {job.job_title}
                              </p>
                            </div>
                            <div
                              onClick={(e) => e.stopPropagation()}
                              className="shrink-0 flex items-center gap-2"
                            >
                              <Select
                                value={job.status}
                                onValueChange={(v) =>
                                  updateJob(job.id, { status: v })
                                }
                              >
                                <SelectTrigger className="h-auto w-auto border-0 p-0 bg-transparent shadow-none focus:ring-0 [&>svg]:hidden">
                                  <StatusBadge status={job.status} />
                                </SelectTrigger>
                                <SelectContent className="bg-popover border-border">
                                  {STATUS_ORDER.map((s) => (
                                    <SelectItem
                                      key={s}
                                      value={s}
                                      className="text-[12px]"
                                    >
                                      {STATUS_CONFIG[s].label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <button
                                    aria-label="Job actions"
                                    className="w-7 h-7 rounded flex items-center justify-center text-muted-foreground/40 hover:text-foreground hover:bg-muted transition-colors"
                                  >
                                    <MoreHorizontal
                                      className="w-4 h-4"
                                      strokeWidth={1.8}
                                    />
                                  </button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent
                                  align="end"
                                  className="w-40 bg-popover border-border"
                                >
                                  <DropdownMenuItem
                                    className="text-[12px] gap-2 cursor-pointer"
                                    onSelect={() =>
                                      startEdit(job.id, "company", job.company)
                                    }
                                  >
                                    <Pencil className="w-3 h-3 opacity-50" />
                                    Edit
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    className="text-[12px] gap-2 cursor-pointer"
                                    onSelect={() => duplicateJob(job)}
                                  >
                                    <Copy className="w-3 h-3 opacity-50" />
                                    Duplicate
                                  </DropdownMenuItem>
                                  {job.job_url && (
                                    <DropdownMenuItem
                                      className="text-[12px] gap-2 cursor-pointer"
                                      onSelect={() =>
                                        window.open(job.job_url, "_blank")
                                      }
                                    >
                                      <ExternalLink className="w-3 h-3 opacity-50" />
                                      Open URL
                                    </DropdownMenuItem>
                                  )}
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    className="text-[12px] gap-2 cursor-pointer text-destructive focus:text-destructive focus:bg-destructive/10"
                                    onSelect={() =>
                                      setDeleteTarget({
                                        id: job.id,
                                        company: job.company,
                                      })
                                    }
                                  >
                                    <Trash2 className="w-3 h-3" />
                                    Delete
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </div>
                          <div className="flex items-center gap-2.5 mt-1.5 flex-wrap">
                            {job.location && (
                              <span className="text-[11.5px] text-muted-foreground/50">
                                {job.location}
                              </span>
                            )}
                            {sal && (
                              <span className="text-[11.5px] tabular-nums text-muted-foreground/50">
                                {sal}
                              </span>
                            )}
                            {job.source && (
                              <div className="scale-90 origin-left">
                                <SourceBadge source={job.source} />
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          </>
        )}
      </div>

      {/* ── Delete confirmation ────────────────────────────────────────────── */}
      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this job?</AlertDialogTitle>
            <AlertDialogDescription>
              Permanently remove{" "}
              <strong className="text-foreground">
                {deleteTarget?.company}
              </strong>
              . This cannot be undone.
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
        <span
          className={cn(
            "tabular-nums text-[10px]",
            active ? "opacity-65" : "opacity-40",
          )}
        >
          {count}
        </span>
      )}
    </button>
  );
}

// ─── JobTableRow (Memoized for Performance) ───────────────────────────────────
const JobTableRow = memo(
  ({
    job,
    sal,
    sel,
    cellEditing,
    editValue,
    setEditValue,
    startEdit,
    onInputKey,
    saveEdit,
    setSelectedRow,
    updateJob,
    duplicateJob,
    setDeleteTarget,
  }) => {
    return (
      <motion.tr
        layout
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.2 }}
        onClick={() => setSelectedRow(job.id)}
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            startEdit(job.id, "company", job.company);
          }
        }}
        className={cn(
          "group h-10 border-b border-border/35 last:border-0 cursor-pointer select-none",
          "transition-colors duration-200",
          sel ? "bg-accent/40" : "hover:bg-muted/30",
        )}
      >
        {/* Company */}
        <td
          className="px-3 py-1.5"
          onDoubleClick={() => startEdit(job.id, "company", job.company)}
        >
          <div className="flex items-center gap-2 min-w-0">
            <CompanyAvatar company={job.company} logo={job.logo} size={24} />

            <div className="flex-1 min-w-0">
              {cellEditing(job.id, "company") ? (
                <input
                  autoFocus
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  onKeyDown={(e) => onInputKey(e, job.id, "company")}
                  onBlur={() => saveEdit(job.id, "company")}
                  className="w-full bg-transparent border-none outline-none p-0 text-[13px] font-semibold text-foreground"
                />
              ) : (
                <span
                  className={cn(
                    "text-[13px] font-semibold text-foreground truncate block leading-none",
                    job.job_url &&
                      "group-hover:underline hover:text-primary cursor-pointer transition-colors",
                  )}
                  onClick={(e) => {
                    if (job.job_url) {
                      e.stopPropagation();
                      window.open(job.job_url, "_blank");
                    }
                  }}
                >
                  {job.company || "—"}
                </span>
              )}
            </div>
          </div>
        </td>

        {/* Role */}
        <td
          className="px-3 py-1.5"
          onDoubleClick={() => startEdit(job.id, "job_title", job.job_title)}
        >
          {cellEditing(job.id, "job_title") ? (
            <input
              autoFocus
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onKeyDown={(e) => onInputKey(e, job.id, "job_title")}
              onBlur={() => saveEdit(job.id, "job_title")}
              className="w-full bg-transparent border-none outline-none p-0 text-[13px] font-medium text-foreground"
            />
          ) : (
            <span
              className={cn(
                "text-[13px] font-medium text-foreground truncate block leading-none",
                job.job_url &&
                  "group-hover:underline hover:text-primary cursor-pointer transition-colors",
              )}
              onClick={(e) => {
                if (job.job_url) {
                  e.stopPropagation();
                  window.open(job.job_url, "_blank");
                }
              }}
            >
              {job.job_title || "—"}
            </span>
          )}
        </td>

        {/* Location */}
        <td
          className="px-3 py-1.5"
          onDoubleClick={() => startEdit(job.id, "location", job.location)}
        >
          <EditableText
            isEditing={cellEditing(job.id, "location")}
            value={job.location}
            editValue={editValue}
            onChange={setEditValue}
            onKeyDown={(e) => onInputKey(e, job.id, "location")}
            onBlur={() => saveEdit(job.id, "location")}
            textCls="text-[12px] text-muted-foreground font-medium"
          />
        </td>

        {/* Salary */}
        <td
          className="px-3 py-1.5 text-right"
          onDoubleClick={() => startEdit(job.id, "salary", job.salary)}
        >
          <EditableText
            isEditing={cellEditing(job.id, "salary")}
            value={sal}
            editValue={editValue}
            onChange={setEditValue}
            onKeyDown={(e) => onInputKey(e, job.id, "salary")}
            onBlur={() => saveEdit(job.id, "salary")}
            textCls="text-[12px] tabular-nums font-medium text-foreground/80"
          />
        </td>

        {/* Status */}
        <td className="px-3 py-1.5" onClick={(e) => e.stopPropagation()}>
          <Select
            value={job.status}
            onValueChange={(v) => updateJob(job.id, { status: v })}
          >
            <SelectTrigger className="h-auto w-full border-0 p-0 bg-transparent shadow-none focus:ring-0 [&>svg]:hidden flex justify-start">
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
        </td>

        {/* Source */}
        <td className="px-3 py-1.5">
          <div className="scale-90 origin-left">
            <SourceBadge source={job.source} />
          </div>
        </td>

        {/* Actions */}
        <td
          className="px-3 py-1.5 text-right"
          onClick={(e) => e.stopPropagation()}
        >
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                aria-label="Job actions"
                className="w-7 h-7 rounded flex items-center justify-center text-muted-foreground/40 hover:text-foreground hover:bg-muted/80 transition-colors ml-auto"
              >
                <MoreHorizontal className="w-4 h-4" strokeWidth={1.8} />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="w-40 bg-popover border-border"
            >
              <DropdownMenuItem
                className="text-[12px] gap-2 cursor-pointer"
                onSelect={() => startEdit(job.id, "company", job.company)}
              >
                <Pencil className="w-3 h-3 opacity-50" /> Edit
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-[12px] gap-2 cursor-pointer"
                onSelect={() => duplicateJob(job)}
              >
                <Copy className="w-3 h-3 opacity-50" /> Duplicate
              </DropdownMenuItem>
              {job.job_url && (
                <DropdownMenuItem
                  className="text-[12px] gap-2 cursor-pointer"
                  onSelect={() => window.open(job.job_url, "_blank")}
                >
                  <ExternalLink className="w-3 h-3 opacity-50" /> Open URL
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-[12px] gap-2 cursor-pointer text-destructive focus:text-destructive focus:bg-destructive/10"
                onSelect={() =>
                  setDeleteTarget({ id: job.id, company: job.company })
                }
              >
                <Trash2 className="w-3 h-3" /> Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </td>
      </motion.tr>
    );
  },
);
