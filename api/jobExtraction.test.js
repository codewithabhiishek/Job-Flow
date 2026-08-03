import assert from "node:assert/strict";
import {
  detectSource,
  normalizeCompany,
  normalizeJobExtraction,
  normalizeLocation,
  normalizeSalary,
} from "./jobExtraction.js";

assert.equal(detectSource({ url: "https://boards.greenhouse.io/acme/jobs/1" }), "Greenhouse");
assert.equal(detectSource({ url: "https://jobs.lever.co/acme/role" }), "Lever");
assert.equal(detectSource({ text: "Applied via LinkedIn" }), "LinkedIn");
assert.equal(detectSource({ url: "https://jobs.acme.com/openings/1" }), "Careers Page");
assert.equal(normalizeCompany("Amazon Web Services"), "Amazon");
assert.equal(normalizeCompany("Infosys Limited"), "Infosys");
assert.equal(normalizeSalary("₹10 Lakhs per annum"), "₹10 LPA");
assert.equal(normalizeLocation("Bangalore, Karnataka, India"), "Bengaluru, Karnataka");

const normalized = normalizeJobExtraction({
  company: "Google LLC", job_title: "Hiring: Backend Engineer", location: "Remote", salary: "₹10 Lakh",
  source: "", work_mode: "remote", employment_type: "full time", deadline: "ASAP", job_url: "",
  confidence: { company: 95, job_title: 90, location: 90, salary: 90, source: 0, work_mode: 90, employment_type: 90, deadline: 80, job_url: 0 },
}, { url: "https://jobs.lever.co/google/backend" });

assert.deepEqual(
  { company: normalized.company, job_title: normalized.job_title, source: normalized.source, salary: normalized.salary, deadline: normalized.deadline, work_mode: normalized.work_mode },
  { company: "Google", job_title: "Backend Engineer", source: "Lever", salary: "₹10 LPA", deadline: "", work_mode: "Remote" },
);

console.log("job extraction normalization checks passed");
