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
    location: "Remote (India)",
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

const STATUS_STYLES = {
  interview: "bg-emerald-950 text-emerald-400",
  applied: "bg-indigo-950 text-indigo-400",
  online_assessment: "bg-orange-950 text-orange-400",
  saved: "bg-neutral-800 text-neutral-300",
};

const STATUS_LABELS = {
  interview: "Interview",
  applied: "Applied",
  online_assessment: "Online Assessment",
  saved: "Saved",
};

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
    <div className="min-h-screen bg-neutral-950 text-neutral-100">
      {/* Nav */}
      <nav className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <Logo size="lg" className="text-white" />
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-white text-neutral-950 text-sm font-semibold tracking-[-0.005em] hover:bg-neutral-200 transition-colors duration-200"
        >
          Open app <ArrowRight className="w-4 h-4" />
        </Link>
      </nav>

      {/* Hero */}
      <section className="max-w-3xl mx-auto px-6 pt-24 pb-16 text-center">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-neutral-900 border border-white/[0.08] text-xs text-neutral-400 mb-7">
          <Sparkles className="w-3 h-3 text-blue-400" />
          AI-powered job tracker
        </div>
        <h1 className="type-h1 text-neutral-100 mb-6">
          Track every application.
          <br />
          Type nothing.
        </h1>
        <p className="text-neutral-400 text-lg max-w-xl mx-auto mb-9 leading-[1.6] font-normal">
          Drop a screenshot, paste a URL, or drop the description. JobFlow
          extracts, organizes, and follows up — so you can focus on landing the
          offer.
        </p>
        <div className="flex items-center justify-center gap-4">
          <Link
            to="/register"
            className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full bg-white text-neutral-950 text-sm font-semibold tracking-[-0.005em] hover:bg-neutral-200 transition-colors duration-200"
          >
            Get started free <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-1 text-sm text-neutral-400 hover:text-neutral-200 transition-colors duration-200"
          >
            See how it works <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* Table Preview */}
      <section className="max-w-5xl mx-auto px-6 pb-24">
        <div className="rounded-xl border border-white/[0.08] overflow-hidden bg-neutral-950 shadow-2xl shadow-black/50">
          {/* Window bar */}
          <div className="h-9 flex items-center px-4 border-b border-white/[0.08] bg-neutral-950 relative">
            <div className="flex gap-2">
              <div className="w-3 h-3 rounded-full bg-neutral-700" />
              <div className="w-3 h-3 rounded-full bg-neutral-700" />
              <div className="w-3 h-3 rounded-full bg-neutral-700" />
            </div>
            <span className="absolute left-1/2 -translate-x-1/2 text-xs text-neutral-600">
              jobflow.app / jobs
            </span>
          </div>
          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/[0.06]">
                  {[
                    "COMPANY",
                    "ROLE",
                    "LOCATION",
                    "SALARY",
                    "STATUS",
                    "APPLIED",
                  ].map((h) => (
                    <th
                      key={h}
                      className="text-left px-4 py-2.5 type-table-head"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {PREVIEW_ROWS.map((row, i) => (
                  <tr
                    key={i}
                    className="border-b border-white/[0.06] last:border-0"
                  >
                    <td className="px-4 py-3 font-medium text-neutral-200">
                      {row.company}
                    </td>
                    <td className="px-4 py-3 text-neutral-400">{row.role}</td>
                    <td className="px-4 py-3 text-neutral-400">
                      {row.location}
                    </td>
                    <td className="px-4 py-3 text-neutral-400">{row.salary}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-md text-[11px] font-medium ${STATUS_STYLES[row.status]}`}
                      >
                        {STATUS_LABELS[row.status]}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-neutral-500">
                      {row.applied}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-5xl mx-auto px-6 pb-32">
        <div className="text-center mb-14">
          <span className="type-label">Features</span>
          <h2 className="type-h2 text-neutral-100 mt-3">
            The last job tracker you'll ever need.
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {FEATURES.map((f, i) => {
            const Icon = f.icon;
            return (
              <div
                key={i}
                className="rounded-xl border border-white/[0.08] bg-neutral-900/50 p-6 hover:border-neutral-700 transition-colors duration-200"
              >
                <div className="w-9 h-9 rounded-lg bg-neutral-800 flex items-center justify-center mb-4">
                  <Icon className="w-4 h-4 text-blue-400" strokeWidth={1.5} />
                </div>
                <h3 className="type-card-title text-neutral-100 mb-1.5">
                  {f.title}
                </h3>
                <p className="type-body-sm text-neutral-500">{f.body}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-2xl mx-auto px-6 pb-32 text-center">
        <h2 className="type-h2 text-neutral-100 mb-3">
          Ready to stop losing track?
        </h2>
        <p className="text-neutral-400 mb-7 text-[15px] leading-[1.6]">
          Sign in with Google, add your first job in under 10 seconds.
        </p>
        <Link
          to="/register"
          className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full bg-white text-neutral-950 text-sm font-semibold tracking-[-0.005em] hover:bg-neutral-200 transition-colors duration-200"
        >
          Get started <ArrowRight className="w-4 h-4" />
        </Link>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/[0.06] py-6">
        <p className="text-center text-xs text-neutral-600">
          © 2026 JobFlow — built for job seekers who take it seriously.
        </p>
      </footer>
    </div>
  );
}
