# Job Flow Architecture

This document outlines the high-level architecture, data flow, and underlying logic of the Job Flow application.

## 1. Tech Stack Overview

Job Flow utilizes a modern, decoupled architecture:
- **Frontend:** React + Vite, styled with Tailwind CSS and Shadcn UI components.
- **Backend:** Node.js + Express.js API.
- **Database:** Neon (Serverless PostgreSQL) managed via Drizzle ORM.
- **Authentication:** Clerk.
- **AI Processing:** Abstracted AI Provider (Gemini / Minimax) for data extraction.

---

## 2. System Architecture & Flow

### 2.1 Authentication Flow
1. **Frontend Login:** The user navigates to `/login` or `/register`, triggering Clerk's React UI components.
2. **Token & User Retrieval:** Once authenticated, Clerk handles session management securely in the browser. 
3. **App Context:** `App.jsx` listens to Clerk's `useUser()` hook and updates our custom `apiClient` instance with the `userId`.
4. **Backend Security:** When the frontend makes an API request (via `apiClient`), it attaches the user identity (e.g., via `x-user-id` header or bearer token). The Express backend uses this identifier to restrict database queries (using Drizzle) ensuring users can only read/write their own job entries.

### 2.2 Frontend to Backend Communication
- **API Client (`src/api/client.js`):** A wrapper around the native `fetch` API. It automatically attaches necessary headers (like authentication and `Content-Type: application/json`) and handles standard error checking.
- **Endpoints:**
  - `GET /api/jobs`: Fetches all jobs belonging to the authenticated user.
  - `POST /api/jobs`: Creates a new job entry.
  - `PUT /api/jobs/:id`: Updates an existing job (e.g., when dragging a card in the Kanban board).
  - `DELETE /api/jobs/:id`: Removes a job.
  - `POST /api/upload`: Handles file uploads (resumes/screenshots).
  - `POST /api/ai/invoke`: Triggers AI processing.

### 2.3 Database Layer (Drizzle + Neon)
- **Schema (`server/schema.js`):** Defines the exact PostgreSQL table structure, including types (text, boolean, timestamp, jsonb for arrays like `skills`).
- **Connection (`server/db.js`):** Connects to the Neon Serverless Postgres via the `@neondatabase/serverless` driver. Drizzle acts as the intermediary, providing type-safe SQL queries.

---

## 3. Core Logic & Calculations

### 3.1 Kanban Board (`Kanban.jsx`)
- **State:** Jobs are grouped locally by their `status` field (`saved`, `applied`, `interviewing`, `offer`, `rejected`).
- **Drag & Drop:** Utilizes `@hello-pangea/dnd`. When a job card is dropped into a new column:
  1. The frontend immediately updates the local React state (Optimistic UI update).
  2. A `PUT` request is dispatched to `/api/jobs/:id` with the new status.
  3. The backend executes an SQL `UPDATE` against the Neon database.

### 3.2 Analytics Dashboard (`Analytics.jsx` & `Dashboard.jsx`)
- **Calculations:** 
  - Iterates over the fetched jobs array to calculate metrics like "Total Applications", "Active Interviews", and "Offers".
  - Aggregates jobs by `applied_date` or `status` to construct timeline charts using `Recharts`.
- **Filtering:** Users can filter calculations dynamically by searching company names or toggling remote/on-site filters without triggering new network requests.

---

## 4. AI & Image Extraction Flow

The most complex feature of the app is extracting structured data from screenshots, URLs, or raw text blocks via the `AddJobDialog.jsx` component.

### Step-by-Step Execution:
1. **Input Stage:** 
   - The user either uploads a screenshot, pastes a URL, or pastes plain text into the dialog box.
2. **File Upload (If Image):**
   - If an image is provided, the frontend sends it to `POST /api/upload`.
   - The backend stores this image temporarily (or permanently in an S3/Cloudinary bucket) and returns a publicly accessible `file_url`.
3. **AI Invocation (`POST /api/ai/invoke`):**
   - The frontend constructs a highly specific prompt containing instructions to extract details.
   - It passes the prompt (and the `file_url` if applicable) to the backend.
4. **Backend Processing (`server/aiProvider.js`):**
   - The `aiProvider` routes the request to a multimodal Large Language Model (e.g., Gemini 1.5 Pro).
   - **Crucial Logic:** The AI is strictly instructed to return data matching a pre-defined JSON Schema (`EXTRACTION_SCHEMA`). This schema forces the LLM to output properties like `company`, `job_title`, `salary`, `skills` (as an array), and `remote` (as a boolean).
5. **Review & Save:**
   - The backend responds with the structured JSON object.
   - The frontend parses this JSON and pre-fills an editable form.
   - The user reviews/edits the extracted calculations.
   - Upon clicking "Save", the final structured object is sent via `POST /api/jobs` and stored in the PostgreSQL database.
