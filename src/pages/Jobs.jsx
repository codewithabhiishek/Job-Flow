import { useState, useEffect, useMemo } from "react";
import { useOutletContext } from "react-router-dom";
import { apiClient } from "@/api/client";
import { ArrowUpDown, ArrowUp, ArrowDown, Minus, Plus } from "lucide-react";
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
import { motion } from "framer-motion";
import { Skeleton } from "@/components/ui/skeleton";

const COLUMNS = [
  { key: "company", label: "Company", sortable: true },
  { key: "job_title", label: "Role", sortable: true },
  { key: "location", label: "Location", sortable: true },
  { key: "salary", label: "Salary", sortable: true, align: "right" },
  { key: "status", label: "Status", sortable: true },
  { key: "applied_date", label: "Applied", sortable: true, align: "right" },
  { key: "created_date", label: "Added", sortable: true, align: "right" },
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
  if (days === 1) return "1d ago";
  if (days < 7) return `${days}d ago`;
  if (days < 30) return `${Math.floor(days / 7)}w ago`;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
};

const formatSalary = (value) => {
  if (!value) return "—";
  if (typeof value === "string" && /[₹€£]/.test(value)) return value;
  const num =
    typeof value === "number"
      ? value
      : parseInt(String(value).replace(/[^\d]/g, ""), 10);
  if (isNaN(num)) return value;
  return "₹" + num.toLocaleString("en-IN");
};

