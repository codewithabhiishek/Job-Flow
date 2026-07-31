import { useAuth } from "@/lib/AuthContext";
import { Sun, Moon, Monitor, Download, Upload, LogOut, Bot } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/ui/use-toast";
import { apiClient } from "@/api/client";
import { useTheme } from "@/components/ThemeProvider";
import { motion } from "framer-motion";

export default function Settings() {
  const { user, logout } = useAuth();
  const { toast } = useToast();
  const { theme } = useTheme();

  const handleExport = async (format) => {
    try {
      const jobs = await apiClient.fetchApi('/jobs');
      if (format === "csv") {
        const headers = ["Company", "Role", "Location", "Salary", "Status", "Applied", "URL"];
        const rows = jobs.map((j) => [
          j.company, j.job_title, j.location, j.salary, j.status, j.applied_date, j.job_url,
        ]);
        const csv = [headers, ...rows]
          .map((r) => r.map((c) => `"${(c || "").replace(/"/g, '""')}"`).join(","))
          .join("\n");
        const blob = new Blob([csv], { type: "text/csv" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "jobflow-export.csv";
        a.click();
        URL.revokeObjectURL(url);
      }
      toast({ title: `Exported ${jobs.length} jobs as ${format.toUpperCase()}` });
    } catch (err) {
      toast({ title: "Export failed", description: err.message, variant: "destructive" });
    }
  };

  const handleImport = () => {
    toast({ title: "Import coming soon", description: "CSV/XLSX import will be available shortly." });
  };

  const initials = (user?.full_name || user?.email || "U")
    .split(" ")
    .map((s) => s[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const container = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.04 } }
  };
  const item = {
    hidden: { opacity: 0, y: 6 },
    show: { opacity: 1, y: 0, transition: { duration: 0.15 } }
  };

  const themeLabel = theme === "dark" ? "Dark" : theme === "light" ? "Light" : "System";
  const ThemeIcon = theme === "dark" ? Moon : theme === "light" ? Sun : Monitor;

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="p-6 max-w-2xl space-y-4">
      <motion.div variants={item}>
        <h1 className="type-page-title text-foreground">Settings</h1>
      </motion.div>

      {/* Profile */}
      <motion.div variants={item}>
        <Card title="Profile">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-[13px] font-medium text-muted-foreground">
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[14px] font-medium text-foreground truncate">
                {user?.full_name || user?.email?.split("@")[0] || "User"}
              </p>
              <p className="text-[12px] text-muted-foreground truncate">{user?.email}</p>
            </div>
            <button
              onClick={() => logout()}
              className="flex items-center gap-1.5 px-3 h-8 rounded-md border border-border text-muted-foreground text-[12px] font-medium hover:bg-muted transition-colors duration-150"
            >
              <LogOut className="w-3.5 h-3.5" strokeWidth={1.5} />
              Sign out
            </button>
          </div>
        </Card>
      </motion.div>

      {/* Appearance — read-only, change via header */}
      <motion.div variants={item}>
        <Card title="Appearance">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-md bg-muted flex items-center justify-center">
              <ThemeIcon className="w-3.5 h-3.5 text-muted-foreground" strokeWidth={1.5} />
            </div>
            <div>
              <p className="text-[13px] text-foreground font-medium">{themeLabel} mode</p>
              <p className="text-[12px] text-muted-foreground">Change theme using the toggle in the top bar</p>
            </div>
          </div>
        </Card>
      </motion.div>

      {/* AI Provider */}
      <motion.div variants={item}>
        <Card title="AI Provider">
          <p className="text-[13px] text-muted-foreground mb-2">
            Currently using <span className="text-foreground font-medium">Gemini 3 Flash</span> via the platform LLM key.
          </p>
          <div className="rounded-md bg-muted border border-border p-3 flex gap-3">
            <Bot className="w-4 h-4 text-chart-1 shrink-0 mt-0.5" strokeWidth={1.5} />
            <p className="text-[12px] text-muted-foreground leading-relaxed">
              The AI extraction layer is abstracted through the platform's InvokeLLM integration. You can switch models (Gemini, GPT, Claude) per request without UI changes.
            </p>
          </div>
        </Card>
      </motion.div>

      {/* Export & Import */}
      <motion.div variants={item}>
        <Card title="Data">
          <div className="flex flex-wrap gap-2">
            <ActionButton onClick={() => handleExport("csv")} icon={Download}>Export CSV</ActionButton>
            <ActionButton onClick={() => handleExport("xlsx")} icon={Download}>Export XLSX</ActionButton>
            <ActionButton onClick={handleImport} icon={Upload}>Import</ActionButton>
          </div>
        </Card>
      </motion.div>
    </motion.div>
  );
}

function Card({ title, children }) {
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <h3 className="text-[12px] font-medium text-muted-foreground uppercase tracking-wider mb-3">{title}</h3>
      {children}
    </div>
  );
}

function ActionButton({ onClick, icon: Icon, children }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-1.5 px-3 h-8 rounded-md bg-muted border border-border text-foreground/80 text-[12px] font-medium hover:bg-accent transition-colors duration-150"
    >
      <Icon className="w-3.5 h-3.5" strokeWidth={1.5} />
      {children}
    </button>
  );
}
