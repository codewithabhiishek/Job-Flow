import { useState, useEffect } from "react";
import { useOutletContext } from "react-router-dom";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { apiClient } from "@/api/client";
import { STATUS_ORDER, STATUS_CONFIG } from "@/components/StatusBadge";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { motion } from "framer-motion";

export default function Kanban() {
  const { searchQuery, openAddJob } = useOutletContext();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);

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

  const filtered = searchQuery
    ? jobs.filter((j) =>
        [j.company, j.job_title, j.location].some((v) =>
          (v || "").toLowerCase().includes(searchQuery.toLowerCase()),
        ),
      )
    : jobs;

  const columns = STATUS_ORDER.map((status) => ({
    status,
    label: STATUS_CONFIG[status].label,
    jobs: filtered.filter((j) => j.status === status),
  }));

  const onDragEnd = async (result) => {
    if (!result.destination) return;
    const sourceStatus = result.source.droppableId;
    const destStatus = result.destination.droppableId;
    if (sourceStatus === destStatus) return;

    const jobId = result.draggableId;
    setJobs((prev) =>
      prev.map((j) => (j.id === jobId ? { ...j, status: destStatus } : j)),
    );
    try {
      await apiClient.fetchApi(`/jobs/${jobId}`, {
        method: "PUT",
        body: JSON.stringify({ status: destStatus }),
      });
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="p-8 h-full flex flex-col max-w-full overflow-hidden space-y-8">
        <div className="space-y-2">
          <Skeleton className="h-5 w-24" />
          <Skeleton className="h-10 w-64" />
        </div>
        <div className="flex gap-4 overflow-hidden">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="w-[300px] shrink-0 space-y-3">
              <Skeleton className="h-8 w-1/3" />
              <div className="rounded-[16px] bg-muted/20 border border-border/40 p-3 h-[400px] space-y-3">
                {Array.from({ length: 3 }).map((_, j) => (
                  <Skeleton key={j} className="h-28 w-full rounded-[10px]" />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.05 }
    }
  };

  const itemAnim = {
    hidden: { opacity: 0, y: 10 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
  };

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="p-8 h-full flex flex-col">
      <motion.div variants={itemAnim} className="mb-8">
        <h2 className="type-label mb-1.5 text-muted-foreground">Pipeline</h2>
        <div className="flex items-center justify-between">
          <h1 className="type-page-title text-foreground">Kanban board</h1>
          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={openAddJob}
            className="text-[14px] font-semibold text-primary hover:text-primary/80 transition-colors duration-200"
          >
            + Add Job
          </motion.button>
        </div>
      </motion.div>

      <DragDropContext onDragEnd={onDragEnd}>
        <motion.div variants={itemAnim} className="flex gap-4 overflow-x-auto flex-1 pb-4">
          {columns.map((col) => (
            <div key={col.status} className="w-[300px] shrink-0 flex flex-col">
              <div className="px-1 mb-3 flex items-center justify-between">
                <span className="text-[12px] font-[600] uppercase tracking-wider text-muted-foreground">
                  {col.label}
                </span>
                <span className="text-[12px] font-medium text-muted-foreground bg-muted/60 px-2 py-0.5 rounded-full">
                  {col.jobs.length}
                </span>
              </div>
              <Droppable droppableId={col.status}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={cn(
                      "flex-1 min-h-[150px] rounded-[16px] bg-muted/30 border border-border/40 p-3 space-y-3 transition-colors duration-200 shadow-inner",
                      snapshot.isDraggingOver &&
                        "bg-muted/50 border-primary/30",
                    )}
                  >
                    {col.jobs.map((job, index) => (
                      <Draggable
                        key={job.id}
                        draggableId={job.id}
                        index={index}
                      >
                        {(dragProvided, dragSnapshot) => (
                          <div
                            ref={dragProvided.innerRef}
                            {...dragProvided.draggableProps}
                            {...dragProvided.dragHandleProps}
                            className={cn(
                              "rounded-[12px] border border-border/60 bg-card p-4 cursor-grab active:cursor-grabbing shadow-sm hover:shadow-premium hover:-translate-y-[2px] transition-all duration-200",
                              dragSnapshot.isDragging &&
                                "shadow-lg border-primary/40 rotate-2",
                            )}
                          >
                            <div className="flex flex-col gap-1 mb-2">
                              <span className="text-[14px] font-medium text-foreground truncate">
                                {job.company}
                              </span>
                              {job.job_title && (
                                <p className="text-[13px] text-muted-foreground truncate">
                                  {job.job_title}
                                </p>
                              )}
                            </div>
                            
                            <div className="flex items-center justify-between text-[12px]">
                              <div className="flex flex-col gap-1 text-muted-foreground">
                                {job.location && (
                                  <span className="truncate">{job.location}</span>
                                )}
                                {job.salary && (
                                  <span className="font-medium text-foreground/80">
                                    {job.salary}
                                  </span>
                                )}
                              </div>
                              <span
                                className={cn(
                                  "px-2 py-0.5 rounded-full border shrink-0 text-[10px] font-medium tracking-wide",
                                  STATUS_CONFIG[col.status].className,
                                )}
                              >
                                {col.label}
                              </span>
                            </div>

                            {job.interview_date && (
                              <div className="mt-3 pt-3 border-t border-border/40 text-[12px] font-medium text-primary flex items-center gap-1.5">
                                <span className="text-[10px]">📅</span>{" "}
                                {new Date(
                                  job.interview_date,
                                ).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                              </div>
                            )}
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                    {col.jobs.length === 0 && !snapshot.isDraggingOver && (
                      <div className="h-full flex flex-col items-center justify-center text-center py-8">
                        <div className="w-10 h-10 rounded-full border-2 border-dashed border-border/60 flex items-center justify-center mb-2">
                          <span className="text-muted-foreground text-[16px]">+</span>
                        </div>
                        <span className="text-[13px] font-medium text-muted-foreground">Drop here</span>
                      </div>
                    )}
                  </div>
                )}
              </Droppable>
            </div>
          ))}
        </motion.div>
      </DragDropContext>
    </motion.div>
  );
}
