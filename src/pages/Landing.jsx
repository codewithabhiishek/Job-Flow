import { useState, useEffect } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "@clerk/clerk-react";
import {
  ArrowRight,
  Sparkles,
  Upload,
  LayoutGrid,
  Columns3,
  Calendar,
  BarChart3,
  Shield,
  SearchCode,
  Pencil,
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

const HOW_IT_WORKS = [
  {
    icon: Upload,
    title: "1. Capture",
    description: "Upload a screenshot, paste a URL, or drop the raw job description.",
  },
  {
    icon: SearchCode,
    title: "2. Extract",
    description: "AI instantly pulls out the company, role, salary, location, and skills.",
  },
  {
    icon: Pencil,
    title: "3. Review",
    description: "Verify the extracted data and make any quick inline edits before saving.",
  },
  {
    icon: BarChart3,
    title: "4. Track",
    description: "Manage applications with Kanban, reminders, and powerful analytics.",
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

// Animation Variants
const FADE_UP = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } },
};

const STAGGER = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

export default function Landing() {
  const { isSignedIn, isLoaded } = useAuth();
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  if (isLoaded && isSignedIn) {
    return <Navigate to="/dashboard" replace />;
  }

  const scrollToHowItWorks = (e) => {
    e.preventDefault();
    document.getElementById("how-it-works")?.scrollIntoView({ behavior: "smooth" });
  };

  const handlePrimaryCta = (e) => {
    e.preventDefault();
    if (!isLoaded) return;
    navigate("/register");
  };

  const handleOpenAppCta = (e) => {
    e.preventDefault();
    if (!isLoaded) return;
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      {/* Nav */}
      <motion.nav
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className={cn(
          "fixed top-0 left-0 right-0 z-50 transition-all duration-300 border-b",
          scrolled
            ? "h-16 bg-background/80 backdrop-blur-md border-border shadow-sm"
            : "h-20 bg-transparent border-transparent"
        )}
      >
        <div className="max-w-6xl mx-auto px-6 h-full flex items-center justify-between">
          <Logo size="lg" />
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleOpenAppCta}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            Open app <ArrowRight className="w-4 h-4" />
          </motion.button>
        </div>
      </motion.nav>

      {/* Hero */}
      <section className="relative max-w-3xl mx-auto px-6 pt-40 pb-20 text-center">
        <motion.div
          variants={STAGGER}
          initial="hidden"
          animate="visible"
          className="flex flex-col items-center"
        >
          <motion.div variants={FADE_UP} className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-muted border border-border text-[12px] font-medium text-muted-foreground mb-7 shadow-sm">
            <Sparkles className="w-3.5 h-3.5 text-chart-1" />
            AI-powered job tracker
          </motion.div>
          
          <motion.h1 variants={FADE_UP} className="text-[34px] sm:text-[56px] leading-[1.1] font-bold text-foreground mb-6 tracking-tight font-heading text-balance">
            Track every application.<br />Type nothing.
          </motion.h1>
          
          <motion.p variants={FADE_UP} className="text-muted-foreground text-[16px] sm:text-[18px] max-w-xl mx-auto mb-10 leading-relaxed">
            Drop a screenshot, paste a URL, or drop the description. JobFlow
            extracts, organizes, and follows up — so you can focus on landing the offer.
          </motion.p>
          
          <motion.div variants={FADE_UP} className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full sm:w-auto">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handlePrimaryCta}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-6 py-3 rounded-full bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              Get started free <ArrowRight className="w-4 h-4" />
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={scrollToHowItWorks}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors py-3 px-6 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded-full"
            >
              See how it works <ArrowRight className="w-4 h-4" />
            </motion.button>
          </motion.div>
        </motion.div>
      </section>

      {/* Table Preview */}
      <section className="relative max-w-5xl mx-auto px-6 pb-24">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4, ease: "easeOut" }}
        >
          <motion.div 
            animate={{ y: [0, -8, 0] }}
            transition={{ repeat: Infinity, duration: 6, ease: "easeInOut" }}
            className="rounded-xl border border-border overflow-hidden bg-card shadow-2xl dark:shadow-black/50"
          >
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
              <table className="w-full text-left text-table-text font-table">
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
                      <td className="px-4 py-3 font-medium text-foreground">
                        <div className="flex items-center gap-2">
                          <div className="w-5 h-5 rounded-sm bg-muted flex items-center justify-center text-[10px] font-bold text-muted-foreground shrink-0">
                            {row.company.charAt(0)}
                          </div>
                          {row.company}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{row.role}</td>
                      <td className="px-4 py-3 text-muted-foreground">{row.location}</td>
                      <td className="px-4 py-3 text-foreground tnum font-mono">{row.salary}</td>
                      <td className="px-4 py-3">
                        <span className={cn("inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium", STATUS_CONFIG[row.status]?.className)}>
                          {STATUS_CONFIG[row.status]?.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground tnum font-mono">{row.applied}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        </motion.div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="max-w-5xl mx-auto px-6 py-24 scroll-mt-20">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={STAGGER}
          className="text-center mb-16"
        >
          <motion.span variants={FADE_UP} className="type-label">How it works</motion.span>
          <motion.h2 variants={FADE_UP} className="text-[32px] font-bold tracking-tight text-foreground mt-3 font-heading">
            From found to tracked in 3 seconds.
          </motion.h2>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 relative">
          <div className="hidden lg:block absolute top-12 left-[12%] right-[12%] h-[1px] bg-gradient-to-r from-transparent via-border to-transparent" />
          
          {HOW_IT_WORKS.map((step, i) => {
            const Icon = step.icon;
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="relative flex flex-col items-center text-center group"
              >
                <div className="w-16 h-16 rounded-2xl bg-card border border-border shadow-sm flex items-center justify-center mb-6 relative z-10 group-hover:-translate-y-1 transition-transform duration-300">
                  <Icon className="w-7 h-7 text-chart-1" strokeWidth={1.5} />
                </div>
                <h3 className="text-[17px] font-semibold text-foreground mb-2 font-heading">{step.title}</h3>
                <p className="text-[14px] text-muted-foreground leading-relaxed px-2">{step.description}</p>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* Features/Trust */}
      <section className="bg-muted/30 border-y border-border py-24">
        <div className="max-w-5xl mx-auto px-6">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={STAGGER}
            className="text-center mb-16"
          >
            <motion.span variants={FADE_UP} className="type-label">Features</motion.span>
            <motion.h2 variants={FADE_UP} className="text-[32px] font-bold tracking-tight text-foreground mt-3 font-heading">
              Everything you need. Nothing you don't.
            </motion.h2>
          </motion.div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {FEATURES.map((f, i) => {
              const Icon = f.icon;
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-50px" }}
                  transition={{ duration: 0.5, delay: i * 0.05 }}
                  whileHover={{ y: -4 }}
                  className="rounded-xl border border-border bg-card p-5 md:p-7 shadow-sm hover:shadow-card-hover dark:hover:shadow-card-dark-hover transition-shadow duration-300"
                >
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-5">
                    <Icon className="w-5 h-5 text-primary" strokeWidth={1.5} />
                  </div>
                  <h3 className="type-card-title text-foreground mb-2">{f.title}</h3>
                  <p className="text-[14px] text-muted-foreground leading-relaxed">{f.body}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-2xl mx-auto px-6 py-32 text-center">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={STAGGER}
        >
          <motion.h2 variants={FADE_UP} className="text-[32px] font-bold tracking-tight text-foreground mb-4 font-heading">
            Ready to stop losing track?
          </motion.h2>
          <motion.p variants={FADE_UP} className="text-muted-foreground mb-8 text-[16px] leading-relaxed">
            Create an account, drop your first job in under 10 seconds.
          </motion.p>
          <motion.button
            variants={FADE_UP}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handlePrimaryCta}
            className="inline-flex items-center justify-center gap-1.5 px-8 py-4 rounded-full bg-primary text-primary-foreground text-[15px] font-medium hover:opacity-90 transition-opacity shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            Get started now <ArrowRight className="w-4 h-4" />
          </motion.button>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-10">
        <div className="max-w-6xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <Logo size="sm" />
          <p className="text-center sm:text-right text-[13px] text-muted-foreground">
            © 2026 JobFlow — built for job seekers who take it seriously.
          </p>
        </div>
      </footer>
    </div>
  );
}
