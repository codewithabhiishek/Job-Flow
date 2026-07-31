import { useOutletContext } from "react-router-dom";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { apiClient } from "@/api/client";
import { STATUS_ORDER, STATUS_CONFIG } from "@/components/StatusBadge";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { motion } from "framer-motion";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import CompanyAvatar from "@/components/CompanyAvatar";

export default function Kanban() {
  const { searchQuery, openAddJob } = useOutletContext();
  const queryClient = useQueryClient();
  const { data: jobs = [], isLoading: loading } = useQuery({
    queryKey: ['jobs'],
    queryFn: () => apiClient.fetchApi('/jobs'),
    staleTime: 1000 * 60 * 5,
  });


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

  const updateMutation = useMutation({
    mutationFn: ({ id, patch }) => apiClient.fetchApi(`/jobs/${id}`, { method: "PUT", body: JSON.stringify(patch) }),
    onMutate: async ({ id, patch }) => {
      await queryClient.cancelQueries({ queryKey: ['jobs'] });
      const previousJobs = queryClient.getQueryData(['jobs']);
      queryClient.setQueryData(['jobs'], old => old?.map(j => j.id === id ? { ...j, ...patch } : j) || []);
      return { previousJobs };
    },
    onError: (err, newTodo, context) => {
      queryClient.setQueryData(['jobs'], context.previousJobs);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
    }
  });

  const onDragEnd = (result) => {
    if (!result.destination) return;
    const sourceStatus = result.source.droppableId;
    const destStatus = result.destination.droppableId;
    if (sourceStatus === destStatus) return;

    const jobId = result.draggableId;
    updateMutation.mutate({ id: jobId, patch: { status: destStatus } });
  };

  if (loading) {
    return (
      <div className="p-6 h-full flex flex-col space-y-6">
        <Skeleton className="h-7 w-28" />
        <div className="flex gap-3 overflow-hidden">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="w-[260px] shrink-0 space-y-2">
              <Skeleton className="h-6 w-20" />
              <Skeleton className="h-[300px] rounded-lg" />
            </div>
          ))}
        </div>
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
    <motion.div variants={container} initial="hidden" animate="show" className="p-6 h-full flex flex-col">
      <motion.div variants={itemAnim} className="mb-5">
        <h1 className="type-page-title text-foreground">Kanban</h1>
      </motion.div>

      <DragDropContext onDragEnd={onDragEnd}>
        <motion.div variants={itemAnim} className="flex gap-3 overflow-x-auto flex-1 pb-4">
          {columns.map((col) => (
            <div key={col.status} className="w-[260px] shrink-0 flex flex-col">
              <div className="px-1 mb-2 flex items-center justify-between">
                <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                  {col.label}
                </span>
                <span className="text-[11px] font-medium text-muted-foreground bg-muted px-1.5 py-0.5 rounded tnum">
                  {col.jobs.length}
                </span>
              </div>
              <Droppable droppableId={col.status}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={cn(
                      "flex-1 min-h-[120px] rounded-lg bg-muted/30 border border-border p-2 space-y-2 transition-colors duration-150",
                      snapshot.isDraggingOver && "bg-muted/60 border-ring/30",
                    )}
                  >
                    {col.jobs.map((job, index) => (
                      <Draggable key={job.id} draggableId={job.id} index={index}>
                        {(dragProvided, dragSnapshot) => (
                          <div
                            ref={dragProvided.innerRef}
                            {...dragProvided.draggableProps}
                            {...dragProvided.dragHandleProps}
                            className={cn(
                              "rounded-md border border-border bg-card p-3 cursor-grab active:cursor-grabbing shadow-card dark:shadow-card-dark hover:shadow-card-hover dark:hover:shadow-card-dark-hover transition-shadow duration-150",
                              dragSnapshot.isDragging && "shadow-lg border-ring/40 rotate-1",
                            )}
                          >
                            <div className="mb-1.5 flex gap-2.5">
                              <CompanyAvatar company={job.company} logo={job.logo} size={28} />
                              <div className="flex-1 min-w-0">
                                <p className="text-[13px] font-medium text-foreground truncate leading-tight">
                                  {job.company}
                                </p>
                                {job.job_title && (
                                  <p className="text-[12px] text-muted-foreground truncate leading-snug mt-0.5">
                                    {job.job_title}
                                  </p>
                                )}
                              </div>
                            </div>
                            
                            <div className="flex items-center justify-between text-[11px]">
                              <div className="flex flex-col gap-0.5 text-muted-foreground min-w-0 flex-1 mr-2">
                                {job.location && (
                                  <span className="truncate">{job.location}</span>
                                )}
                                {job.salary && (
                                  <span className="font-medium text-foreground/70 tnum">
                                    {job.salary}
                                  </span>
                                )}
                              </div>
                            </div>

                            {job.interview_date && (
                              <div className="mt-2 pt-2 border-t border-border text-[11px] font-medium text-chart-1 tnum">
                                📅 {new Date(job.interview_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                              </div>
                            )}
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                    {col.jobs.length === 0 && !snapshot.isDraggingOver && (
                      <div className="h-full flex items-center justify-center text-center py-6">
                        <span className="text-[12px] text-muted-foreground/60">Drop here</span>
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
