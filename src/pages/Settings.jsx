import { useState, useEffect } from "react";
import { useAuth } from "@/lib/AuthContext";
import { Sun, Moon, Download, Upload, LogOut, Bot, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/ui/use-toast";
import { apiClient } from "@/api/client";

export default function Settings() {
  const { user, logout } = useAuth();
  const { toast } = useToast();
  const [theme, setTheme] = useState("dark");

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [theme]);

  const handleExport = async (format) => {
    try {
      const jobs = await apiClient.fetchApi('/jobs');
      if (format === "csv") {
        const headers = [
          "Company",
          "Role",
          "Location",
          "Salary",
          "Status",
          "Applied",
          "URL",
        ];
        const rows = jobs.map((j) => [
          j.company,
          j.job_title,
          j.location,
          j.salary,
          j.status,
          j.applied_date,
          j.job_url,
        ]);
        const csv = [headers, ...rows]
          .map((r) =>
            r.map((c) => `"${(c || "").replace(/"/g, '""')}"`).join(","),
          )
          .join("\n");
        const blob = new Blob([csv], { type: "text/csv" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "jobflow-export.csv";
        a.click();
        URL.revokeObjectURL(url);
      }
      toast({
        title: `Exported ${jobs.length} jobs as ${format.toUpperCase()}`,
      });
    } catch (err) {
      toast({
        title: "Export failed",
        description: err.message,
        variant: "destructive",
      });
    }
  };

  const handleImport = () => {
    toast({
      title: "Import coming soon",
      description: "CSV/XLSX import will be available shortly.",
    });
  };

  const initials = (user?.full_name || user?.email || "U")
    .split(" ")
    .map((s) => s[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="p-8 max-w-3xl space-y-5">
      <div>
        <h2 className="type-label mb-1.5">Preferences</h2>
        <h1 className="type-page-title text-neutral-100">Settings</h1>
      </div>

      {/* Profile */}
      <Card title="Profile">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-neutral-800 flex items-center justify-center text-sm font-medium text-neutral-300">
            {initials}
          </div>
          <div className="flex-1">
            <p className="type-card-title text-neutral-100">
              {user?.full_name || user?.email?.split("@")[0] || "User"}
            </p>
            <p className="type-body-sm text-neutral-500">{user?.email}</p>
          </div>
          <button
            onClick={() => logout()}
            className="flex items-center gap-1.5 px-3 h-8 rounded-md border border-white/[0.08] text-neutral-300 text-xs hover:bg-neutral-900 transition-colors duration-200"
          >
            <LogOut className="w-3.5 h-3.5" strokeWidth={1.5} />
            Sign out
          </button>
        </div>
      </Card>

      {/* Appearance */}
      <Card title="Appearance">
        <div className="flex items-center gap-2 p-1 rounded-lg bg-neutral-900 border border-white/[0.08] w-fit">
          <button
            onClick={() => setTheme("light")}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors duration-200",
              theme === "light"
                ? "bg-white text-neutral-950"
                : "text-neutral-400 hover:text-neutral-200",
            )}
          >
            <Sun className="w-3.5 h-3.5" strokeWidth={1.5} />
            Light
          </button>
          <button
            onClick={() => setTheme("dark")}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors duration-200",
              theme === "dark"
                ? "bg-white text-neutral-950"
                : "text-neutral-400 hover:text-neutral-200",
            )}
          >
            <Moon className="w-3.5 h-3.5" strokeWidth={1.5} />
            Dark
          </button>
        </div>
      </Card>

      {/* AI Provider */}
      <Card title="AI Provider">
        <p className="type-body-sm text-neutral-400 mb-3">
          Currently using{" "}
          <span className="text-neutral-200 font-medium">Gemini 3 Flash</span>{" "}
          via the platform LLM key.
        </p>
        <div className="rounded-md bg-neutral-900 border border-white/[0.08] p-3 flex gap-3">
          <Bot
            className="w-4 h-4 text-blue-400 shrink-0 mt-0.5"
            strokeWidth={1.5}
          />
          <p className="type-body-sm text-neutral-500">
            The AI extraction layer is abstracted through the platform's
            InvokeLLM integration. You can switch models (Gemini, GPT, Claude)
            per request without UI changes. To use a custom provider key,
            configure it in your backend environment — the provider interface
            stays the same.
          </p>
        </div>
      </Card>

      {/* Export & Import */}
      <Card title="Export & Import">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => handleExport("csv")}
            className="flex items-center gap-1.5 px-3 h-8 rounded-md bg-neutral-900 border border-white/[0.08] text-neutral-300 text-xs hover:bg-neutral-800 transition-colors duration-200"
          >
            <Download className="w-3.5 h-3.5" strokeWidth={1.5} />
            Export CSV
          </button>
          <button
            onClick={() => handleExport("xlsx")}
            className="flex items-center gap-1.5 px-3 h-8 rounded-md bg-neutral-900 border border-white/[0.08] text-neutral-300 text-xs hover:bg-neutral-800 transition-colors duration-200"
          >
            <Download className="w-3.5 h-3.5" strokeWidth={1.5} />
            Export XLSX
          </button>
          <button
            onClick={handleImport}
            className="flex items-center gap-1.5 px-3 h-8 rounded-md bg-neutral-900 border border-white/[0.08] text-neutral-300 text-xs hover:bg-neutral-800 transition-colors duration-200"
          >
            <Upload className="w-3.5 h-3.5" strokeWidth={1.5} />
            Import CSV/XLSX
          </button>
        </div>
      </Card>
    </div>
  );
}

function Card({ title, children }) {
  return (
    <div className="rounded-xl border border-white/[0.06] bg-neutral-950 p-6">
      <h3 className="type-label mb-3">{title}</h3>
      {children}
    </div>
  );
}
