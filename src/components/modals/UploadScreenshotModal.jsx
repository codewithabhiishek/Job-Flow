import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Camera, Upload, Loader2, Sparkles, Check } from "lucide-react";
import { apiClient } from "@/api/client";
import { useToast } from "@/components/ui/use-toast";

export default function UploadScreenshotModal({ open, onOpenChange, onExtract }) {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleClose = (isOpen) => {
    if (!isOpen) {
      setFile(null);
      setLoading(false);
    }
    onOpenChange(isOpen);
  };

  const toBase64 = (file) => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = error => reject(error);
  });

  const extract = async () => {
    if (!file) return;
    setLoading(true);
    try {
      const base64 = await toBase64(file);
      const result = await apiClient.fetchApi('/ai/invoke', {
        method: "POST",
        body: JSON.stringify({
          method: "screenshot",
          payload: base64,
        }),
      });
      onExtract({ ...result, source: "screenshot" });
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
            <Camera className="w-4 h-4 text-chart-1" />
            Upload Screenshot
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 mt-2">
          <label className="flex flex-col items-center justify-center gap-2 border-2 border-dashed border-border rounded-lg py-12 cursor-pointer hover:border-muted-foreground/30 hover:bg-muted/30 transition-colors">
            {file ? (
              <>
                <Check className="w-6 h-6 text-emerald-500" />
                <span className="text-[14px] text-foreground font-medium">{file.name}</span>
                <span className="text-[12px] text-muted-foreground/60">{(file.size / 1024 / 1024).toFixed(2)} MB</span>
              </>
            ) : (
              <>
                <Upload className="w-6 h-6 text-muted-foreground/50" />
                <span className="text-[14px] font-medium text-foreground">Click to select screenshot</span>
                <span className="text-[12px] text-muted-foreground/60">PNG, JPG, WEBP</span>
              </>
            )}
            <input 
              type="file" 
              accept="image/png, image/jpeg, image/jpg, image/webp" 
              className="hidden" 
              onChange={(e) => setFile(e.target.files?.[0])} 
            />
          </label>
          <Button onClick={extract} disabled={!file || loading} className="w-full h-10">
            {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Sparkles className="w-4 h-4 mr-2" />}
            {loading ? "Extracting..." : "Extract with AI"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
