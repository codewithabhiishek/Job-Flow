import { useState, useMemo, useRef, useEffect, useCallback } from "react";
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
  ExternalLink,
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
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from "@/components/ui/tooltip";
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
import { cn, condenseSalary, formatLocation } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import EditJobModal from "@/components/modals/EditJobModal";

// ─── Columns: exactly 6 data + 1 actions ─────────────────────────────────────
// Intentional fixed pixel widths so the layout stays balanced and nothing shifts
// regardless of content length. Summed width drives the table's min-width.
const COLS = [
  { key: "company", label: "Company", w: "w-[200px]", sort: true, edit: true },
  { key: "job_title", label: "Role", w: "w-[220px]", sort: true, edit: true },
  { key: "location", label: "Location", w: "w-[130px]", sort: true, edit: true },
  {
    key: "salary",
    label: "Salary",
    w: "w-[110px]",
    sort: false,
    edit: true,
    align: "right",
  },
  { key: "status", label: "Status", w: "w-[115px]", sort: true, edit: false },
  { key: "source", label: "Source", w: "w-[100px]", sort: false, edit: false },
  { key: "_actions", label: "", w: "w-[110px]", sort: false, edit: false },
];
const TABLE_MIN_W = COLS.reduce((acc, c) => acc + parseInt(c.w.match(/\d+/)?.[0] || 0, 10), 0);

const EDIT_COLS = COLS.filter((c) => c.edit).map((c) => c.key);

// ─── Inline text cell ─────────────────────────────────────────────────────────
function EditableText({
  isEditing,
  value,
  editValue,
  onChange,
  onKeyDown,
  onBlur,
  textCls,
  title,
}) {
  if (isEditing) {
    return (
      <input
        autoFocus
        value={editValue}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={onKeyDown}
        onBlur={onBlur}
        className={cn(
          "w-full bg-transparent border-none outline-none p-0 [text-align:inherit]",
          textCls || "text-[13px] text-foreground"
        )}
      />
    );
  }
  return (
    <span className={cn("truncate block leading-5", textCls)} title={title}>
      {value || "—"}
    </span>
  );
}

