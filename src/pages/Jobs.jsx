import { useState, useEffect, useMemo } from "react";
import { useOutletContext } from "react-router-dom";
import { apiClient } from "@/api/client";
import { ArrowUpDown, ArrowUp, ArrowDown, Minus } from "lucide-react";
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
  if (typeof value === "string" && /[₹$€£]/.test(value)) return value;
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
      <div className="p-6">
        <div className="h-20 bg-neutral-900 rounded-lg animate-pulse mb-4" />
        <div className="h-96 bg-neutral-900 rounded-lg animate-pulse" />
      </div>
    );
  }

  return (
    <div className="p-8 max-w-[1400px]">
      <div className="mb-6">
        <h2 className="type-label mb-1.5">Jobs</h2>
        <h1 className="type-page-title text-neutral-100">All applications</h1>
      </div>

      <div className="rounded-xl border border-white/[0.06] overflow-hidden">
        <table className="w-full table-fixed text-sm">
          <thead>
            <tr className="border-b border-white/[0.06] bg-neutral-950">
              {COLUMNS.map((col) => (
                <th
                  key={col.key}
                  onClick={() => col.sortable && handleSort(col.key)}
                  style={{ width: COLUMN_WIDTHS[col.key] }}
                  className={cn(
                    "text-left px-3 py-3 type-table-head whitespace-nowrap",
                    col.sortable && "cursor-pointer hover:text-neutral-400",
                  )}
                >
                  {col.label.toUpperCase()}
                  {col.sortable && <SortIcon colKey={col.key} />}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td
                  colSpan={COLUMNS.length}
                  className="px-4 py-16 text-center text-sm text-neutral-500"
                >
                  No jobs found. Click{" "}
                  <button
                    onClick={openAddJob}
                    className="text-blue-400 hover:underline"
                  >
                    Add Job
                  </button>{" "}
                  to get started.
                </td>
              </tr>
            ) : (
              filtered.map((job) => (
                <tr
                  key={job.id}
                  className="border-b border-white/[0.06] last:border-0 hover:bg-white/[0.025] transition-colors duration-200 group"
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
                      className="px-3 py-3 whitespace-nowrap overflow-hidden"
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
      <p className="type-body-sm text-neutral-500 mt-4">
        {filtered.length} {filtered.length === 1 ? "job" : "jobs"} ·
        Double-click cells to edit
      </p>
    </div>
  );
}
