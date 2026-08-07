import { cn } from "@/lib/utils";

export default function Logo({ className, iconOnly = false, size = "md", animated = false }) {
  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-6 h-6",
    lg: "w-7 h-7",
    xl: "w-10 h-10",
  };

  const textClasses = {
    sm: "text-[13px]",
    md: "text-[14px]",
    lg: "text-[18px]",
    xl: "text-[24px]",
  };

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div
        className={cn(
          "relative flex items-center justify-center shrink-0",
          sizeClasses[size],
          animated && "logo-float",
        )}
      >
        {animated && (
          <span
            aria-hidden
            className="logo-glow absolute inset-0 rounded-full bg-foreground/20 blur-[6px]"
          />
        )}
        <svg
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="relative w-full h-full text-foreground"
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
        </svg>
      </div>
      {!iconOnly && (
        <span className={cn("font-bold tracking-tight text-foreground leading-none flex items-center", textClasses[size])}>
          JobFlow
        </span>
      )}
    </div>
  );
}