// ─── Row action icon button (revealed on row hover / keyboard focus) ──────────
function RowAction({ icon: Icon, label, onClick, danger }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          aria-label={label}
          onClick={onClick}
          className={cn(
            "w-7 h-7 rounded-md flex items-center justify-center transition-all duration-150 active:scale-95",
            "text-muted-foreground/60 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 focus:opacity-100",
            danger
              ? "hover:text-destructive hover:bg-destructive/10"
              : "hover:text-foreground hover:bg-muted/70",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          )}
        >
          <Icon className="w-[15px] h-[15px]" strokeWidth={1.9} />
        </button>
      </TooltipTrigger>
      <TooltipContent side="top" className="text-[11px] px-2 py-1">
        {label}
      </TooltipContent>
    </Tooltip>
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
  const [editTarget, setEditTarget] = useState(null); // job being edited in EditJobModal
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

  const updateJob = useCallback((id, patch) => updateMutation.mutate({ id, patch }), [updateMutation]);
  const removeJob = useCallback((id) => deleteMutation.mutate(id), [deleteMutation]);

  // ── Edit ──────────────────────────────────────────────────────────────────────
  // These are passed into memo(JobTableRow); keep their identities stable so the
  // memo actually prevents re-renders when unrelated state changes.
  const startEdit = useCallback((id, col, val) => {
    setSelectedRow(id);
    setEditingCell({ id, col });
    setEditValue(val || "");
  }, []);

  const saveEdit = useCallback(
    (id, col) => {
      const j = jobs.find((x) => x.id === id);
      if (j && j[col] !== editValue) updateJob(id, { [col]: editValue });
      setEditingCell(null);
    },
    [jobs, editValue, updateJob],
  );

  const cellEditing = useCallback(
    (id, col) => editingCell?.id === id && editingCell?.col === col,
    [editingCell],
  );

  const onInputKey = useCallback(
    (e, id, col) => {
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
    },
    [saveEdit, startEdit, filtered, jobs],
  );

  // ── Keyboard nav ──────────────────────────────────────────────────────────────
  useEffect(() => {
    const handler = (e) => {
      if (!selectedRow || editingCell) return;
      // Don't steal arrow keys while the user is typing elsewhere (search, inputs, selects).
      const t = e.target;
      if (
        t &&
        (t.tagName === "INPUT" ||
          t.tagName === "TEXTAREA" ||
          t.tagName === "SELECT" ||
          t.isContentEditable)
      )
        return;
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
      <div className="px-4 sm:px-6 lg:px-8 py-5 sm:py-7 w-full flex flex-col h-full" aria-busy="true" aria-label="Loading jobs">
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
      className="flex flex-col min-h-full px-4 sm:px-6 lg:px-8 py-5 sm:py-7 w-full max-w-full"
      onClick={() => setSelectedRow(null)}
    >
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between mb-5 shrink-0">
        <div>
          <h1 className="type-page-title text-foreground">
          Jobs
          </h1>
          <p className="hidden sm:block mt-1 text-[12px] text-muted-foreground">Keep every opportunity and next step in one calm, focused view.</p>
        </div>
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
        className="overflow-hidden rounded-xl border border-border bg-card shadow-card"
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
              <p className="text-[14px] font-semibold text-foreground">
                {searchQuery || statusFilter !== "all" ? "No matching jobs" : "Start tracking your applications"}
              </p>
              <p className="text-[13px] text-muted-foreground mt-1">
                {searchQuery || statusFilter !== "all" ? "Try a different search or filter to find what you need." : "Add a role to see your application pipeline take shape."}
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
            {/* ── Desktop / tablet table ──────────────────────────────────
                Only the table scrolls horizontally on narrow viewports; the
                footer stays pinned to the container width below it. The outer
                wrapper owns overflow-hidden so rounded corners survive scroll. */}
            <div className="hidden md:block">
              <div className="overflow-x-auto overscroll-x-contain">
                <table
                  className="w-full text-left table-fixed font-table"
                  style={{ minWidth: TABLE_MIN_W }}
                  ref={tableRef}
                >
                {/* thead */}
                <thead>
                  <tr className="border-b border-border">
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
                          "group px-3 xl:px-4 py-3 type-table-head select-none bg-muted/60 border-r border-border/50 last:border-r-0 whitespace-nowrap",
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
                        setDeleteTarget={setDeleteTarget}
                        setEditTarget={setEditTarget}
                      />
                    ))}
                  </AnimatePresence>
                </tbody>
                </table>
              </div>

              {/* Row count & Hints footer */}
              <div className="px-4 py-2.5 border-t border-border flex items-center justify-between bg-muted/30 rounded-b-xl">
                <div className="hidden md:flex items-center gap-3 text-[12px] text-muted-foreground/70 font-medium tracking-tight">
                  <span className="flex items-center gap-1.5"><Pencil className="w-3 h-3 opacity-70" /> Double-click any cell to edit</span>
                  <span className="opacity-30">•</span>
                  <span>Hover a row for quick actions</span>
                  <span className="opacity-30">•</span>
                  <span>Press <kbd className="font-sans px-1.5 py-0.5 bg-card rounded border border-border text-[10px] shadow-sm">Enter</kbd> to edit</span>
                </div>
                <span className="text-[11.5px] text-muted-foreground tabular-nums font-medium font-mono">
                  {filtered.length} {filtered.length === 1 ? "job" : "jobs"}
                  {statusFilter !== "all" && " · filtered"}
                </span>
              </div>
            </div>

            {/* ── Mobile cards ───────────────────────────────────────────── */}
            <div className="md:hidden divide-y divide-border/40 font-table">
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
                      className="px-4 py-4 hover:bg-muted/25 active:bg-muted/40 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
                      tabIndex={0}
                      role="button"
                      aria-label={`Open ${job.job_title || "job"} at ${job.company || "company"}`}
                      onKeyDown={(e) => {
                        if ((e.key === "Enter" || e.key === " ") && job.job_url) {
                          e.preventDefault();
                          window.open(job.job_url, "_blank");
                        }
                      }}
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
                          size={28}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <p className="text-[13px] font-semibold text-foreground truncate leading-snug">
                                {job.company}
                              </p>
                              <p className="text-[12px] text-foreground/60 font-medium truncate leading-snug">
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
                                <SelectTrigger className="h-auto w-auto border-0 p-0 bg-transparent shadow-none [&>svg]:hidden">
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
                                    className="w-9 h-9 rounded flex items-center justify-center text-muted-foreground/40 hover:text-foreground hover:bg-muted active:bg-muted/70 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
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
                                    onSelect={() => setEditTarget(job)}
                                  >
                                    <Pencil className="w-3 h-3 opacity-50" />
                                    Edit details
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
                              <span
                                className="text-[11.5px] text-muted-foreground truncate min-w-0 max-w-[45%]"
                                title={job.location}
                              >
                                {formatLocation(job.location)}
                              </span>
                            )}
                            {sal && (
                              <span className="text-[11.5px] tabular-nums text-muted-foreground font-mono shrink-0">
                                {sal}
                              </span>
                            )}
                            {job.source && (
                              <div className="scale-90 origin-left shrink-0">
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

      {/* ── Edit details (sets deadline / applied / reply / interview dates) ── */}
      <EditJobModal
        job={editTarget}
        open={!!editTarget}
        onOpenChange={(open) => !open && setEditTarget(null)}
      />
    </div>
  );
}

