const EMPTY = "";

const SOURCE_RULES = [
  [/linkedin\.com/i, "LinkedIn"],
  [/(wellfound\.com|angel\.co)/i, "Wellfound"],
  [/naukri\.com/i, "Naukri"],
  [/indeed\.com/i, "Indeed"],
  [/(boards\.)?greenhouse\.io/i, "Greenhouse"],
  [/(jobs\.)?lever\.co/i, "Lever"],
  [/workdayjobs\.com|myworkdayjobs\.com/i, "Workday"],
  [/ashbyhq\.com/i, "Ashby"],
  [/smartrecruiters\.com/i, "SmartRecruiters"],
  [/ycombinator\.com\/jobs/i, "Y Combinator"],
  [/glassdoor\.com/i, "Glassdoor"],
  [/instahyre\.com/i, "Instahyre"],
  [/amazon\.jobs/i, "Amazon Jobs"],
  [/careers\.google\.com/i, "Google Careers"],
];

const SOURCE_TEXT_RULES = [
  [/\b(applied|apply|posted)\s+(via|on)\s+linkedin\b|\blinkedin\b/i, "LinkedIn"],
  [/\bwellfound\b|\bangel\.co\b/i, "Wellfound"],
  [/\bnaukri\b/i, "Naukri"],
  [/\bindeed\b/i, "Indeed"],
  [/\bgreenhouse\b/i, "Greenhouse"],
  [/\blever\b/i, "Lever"],
  [/\bworkday\b/i, "Workday"],
  [/\bashby\b/i, "Ashby"],
  [/\bsmartrecruiters\b/i, "SmartRecruiters"],
  [/\by\s?combinator\b/i, "Y Combinator"],
];

const clean = (value) => typeof value === "string" && !/^(none|null|n\/?a|unknown|undefined)$/i.test(value.trim())
  ? value.replace(/\s+/g, " ").trim()
  : EMPTY;

export function detectSource({ url = "", text = "", claimedSource = "" } = {}) {
  const candidate = clean(url);
  for (const [pattern, source] of SOURCE_RULES) if (pattern.test(candidate)) return source;
  for (const [pattern, source] of SOURCE_TEXT_RULES) if (pattern.test(text)) return source;
  const claimed = clean(claimedSource);
  if (claimed && !/^company (website|site)$/i.test(claimed)) return claimed;
  if (candidate) {
    try {
      const host = new URL(candidate).hostname.replace(/^www\./, "");
      if (/^(careers|jobs)\./i.test(host) || /\/(careers|jobs|openings|job)\b/i.test(new URL(candidate).pathname)) return "Careers Page";
      return "Careers Page";
    } catch { /* validated elsewhere */ }
  }
  return "Unknown";
}

export function normalizeCompany(value) {
  let company = clean(value);
  if (!company) return EMPTY;
  company = company.replace(/^company:\s*/i, "").replace(/\s*[|–—-]\s*(careers|jobs|job openings).*$/i, "");
  company = company.replace(/\s+(india|llc|ltd\.?|limited|inc\.?|incorporated|corp\.?|corporation|pvt\.?\s*ltd\.?)$/i, "");
  const aliases = new Map([["amazon web services", "Amazon"], ["aws", "Amazon"], ["google llc", "Google"]]);
  return aliases.get(company.toLowerCase()) || company;
}

