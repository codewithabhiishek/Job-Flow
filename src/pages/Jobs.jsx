import { useState, useEffect, useMemo } from "react";
import { useOutletContext } from "react-router-dom";
import { apiClient } from "@/api/client";
import { ArrowUpDown, ArrowUp, ArrowDown, Minus, Ghost } from "lucide-react";
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
  { key: "salary", label: "Salary", sortable: true },
  { key: "remote", label: "Remote", sortable: true },
  { key: "status", label: "Status", sortable: true },
  { key: "applied_date", label: "Applied", sortable: true },
  { key: "reply_date", label: "Reply", sortable: true },
  { key: "interview_date", label: "Interview", sortable: true },
  { key: "deadline", label: "Deadline", sortable: true },
  { key: "created_date", label: "Added", sortable: true },
];

const COLUMN_WIDTHS = {
  company: "15%",
  job_title: "13%",
  location: "17%",
  salary: "8%",
  remote: "5%",
  status: "9%",
  applied_date: "8%",
  reply_date: "7%",
  interview_date: "7%",
  deadline: "7%",
  created_date: "7%",
};

const formatDate = (dateStr) => {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  if (isNaN(d)) return "—";
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "2-digit",
  });
};

const formatRelative = (dateStr) => {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  if (isNaN(d)) return "—";
  const diff = Date.now() - d.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  if (days === 0) return "Today";
  if (days === 1) return "1d ago";
  if (days < 7) return `${days}d ago`;
  if (days < 30) return `${Math.floor(days / 7)}w ago`;
  return formatDate(dateStr);
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
  const [remoteFilter, setRemoteFilter] = useState("all");
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
    if (remoteFilter !== "all")
      result = result.filter((j) =>
        remoteFilter === "remote" ? j.remote : !j.remote,
      );

    result.sort((a, b) => {
      const av = a[sortKey] || "";
      const bv = b[sortKey] || "";
      if (sortKey === "remote") {
        return sortDir === "asc"
          ? av === bv
            ? 0
            : av
              ? -1
              : 1
          : av === bv
            ? 0
            : av
              ? 1
              : -1;
      }
      if (av < bv) return sortDir === "asc" ? -1 : 1;
      if (av > bv) return sortDir === "asc" ? 1 : -1;
      return 0;
    });
    return result;
  }, [jobs, searchQuery, statusFilter, remoteFilter, sortKey, sortDir]);

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
        <ArrowUpDown
          className="w-3 h-3 text-neutral-700 inline-block ml-1"
          strokeWidth={1.5}
        />
      );
    return sortDir === "asc" ? (
      <ArrowUp
        className="w-3 h-3 text-neutral-400 inline-block ml-1"
        strokeWidth={1.5}
      />
    ) : (
      <ArrowDown
        className="w-3 h-3 text-neutral-400 inline-block ml-1"
        strokeWidth={1.5}
      />
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
          className="w-full h-7 px-1.5 rounded bg-neutral-900 border border-neutral-700 text-sm text-neutral-200 focus:outline-none"
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
            <SelectTrigger className="h-7 w-auto border-0 p-0 gap-1 bg-transparent hover:bg-neutral-900 focus:ring-0">
              <StatusBadge status={job.status} showChevron />
            </SelectTrigger>
            <SelectContent className="bg-neutral-900 border-white/[0.08]">
              {STATUS_ORDER.map((s) => (
                <SelectItem
                  key={s}
                  value={s}
                  className="text-neutral-300 focus:bg-neutral-800"
                >
                  {STATUS_CONFIG[s].label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );
      case "remote":
        return value ? (
          <span className="text-neutral-300 text-xs">Remote</span>
        ) : (
          <Minus className="w-3 h-3 text-neutral-700" strokeWidth={1.5} />
        );
      case "applied_date":
      case "reply_date":
      case "interview_date":
        return <span className="text-neutral-400">{formatDate(value)}</span>;
      case "deadline":
        return <span className="text-neutral-400">{formatDate(value)}</span>;
      case "created_date":
        return <span className="text-neutral-500">{formatDate(value)}</span>;
      case "salary":
        return <span className="text-neutral-300">{formatSalary(value)}</span>;
      default:
        return (
          <span className="text-neutral-300 truncate block">
            {value || "—"}
          </span>
        );
    }
  };

  if (loading) {
    return (
      <div className="p-8 max-w-[1400px] space-y-8">
        <div className="space-y-2">
          <Skeleton className="h-5 w-24" />
          <Skeleton className="h-10 w-64" />
        </div>
        <div className="rounded-[16px] border border-border/60 p-4">
          <div className="space-y-3">
            <Skeleton className="h-12 w-full rounded-[8px]" />
            {Array.from({ length: 10 }).map((_, i) => (
              <Skeleton key={i} className="h-14 w-full rounded-[8px]" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.03 }
    }
  };

  const itemAnim = {
    hidden: { opacity: 0, y: 10 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
  };

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="p-8 max-w-[1400px]">
      <motion.div variants={itemAnim} className="mb-6">
        <h2 className="type-label mb-1.5 text-muted-foreground">Jobs</h2>
        <h1 className="type-page-title text-foreground">All applications</h1>
      </motion.div>

      <motion.div variants={itemAnim} className="rounded-[16px] border border-border/60 bg-card overflow-hidden shadow-premium dark:shadow-premium-dark">
        <div className="w-full overflow-auto">
          <table className="w-full table-fixed text-[14px]">
            <thead>
              <tr className="border-b border-border/60 bg-muted/30">
                {COLUMNS.map((col) => (
                  <th
                    key={col.key}
                    onClick={() => col.sortable && handleSort(col.key)}
                    style={{ width: COLUMN_WIDTHS[col.key] }}
                    className={cn(
                      "text-left px-4 py-3 text-[11px] font-semibold tracking-wider uppercase text-muted-foreground whitespace-nowrap",
                      col.sortable && "cursor-pointer hover:text-foreground transition-colors",
                    )}
                  >
                    {col.label}
                    {col.sortable && <SortIcon colKey={col.key} />}
                  </th>
                ))}
              </tr>
            </thead>
          <tbody className="divide-y divide-border/40">
            {filtered.length === 0 ? (
              <tr>
                <td
                  colSpan={COLUMNS.length}
                  className="px-6 py-24 text-center"
                >
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex flex-col items-center justify-center max-w-sm mx-auto"
                  >
                    <div className="w-12 h-12 rounded-2xl bg-muted/50 flex items-center justify-center mb-4 border border-border/40 text-muted-foreground/50 shadow-sm">
                      <Ghost className="w-6 h-6" strokeWidth={1.5} />
                    </div>
                    <h4 className="text-[15px] font-semibold tracking-tight text-foreground mb-1">It's quiet in here</h4>
                    <p className="text-[14px] text-muted-foreground mb-6 text-center leading-relaxed">
                      You haven't added any jobs yet. Start tracking your applications to see them appear here.
                    </p>
                    <button 
                      onClick={openAddJob} 
                      className="inline-flex items-center justify-center h-9 px-4 rounded-[8px] bg-foreground text-background font-medium text-[13px] hover:scale-[1.02] active:scale-[0.98] transition-all shadow-sm"
                    >
                      Add your first job
                    </button>
                  </motion.div>
                </td>
              </tr>
            ) : (
              filtered.map((job) => (
                <tr
                  key={job.id}
                  className="group hover:bg-muted/40 transition-colors duration-200"
                >
                  {COLUMNS.map((col) => (
                    <td
                      key={col.key}
                      onDoubleClick={() =>
                        col.sortable &&
                        col.key !== "status" &&
                        col.key !== "remote" &&
                        handleCellEdit(job.id, col.key, job[col.key])
                      }
                      className="px-4 py-3 whitespace-nowrap overflow-hidden"
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
      <motion.p variants={itemAnim} className="text-[13px] text-muted-foreground mt-4 ml-1">
        {filtered.length} {filtered.length === 1 ? "job" : "jobs"} ·
        Double-click cells to edit
      </motion.p>
    </motion.div>
  );
}
