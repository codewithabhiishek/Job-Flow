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

const COLUMNS = [
  { key: "company", label: "Company", width: "w-[20%]", sortable: true, editable: true },
  { key: "job_title", label: "Role", width: "w-[20%]", sortable: true, editable: true },
  { key: "status", label: "Status", width: "w-[15%]", sortable: true, editable: false },
  { key: "location", label: "Location", width: "w-[14%]", sortable: true, editable: true },
  { key: "salary", label: "Salary", width: "w-[12%]", sortable: true, align: "right", editable: true },
  { key: "updated", label: "Last Updated", width: "w-[11%]", sortable: true, align: "right", editable: false },
  { key: "actions", label: "", width: "w-[8%]", sortable: false, align: "right", editable: false },
];

const EDITABLE_COLS = COLUMNS.filter(c => c.editable).map(c => c.key);

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

const getCompanyAvatar = (companyName) => {
  if (!companyName) return { initials: "?", bg: "bg-muted", text: "text-muted-foreground" };
  const initials = companyName.substring(0, 2).toUpperCase();
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
  
  // Spreadsheet state
  const [selectedRowId, setSelectedRowId] = useState(null);
  const [editingCell, setEditingCell] = useState(null); // { id, col }
  const [editValue, setEditValue] = useState("");
  
  const tableRef = useRef(null);

  useEffect(() => {
    console.log("[Jobs] mounted");
    let isMounted = true;
    
    const load = async () => {
      console.log("[Jobs] fetching jobs");
      try {
        const data = await apiClient.fetchApi('/jobs');
        if (!isMounted) return;
        
        console.log(`[Jobs] API response status: 200, job count: ${data.length}`);
        console.log("[Jobs] jobs stored in state");
        setJobs(data);
      } catch (err) {
        console.error("[Jobs] Error fetching jobs:", err);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };
    load();
    
    return () => { isMounted = false; };
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
      const k = sortKey === "updated" ? "created_date" : sortKey;
      const av = a[k] || "";
      const bv = b[k] || "";
      if (av < bv) return sortDir === "asc" ? -1 : 1;
      if (av > bv) return sortDir === "asc" ? 1 : -1;
      return 0;
    });
    
    console.log(`[Jobs] raw jobs length: ${jobs.length} | filtered jobs length: ${result.length}`);
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

  const removeJob = (jobId) => {
    setJobs((prev) => prev.filter((j) => j.id !== jobId));
  };

  // --- Keyboard & Inline Edit Handlers ---
  const handleKeyDown = (e) => {
    if (!selectedRowId && !editingCell) return;
    
    // Global row navigation if not editing
    if (!editingCell) {
      const currentIndex = filtered.findIndex(j => j.id === selectedRowId);
      if (e.key === "ArrowDown") {
        e.preventDefault();
        if (currentIndex < filtered.length - 1) setSelectedRowId(filtered[currentIndex + 1].id);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        if (currentIndex > 0) setSelectedRowId(filtered[currentIndex - 1].id);
      }
    }
  };

  // Attach global keyboard listener for row navigation
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
    if (job && job[col] !== editValue) {
      updateJob(id, { [col]: editValue });
    }
    setEditingCell(null);
  };

  const handleInputKeyDown = (e, id, col) => {
    if (e.key === "Enter") {
      e.preventDefault();
      saveEdit(id, col);
    } else if (e.key === "Escape") {
      e.preventDefault();
      setEditingCell(null);
    } else if (e.key === "Tab") {
      e.preventDefault();
      saveEdit(id, col);
      
      const colIndex = EDITABLE_COLS.indexOf(col);
      if (e.shiftKey) {
        // move left
        if (colIndex > 0) {
          const nextCol = EDITABLE_COLS[colIndex - 1];
          const job = jobs.find(j => j.id === id);
          startEdit(id, nextCol, job[nextCol]);
        } else {
          // move to prev row last col
          const rowIndex = filtered.findIndex(j => j.id === id);
          if (rowIndex > 0) {
            const nextRowId = filtered[rowIndex - 1].id;
            const nextCol = EDITABLE_COLS[EDITABLE_COLS.length - 1];
            const job = jobs.find(j => j.id === nextRowId);
            startEdit(nextRowId, nextCol, job[nextCol]);
          }
        }
      } else {
        // move right
        if (colIndex < EDITABLE_COLS.length - 1) {
          const nextCol = EDITABLE_COLS[colIndex + 1];
          const job = jobs.find(j => j.id === id);
          startEdit(id, nextCol, job[nextCol]);
        } else {
          // move to next row first col
          const rowIndex = filtered.findIndex(j => j.id === id);
          if (rowIndex < filtered.length - 1) {
            const nextRowId = filtered[rowIndex + 1].id;
            const nextCol = EDITABLE_COLS[0];
            const job = jobs.find(j => j.id === nextRowId);
            startEdit(nextRowId, nextCol, job[nextCol]);
          }
        }
      }
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
            <Skeleton key={i} className="h-14 w-full" />
          ))}
        </div>
      </div>
    );
  }

  const statusCounts = {};
  jobs.forEach((j) => { statusCounts[j.status] = (statusCounts[j.status] || 0) + 1; });

  return (
    <div className="flex flex-col min-h-full px-6 lg:px-8 py-8 w-full max-w-full mx-auto" onClick={() => setSelectedRowId(null)}>
      <div className="flex items-center justify-between mb-6 shrink-0">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Jobs</h1>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-4 shrink-0" onClick={e => e.stopPropagation()}>
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
      <div className="overflow-x-auto rounded-[8px] border border-border bg-card shadow-sm" onClick={e => e.stopPropagation()}>
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
            <div className="hidden md:block min-w-[900px]">
              <table className="w-full text-left table-fixed" ref={tableRef}>
                <thead>
                  <tr>
                    {COLUMNS.map((col) => (
                      <th
                        key={col.key}
                        onClick={() => col.sortable && handleSort(col.key)}
                        className={cn(
                          "px-4 py-3 text-[11px] font-medium uppercase tracking-wider text-muted-foreground truncate group bg-muted/30 border-b border-border/70",
                          col.width,
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
                <tbody>
                  {filtered.map((job) => {
                    const avatar = getCompanyAvatar(job.company);
                    const isSelected = selectedRowId === job.id;
                    return (
                      <tr
                        key={job.id}
                        onClick={() => setSelectedRowId(job.id)}
                        className={cn(
                          "group h-[52px] transition-colors duration-100 select-none border-b border-border/50 last:border-0",
                          isSelected ? "bg-muted/80" : "hover:bg-muted/40"
                        )}
                      >
                        {COLUMNS.map(col => {
                          const isEditing = editingCell?.id === job.id && editingCell?.col === col.key;
                          
                          // Render logic for specific columns
                          if (col.key === 'company') {
                            return (
                              <td key={col.key} className="px-4 py-0 truncate" onDoubleClick={() => startEdit(job.id, col.key, job[col.key])}>
                                <div className="flex items-center gap-2.5">
                                  <div className={cn("w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-semibold shrink-0", avatar.color)}>
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
                                        className="w-full bg-transparent border-none outline-none p-0 m-0 text-[13px] font-medium text-foreground h-full"
                                      />
                                    ) : (
                                      <span className="text-[13px] font-medium text-foreground truncate block">
                                        {job.company}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </td>
                            );
                          }
                          
                          if (col.key === 'status') {
                            return (
                              <td key={col.key} className="px-4 py-0" onClick={(e) => e.stopPropagation()}>
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
                            );
                          }
                          
                          if (col.key === 'updated') {
                            return (
                              <td key={col.key} className="px-4 py-0 text-right truncate">
                                <span className="text-[13px] font-medium text-muted-foreground tnum">
                                  {formatDate(job.created_date)}
                                </span>
                              </td>
                            );
                          }

                          if (col.key === 'actions') {
                            return (
                              <td key={col.key} className="px-4 py-0 text-right">
                                <DeleteJobButton jobId={job.id} jobTitle={job.company} onDeleteSuccess={removeJob} />
                              </td>
                            );
                          }
                          
                          // Default rendering for Role, Location, Salary
                          return (
                            <td key={col.key} className={cn("px-4 py-0 truncate", col.align === 'right' && "text-right")} onDoubleClick={() => startEdit(job.id, col.key, job[col.key])}>
                              <div className={cn(
                                "flex items-center gap-1.5 h-full w-full",
                                col.align === 'right' && "justify-end"
                              )}>
                                {col.key === 'location' && !isEditing && job.location && (
                                  <MapPin className="w-3.5 h-3.5 shrink-0 text-muted-foreground" strokeWidth={1.5} />
                                )}
                                {isEditing ? (
                                  <input
                                    autoFocus
                                    value={editValue}
                                    onChange={e => setEditValue(e.target.value)}
                                    onKeyDown={e => handleInputKeyDown(e, job.id, col.key)}
                                    onBlur={() => saveEdit(job.id, col.key)}
                                    className={cn(
                                      "w-full bg-transparent border-none outline-none p-0 m-0 text-[13px] font-medium text-foreground",
                                      col.align === 'right' && "text-right tnum"
                                    )}
                                  />
                                ) : (
                                  <span className={cn(
                                    "text-[13px] font-medium truncate block",
                                    col.key === 'job_title' ? "text-foreground" : "text-muted-foreground",
                                    col.align === 'right' && "tnum",
                                    !job[col.key] && "text-muted-foreground/30"
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

            {/* Mobile View (Cards) */}
            <div className="md:hidden divide-y divide-border">
              {filtered.map((job) => {
                const avatar = getCompanyAvatar(job.company);
                return (
                  <div
                    key={job.id}
                    className="p-5 bg-card space-y-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={cn("w-9 h-9 rounded-full flex items-center justify-center text-[12px] font-semibold shrink-0", avatar.color)}>
                          {avatar.initials}
                        </div>
                        <div className="min-w-0">
                          <h3 className="text-[14.5px] font-semibold text-foreground truncate">{job.company}</h3>
                          <p className="text-[13.5px] font-medium text-foreground/80 truncate">{job.job_title}</p>
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
                    
                    <div className="flex flex-wrap gap-x-4 gap-y-2.5 text-[12.5px] text-muted-foreground font-medium pt-1">
                      {job.location && (
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" /> {job.location}
                        </span>
                      )}
                      {job.salary && (
                        <span className="text-foreground/80 tnum">{job.salary}</span>
                      )}
                      <div className="ml-auto flex items-center gap-4">
                        <span className="tnum">Updated {formatDate(job.created_date)}</span>
                        <DeleteJobButton jobId={job.id} jobTitle={job.company} onDeleteSuccess={removeJob} />
                      </div>
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

function FilterChip({ children, active, onClick, count }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1.5 h-8 px-3.5 rounded-[6px] text-[13px] font-medium transition-colors duration-150 border",
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