export default function Jobs() {
  const { searchQuery, openAddJob } = useOutletContext();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sortKey, setSortKey] = useState("created_date");
  const [sortDir, setSortDir] = useState("desc");
  const [statusFilter, setStatusFilter] = useState("all");
  const [editingCell, setEditingCell] = useState(null);
  const [editValue, setEditValue] = useState("");

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
      const av = a[sortKey] || "";
      const bv = b[sortKey] || "";
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

  const handleCellEdit = (jobId, field, currentValue) => {
    setEditingCell({ jobId, field });
    setEditValue(currentValue || "");
  };

  const saveCellEdit = () => {
    if (editingCell) {
      updateJob(editingCell.jobId, { [editingCell.field]: editValue });
    }
    setEditingCell(null);
    setEditValue("");
  };

  const SortIcon = ({ colKey }) => {
    if (sortKey !== colKey)
      return (
        <ArrowUpDown className="w-3 h-3 text-muted-foreground/40 inline-block ml-1" strokeWidth={1.5} />
      );
    return sortDir === "asc" ? (
      <ArrowUp className="w-3 h-3 text-foreground inline-block ml-1" strokeWidth={1.5} />
    ) : (
      <ArrowDown className="w-3 h-3 text-foreground inline-block ml-1" strokeWidth={1.5} />
    );
  };

  const renderCell = (job, col) => {
    const value = job[col.key];
    if (editingCell?.jobId === job.id && editingCell?.field === col.key) {
      return (
        <input
          autoFocus
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onBlur={saveCellEdit}
          onKeyDown={(e) => {
            if (e.key === "Enter") saveCellEdit();
            if (e.key === "Escape") setEditingCell(null);
          }}
          className="w-full h-7 px-1.5 rounded bg-muted border border-border text-[13px] text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
        />
      );
    }

    switch (col.key) {
      case "status":
        return (
          <Select
            value={job.status}
            onValueChange={(v) => updateJob(job.id, { status: v })}
          >
            <SelectTrigger className="h-7 w-auto border-0 p-0 gap-1 bg-transparent hover:bg-muted focus:ring-0">
              <StatusBadge status={job.status} />
            </SelectTrigger>
            <SelectContent className="bg-popover border-border">
              {STATUS_ORDER.map((s) => (
                <SelectItem key={s} value={s} className="text-popover-foreground focus:bg-muted">
                  {STATUS_CONFIG[s].label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );
      case "applied_date":
      case "created_date":
        return <span className="text-muted-foreground tnum">{formatDate(value)}</span>;
      case "salary":
        return <span className="text-foreground tnum">{formatSalary(value)}</span>;
      case "company":
        return <span className="text-foreground font-medium">{value || "—"}</span>;
      default:
        return <span className="text-foreground/80">{value || "—"}</span>;
    }
  };

  if (loading) {
    return (
      <div className="p-6 space-y-6 max-w-[1200px]">
        <Skeleton className="h-7 w-40" />
        <div className="rounded-lg border border-border">
          <Skeleton className="h-10 w-full" />
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-11 w-full" />
          ))}
        </div>
      </div>
    );
  }

  const container = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.04 } }
  };
  const itemAnim = {
    hidden: { opacity: 0, y: 6 },
    show: { opacity: 1, y: 0, transition: { duration: 0.15 } }
  };

  // Status filter counts
  const statusCounts = {};
  jobs.forEach((j) => { statusCounts[j.status] = (statusCounts[j.status] || 0) + 1; });

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="p-6 max-w-[1200px]">
      <motion.div variants={itemAnim} className="flex items-center justify-between mb-4">
        <h1 className="type-page-title text-foreground">Jobs</h1>
        <span className="text-[12px] text-muted-foreground tnum">{filtered.length} total</span>
      </motion.div>

      {/* Status filter chips */}
      <motion.div variants={itemAnim} className="flex flex-wrap gap-1.5 mb-4">
        <FilterChip active={statusFilter === "all"} onClick={() => setStatusFilter("all")} count={jobs.length}>
          All
        </FilterChip>
        {STATUS_ORDER.filter((s) => statusCounts[s]).map((s) => (
          <FilterChip key={s} active={statusFilter === s} onClick={() => setStatusFilter(s)} count={statusCounts[s]}>
            {STATUS_CONFIG[s].label}
          </FilterChip>
        ))}
      </motion.div>

      <motion.div variants={itemAnim} className="rounded-lg border border-border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px] text-table-text">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                {COLUMNS.map((col) => (
                  <th
                    key={col.key}
                    onClick={() => col.sortable && handleSort(col.key)}
                    className={cn(
                      "px-4 py-2.5 text-table-header font-medium whitespace-nowrap sticky top-0 bg-muted/30 z-10",
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
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={COLUMNS.length} className="px-4 py-16 text-center">
                    <p className="text-[13px] text-muted-foreground mb-3">No jobs match your filters</p>
                    <button
                      onClick={openAddJob}
                      className="inline-flex items-center gap-1.5 h-8 px-3 rounded-md bg-primary text-primary-foreground text-button-text font-medium hover:opacity-90 transition-opacity"
                    >
                      <Plus className="w-3.5 h-3.5" strokeWidth={2} />
                      Add Job
                    </button>
                  </td>
                </tr>
              ) : (
                filtered.map((job) => (
                  <tr
                    key={job.id}
                    className="group hover:bg-muted/30 transition-colors duration-100"
                  >
                    {COLUMNS.map((col) => (
                      <td
                        key={col.key}
                        onDoubleClick={() =>
                          col.sortable &&
                          col.key !== "status" &&
                          handleCellEdit(job.id, col.key, job[col.key])
                        }
                        className={cn(
                          "px-4 py-2.5 whitespace-nowrap",
                          col.align === "right" && "text-right",
                        )}
                      >
                        {renderCell(job, col)}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </motion.div>
      <motion.p variants={itemAnim} className="text-[12px] text-muted-foreground mt-3">
        Double-click cells to edit inline
      </motion.p>
    </motion.div>
  );
}

function FilterChip({ children, active, onClick, count }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1.5 h-7 px-2.5 rounded-md text-[12px] font-medium transition-colors duration-100",
        active
          ? "bg-foreground text-background"
          : "bg-muted text-muted-foreground hover:text-foreground",
      )}
    >
      {children}
      {count !== undefined && (
        <span className={cn("tnum", active ? "opacity-70" : "opacity-50")}>{count}</span>
      )}
    </button>
  );
}
