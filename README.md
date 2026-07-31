# Job Flow

A standard React + Vite frontend with an Express backend using Neon PostgreSQL.

## Getting Started

1. Set up your `.env` file based on `.env.example`:
   ```bash
   cp .env.example .env
   # Add your Clerk and Neon database credentials
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Run the development server (runs both Vite and Express API concurrently):
   ```bash
   npm run dev
   ```

The app will be running at `http://localhost:5173`.
The backend API will be running at `http://localhost:3001`.

## Technologies

- React + Vite
- Clerk Authentication
- Tailwind CSS
- Express.js
- Drizzle ORM
- Neon PostgreSQL
