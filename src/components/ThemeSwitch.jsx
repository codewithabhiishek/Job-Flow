import { Moon, Sun } from "lucide-react";
import { cn } from "@/lib/utils";

// Theme-aware toggle. `checked === true` means dark is the active theme.
//
// Layout is fixed by convention:  🌙 Dark (left) | ☀️ Light (right)
// The sliding highlight always sits under the currently active theme's icon:
//   dark  (checked=true)  -> highlight on the left  (Moon)
//   light (checked=false) -> highlight on the right (Sun)
const ThemeSwitch = ({ checked, onChange }) => {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={checked ? "Switch to light mode" : "Switch to dark mode"}
      onClick={onChange}
      className={cn(
        "relative flex items-center w-[76px] h-10 shrink-0 rounded-full p-1 cursor-pointer select-none",
        "border border-border bg-muted transition-[background-color,border-color,box-shadow] duration-300",
        "hover:bg-muted/80 hover:border-border/80 hover:shadow-sm",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
      )}
    >
      {/* Sliding highlight — slides to the active theme side.
          Dark (Moon) is the LEFT slot, so dark-active keeps it on the left. */}
      <span
        aria-hidden
        className={cn(
          "absolute top-1 left-1 w-[34px] h-8 rounded-full bg-background border border-border/70 shadow-sm",
          "flex items-center justify-center transition-transform duration-300 ease-in-out",
          checked ? "translate-x-0" : "translate-x-[34px]",
        )}
      >
        {checked ? (
          <Moon className="w-4 h-4 text-primary" strokeWidth={2.2} />
        ) : (
          <Sun className="w-4 h-4 text-primary" strokeWidth={2.2} />
        )}
      </span>

      {/* Track icons — LEFT is Dark (Moon), RIGHT is Light (Sun).
          The active side sits under the highlight, so its track icon is
          transparent (the highlight renders the visible glyph). */}
      <span className="flex-1 flex items-center justify-center">
        <Moon
          className={cn(
            "w-4 h-4 transition-colors duration-300",
            checked ? "text-transparent" : "text-muted-foreground/40",
          )}
          strokeWidth={2.2}
        />
      </span>
      <span className="flex-1 flex items-center justify-center">
        <Sun
          className={cn(
            "w-4 h-4 transition-colors duration-300",
            checked ? "text-muted-foreground/40" : "text-transparent",
          )}
          strokeWidth={2.2}
        />
      </span>
    </button>
  );
};

export default ThemeSwitch;
