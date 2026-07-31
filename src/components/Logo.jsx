import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export default function Logo({ className, iconOnly = false, size = "md" }) {
  const sizeClasses = {
    sm: "w-5 h-5",
    md: "w-7 h-7",
    lg: "w-10 h-10",
    xl: "w-16 h-16",
  };

  const textClasses = {
    sm: "text-sm",
    md: "text-lg",
    lg: "text-2xl",
    xl: "text-4xl",
  };

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div className={cn("relative flex items-center justify-center shrink-0", sizeClasses[size])}>
        <motion.svg
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full text-foreground"
          initial={{ rotate: -10, scale: 0.9 }}
          animate={{ rotate: 0, scale: 1 }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
        >
          <path
            d="M5 8h14M8 8V6a2 2 0 012-2h4a2 2 0 012 2v2M4 8h16v11a2 2 0 01-2 2H6a2 2 0 01-2-2V8z"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M12 12v3M9 15h6"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </motion.svg>
      </div>
      {!iconOnly && (
        <span className={cn("font-bold tracking-tight text-foreground", textClasses[size])}>
          Job<span className="text-muted-foreground">Flow</span>
        </span>
      )}
    </div>
  );
}
