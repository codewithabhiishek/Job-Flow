import { useState, useEffect } from "react";
import { useOutletContext } from "react-router-dom";
import { apiClient } from "@/api/client";
import { ChevronLeft, ChevronRight, CalendarDays } from "lucide-react";
import { cn } from "@/lib/utils";

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
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());

  useEffect(() => {
    const load = async () => {
      try {
        const data = await apiClient.fetchApi('/jobs');
        setJobs(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

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
        <div className="h-96 bg-neutral-900 rounded-lg animate-pulse" />
      </div>
    );
  }

  return (
    <div className="p-8 max-w-[1400px]">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="type-label mb-1.5">Schedule</h2>
          <h1 className="type-page-title text-neutral-100">
            {MONTHS[month]} {year}
          </h1>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={prevMonth}
            className="w-8 h-8 flex items-center justify-center rounded-md border border-neutral-800 text-neutral-400 hover:bg-neutral-900 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" strokeWidth={1.5} />
          </button>
          <button
            onClick={() => setCurrentDate(new Date())}
            className="px-3 h-8 rounded-md border border-neutral-800 text-neutral-400 text-xs hover:bg-neutral-900 transition-colors"
          >
            Today
          </button>
          <button
            onClick={nextMonth}
            className="w-8 h-8 flex items-center justify-center rounded-md border border-neutral-800 text-neutral-400 hover:bg-neutral-900 transition-colors"
          >
            <ChevronRight className="w-4 h-4" strokeWidth={1.5} />
          </button>
        </div>
      </div>

      <div className="rounded-xl border border-white/[0.06] overflow-hidden">
        <div className="grid grid-cols-7 border-b border-white/[0.06]">
          {DAYS.map((day) => (
            <div key={day} className="px-3 py-2.5 text-center type-table-head">
              {day.toUpperCase()}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {cells.map((day, i) => {
            const events = eventsForDay(day);
            return (
              <div
                key={i}
                className={cn(
                  "min-h-[100px] border-r border-b border-white/[0.06] p-1.5",
                  !day && "bg-neutral-950",
                  (i + 1) % 7 === 0 && "border-r-0",
                )}
              >
                {day && (
                  <>
                    <span
                      className={cn(
                        "inline-block text-xs mb-1",
                        isToday(day)
                          ? "w-5 h-5 leading-5 text-center rounded-full bg-blue-600 text-white"
                          : "text-neutral-500",
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
                              "text-[10px] px-1.5 py-0.5 rounded truncate",
                              isInterview
                                ? "bg-emerald-950 text-emerald-400"
                                : "bg-orange-950 text-orange-400",
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
      </div>

      {jobs.filter((j) => j.interview_date || j.deadline).length === 0 && (
        <div className="mt-6 text-center py-8">
          <CalendarDays
            className="w-8 h-8 text-neutral-700 mx-auto mb-2"
            strokeWidth={1.5}
          />
          <p className="text-sm text-neutral-500">
            No interviews or deadlines scheduled
          </p>
          <p className="text-xs text-neutral-700 mt-1">
            Set interview dates or deadlines on your jobs to see them here.
          </p>
        </div>
      )}
    </div>
  );
}
