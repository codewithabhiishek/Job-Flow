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
      
      // Pass data to AppLayout to open ReviewJobModal
      onExtract(extractedPayload);
      
      // Clean up local state for the next time it opens
      setFile(null);
      setUrl("");
      setText("");
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
        <div className="p-6 pb-6 border-b border-border/50 bg-muted/10">
          <DialogHeader>
            <DialogTitle className="text-foreground text-[18px] font-semibold mb-6">
              Add New Job
            </DialogTitle>
          </DialogHeader>

          {/* Segmented Control */}
          <div className="flex p-1.5 space-x-1 bg-muted/40 rounded-[14px] border border-border/40">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <motion.button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  whileHover={{ scale: 1.01, backgroundColor: isActive ? "" : "rgba(255,255,255,0.03)" }}
                  whileTap={{ scale: 0.98 }}
                  className={cn(
                    "flex-1 relative flex items-center justify-center gap-2.5 py-2.5 rounded-[10px] transition-colors duration-200 outline-none cursor-pointer",
                    isActive ? "text-foreground font-semibold" : "text-muted-foreground font-normal hover:text-foreground/90"
                  )}
                >
                  {isActive && (
                    <motion.div
                      layoutId="activeTabIndicator"
                      className="absolute inset-0 bg-popover rounded-[10px] shadow-sm border border-border/60"
                      transition={{ type: "spring", bounce: 0.15, duration: 0.4 }}
                    />
                  )}
                  <span className="relative z-10 flex items-center gap-2">
                    <Icon 
                      className={cn(
                        "w-[18px] h-[18px] transition-colors duration-200", 
                        isActive ? "text-foreground" : "text-muted-foreground/80"
                      )} 
                      strokeWidth={isActive ? 2.5 : 2} 
                    />
                    <span className="text-[14px] leading-none">{tab.label}</span>
                  </span>
                </motion.button>
              );
            })}
          </div>
        </div>

        {/* Dynamic Content Area (Fixed Height to prevent jumping) */}
        <div className="px-8 py-6 flex-1 min-h-[280px] relative flex flex-col">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              transition={{ duration: 0.15 }}
              className="h-full flex-1 flex flex-col justify-center"
            >
              {activeTab === "screenshot" && (
                <div className="flex-1 flex flex-col justify-center">
                  <label className="flex flex-col items-center justify-center gap-3 border-2 border-dashed border-border rounded-[14px] py-16 cursor-pointer hover:border-muted-foreground/40 hover:bg-muted/30 transition-colors">
                    {file ? (
                      <>
                        <div className="w-14 h-14 rounded-full bg-emerald-500/10 flex items-center justify-center">
                          <Check className="w-7 h-7 text-emerald-500" />
                        </div>
                        <div className="text-center mt-2">
                          <p className="text-[15px] text-foreground font-semibold">{file.name}</p>
                          <p className="text-[13px] text-muted-foreground/80 mt-0.5">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="w-14 h-14 rounded-full bg-muted/60 flex items-center justify-center">
                          <Upload className="w-6 h-6 text-muted-foreground/80" />
                        </div>
                        <div className="text-center mt-2">
                          <p className="text-[15px] font-semibold text-foreground">Click or drag to select screenshot</p>
                          <p className="text-[13px] text-muted-foreground/70 mt-1">Supports PNG, JPG, WEBP</p>
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
                <div className="flex-1 flex flex-col justify-center gap-3">
                  <label className="text-[15px] font-semibold text-foreground">Job Posting URL</label>
                  <input
                    type="url"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="https://www.linkedin.com/jobs/view/..."
                    className="w-full h-[52px] px-5 rounded-[12px] bg-muted/30 border border-border text-[15px] text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-ring focus:ring-1 focus:ring-ring transition-shadow"
                    autoFocus
                  />
                  <p className="text-[13px] text-muted-foreground/80 mt-1 leading-relaxed">
                    Works best with LinkedIn, Indeed, Greenhouse, Lever, and standard company careers pages.
                  </p>
                </div>
              )}

              {activeTab === "text" && (
                <div className="flex-1 flex flex-col gap-3 h-full justify-center">
                  <label className="text-[15px] font-semibold text-foreground">Raw Job Description</label>
                  <textarea
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder="Copy and paste the entire job description here..."
                    className="w-full flex-1 min-h-[180px] p-5 rounded-[12px] bg-muted/30 border border-border text-[14px] text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-ring focus:ring-1 focus:ring-ring resize-none transition-shadow leading-relaxed"
                    autoFocus
                  />
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Footer */}
        <div className="p-8 pt-4 border-t border-border/50 bg-muted/10">
          <Button 
            onClick={handleExtract} 
            disabled={!canExtract() || loading} 
            className="w-full h-[52px] text-[15px] font-semibold shadow-sm rounded-[12px]"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <Sparkles className="w-5 h-5 mr-2" />}
            {buttonText()}
          </Button>
        </div>
        
      </DialogContent>
    </Dialog>
  );
}
