import React, { useState } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { apiClient } from "@/api/client";

const DeleteJobButton = ({ jobId, jobTitle, onDeleteSuccess }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await apiClient.fetchApi(`/jobs/${jobId}`, {
        method: "DELETE",
      });
      toast.success("Job deleted successfully");
      if (onDeleteSuccess) {
        onDeleteSuccess(jobId);
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete job. Please try again.");
    } finally {
      setIsDeleting(false);
      setIsOpen(false);
    }
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
      <AlertDialogTrigger asChild>
        <div className="delete-btn-wrapper" onClick={(e) => { e.stopPropagation(); setIsOpen(true); }}>
          <style>{`
            .delete-btn-wrapper {
              display: inline-flex;
              transform: scale(0.65);
              transform-origin: right center;
            }
            .delete-btn-wrapper .button {
              width: 50px;
              height: 50px;
              border-radius: 50%;
              background-color: rgb(20, 20, 20);
              border: none;
              font-weight: 600;
              display: flex;
              align-items: center;
              justify-content: center;
              box-shadow: 0px 0px 20px rgba(0, 0, 0, 0.164);
              cursor: pointer;
              transition-duration: .3s;
              overflow: hidden;
              position: relative;
            }

            /* Fix hover style leaking across themes by explicitly overriding background if needed, 
               but user said keep colors exactly as-is. */
            
            .delete-btn-wrapper .svgIcon {
              width: 12px;
              transition-duration: .3s;
            }

            .delete-btn-wrapper .svgIcon path {
              fill: white;
            }

            .delete-btn-wrapper .button:hover {
              width: 140px;
              border-radius: 50px;
              transition-duration: .3s;
              background-color: rgb(255, 69, 69);
              align-items: center;
            }

            .delete-btn-wrapper .button:hover .svgIcon {
              width: 50px;
              transition-duration: .3s;
              transform: translateY(60%);
            }

            .delete-btn-wrapper .button::before {
              position: absolute;
              top: -20px;
              content: "Delete";
              color: white;
              transition-duration: .3s;
              font-size: 2px;
            }

            .delete-btn-wrapper .button:hover::before {
              font-size: 13px;
              opacity: 1;
              transform: translateY(30px);
              transition-duration: .3s;
            }
          `}</style>
          <button className="button" type="button">
            <svg viewBox="0 0 448 512" className="svgIcon">
              <path d="M135.2 17.7L128 32H32C14.3 32 0 46.3 0 64S14.3 96 32 96H416c17.7 0 32-14.3 32-32s-14.3-32-32-32H320l-7.2-14.3C307.4 6.8 296.3 0 284.2 0H163.8c-12.1 0-23.2 6.8-28.6 17.7zM416 128H32L53.2 467c1.6 25.3 22.6 45 47.9 45H346.9c25.3 0 46.3-19.7 47.9-45L416 128z" />
            </svg>
          </button>
        </div>
      </AlertDialogTrigger>
      
      <AlertDialogContent onClick={(e) => e.stopPropagation()}>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you sure you want to delete this job?</AlertDialogTitle>
          <AlertDialogDescription>
            This will permanently delete the application for <strong className="text-foreground">{jobTitle}</strong>. This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
          <AlertDialogAction 
            onClick={(e) => { e.preventDefault(); handleDelete(); }}
            disabled={isDeleting}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isDeleting ? "Deleting..." : "Delete"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default DeleteJobButton;
