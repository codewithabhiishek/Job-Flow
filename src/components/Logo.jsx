import { cn } from "@/lib/utils";

export default function Logo({ className, iconOnly = false, size = "md", animated = false }) {
  const sizeClasses = {
    sm: "w-5 h-5",
    md: "w-9 h-9",
    lg: "w-9 h-9",
    xl: "w-11 h-11",
  };

  const textClasses = {
    sm: "text-[13px]",
    md: "text-[16px]",
    lg: "text-[19px]",
    xl: "text-[26px]",
  };

  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <div
        className={cn(
          "relative flex items-center justify-center shrink-0 overflow-hidden rounded-[8px] transition-[filter] duration-300",
          sizeClasses[size],
        )}
      >
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
        {/* Light sweep — a narrow sheen crosses the mark once per cycle.
            Transform-only, GPU accelerated, clipped to the icon bounds. */}
        {animated && <span aria-hidden className="logo-sweep" />}
      </div>
      {!iconOnly && (
        <span
          className={cn(
            "font-heading font-semibold tracking-[-0.02em] text-foreground leading-none flex items-center",
            textClasses[size],
          )}
        >
          JobFlow
        </span>
      )}
    </div>
  );
}
