import { clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs) {
  return twMerge(clsx(inputs))
}

// City names that are ambiguous across regions/states — for these, keep the
// state so the label stays unambiguous (e.g. "Portland" → "Portland, Oregon").
const AMBIGUOUS_CITIES = new Set([
  "portland", "springfield", "columbus", "newark", "bristol", "cleveland",
  "sydney", "victoria", "aurora", "burlington", "orange", "lebanon",
  "richmond", "dover", "montgomery", "madison", "washington", "georgetown",
  "albany", "manchester", "lancaster", "columbia", "salem", "charleston",
  "franklin", "oxford", "dublin", "london", "cambridge", "princeton",
]);

/**
 * Shorten a full location for compact table/list display — the shortest
 * meaningful representation, so dashboards stay scannable.
 *   "Chennai, Tamil Nadu, India" → "Chennai"
 *   "Pune, Maharashtra"          → "Pune"
 *   "Delhi, India"               → "Delhi"
 *   "Portland, Oregon, USA"      → "Portland, Oregon"  (ambiguous city keeps state)
 *   "Remote" / "Hybrid"          → unchanged
 * The full value is preserved by the caller (edit, search, analytics all use it).
 */
export function formatLocation(value) {
  if (!value) return "";
  const full = String(value).replace(/\s+/g, " ").trim();
  if (!full) return "";

  // Pure work-mode locations display as-is.
  const mode = full.match(/\b(remote|hybrid|on[- ]?site|work from home|wfh)\b/i);
  if (mode && !full.includes(",")) return mode[0];

  const parts = full.split(",").map((p) => p.trim()).filter(Boolean);
  if (parts.length === 0) return full;

  const city = parts[0];
  if (AMBIGUOUS_CITIES.has(city.toLowerCase()) && parts.length >= 2) {
    return `${city}, ${parts[1]}`;
  }
  return city;
}


export const isIframe = window.self !== window.top;
