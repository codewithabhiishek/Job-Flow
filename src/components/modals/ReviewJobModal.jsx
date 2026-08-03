import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Check, Loader2 } from "lucide-react";
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
  work_mode: "",
  remote: false,
  skills: [],
  job_url: "",
  deadline: "",
  notes: "",
  source: "Unknown",
  status: "saved",
};

export default function ReviewJobModal({ open, onOpenChange, extractedData, onSaved }) {
  const queryClient = useQueryClient();
  const [data, setData] = useState(EMPTY_JOB);
  const [loading, setLoading] = useState(false);

  const createMutation = useMutation({
    mutationFn: async (jobData) => {
      return apiClient.fetchApi('/jobs', {
        method: "POST",
        body: JSON.stringify(jobData),
      });
    },
    onMutate: async (newJob) => {
      await queryClient.cancelQueries({ queryKey: ['jobs'] });
      const previousJobs = queryClient.getQueryData(['jobs']);
      queryClient.setQueryData(['jobs'], (old) => {
        // Optimistic append - give it a temporary ID so it renders instantly
        const optimisticJob = { ...newJob, id: `temp-${Date.now()}`, created_date: new Date().toISOString() };
        return old ? [optimisticJob, ...old] : [optimisticJob];
      });
      return { previousJobs };
    },
    onError: (err, newJob, context) => {
      queryClient.setQueryData(['jobs'], context.previousJobs);
      toast.error("Failed to save job", { description: err.message });
      setLoading(false);
    },
    onSuccess: () => {
      toast.success("Job added successfully");
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
      handleClose(false);
      if (onSaved) onSaved();
    },
    onSettled: () => {
      setLoading(false);
    }
  });

  // Load the initial extracted data when the modal opens
  useEffect(() => {
    console.log(`[DEBUG] ReviewJobModal: useEffect triggered | open: ${open} | extractedData:`, extractedData);
    if (extractedData && open) {
      console.log("[DEBUG] ReviewJobModal: Setting form data based on extractedData");
      setData({ ...EMPTY_JOB, ...extractedData });
    }
  }, [extractedData, open]);

  useEffect(() => {
    if (open) {
      console.log("[DEBUG] ReviewJobModal: Component MOUNTED / OPENED");
    } else {
      console.log("[DEBUG] ReviewJobModal: Component UNMOUNTED / CLOSED");
    }
  }, [open]);

  const handleClose = (isOpen) => {
    if (!isOpen) {
      setData(EMPTY_JOB);
      setLoading(false);
    }
    onOpenChange(isOpen);
  };

  const update = (field, value) => {
    setData((prev) => ({ ...prev, [field]: value }));
  };

  const save = async () => {
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
    createMutation.mutate({
      ...data,
      skills: Array.isArray(data.skills) ? data.skills : [],
    });
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl bg-popover border-border text-popover-foreground max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-foreground flex items-center gap-2 text-[15px]">
            <Check className="w-4 h-4 text-emerald-500" />
            Review extracted details
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Company" value={data.company} onChange={(v) => update("company", v)} required />
            <Field label="Job Title" value={data.job_title} onChange={(v) => update("job_title", v)} />
            <Field label="Location" value={data.location} onChange={(v) => update("location", v)} />
            <Field label="Salary" value={data.salary} onChange={(v) => update("salary", v)} />
            <Field label="Employment Type" value={data.employment_type} onChange={(v) => update("employment_type", v)} />
            <Field label="Work mode" value={data.work_mode} onChange={(v) => update("work_mode", v)} />
            <Field label="Source" value={data.source} onChange={(v) => update("source", v)} />
            <Field label="Job URL" value={data.job_url} onChange={(v) => update("job_url", v)} />
            <Field label="Deadline" value={data.deadline} onChange={(v) => update("deadline", v)} type="date" />
          </div>

          <div className="flex items-center gap-2">
            <label className="flex items-center gap-2 text-[13px] text-muted-foreground cursor-pointer">
              <input
                type="checkbox"
                checked={data.remote}
                onChange={(e) => update("remote", e.target.checked)}
                className="rounded border-border bg-muted cursor-pointer"
              />
              Remote
            </label>
            <div className="ml-auto flex items-center gap-2">
              <span className="text-[12px] text-muted-foreground">Status:</span>
              <Select value={data.status} onValueChange={(v) => update("status", v)}>
                <SelectTrigger className="w-36 h-8 bg-muted border-border text-foreground text-[12px]">
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

          {data.skills?.length > 0 && (
            <div>
              <label className="type-label mb-1.5 block">Extracted Skills</label>
              <div className="flex flex-wrap gap-1.5">
                {data.skills.map((skill, i) => (
                  <span key={i} className="px-2 py-0.5 rounded-md bg-muted border border-border text-[11px] text-muted-foreground">
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div>
            <label className="type-label mb-1.5 block">Notes</label>
            <textarea
              value={data.notes || ""}
              onChange={(e) => update("notes", e.target.value)}
              rows={2}
              className="w-full px-3 py-2 rounded-md bg-muted border border-border text-[13px] text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:border-ring focus:ring-1 focus:ring-ring resize-none"
            />
          </div>

          <div className="flex justify-end pt-2">
            <Button onClick={save} disabled={loading} className="px-6">
              {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Check className="w-4 h-4 mr-2" />}
              {loading ? "Saving..." : "Save Job"}
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
