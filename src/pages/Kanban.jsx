import { useState, useEffect } from "react";
import { useOutletContext } from "react-router-dom";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { apiClient } from "@/api/client";
import { STATUS_ORDER, STATUS_CONFIG } from "@/components/StatusBadge";
import { cn } from "@/lib/utils";

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
      <div className="p-6">
        <div className="h-96 bg-neutral-900 rounded-lg animate-pulse" />
      </div>
    );
  }

  return (
    <div className="p-8 h-full flex flex-col">
      <div className="mb-6">
        <h2 className="type-label mb-1.5">Pipeline</h2>
        <div className="flex items-center justify-between">
          <h1 className="type-page-title text-neutral-100">Kanban board</h1>
          <button
            onClick={openAddJob}
            className="text-sm text-neutral-400 hover:text-neutral-200 transition-colors duration-200"
          >
            + Add Job
          </button>
        </div>
      </div>

      <DragDropContext onDragEnd={onDragEnd}>
        <div className="flex gap-3 overflow-x-auto flex-1 pb-4">
          {columns.map((col) => (
            <div key={col.status} className="w-64 shrink-0 flex flex-col">
              <div className="px-3 py-2 mb-2 flex items-center justify-between">
                <span className="text-[11px] font-medium uppercase tracking-[0.06em] text-neutral-400">
                  {col.label}
                </span>
                <span className="text-xs text-neutral-500">
                  {col.jobs.length}
                </span>
              </div>
              <Droppable droppableId={col.status}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={cn(
                      "flex-1 min-h-[100px] rounded-lg border border-white/[0.06] bg-neutral-950 p-2 space-y-2 transition-colors duration-200",
                      snapshot.isDraggingOver &&
                        "bg-neutral-900 border-white/[0.08]",
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
                              "rounded-md border border-white/[0.08] bg-neutral-900 p-3 cursor-grab active:cursor-grabbing",
                              dragSnapshot.isDragging &&
                                "shadow-md shadow-black/30 border-white/[0.1]",
                            )}
                          >
                            <div className="flex items-start justify-between mb-1.5">
                              <span className="text-sm font-medium text-neutral-200 truncate">
                                {job.company}
                              </span>
                              <span
                                className={cn(
                                  "px-1.5 py-0.5 rounded text-[10px] font-medium shrink-0 ml-2",
                                  STATUS_CONFIG[col.status].className,
                                )}
                              >
                                {col.jobs.length > 0 && ""}
                              </span>
                            </div>
                            {job.job_title && (
                              <p className="text-xs text-neutral-400 mb-1.5 truncate">
                                {job.job_title}
                              </p>
                            )}
                            <div className="flex items-center gap-2 text-[11px] text-neutral-500">
                              {job.location && (
                                <span className="truncate">{job.location}</span>
                              )}
                              {job.salary && (
                                <span className="text-neutral-500">
                                  {job.salary}
                                </span>
                              )}
                            </div>
                            {job.interview_date && (
                              <div className="mt-2 text-[11px] text-emerald-400 flex items-center gap-1">
                                📅{" "}
                                {new Date(
                                  job.interview_date,
                                ).toLocaleDateString()}
                              </div>
                            )}
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                    {col.jobs.length === 0 && (
                      <div className="text-center py-6 text-xs text-neutral-700">
                        Drop here
                      </div>
                    )}
                  </div>
                )}
              </Droppable>
            </div>
          ))}
        </div>
      </DragDropContext>
    </div>
  );
}
