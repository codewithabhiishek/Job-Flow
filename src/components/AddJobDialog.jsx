import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import {
  Camera,
  Link2,
  ClipboardPaste,
  Loader2,
  Sparkles,
  Upload,
  Check,
} from "lucide-react";
import { apiClient } from "@/api/client";
import { useToast } from "@/components/ui/use-toast";
import { STATUS_ORDER } from "./StatusBadge";
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
  remote: false,
  skills: [],
  job_url: "",
  deadline: "",
  notes: "",
  status: "saved",
};

export default function AddJobDialog({ open, onOpenChange }) {
  const [activeTab, setActiveTab] = useState("screenshot");
  const [loading, setLoading] = useState(false);
  const [extracted, setExtracted] = useState(null);
  const [screenshotFile, setScreenshotFile] = useState(null);
  const [urlInput, setUrlInput] = useState("");
  const [textInput, setTextInput] = useState("");
  const { toast } = useToast();

  const reset = () => {
    setExtracted(null);
    setScreenshotFile(null);
    setUrlInput("");
    setTextInput("");
    setLoading(false);
  };

  const handleClose = (open) => {
    if (!open) reset();
    onOpenChange(open);
  };

  const handleScreenshotChange = (e) => {
    const file = e.target.files?.[0];
    if (file) setScreenshotFile(file);
  };

  const extractFromScreenshot = async () => {
    if (!screenshotFile) return;
    setLoading(true);
    try {
      const { file_url } = await apiClient.fetchApi('/upload', {
        method: "POST",
        body: JSON.stringify({ filename: screenshotFile.name }),
      });
      const result = await apiClient.fetchApi('/ai/invoke', {
        method: "POST",
        body: JSON.stringify({
          prompt: `Extract all job posting details from this screenshot. Include company name, company logo URL (if visible), job title, location, salary range, employment type, experience level, whether it's remote, required skills, the job posting URL (if visible), application deadline, and any notable details. If a field is not present, return an empty string or empty array.`,
          file_urls: [file_url],
        }),
      });
      setExtracted({ ...EMPTY_JOB, ...result, source: "screenshot" });
    } catch (err) {
      toast({ title: "Extraction failed", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const extractFromUrl = async () => {
    if (!urlInput.trim()) return;
    setLoading(true);
    try {
      const result = await apiClient.fetchApi('/ai/invoke', {
        method: "POST",
        body: JSON.stringify({
          prompt: `Extract all job posting details from this job URL: ${urlInput}. Include company name, company logo URL, job title, location, salary range, employment type, experience level, whether it's remote, required skills, the job posting URL, application deadline, and any notable details. If a field is not present, return an empty string or empty array.`,
        }),
      });
      setExtracted({ ...EMPTY_JOB, ...result, job_url: urlInput, source: "url" });
    } catch (err) {
      toast({ title: "Extraction failed", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const extractFromText = async () => {
    if (!textInput.trim()) return;
    setLoading(true);
    try {
      const result = await apiClient.fetchApi('/ai/invoke', {
        method: "POST",
        body: JSON.stringify({
          prompt: `Extract all job posting details from the following job description text. Include company name, company logo URL (if mentioned), job title, location, salary range, employment type, experience level, whether it's remote, required skills, the job posting URL (if mentioned), application deadline, and any notable details. If a field is not present, return an empty string or empty array.\n\nJob description:\n${textInput}`,
        }),
      });
      setExtracted({ ...EMPTY_JOB, ...result, source: "text" });
    } catch (err) {
      toast({ title: "Extraction failed", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!extracted?.company?.trim()) {
      toast({ title: "Company name is required", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      await apiClient.fetchApi('/jobs', {
        method: "POST",
        body: JSON.stringify({
          ...extracted,
          skills: Array.isArray(extracted.skills) ? extracted.skills : [],
        }),
      });
      toast({ title: "Job added successfully" });
      handleClose(false);
    } catch (err) {
      toast({ title: "Failed to save job", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl bg-popover border-border text-popover-foreground">
        <DialogHeader>
          <DialogTitle className="text-foreground flex items-center gap-2 text-[15px]">
            {extracted ? (
              <>
                <Check className="w-4 h-4 text-emerald-500" />
                Review extracted details
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-chart-1" />
                Add a job
              </>
            )}
          </DialogTitle>
        </DialogHeader>

        {extracted ? (
          <ReviewForm
            extracted={extracted}
            setExtracted={setExtracted}
            loading={loading}
            onSave={handleSave}
            onReextract={() => { setExtracted(null); reset(); }}
          />
        ) : (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3 bg-muted border border-border">
              <TabsTrigger value="screenshot" className="data-[state=active]:bg-background text-muted-foreground data-[state=active]:text-foreground gap-1.5 text-[13px]">
                <Camera className="w-3.5 h-3.5" /> Screenshot
              </TabsTrigger>
              <TabsTrigger value="url" className="data-[state=active]:bg-background text-muted-foreground data-[state=active]:text-foreground gap-1.5 text-[13px]">
                <Link2 className="w-3.5 h-3.5" /> Job URL
              </TabsTrigger>
              <TabsTrigger value="text" className="data-[state=active]:bg-background text-muted-foreground data-[state=active]:text-foreground gap-1.5 text-[13px]">
                <ClipboardPaste className="w-3.5 h-3.5" /> Paste
              </TabsTrigger>
            </TabsList>

            <TabsContent value="screenshot" className="mt-4">
              <div className="space-y-3">
                <label className="flex flex-col items-center justify-center gap-2 border-2 border-dashed border-border rounded-lg py-8 cursor-pointer hover:border-muted-foreground/30 hover:bg-muted/30 transition-colors">
                  {screenshotFile ? (
                    <>
                      <Check className="w-5 h-5 text-emerald-500" />
                      <span className="text-[13px] text-foreground">{screenshotFile.name}</span>
                    </>
                  ) : (
                    <>
                      <Upload className="w-5 h-5 text-muted-foreground/50" />
                      <span className="text-[13px] text-muted-foreground">Click to upload a screenshot</span>
                      <span className="text-[11px] text-muted-foreground/60">PNG, JPG up to 10MB</span>
                    </>
                  )}
                  <input type="file" accept="image/*" className="hidden" onChange={handleScreenshotChange} />
                </label>
                <Button onClick={extractFromScreenshot} disabled={!screenshotFile || loading} className="w-full">
                  {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Sparkles className="w-4 h-4 mr-2" />}
                  {loading ? "Extracting..." : "Extract with AI"}
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="url" className="mt-4">
              <div className="space-y-3">
                <input
                  type="url"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  placeholder="https://jobs.company.com/senior-engineer"
                  className="w-full h-9 px-3 rounded-md bg-muted border border-border text-[13px] text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:border-ring focus:ring-1 focus:ring-ring"
                />
                <Button onClick={extractFromUrl} disabled={!urlInput.trim() || loading} className="w-full">
                  {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Sparkles className="w-4 h-4 mr-2" />}
                  {loading ? "Extracting..." : "Fetch & Extract"}
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="text" className="mt-4">
              <div className="space-y-3">
                <textarea
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                  placeholder="Paste the full job description here..."
                  rows={6}
                  className="w-full px-3 py-2 rounded-md bg-muted border border-border text-[13px] text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:border-ring focus:ring-1 focus:ring-ring resize-none"
                />
                <Button onClick={extractFromText} disabled={!textInput.trim() || loading} className="w-full">
                  {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Sparkles className="w-4 h-4 mr-2" />}
                  {loading ? "Extracting..." : "Extract with AI"}
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        )}
      </DialogContent>
    </Dialog>
  );
}

function ReviewForm({ extracted, setExtracted, loading, onSave, onReextract }) {
  const update = (field, value) =>
    setExtracted({ ...extracted, [field]: value });

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <Field label="Company" value={extracted.company} onChange={(v) => update("company", v)} required />
        <Field label="Job Title" value={extracted.job_title} onChange={(v) => update("job_title", v)} />
        <Field label="Location" value={extracted.location} onChange={(v) => update("location", v)} />
        <Field label="Salary" value={extracted.salary} onChange={(v) => update("salary", v)} />
        <Field label="Employment Type" value={extracted.employment_type} onChange={(v) => update("employment_type", v)} />
        <Field label="Experience" value={extracted.experience} onChange={(v) => update("experience", v)} />
        <Field label="Job URL" value={extracted.job_url} onChange={(v) => update("job_url", v)} />
        <Field label="Deadline" value={extracted.deadline} onChange={(v) => update("deadline", v)} type="date" />
      </div>

      <div className="flex items-center gap-2">
        <label className="flex items-center gap-2 text-[13px] text-muted-foreground">
          <input
            type="checkbox"
            checked={extracted.remote}
            onChange={(e) => update("remote", e.target.checked)}
            className="rounded border-border"
          />
          Remote
        </label>
        <div className="ml-auto flex items-center gap-2">
          <span className="text-[12px] text-muted-foreground">Status:</span>
          <Select value={extracted.status} onValueChange={(v) => update("status", v)}>
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

      {extracted.skills?.length > 0 && (
        <div>
          <label className="type-label mb-1.5 block">Skills</label>
          <div className="flex flex-wrap gap-1">
            {extracted.skills.map((skill, i) => (
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
          value={extracted.notes || ""}
          onChange={(e) => update("notes", e.target.value)}
          rows={2}
          className="w-full px-3 py-2 rounded-md bg-muted border border-border text-[13px] text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:border-ring focus:ring-1 focus:ring-ring resize-none"
        />
      </div>

      <div className="flex items-center gap-2 pt-1">
        <Button variant="outline" onClick={onReextract} className="border-border text-muted-foreground hover:bg-muted">
          Start over
        </Button>
        <Button onClick={onSave} disabled={loading} className="ml-auto">
          {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Check className="w-4 h-4 mr-2" />}
          Save job
        </Button>
      </div>
    </div>
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