export function normalizeTitle(value) {
  return clean(value)
    .replace(/^(we(?:'|’)re\s+)?hiring\s*:?\s*/i, "")
    .replace(/^job\s*title\s*:?\s*/i, "")
    .replace(/^role\s*:?\s*/i, "");
}

export function normalizeLocation(value) {
  let location = clean(value);
  if (!location) return EMPTY;
  if (/\bremote\b/i.test(location) && !/[a-z]+,\s*[a-z]+/i.test(location)) return "Remote";
  location = location.replace(/\bBangalore\b/gi, "Bengaluru");
  location = location.replace(/,?\s*India\b/i, "").replace(/\s+/g, " ").trim();
  return location.replace(/,\s*$/, "");
}

export function normalizeSalary(value) {
  let salary = clean(value);
  if (!salary) return EMPTY;
  salary = salary.replace(/\s+/g, " ");
  const lakh = salary.match(/₹\s*(\d+(?:\.\d+)?)\s*(?:lpa|lakhs?(?:\s+per\s+annum)?|lakh)(?:\s+per\s+annum)?/i);
  if (lakh) return `₹${lakh[1]} LPA`;
  const monthly = salary.match(/(₹|\$|€|£)\s*([\d,.]+)\s*(?:\/|per\s+)?(?:month|mo\b|monthly)/i);
  if (monthly) return `${monthly[1]}${monthly[2].replace(/\s/g, "")}/mo`;
  return salary;
}

export function normalizeWorkMode(value, location = "") {
  const candidate = `${clean(value)} ${clean(location)}`.toLowerCase();
  if (/\bhybrid\b/.test(candidate)) return "Hybrid";
  if (/\bremote\b|work from home|wfh/.test(candidate)) return "Remote";
  if (/\bon[ -]?site\b|in[ -]?office/.test(candidate)) return "On-site";
  return EMPTY;
}

export function normalizeEmploymentType(value) {
  const candidate = clean(value).toLowerCase();
  if (/intern/.test(candidate)) return "Internship";
  if (/full[ -]?time/.test(candidate)) return "Full-time";
  if (/part[ -]?time/.test(candidate)) return "Part-time";
  if (/contract|temporary/.test(candidate)) return "Contract";
  if (/freelance/.test(candidate)) return "Freelance";
  return EMPTY;
}

export function normalizeUrl(value) {
  const url = clean(value);
  if (!url) return EMPTY;
  try {
    const parsed = new URL(url);
    if (!/^https?:$/.test(parsed.protocol)) return EMPTY;
    return parsed.toString();
  } catch { return EMPTY; }
}

export function normalizeDeadline(value) {
  const date = clean(value);
  if (!date) return EMPTY;
  // Exact calendar date, optionally carrying a time (ISO datetime or "2025-03-01 12:00").
  const iso = date.match(/^(\d{4})-(\d{2})-(\d{2})(?:[T\s].*)?$/);
  if (iso) {
    const [, y, m, d] = iso;
    const normalized = `${y}-${m}-${d}`;
    if (!Number.isNaN(Date.parse(`${normalized}T00:00:00Z`))) return normalized;
  }
  // Ambiguous relative dates ("in 3 days", "ASAP") must never be invented.
  const explicit = date.match(/^(\d{1,2})[\/-](\d{1,2})[\/-](\d{4})$/);
  if (!explicit) return EMPTY;
  const [, day, month, year] = explicit;
  const normalized = `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
  return Number.isNaN(Date.parse(`${normalized}T00:00:00Z`)) ? EMPTY : normalized;
}

// Accept an array of skills, or a delimited string (commas, bullets, pipes, semicolons).
export function normalizeSkills(value) {
  if (typeof value === "string") {
    value = value.split(/[,;•|]/).map((s) => s.trim()).filter(Boolean);
  }
  if (!Array.isArray(value)) return [];
  return value
    .map((s) => (typeof s === "string" ? s.replace(/\s+/g, " ").trim() : ""))
    .filter(Boolean)
    .slice(0, 50);
}

export function normalizeJobExtraction(raw = {}, context = {}) {
  const confidence = raw.confidence || {};
  const accepted = (key) => Number(confidence[key] ?? 0) >= 50;
  const url = normalizeUrl(context.url || (accepted("job_url") ? raw.job_url : ""));
  const location = accepted("location") ? normalizeLocation(raw.location) : EMPTY;
  const result = {
    company: accepted("company") ? normalizeCompany(raw.company) : EMPTY,
    job_title: accepted("job_title") ? normalizeTitle(raw.job_title) : EMPTY,
    location,
    salary: accepted("salary") ? normalizeSalary(raw.salary) : EMPTY,
    source: detectSource({ url, text: context.text, claimedSource: accepted("source") ? raw.source : "" }),
    work_mode: normalizeWorkMode(accepted("work_mode") ? raw.work_mode : "", location),
    employment_type: accepted("employment_type") ? normalizeEmploymentType(raw.employment_type) : EMPTY,
    deadline: accepted("deadline") ? normalizeDeadline(raw.deadline) : EMPTY,
    job_url: url,
    skills: accepted("skills") ? normalizeSkills(raw.skills) : [],
    confidence: Object.fromEntries(["company", "job_title", "location", "salary", "source", "work_mode", "employment_type", "deadline", "job_url", "skills"].map((key) => [key, Math.max(0, Math.min(100, Number(confidence[key] || 0)))])),
  };
  if (url) result.confidence.source = 100;
  if (url) result.confidence.job_url = 100;
  return result;
}

export function validateJobExtraction(job) {
  const missingRequired = [];
  if (!job.company) missingRequired.push("company");
  if (!job.job_title) missingRequired.push("job_title");
  const errors = [];
  if (job.job_url && !normalizeUrl(job.job_url)) errors.push("Job URL must be a valid HTTP or HTTPS URL.");
  return { valid: missingRequired.length === 0 && errors.length === 0, missingRequired, errors };
}
