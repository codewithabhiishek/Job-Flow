import { useAuth } from "@/lib/AuthContext";
import { useClerk } from "@clerk/clerk-react";
import { Download, Upload, LogOut, Bot, Key, Settings as SettingsIcon } from "lucide-react";
import { motion } from "framer-motion";

export default function Settings() {
  const { user, logout } = useAuth();
  const clerk = useClerk();

  const initials = (user?.first_name || user?.email || "U")
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

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="p-6 max-w-2xl space-y-6">
      <motion.div variants={item}>
        <h1 className="type-page-title text-foreground">Settings</h1>
      </motion.div>

      {/* Profile */}
      <motion.div variants={item}>
        <Card title="Profile">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center text-[13px] font-medium text-muted-foreground overflow-hidden shrink-0">
              {user?.avatar_url ? (
                <img src={user.avatar_url} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                initials
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[14px] font-semibold text-foreground truncate">
                {user?.first_name ? `${user.first_name} ${user.last_name || ""}` : user?.email?.split("@")[0] || "User"}
              </p>
              <p className="text-[13px] text-muted-foreground truncate">{user?.email}</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => clerk.openUserProfile()}
                className="flex items-center gap-1.5 px-3 h-8 rounded-md bg-muted text-foreground text-[12px] font-medium hover:bg-accent transition-colors duration-150"
              >
                <SettingsIcon className="w-3.5 h-3.5" strokeWidth={1.5} />
                Manage Account
              </button>
              <button
                onClick={() => logout()}
                className="flex items-center gap-1.5 px-3 h-8 rounded-md border border-border text-muted-foreground text-[12px] font-medium hover:bg-muted transition-colors duration-150"
              >
                <LogOut className="w-3.5 h-3.5" strokeWidth={1.5} />
                Sign out
              </button>
            </div>
          </div>
        </Card>
      </motion.div>

      {/* AI Provider */}
      <motion.div variants={item}>
        <Card title="AI Provider">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-[13px] text-foreground font-medium flex items-center gap-2">
                <Bot className="w-4 h-4 text-primary" strokeWidth={1.5} />
                Current: Default Platform AI
              </p>
              <p className="text-[12px] text-muted-foreground mt-1">
                Use the default AI service or connect your own API key.
              </p>
            </div>
            <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-semibold uppercase tracking-wider">
              Coming Soon
            </span>
          </div>

          <div className="rounded-md border border-border/50 bg-muted/30 p-4 space-y-4 opacity-70 pointer-events-none relative">
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/40 backdrop-blur-[1px] rounded-md">
              <span className="bg-background border border-border px-3 py-1.5 rounded-md text-[12px] font-medium text-foreground shadow-sm flex items-center gap-2">
                <Key className="w-3.5 h-3.5" />
                Bring Your Own API Key (Coming Soon)
              </span>
            </div>
            
            <div className="space-y-1.5">
              <label className="text-[12px] font-medium text-foreground">Select Provider</label>
              <select disabled className="w-full h-9 px-3 rounded-md border border-border bg-background text-[13px] text-foreground opacity-50">
                <option>NVIDIA NIM</option>
                <option>OpenAI</option>
                <option>Anthropic</option>
                <option>Gemini</option>
              </select>
            </div>
            
            <div className="space-y-1.5">
              <label className="text-[12px] font-medium text-foreground">API Key</label>
              <input 
                type="password" 
                disabled 
                placeholder="sk-..." 
                className="w-full h-9 px-3 rounded-md border border-border bg-background text-[13px] opacity-50" 
              />
            </div>
            
            <button disabled className="w-full h-9 rounded-md bg-primary text-primary-foreground text-[13px] font-medium opacity-50">
              Save Key
            </button>
          </div>
        </Card>
      </motion.div>

      {/* Export & Import */}
      <motion.div variants={item}>
        <Card title="Data">
          <div className="flex flex-wrap gap-2">
            <ActionButton disabled icon={Download}>Export CSV (Coming Soon)</ActionButton>
            <ActionButton disabled icon={Download}>Export XLSX (Coming Soon)</ActionButton>
            <ActionButton disabled icon={Upload}>Import (Coming Soon)</ActionButton>
          </div>
        </Card>
      </motion.div>
    </motion.div>
  );
}

function Card({ title, children }) {
  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
      <h3 className="text-[12px] font-bold text-muted-foreground uppercase tracking-wider mb-4">{title}</h3>
      {children}
    </div>
  );
}

function ActionButton({ icon: Icon, children, disabled }) {
  return (
    <button
      disabled={disabled}
      className={`flex items-center gap-1.5 px-3 h-8 rounded-md border text-[12px] font-medium transition-colors duration-150 ${
        disabled 
          ? "bg-muted/50 border-border/50 text-muted-foreground cursor-not-allowed"
          : "bg-background border-border text-foreground hover:bg-muted"
      }`}
    >
      <Icon className="w-3.5 h-3.5" strokeWidth={1.5} />
      {children}
    </button>
  );
}
