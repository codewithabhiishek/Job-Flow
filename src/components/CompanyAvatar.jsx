import { useState } from "react";
import { cn } from "@/lib/utils";

/**
 * CompanyAvatar Component
 * Displays a company's logo if available. Falls back to a stylish initials badge if logo is missing or fails to load.
 */
export default function CompanyAvatar({ company, logo, className, size = 32 }) {
  const [imageFailed, setImageFailed] = useState(false);

  // Generate fallback initials
  const initials = (company || "U")
    .split(" ")
    .map((s) => s[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const isFailed = imageFailed || !logo || logo === "failed" || logo === "";

  if (isFailed) {
    return (
      <div 
        className={cn(
          "shrink-0 rounded-md bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-medium shadow-sm",
          className
        )}
        style={{ width: size, height: size, fontSize: size * 0.4 }}
      >
        {initials}
      </div>
    );
  }

  return (
    <div 
      className={cn(
        "shrink-0 rounded-md bg-white border border-border/50 flex items-center justify-center overflow-hidden shadow-sm",
        className
      )}
      style={{ width: size, height: size }}
    >
      <img
        src={logo}
        alt={`${company} logo`}
        className="w-full h-full object-contain p-0.5"
        onError={() => setImageFailed(true)}
        loading="lazy"
      />
    </div>
  );
}
