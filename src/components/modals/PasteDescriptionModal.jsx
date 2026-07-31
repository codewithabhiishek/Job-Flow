import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ClipboardPaste, Loader2, Sparkles } from "lucide-react";
import { apiClient } from "@/api/client";
import { useToast } from "@/components/ui/use-toast";

export default function PasteDescriptionModal({ open, onOpenChange, onExtract }) {
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleClose = (isOpen) => {
    if (!isOpen) {
      setText("");
      setLoading(false);
    }
    onOpenChange(isOpen);
  };

  const extract = async () => {
    if (!text.trim()) return;
    setLoading(true);
    try {
      const result = await apiClient.fetchApi('/ai/invoke', {
        method: "POST",
        body: JSON.stringify({
          method: "text",
          payload: text,
        }),
      });
      onExtract({ ...result, source: "text" });
      handleClose(false);
    } catch (err) {
      toast({ title: "Extraction failed", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-xl bg-popover border-border text-popover-foreground">
        <DialogHeader>
          <DialogTitle className="text-foreground flex items-center gap-2 text-[15px]">
            <ClipboardPaste className="w-4 h-4 text-chart-1" />
            Paste Job Description
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 mt-2">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Paste the complete job description here..."
            rows={10}
            className="w-full p-3 rounded-md bg-muted border border-border text-[13px] text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:border-ring focus:ring-1 focus:ring-ring resize-none"
            autoFocus
          />
          <Button onClick={extract} disabled={!text.trim() || loading} className="w-full h-10">
            {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Sparkles className="w-4 h-4 mr-2" />}
            {loading ? "Extracting..." : "Extract with AI"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
