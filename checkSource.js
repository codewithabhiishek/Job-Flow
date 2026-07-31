import { neon } from '@neondatabase/serverless';
import dotenv from 'dotenv';
dotenv.config({ path: ".env.local" });
dotenv.config();

const sql = neon(process.env.DATABASE_URL);
async function check() {
  const result = await sql`SELECT id, company, source FROM jobs ORDER BY id DESC LIMIT 10`;
  console.log(result);
}
check();
