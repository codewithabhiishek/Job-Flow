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

/**
 * Condense a raw salary string to a single short token for dense UI
 * (tables, kanban cards). Returns null when nothing meaningful is present.
 *   "₹24,00,000 - ₹32,00,000 /year" → "₹24L"
 *   "$120k-$150k"                    → "$120k"
 *   "Not disclosed"                  → null
 */
export function condenseSalary(raw) {
  if (!raw) return null;
  const s = raw.toString().trim();
  if (!s || /not\s*disclosed/i.test(s)) return null;

  let period = "";
  if (/\/(month|mo|monthly)/i.test(s)) period = "/mo";
  else if (/\/(year|yr|annual|annum|pa)/i.test(s)) period = "/yr";
  else if (/\/(hour|hr)/i.test(s)) period = "/hr";

  const cur = (s.match(/[₹$€£¥]/) ?? [""])[0];

  if (/lpa/i.test(s)) {
    const m = s.replace(/,/g, "").match(/(\d+(?:\.\d+)?)/);
    return m ? `${cur}${parseFloat(m[1])}L` : null;
  }

  const m = s.replace(/,/g, "").match(/(\d+(?:\.\d+)?)/);
  if (!m) return s.length > 12 ? s.slice(0, 11) + "…" : s;

  let n = parseFloat(m[1]);
  // "$120k" / "₹60k" style salaries: the raw number already carries the "k" unit,
  // so promote it to thousands before the thresholds below, otherwise the "k" is
  // silently dropped and the value is displayed ~1000x too small.
  if (s.match(/(\d+(?:\.\d+)?)\s*k\b/i)) n *= 1000;
  if (n >= 1_000_000)
    return `${cur}${(n / 1_000_000).toFixed(1).replace(/\.0$/, "")}M${period}`;
  if (n >= 1_000) return `${cur}${Math.round(n / 1_000)}k${period}`;
  return `${cur}${n}${period}`;
}


export const isIframe = window.self !== window.top;
