import { neon } from '@neondatabase/serverless';
import dotenv from 'dotenv';
import { resolveCompanyLogo } from '../api/utils/logoResolver.js';

dotenv.config({ path: ".env.local" });
dotenv.config();

const sql = neon(process.env.DATABASE_URL);

async function backfill() {
  console.log("Starting logo backfill process...");
  
  // Find all jobs where logo is NULL, empty string, or "failed"
  const pendingJobs = await sql`SELECT id, company, job_url, logo FROM jobs WHERE logo IS NULL OR logo = '' OR logo = 'failed'`;
  
  if (pendingJobs.length === 0) {
    console.log("No jobs require backfilling. Exiting.");
    return;
  }
  
  console.log(`Found ${pendingJobs.length} jobs to backfill.`);
  
  for (const job of pendingJobs) {
    console.log(`Processing job ID ${job.id} - Company: ${job.company}`);
    try {
      const resolvedLogo = await resolveCompanyLogo(job.company, job.job_url);
      
      await sql`UPDATE jobs SET logo = ${resolvedLogo} WHERE id = ${job.id}`;
      console.log(`  -> Resolved to: ${resolvedLogo}`);
      
      // Sleep for 300ms to avoid rate limiting from Clearbit API
      await new Promise(r => setTimeout(r, 300));
    } catch (e) {
      console.error(`  -> Error processing job ID ${job.id}:`, e.message);
    }
  }
  
  console.log("Backfill complete!");
}

backfill().catch(console.error);
