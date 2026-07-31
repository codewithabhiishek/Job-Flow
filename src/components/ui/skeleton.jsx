import { cn } from "@/lib/utils";

function Skeleton({ className, ...props }) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-[8px] bg-muted/40",
        "after:absolute after:inset-0 after:-translate-x-full after:animate-[shimmer_2s_infinite] after:bg-gradient-to-r after:from-transparent after:via-foreground/5 after:to-transparent",
        className
      )}
      {...props}
    />
  );
}

export { Skeleton };
