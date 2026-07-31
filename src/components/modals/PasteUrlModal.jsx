import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Link2, Loader2, Sparkles } from "lucide-react";
import { apiClient } from "@/api/client";
import { useToast } from "@/components/ui/use-toast";

export default function PasteUrlModal({ open, onOpenChange, onExtract }) {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleClose = (isOpen) => {
    if (!isOpen) {
      setUrl("");
      setLoading(false);
    }
    onOpenChange(isOpen);
  };

  const extract = async () => {
    if (!url.trim()) return;
    try {
      new URL(url);
    } catch {
      toast({ title: "Invalid URL", description: "Please enter a valid https:// URL.", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      const result = await apiClient.fetchApi('/ai/invoke', {
        method: "POST",
        body: JSON.stringify({
          method: "url",
          payload: url,
        }),
      });
      onExtract({ ...result, job_url: url, source: "url" });
      handleClose(false);
    } catch (err) {
      toast({ title: "Extraction failed", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md bg-popover border-border text-popover-foreground">
        <DialogHeader>
          <DialogTitle className="text-foreground flex items-center gap-2 text-[15px]">
            <Link2 className="w-4 h-4 text-chart-1" />
            Paste Job URL
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 mt-2">
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="Paste a LinkedIn, Indeed, Greenhouse, Lever or company careers URL..."
            className="w-full h-10 px-3 rounded-md bg-muted border border-border text-[13px] text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:border-ring focus:ring-1 focus:ring-ring"
            autoFocus
          />
          <Button onClick={extract} disabled={!url.trim() || loading} className="w-full h-10">
            {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Sparkles className="w-4 h-4 mr-2" />}
            {loading ? "Fetching & Extracting..." : "Fetch & Extract"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
