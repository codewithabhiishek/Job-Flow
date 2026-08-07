import { useState, useEffect, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Camera, Link2, ClipboardPaste, Upload, Loader2, Sparkles, Check } from "lucide-react";
import { apiClient } from "@/api/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

const TABS = [
  { id: "screenshot", label: "Screenshot", icon: Camera },
  { id: "url", label: "Job URL", icon: Link2 },
  { id: "text", label: "Description", icon: ClipboardPaste },
];

const ACCEPTED_TYPES = ["image/png", "image/jpeg", "image/webp"];
const MAX_INPUT_FILE_MB = 20;

export default function AddJobModal({ open, defaultTab = "screenshot", onOpenChange, onExtract }) {
  // Always initialise to "screenshot" — never rely on a useEffect to set this
  // after the first render, which causes the dropzone to flash invisible.
  const [activeTab, setActiveTab] = useState("screenshot");

  // State for Screenshot
  const [file, setFile] = useState(null);

  // State for URL
  const [url, setUrl] = useState("");

  // State for Description
  const [text, setText] = useState("");

  const [loading, setLoading] = useState(false);

  // Tracks whether the dialog is still open across async work, so a completed
  // extraction never re-opens the Review modal after the user already closed it.
  const openRef = useRef(open);
  useEffect(() => {
    openRef.current = open;
  }, [open]);

  // Client-side file guard: validate type and size before compression so we never
  // read an unsupported/huge file into memory or surface a confusing canvas error.
  const handleFileChange = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!ACCEPTED_TYPES.includes(f.type)) {
      toast.error("Unsupported file type", { description: "Please upload a PNG, JPG, or WEBP screenshot." });
      e.target.value = "";
      return;
    }
    if (f.size > MAX_INPUT_FILE_MB * 1024 * 1024) {
      toast.error("File too large", { description: `Please upload a screenshot under ${MAX_INPUT_FILE_MB} MB.` });
      e.target.value = "";
      return;
    }
    setFile(f);
  };

  // When the modal re-opens, reset to the correct default tab.
  // We track the PREVIOUS open value so we only fire on the false→true transition,
  // not on every render while it is already open.
  const prevOpen = useRef(false);
  useEffect(() => {
    if (open && !prevOpen.current) {
      setActiveTab(defaultTab ?? "screenshot");
      setFile(null);
      setUrl("");
      setText("");
      setLoading(false);
    }
    prevOpen.current = open;
  }, [open, defaultTab]);

  const handleClose = (isOpen) => {
    // State is now reset in the useEffect above on the next open,
    // so we don't need to duplicate it here — but we keep the guard
    // for immediate visual cleanup when the dialog closes.
    if (!isOpen) {
      setLoading(false);
    }
    onOpenChange(isOpen);
  };

  const toBase64 = async (file) => {
    console.log(`[Compression] Original file size: ${(file.size / 1024 / 1024).toFixed(2)} MB`);
    
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          
          const maxDimension = 1600;
          if (width > maxDimension || height > maxDimension) {
            const ratio = Math.min(maxDimension / width, maxDimension / height);
            width *= ratio;
            height *= ratio;
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(0, 0, width, height);
          ctx.drawImage(img, 0, 0, width, height);

          const MAX_BASE64_SIZE = 3.8 * 1024 * 1024; // 3.8 MB (safely below 4.5MB limit)
          let quality = 0.8;
          let compressedBase64 = canvas.toDataURL('image/jpeg', quality);
          
          while (compressedBase64.length > MAX_BASE64_SIZE && quality > 0.1) {
            quality -= 0.1;
            compressedBase64 = canvas.toDataURL('image/jpeg', quality);
          }

          console.log(`[Compression] Final Quality: ${quality.toFixed(1)}`);
          console.log(`[Compression] Base64 size: ${(compressedBase64.length / 1024 / 1024).toFixed(2)} MB`);
          
          const estimatedPayloadSize = compressedBase64.length + 500;
          console.log(`[Compression] Estimated HTTP payload size: ${(estimatedPayloadSize / 1024 / 1024).toFixed(2)} MB`);

          if (compressedBase64.length > MAX_BASE64_SIZE) {
            reject(new Error("Image is too large. Please upload a smaller screenshot."));
            return;
          }

          resolve(compressedBase64);
        };
        img.onerror = () => reject(new Error("Failed to process image."));
        img.src = e.target.result;
      };
      reader.onerror = error => reject(error);
    });
  };

  const handleExtract = async () => {
    // Button is disabled when empty, but guard defensively so we never leave
    // the loading state stuck on an empty submission.
    if (!canExtract()) {
      setLoading(false);
      return;
    }
    setLoading(true);
    let payload = null;
    let method = activeTab;

    try {
      if (activeTab === "screenshot") {
        payload = await toBase64(file);
      } else if (activeTab === "url") {
        try {
          new URL(url);
        } catch {
          toast.error("Invalid URL", { description: "Please enter a valid https:// URL." });
          setLoading(false);
          return;
        }
        payload = url;
      } else if (activeTab === "text") {
        payload = text;
      }

      console.log(`[AI Invocation] Sending request...`);
      const result = await apiClient.fetchApi('/ai/invoke', {
        method: 'POST',
        body: JSON.stringify({
          method,
          payload
        })
      });
      console.log(`[AI Invocation] Success. Extracted data received.`);

      console.log("[DEBUG] Fetch API complete. Raw result:", result);

      if (result && result.success === false) {
        console.log("[DEBUG] Result indicates failure. Throwing error.");
        throw new Error(`${result.stage}: ${result.error}`);
      }

      const extractedPayload = { ...result };
      
      if (method === "url") {
        extractedPayload.job_url = url;
      }

      // The API applies canonical source detection and normalization to every input type.
      console.log("[DEBUG] Payload prepared for onExtract:", extractedPayload);

      // Pass data to AppLayout to open ReviewJobModal — but only if this dialog
      // is still open (the user may have closed it during the network call).
      if (openRef.current) {
        console.log("[DEBUG] Calling onExtract...");
        onExtract(extractedPayload);
      }

      // Clean up local state for the next time it opens
      setFile(null);
      setUrl("");
      setText("");
    } catch (err) {
      console.error("[DEBUG] Exception caught in handleExtract:", err);
      toast.error("Extraction failed", { description: err.message });
    } finally {
      console.log("[DEBUG] Finally block executed. Setting loading=false.");
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
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.12 }}
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
                      onChange={handleFileChange}
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
