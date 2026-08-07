import { useState } from "react";
import { useOutletContext } from "react-router-dom";
import { apiClient } from "@/api/client";
import { ChevronLeft, ChevronRight, CalendarDays } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery } from "@tanstack/react-query";

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];
const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function CalendarPage() {
  const { searchQuery } = useOutletContext();
  const [currentDate, setCurrentDate] = useState(new Date());

  const { data: jobs = [], isLoading: loading } = useQuery({
    queryKey: ['jobs'],
    queryFn: () => apiClient.fetchApi('/jobs'),
    staleTime: 1000 * 60 * 5,
  });

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  // Pad to full weeks so every grid row has 7 cells — without this the last
  // row renders unboxed empty space and border math below breaks.
  while (cells.length % 7 !== 0) cells.push(null);

  const eventsForDay = (day) => {
    if (!day) return [];
    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    return jobs.filter((j) => {
      const matchesSearch = searchQuery
        ? [j.company, j.job_title].some((v) =>
            (v || "").toLowerCase().includes(searchQuery.toLowerCase()),
          )
        : true;
      return (
        matchesSearch &&
        (j.interview_date === dateStr || j.deadline === dateStr)
      );
    });
  };

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));
  const today = new Date();
  const isToday = (day) =>
    day &&
    today.getDate() === day &&
    today.getMonth() === month &&
    today.getFullYear() === year;

  if (loading) {
    return (
      <div className="p-6">
        <Skeleton className="h-[600px] rounded-lg" />
      </div>
    );
  }

  const container = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.04 } }
  };
  const itemAnim = {
    hidden: { opacity: 0, y: 6 },
    show: { opacity: 1, y: 0, transition: { duration: 0.15 } }
  };

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="p-4 md:p-6 lg:p-8 max-w-[1400px]">
      <motion.div variants={itemAnim} className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="type-label mb-1">Schedule</h2>
          <h1 className="type-page-title text-foreground">
            {MONTHS[month]} {year}
          </h1>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            onClick={prevMonth}
            aria-label="Previous month"
            className="w-10 h-10 flex items-center justify-center rounded-md border border-border text-muted-foreground hover:bg-muted transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            <ChevronLeft className="w-4 h-4" strokeWidth={1.5} />
          </button>
          <button
            onClick={() => setCurrentDate(new Date())}
            className="px-3 h-10 rounded-md border border-border text-muted-foreground text-[12px] font-medium hover:bg-muted transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            Today
          </button>
          <button
            onClick={nextMonth}
            aria-label="Next month"
            className="w-10 h-10 flex items-center justify-center rounded-md border border-border text-muted-foreground hover:bg-muted transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            <ChevronRight className="w-4 h-4" strokeWidth={1.5} />
          </button>
        </div>
      </motion.div>

      <motion.div variants={itemAnim} className="rounded-lg border border-border bg-card overflow-hidden">
        <div className="grid grid-cols-7 border-b border-border bg-muted/30">
          {DAYS.map((day) => (
            <div key={day} className="px-1 py-2 sm:px-3 sm:py-2.5 text-center type-table-head">
              {day}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 bg-card">
          {cells.map((day, i) => {
            const events = eventsForDay(day);
            return (
              <div
                key={i}
                className={cn(
                  "min-h-[72px] sm:min-h-[110px] border-r border-b border-border p-1 sm:p-2 transition-colors duration-200",
                  !day && "bg-muted/20",
                  day && "hover:bg-muted/40",
                  day && (i % 7 === 0 || i % 7 === 6) && "bg-muted/10",
                  day && isToday(day) && "ring-1 ring-inset ring-chart-1/50",
                  (i + 1) % 7 === 0 && "border-r-0",
                  i >= cells.length - 7 && "border-b-0"
                )}
              >
                {day && (
                  <>
                    <span
                      className={cn(
                        "inline-block text-[12px] mb-1.5 font-medium tnum font-mono",
                        isToday(day)
                          ? "w-6 h-6 leading-6 text-center rounded-full bg-chart-1 text-white"
                          : "text-muted-foreground",
                      )}
                    >
                      {day}
                    </span>
                    <div className="space-y-1">
                      {events.map((job) => {
                        const isInterview =
                          job.interview_date &&
                          new Date(job.interview_date).toDateString() ===
                            new Date(year, month, day).toDateString();
                        return (
                          <div
                            key={job.id}
                            className={cn(
                              "text-[11px] px-1.5 py-1 sm:py-0.5 rounded truncate font-medium",
                              isInterview
                                ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                                : "bg-orange-50 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
                            )}
                            title={`${isInterview ? "Interview" : "Deadline"}: ${job.company}`}
                          >
                            {isInterview ? "🎤" : "⏰"} {job.company}
                          </div>
                        );
                      })}
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </motion.div>

      {jobs.filter((j) => j.interview_date || j.deadline).length === 0 && (
        <motion.div variants={itemAnim} className="mt-8 text-center py-8">
          <CalendarDays
            className="w-8 h-8 text-muted-foreground/40 mx-auto mb-3"
            strokeWidth={1.5}
          />
          <p className="text-[13px] text-muted-foreground">
            No interviews or deadlines scheduled
          </p>
          <p className="text-[12px] text-muted-foreground/70 mt-1">
            Set dates on your jobs to see them here.
          </p>
        </motion.div>
      )}
    </motion.div>
  );
}
