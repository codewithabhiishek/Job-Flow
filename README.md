<div align="center">
  <img src="https://vitejs.dev/logo.svg" alt="Vite Logo" width="80" height="80" />
  <h1 align="center">Job Flow</h1>
  <p align="center">
    <strong>A Next-Generation Job Tracking Platform powered by React, Express, Neon & AI</strong>
  </p>
  
  <p align="center">
    <a href="https://reactjs.org/"><img src="https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" alt="React" /></a>
    <a href="https://expressjs.com/"><img src="https://img.shields.io/badge/Express.js-404D59?style=for-the-badge" alt="Express" /></a>
    <a href="https://neon.tech/"><img src="https://img.shields.io/badge/Neon-00E599?style=for-the-badge&logo=neon&logoColor=black" alt="Neon" /></a>
    <a href="https://clerk.com/"><img src="https://img.shields.io/badge/Clerk-6C47FF?style=for-the-badge&logo=clerk&logoColor=white" alt="Clerk" /></a>
    <a href="https://tailwindcss.com/"><img src="https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white" alt="Tailwind" /></a>
  </p>
</div>

---

## 📖 Overview

**Job Flow** is a streamlined, visually stunning job application tracker that leverages AI to eliminate manual data entry. Gone are the days of manually typing out company names, salaries, and required skills. Simply paste a screenshot, drop a job URL, or paste the job description text, and let the integrated LLM seamlessly extract and structure the data for your Kanban board.

## ✨ Key Features

- **🧠 AI-Powered Data Extraction:** Automatically parses screenshots, job URLs, or text into a structured schema using Gemini/Minimax via our custom `aiProvider`. Features advanced platform inference logic.
- **🔐 Secure Authentication:** Seamless user login and registration powered by **Clerk**.
- **🗂️ Drag & Drop Kanban:** Easily move your job applications between statuses with instantaneous optimistic UI updates powered by **React Query**.
- **📊 Real-time Analytics:** Visualizes your application progress, hit rate, and active pipelines via dynamic Recharts.
- **⚡ Blazing Fast Architecture:** Built with Vite and backed by a Serverless Postgres database via Neon and Drizzle ORM. Optimized with lazy loading and code splitting.
- **🛡️ Production Security:** Protected against SSRF attacks and fully rate-limited API endpoints.

---

## 🏛️ System Architecture

Our decoupled architecture isolates the frontend UI from the database logic, ensuring security and speed.

```mermaid
flowchart TD
    subgraph Frontend [React + Vite Client]
        UI[User Interface / Pages]
        Clerk[Clerk Auth]
        ReactQuery[React Query Cache]
        APIClient[API Client Fetch]
        
        UI <--> Clerk
        UI <--> ReactQuery
        ReactQuery <--> APIClient
    end
    
    subgraph Backend [Express API - port 3001]
        API[Express Router]
        AI[AI Provider Wrapper]
        DBConfig[Drizzle ORM]
        
        API <--> AI
        API <--> DBConfig
    end
    
    subgraph External [External Services]
        Neon[(Neon Serverless Postgres)]
        LLM[Gemini / Minimax LLM]
    end

    APIClient == "HTTP /api/* \n (w/ Auth Headers)" === API
    DBConfig == "SQL Queries" ==> Neon
    AI == "Prompt + Context" ==> LLM
```

---

## 🤖 AI Extraction Flow

Adding a job via AI utilizes a strict prompt structure to ensure predictable parsing.

```mermaid
sequenceDiagram
    participant User
    participant Frontend
    participant Backend
    participant LLM (AI)
    participant Database

    User->>Frontend: Uploads Screenshot / Pastes URL
    Frontend->>Backend: POST /api/upload (if image)
    Backend-->>Frontend: returns file_url
    Frontend->>Backend: POST /api/ai/invoke <br>(Prompt + Image URL)
    Backend->>LLM (AI): Extract data via EXTRACTION_SCHEMA
    LLM (AI)-->>Backend: Returns Structured JSON
    Backend-->>Frontend: Forward JSON response
    Frontend->>User: Displays pre-filled Review Form
    User->>Frontend: Clicks "Save Job"
    Frontend->>Backend: POST /api/jobs
    Backend->>Database: INSERT into Jobs table
    Database-->>Backend: OK
    Backend-->>Frontend: OK
    Frontend-->>User: Updates UI
```

---

## 🚀 Getting Started

Follow these instructions to run Job Flow on your local machine.

### 1. Prerequisites
- Node.js (v18+)
- npm or yarn
- Accounts on [Clerk](https://clerk.com/) and [Neon](https://neon.tech/)

### 2. Installation
Clone the repository and install the dependencies:
```bash
git clone https://github.com/codewithabhiishek/Job-Flow.git
cd Job-Flow
npm install
```

### 3. Environment Variables
Copy the template `.env.example` to `.env`:
```bash
cp .env.example .env
```
Populate the file with your specific variables:
```env
# Clerk Auth
VITE_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...

# Neon Database
DATABASE_URL=postgresql://user:password@ep-cool-resonance-123456.us-east-2.aws.neon.tech/neondb?sslmode=require
```

### 4. Run the Servers
Launch both the Vite frontend and Express backend concurrently:
```bash
npm run dev
```

- **Frontend:** http://localhost:5173
- **Backend API:** http://localhost:3001

---

<div align="center">
  <p>Built with ❤️ for modern developers.</p>
</div>
