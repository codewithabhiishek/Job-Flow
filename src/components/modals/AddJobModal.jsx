import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Camera, Link2, ClipboardPaste, Upload, Loader2, Sparkles, Check } from "lucide-react";
import { apiClient } from "@/api/client";
import { useToast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

const TABS = [
  { id: "screenshot", label: "Screenshot", icon: Camera },
  { id: "url", label: "Job URL", icon: Link2 },
  { id: "text", label: "Description", icon: ClipboardPaste },
];

export default function AddJobModal({ open, defaultTab = "screenshot", onOpenChange, onExtract }) {
  const [activeTab, setActiveTab] = useState(defaultTab);
  
  // State for Screenshot
  const [file, setFile] = useState(null);
  
  // State for URL
  const [url, setUrl] = useState("");
  
  // State for Description
  const [text, setText] = useState("");
  
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      setActiveTab(defaultTab);
    }
  }, [open, defaultTab]);

  const handleClose = (isOpen) => {
    if (!isOpen) {
      setFile(null);
      setUrl("");
      setText("");
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

  const handleExtract = async () => {
    setLoading(true);
    let payload = null;
    let method = activeTab;

    try {
      if (activeTab === "screenshot") {
        if (!file) return;
        payload = await toBase64(file);
      } else if (activeTab === "url") {
        if (!url.trim()) return;
        try {
          new URL(url);
        } catch {
          toast({ title: "Invalid URL", description: "Please enter a valid https:// URL.", variant: "destructive" });
          setLoading(false);
          return;
        }
        payload = url;
      } else if (activeTab === "text") {
        if (!text.trim()) return;
        payload = text;
      }

      const result = await apiClient.fetchApi('/ai/invoke', {
        method: "POST",
        body: JSON.stringify({ method, payload }),
      });

      if (result.success === false) {
        throw new Error(`${result.stage}: ${result.error}`);
      }

      const extractedPayload = { ...result, source: method };
      if (method === "url") extractedPayload.job_url = url;
      
      onExtract(extractedPayload);
      handleClose(false);
    } catch (err) {
      toast({ title: "Extraction failed", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const canExtract = () => {
    if (activeTab === "screenshot") return !!file;
    if (activeTab === "url") return !!url.trim();
    if (activeTab === "text") return !!text.trim();
    return false;
  };

  const buttonText = () => {
    if (loading) return activeTab === "url" ? "Fetching & Extracting..." : "Extracting...";
    return activeTab === "url" ? "Fetch & Extract" : "Extract with AI";
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-xl bg-popover border-border text-popover-foreground flex flex-col gap-0 p-0 overflow-hidden">
        
        {/* Header & Tabs */}
        <div className="p-6 pb-4 border-b border-border/50 bg-muted/20">
          <DialogHeader>
            <DialogTitle className="text-foreground text-[18px] font-semibold mb-4">
              Add New Job
            </DialogTitle>
          </DialogHeader>

          {/* Segmented Control */}
          <div className="flex p-1 space-x-1 bg-muted/50 rounded-xl border border-border/50">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "flex-1 relative flex items-center justify-center gap-2 py-2 text-sm font-medium rounded-lg transition-all duration-200",
                    isActive ? "text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                  )}
                >
                  {isActive && (
                    <motion.div
                      layoutId="activeTabIndicator"
                      className="absolute inset-0 bg-background rounded-lg shadow-sm border border-border/50"
                      transition={{ type: "spring", bounce: 0.15, duration: 0.5 }}
                    />
                  )}
                  <span className="relative z-10 flex items-center gap-2">
                    <Icon className="w-4 h-4" />
                    {tab.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Dynamic Content Area (Fixed Height to prevent jumping) */}
        <div className="p-6 flex-1 min-h-[280px] relative">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              transition={{ duration: 0.15 }}
              className="h-full flex flex-col"
            >
              {activeTab === "screenshot" && (
                <div className="flex-1 flex flex-col justify-center">
                  <label className="flex flex-col items-center justify-center gap-3 border-2 border-dashed border-border rounded-xl py-14 cursor-pointer hover:border-muted-foreground/40 hover:bg-muted/30 transition-colors">
                    {file ? (
                      <>
                        <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center">
                          <Check className="w-6 h-6 text-emerald-500" />
                        </div>
                        <div className="text-center">
                          <p className="text-[14px] text-foreground font-medium">{file.name}</p>
                          <p className="text-[12px] text-muted-foreground/60">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                          <Upload className="w-5 h-5 text-muted-foreground" />
                        </div>
                        <div className="text-center">
                          <p className="text-[14px] font-medium text-foreground">Click or drag to select screenshot</p>
                          <p className="text-[12px] text-muted-foreground/60 mt-1">Supports PNG, JPG, WEBP</p>
                        </div>
                      </>
                    )}
                    <input 
                      type="file" 
                      accept="image/png, image/jpeg, image/jpg, image/webp" 
                      className="hidden" 
                      onChange={(e) => setFile(e.target.files?.[0])} 
                    />
                  </label>
                </div>
              )}

              {activeTab === "url" && (
                <div className="flex-1 flex flex-col gap-2">
                  <label className="text-sm font-medium text-foreground">Job Posting URL</label>
                  <input
                    type="url"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="https://www.linkedin.com/jobs/view/..."
                    className="w-full h-12 px-4 rounded-xl bg-muted/50 border border-border text-[14px] text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-ring focus:ring-1 focus:ring-ring transition-shadow"
                    autoFocus
                  />
                  <p className="text-xs text-muted-foreground/80 mt-2">
                    Works best with LinkedIn, Indeed, Greenhouse, Lever, and standard company careers pages.
                  </p>
                </div>
              )}

              {activeTab === "text" && (
                <div className="flex-1 flex flex-col gap-2 h-full">
                  <label className="text-sm font-medium text-foreground">Raw Job Description</label>
                  <textarea
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder="Copy and paste the entire job description here..."
                    className="w-full flex-1 min-h-[200px] p-4 rounded-xl bg-muted/50 border border-border text-[13px] text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-ring focus:ring-1 focus:ring-ring resize-none transition-shadow leading-relaxed"
                    autoFocus
                  />
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Footer */}
        <div className="p-6 pt-4 border-t border-border/50 bg-muted/10">
          <Button 
            onClick={handleExtract} 
            disabled={!canExtract() || loading} 
            className="w-full h-12 text-[15px] shadow-sm"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <Sparkles className="w-5 h-5 mr-2" />}
            {buttonText()}
          </Button>
        </div>
        
      </DialogContent>
    </Dialog>
  );
}
