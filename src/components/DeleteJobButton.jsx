import React, { useState } from 'react';
import { Trash2 } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { apiClient } from "@/api/client";

const DeleteJobButton = ({ jobId, jobTitle, onDeleteSuccess }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await apiClient.fetchApi(`/jobs/${jobId}`, { method: "DELETE" });
      toast.success("Job deleted successfully");
      if (onDeleteSuccess) onDeleteSuccess(jobId);
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete job. Please try again.");
    } finally {
      setIsDeleting(false);
      setIsOpen(false);
    }
  };

  return (
    <>
      {/* Compact icon-only button with tooltip */}
      <div className="relative inline-flex items-center justify-center">
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); setIsOpen(true); }}
          onMouseEnter={() => setShowTooltip(true)}
          onMouseLeave={() => setShowTooltip(false)}
          className="
            w-7 h-7 rounded-md flex items-center justify-center
            text-muted-foreground/40
            hover:text-red-500 hover:bg-red-500/10
            transition-all duration-150
            opacity-0 group-hover:opacity-100
          "
          aria-label="Delete job"
        >
          <Trash2 className="w-3.5 h-3.5" strokeWidth={1.8} />
        </button>
        {showTooltip && (
          <span className="
            absolute -top-7 left-1/2 -translate-x-1/2
            bg-foreground text-background
            text-[11px] font-medium px-2 py-0.5 rounded
            whitespace-nowrap pointer-events-none z-50
            shadow-md
          ">
            Delete
          </span>
        )}
      </div>

      {/* Confirmation Dialog */}
      <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
        <AlertDialogContent onClick={(e) => e.stopPropagation()}>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this job?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the application for{" "}
              <strong className="text-foreground">{jobTitle}</strong>. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => { e.preventDefault(); handleDelete(); }}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? "Deleting…" : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default DeleteJobButton;