// ─── FilterChip ───────────────────────────────────────────────────────────────
function Chip({ children, active, onClick, count }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1.5 h-7 px-2.5 rounded-md text-[11.5px] font-medium transition-all duration-150 border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        active
          ? "bg-foreground text-background border-foreground/80"
          : "bg-transparent text-muted-foreground border-border/50 hover:bg-muted hover:text-foreground hover:border-border/80",
      )}
    >
      {children}
      {count > 0 && (
        <span
          className={cn(
            "tabular-nums text-[10px] font-mono",
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
    setDeleteTarget,
    setEditTarget,
  }) => {
    return (
      <motion.tr
        layout
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.2 }}
        onClick={() => setSelectedRow(job.id)}
        onFocus={() => setSelectedRow(job.id)}
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            startEdit(job.id, "company", job.company);
          }
        }}
        className={cn(
          "group align-middle h-[54px] border-b border-border/60 last:border-0 cursor-pointer select-none outline-none",
          "transition-[background-color,box-shadow] duration-200 ease-out focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring",
          sel
            ? "bg-primary/[0.045] shadow-[inset_3px_0_0_hsl(var(--primary))]"
            : "hover:bg-muted/50",
        )}
      >
        {/* Company */}
        <td
          className="px-3 xl:px-4 py-2 align-middle border-r border-border/50 last:border-r-0"
          onDoubleClick={() => startEdit(job.id, "company", job.company)}
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <CompanyAvatar company={job.company} logo={job.logo} size={28} />

            <div className="flex-1 min-w-0">
              {cellEditing(job.id, "company") ? (
                <input
                  autoFocus
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  onKeyDown={(e) => onInputKey(e, job.id, "company")}
                  onBlur={() => saveEdit(job.id, "company")}
                  className="w-full bg-transparent border-none outline-none p-0 text-[14px] font-semibold tracking-[-0.01em] text-foreground"
                />
              ) : (
                <span className="text-[14px] font-semibold tracking-[-0.01em] text-foreground truncate block leading-5">
                  {job.company || "—"}
                </span>
              )}
            </div>
          </div>
        </td>

        {/* Role */}
        <td
          className="px-3 xl:px-4 py-2 align-middle border-r border-border/50 last:border-r-0"
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
            <span className="text-[13px] font-medium text-foreground/90 truncate block leading-5">
              {job.job_title || "—"}
            </span>
          )}
        </td>

        {/* Location */}
        <td
          className="px-3 xl:px-4 py-2 align-middle border-r border-border/50 last:border-r-0"
          onDoubleClick={() => startEdit(job.id, "location", job.location)}
        >
          <EditableText
            isEditing={cellEditing(job.id, "location")}
            value={formatLocation(job.location)}
            title={job.location}
            editValue={editValue}
            onChange={setEditValue}
            onKeyDown={(e) => onInputKey(e, job.id, "location")}
            onBlur={() => saveEdit(job.id, "location")}
            textCls="text-[12.5px] text-muted-foreground font-medium tracking-[-0.01em]"
          />
        </td>

        {/* Salary */}
        <td
          className="px-3 xl:px-4 py-2 align-middle text-right border-r border-border/50 last:border-r-0"
          onDoubleClick={() => startEdit(job.id, "salary", job.salary)}
        >
          <EditableText
            isEditing={cellEditing(job.id, "salary")}
            value={sal}
            editValue={editValue}
            onChange={setEditValue}
            onKeyDown={(e) => onInputKey(e, job.id, "salary")}
            onBlur={() => saveEdit(job.id, "salary")}
            textCls="text-[12.5px] tabular-nums font-semibold text-foreground tracking-[-0.01em] font-mono"
          />
        </td>

        {/* Status */}
        <td
          className="px-3 xl:px-4 py-2 align-middle border-r border-border/50 last:border-r-0"
          onClick={(e) => e.stopPropagation()}
        >
          <Select
            value={job.status}
            onValueChange={(v) => updateJob(job.id, { status: v })}
          >
            <SelectTrigger className="h-auto w-full border-0 p-0 bg-transparent shadow-none [&>svg]:hidden flex justify-start">
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
        <td className="px-3 xl:px-4 py-2 align-middle border-r border-border/50 last:border-r-0">
          <SourceBadge source={job.source} />
        </td>

        {/* Actions — revealed on row hover / keyboard focus */}
        <td
          className="px-3 xl:px-4 py-2 align-middle text-right border-r border-border/50 last:border-r-0"
          onClick={(e) => e.stopPropagation()}
        >
          <TooltipProvider delayDuration={300}>
            <div className="flex items-center justify-end gap-1">
              <RowAction
                icon={Pencil}
                label="Edit"
                onClick={() => setEditTarget(job)}
              />
              {job.job_url && (
                <RowAction
                  icon={ExternalLink}
                  label="Open URL"
                  onClick={() => window.open(job.job_url, "_blank")}
                />
              )}
              <RowAction
                icon={Trash2}
                label="Delete"
                danger
                onClick={() =>
                  setDeleteTarget({ id: job.id, company: job.company })
                }
              />
            </div>
          </TooltipProvider>
        </td>
      </motion.tr>
    );
  },
);
