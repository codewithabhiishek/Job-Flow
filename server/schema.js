import { pgTable, serial, text, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";

export const jobs = pgTable('jobs', {
  id: serial('id').primaryKey(),
  company: text('company').notNull(),
  logo: text('logo'),
  job_title: text('job_title'),
  location: text('location'),
  salary: text('salary'),
  employment_type: text('employment_type'),
  experience: text('experience'),
  remote: boolean('remote').default(false),
  skills: jsonb('skills').$type<string[]>(),
  job_url: text('job_url'),
  deadline: text('deadline'), // or timestamp, based on string format
  notes: text('notes'),
  status: text('status').default('saved'),
  applied_date: text('applied_date'),
  reply_date: text('reply_date'),
  interview_date: text('interview_date'),
  source: text('source'),
  created_date: timestamp('created_date').defaultNow(),
  user_id: text('user_id').notNull(), // To link job to a Clerk user
});
