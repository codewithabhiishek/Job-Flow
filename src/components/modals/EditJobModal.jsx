import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, Pencil } from "lucide-react";
import { apiClient } from "@/api/client";
import { toast } from "sonner";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { STATUS_ORDER } from "@/components/StatusBadge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const EMPTY_JOB = {
  company: "",
  logo: "",
  job_title: "",
  location: "",
  salary: "",
  employment_type: "",
  experience: "",
  work_mode: "",
  remote: false,
  job_url: "",
  deadline: "",
  applied_date: "",
  reply_date: "",
  interview_date: "",
  notes: "",
  source: "",
  status: "saved",
};

export default function EditJobModal({ job, open, onOpenChange }) {
  const queryClient = useQueryClient();
  const [data, setData] = useState(EMPTY_JOB);
  const [loading, setLoading] = useState(false);

  // Sync form state whenever the modal opens with a (possibly different) job.
  useEffect(() => {
    if (open && job) {
      setData({
        ...EMPTY_JOB,
        ...job,
        skills: Array.isArray(job.skills) ? job.skills : [],
        // Keep text date fields in the YYYY-MM-DD shape the server stores and
        // the Calendar page matches against.
        deadline: job.deadline || "",
        applied_date: job.applied_date || "",
        reply_date: job.reply_date || "",
        interview_date: job.interview_date || "",
      });
    }
  }, [open, job]);

  const updateMutation = useMutation({
    mutationFn: (payload) =>
      apiClient.fetchApi(`/jobs/${job.id}`, {
        method: "PUT",
        body: JSON.stringify(payload),
      }),
    onMutate: async (payload) => {
      await queryClient.cancelQueries({ queryKey: ["jobs"] });
      const previousJobs = queryClient.getQueryData(["jobs"]);
      queryClient.setQueryData(["jobs"], (old) =>
        old?.map((j) => (j.id === job.id ? { ...j, ...payload } : j)) || [],
      );
      return { previousJobs };
    },
    onError: (err, _payload, context) => {
      queryClient.setQueryData(["jobs"], context.previousJobs);
      toast.error("Failed to update job", { description: err.message });
      setLoading(false);
    },
    onSuccess: () => {
      toast.success("Job updated");
      queryClient.invalidateQueries({ queryKey: ["jobs"] });
      onOpenChange(false);
    },
    onSettled: () => setLoading(false),
  });

  const handleClose = (isOpen) => {
    if (!isOpen) {
      setData(EMPTY_JOB);
      setLoading(false);
    }
    onOpenChange(isOpen);
  };

  const update = (field, value) => setData((prev) => ({ ...prev, [field]: value }));

  const save = () => {
    if (!data.company?.trim()) {
      toast.error("Company name is required");
      return;
    }
    if (!data.job_title?.trim()) {
      toast.error("Job title is required");
      return;
    }
    if (data.job_url && !/^https?:\/\/[^\s]+$/i.test(data.job_url)) {
      toast.error("Enter a valid job URL");
      return;
    }
    setLoading(true);
    updateMutation.mutate({
      company: data.company,
      logo: data.logo,
      job_title: data.job_title,
      location: data.location,
      salary: data.salary,
      employment_type: data.employment_type,
      experience: data.experience,
      work_mode: data.work_mode === "__none__" ? "" : data.work_mode,
      remote: data.work_mode === "Remote" || data.remote,
      skills: Array.isArray(data.skills) ? data.skills : [],
      job_url: data.job_url,
      deadline: data.deadline || "",
      applied_date: data.applied_date || "",
      reply_date: data.reply_date || "",
      interview_date: data.interview_date || "",
      notes: data.notes,
      source: data.source,
      status: data.status,
    });
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl bg-popover border-border text-popover-foreground max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-foreground flex items-center gap-2 text-[15px]">
            <Pencil className="w-4 h-4 text-primary" />
            Edit job
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="Company" value={data.company} onChange={(v) => update("company", v)} required />
            <Field label="Job Title" value={data.job_title} onChange={(v) => update("job_title", v)} required />
            <Field label="Location" value={data.location} onChange={(v) => update("location", v)} />
            <Field label="Salary" value={data.salary} onChange={(v) => update("salary", v)} />
            <Field label="Employment Type" value={data.employment_type} onChange={(v) => update("employment_type", v)} />
            <Field label="Experience" value={data.experience} onChange={(v) => update("experience", v)} />
            <Field label="Source" value={data.source} onChange={(v) => update("source", v)} />
            <Field label="Job URL" value={data.job_url} onChange={(v) => update("job_url", v)} />
            <Field label="Deadline" value={data.deadline} onChange={(v) => update("deadline", v)} type="date" />
            <Field label="Applied Date" value={data.applied_date} onChange={(v) => update("applied_date", v)} type="date" />
            <Field label="Reply Date" value={data.reply_date} onChange={(v) => update("reply_date", v)} type="date" />
            <Field label="Interview Date" value={data.interview_date} onChange={(v) => update("interview_date", v)} type="date" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="type-label mb-1 block">Work mode</label>
              <Select
                value={data.work_mode || "__none__"}
                onValueChange={(v) => update("work_mode", v)}
              >
                <SelectTrigger className="w-full h-8 bg-muted border-border text-foreground text-[13px]">
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent className="bg-popover border-border">
                  {["__none__", "Remote", "Hybrid", "On-site"].map((m) => (
                    <SelectItem key={m} value={m} className="text-[12px]">
                      {m === "__none__" ? "—" : m}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="type-label mb-1 block">Status</label>
              <Select value={data.status} onValueChange={(v) => update("status", v)}>
                <SelectTrigger className="w-full h-8 bg-muted border-border text-foreground text-[13px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-popover border-border">
                  {STATUS_ORDER.map((s) => (
                    <SelectItem key={s} value={s} className="text-popover-foreground capitalize focus:bg-muted text-[12px]">
                      {s.replace(/_/g, " ")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <label className="flex items-center gap-2 text-[13px] text-muted-foreground cursor-pointer">
            <input
              type="checkbox"
              checked={data.remote}
              onChange={(e) => update("remote", e.target.checked)}
              className="rounded border-border bg-muted cursor-pointer"
            />
            Remote
          </label>

          <div>
            <label className="type-label mb-1.5 block">Notes</label>
            <textarea
              value={data.notes || ""}
              onChange={(e) => update("notes", e.target.value)}
              rows={3}
              className="w-full px-3 py-2 rounded-md bg-muted border border-border text-[13px] text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:border-ring focus:ring-1 focus:ring-ring resize-none"
            />
          </div>

          <div className="flex justify-end pt-2">
            <Button onClick={save} disabled={loading} className="px-6">
              {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Pencil className="w-4 h-4 mr-2" />}
              {loading ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function Field({ label, value, onChange, type = "text", required }) {
  return (
    <div>
      <label className="type-label mb-1 block">
        {label}
        {required && <span className="text-destructive ml-0.5">*</span>}
      </label>
      <input
        type={type}
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        className="w-full h-8 px-3 rounded-md bg-muted border border-border text-[13px] text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:border-ring focus:ring-1 focus:ring-ring"
      />
    </div>
  );
}
