import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

export default {
  schema: './api/schema.js',
  out: './api/drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL,
  },
};
