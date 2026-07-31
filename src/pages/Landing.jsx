import { Link } from "react-router-dom";
import {
  ArrowRight,
  Sparkles,
  Upload,
  LayoutGrid,
  Columns3,
  Calendar,
  BarChart3,
  Shield,
} from "lucide-react";
import Logo from "@/components/Logo";
import { STATUS_CONFIG } from "@/components/StatusBadge";
import { cn } from "@/lib/utils";

const PREVIEW_ROWS = [
  {
    company: "Razorpay",
    role: "Senior Product Engineer",
    location: "Bengaluru",
    salary: "₹45 LPA",
    status: "interview",
    applied: "3d ago",
  },
  {
    company: "Swiggy",
    role: "Design Engineer",
    location: "Remote",
    salary: "₹30 LPA",
    status: "applied",
    applied: "1w ago",
  },
  {
    company: "Meesho",
    role: "Full Stack Engineer",
    location: "Bengaluru",
    salary: "₹35 LPA",
    status: "online_assessment",
    applied: "4d ago",
  },
  {
    company: "Groww",
    role: "Growth Engineer",
    location: "Bengaluru",
    salary: "₹25 LPA",
    status: "saved",
    applied: "—",
  },
];

const FEATURES = [
  {
    icon: Upload,
    title: "AI Extraction",
    body: "Screenshots, URLs, or plain text — extracted in seconds.",
  },
  {
    icon: LayoutGrid,
    title: "Spreadsheet-fast",
    body: "Inline edits, sortable columns, sub-second filtering.",
  },
  {
    icon: Columns3,
    title: "Kanban board",
    body: "Drag applications across the pipeline like Linear issues.",
  },
  {
    icon: Calendar,
    title: "Interview calendar",
    body: "See every deadline and interview in one view.",
  },
  {
    icon: BarChart3,
    title: "Real analytics",
    body: "Response rate, interview rate, top companies, salary trends.",
  },
  {
    icon: Shield,
    title: "Private by default",
    body: "Only you see your jobs. Screenshots never stored.",
  },
];

export default function Landing() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Nav */}
      <nav className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <Logo size="lg" />
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity"
        >
          Open app <ArrowRight className="w-4 h-4" />
        </Link>
      </nav>

      {/* Hero */}
      <section className="max-w-3xl mx-auto px-6 pt-24 pb-16 text-center">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-muted border border-border text-[12px] font-medium text-muted-foreground mb-7 shadow-sm">
          <Sparkles className="w-3.5 h-3.5 text-chart-1" />
          AI-powered job tracker
        </div>
        <h1 className="text-[40px] leading-[1.1] font-bold text-foreground mb-6 tracking-tight">
          Track every application.<br />Type nothing.
        </h1>
        <p className="text-muted-foreground text-[16px] max-w-xl mx-auto mb-9 leading-relaxed">
          Drop a screenshot, paste a URL, or drop the description. JobFlow
          extracts, organizes, and follows up — so you can focus on landing the offer.
        </p>
        <div className="flex items-center justify-center gap-4">
          <Link
            to="/register"
            className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity shadow-sm"
          >
            Get started free <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            See how it works <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* Table Preview */}
      <section className="max-w-5xl mx-auto px-6 pb-24">
        <div className="rounded-xl border border-border overflow-hidden bg-card shadow-2xl dark:shadow-black/50">
          {/* Window bar */}
          <div className="h-10 flex items-center px-4 border-b border-border bg-muted/50 relative">
            <div className="flex gap-2">
              <div className="w-3 h-3 rounded-full bg-muted-foreground/30" />
              <div className="w-3 h-3 rounded-full bg-muted-foreground/30" />
              <div className="w-3 h-3 rounded-full bg-muted-foreground/30" />
            </div>
            <span className="absolute left-1/2 -translate-x-1/2 text-[12px] font-medium text-muted-foreground/70">
              jobflow.app / jobs
            </span>
          </div>
          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-table-text">
              <thead>
                <tr className="border-b border-border bg-muted/20">
                  {["COMPANY", "ROLE", "LOCATION", "SALARY", "STATUS", "APPLIED"].map((h) => (
                    <th key={h} className="px-4 py-3 type-table-head">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {PREVIEW_ROWS.map((row, i) => (
                  <tr key={i} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3 font-medium text-foreground">{row.company}</td>
                    <td className="px-4 py-3 text-muted-foreground">{row.role}</td>
                    <td className="px-4 py-3 text-muted-foreground">{row.location}</td>
                    <td className="px-4 py-3 text-foreground tnum">{row.salary}</td>
                    <td className="px-4 py-3">
                      <span className={cn("inline-block px-2 py-0.5 rounded-md text-[11px] font-medium", STATUS_CONFIG[row.status]?.className)}>
                        {STATUS_CONFIG[row.status]?.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground tnum">{row.applied}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-5xl mx-auto px-6 pb-32">
        <div className="text-center mb-12">
          <span className="type-label">Features</span>
          <h2 className="text-[28px] font-bold tracking-tight text-foreground mt-3">
            The last job tracker you'll ever need.
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {FEATURES.map((f, i) => {
            const Icon = f.icon;
            return (
              <div
                key={i}
                className="rounded-xl border border-border bg-card p-6 shadow-sm hover:shadow-card-hover dark:hover:shadow-card-dark-hover transition-all duration-200"
              >
                <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center mb-4">
                  <Icon className="w-4 h-4 text-chart-1" strokeWidth={1.5} />
                </div>
                <h3 className="type-card-title text-foreground mb-1.5">{f.title}</h3>
                <p className="text-[13px] text-muted-foreground leading-relaxed">{f.body}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-2xl mx-auto px-6 pb-32 text-center">
        <h2 className="text-[28px] font-bold tracking-tight text-foreground mb-4">
          Ready to stop losing track?
        </h2>
        <p className="text-muted-foreground mb-8 text-[15px] leading-relaxed">
          Sign in with Google, add your first job in under 10 seconds.
        </p>
        <Link
          to="/register"
          className="inline-flex items-center gap-1.5 px-6 py-3 rounded-full bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity shadow-sm"
        >
          Get started <ArrowRight className="w-4 h-4" />
        </Link>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8">
        <p className="text-center text-[12px] text-muted-foreground">
          © 2026 JobFlow — built for job seekers who take it seriously.
        </p>
      </footer>
    </div>
  );
}
