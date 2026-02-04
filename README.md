# 🎯 JobHunter.io

**The ultimate AI-powered job search automation suite.**

JobHunter.io streamlines your job search by combining a powerful job tracker, LinkedIn scraper, and an advanced **AI Resume Generator** into one cohesive platform.

![Dashboard Preview](https://raw.githubusercontent.com/Asif-ibrahim101/JobHunter.io/main/screenshots/dashboard.png)

## ✨ Features

### 📄 AI Resume Generator (New!)
Create ATS-optimized resumes tailored to specific job descriptions in seconds.
- **Tailored Content**: AI analyzes the Job Description and your profile to generate targeted resume content.
- **ATS Scoring**: Real-time scoring (0-100) with "Missing Keywords" analysis to help you pass the bots.
- **AI Bullet Points**: One-click generation of high-impact, role-specific bullet points for your experience.
- **Resume History**: Track every resume you generate, view historical scores, and download past versions.
- **Manual Save**: Save specific versions of your resume to your dashboard for later access.
- **Professional PDF**: Export clean, LaTeX-formatted PDFs automatically named (`Name_Company.pdf`).

### 🕵️ Job Automation
- **Chrome Extension**: Save job details from LinkedIn with a single click.
- **LinkedIn Scraper**: Automated scraping to populate your job board.
- **Job Board**: A Kanban-style or list view dashboard to manage your application pipeline.
- **AI Answers**: Generate personalized answers for common application questions (e.g., "Why this company?") using the **AI Answer** button.

## 🛠️ Tech Stack

- **Frontend**: Next.js 16 (App Router), TypeScript, Tailwind CSS, Lucide Icons.
- **Backend**: Node.js, Express (Scraper), Next.js Server Actions (Resumes).
- **Database**: Supabase (PostgreSQL) + Storage.
- **AI**: OpenAI GPT-4o.
- **PDF Generation**: LaTeX Compiler API.

## 🚀 Quick Start

### 1. Prerequisites
- Node.js 18+
- Supabase Account
- OpenAI API Key

### 2. Clone & Install

```bash
git clone https://github.com/Asif-ibrahim101/JobHunter.io.git
cd JobHunter.io

# Install Backend dependencies
cd backend && npm install

# Install Frontend dependencies
cd ../frontend && npm install
```

### 3. Environment Setup

Create `.env.local` in `frontend/`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
OPENAI_API_KEY=sk-your-key
```

### 4. Database Setup (Supabase)

Run the following SQL queries in your Supabase SQL Editor:

**Step 1: Create Jobs Table**
```sql
CREATE TABLE jobs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  company TEXT,
  location TEXT,
  description TEXT,
  url TEXT,
  source TEXT DEFAULT 'LinkedIn',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all" ON jobs FOR ALL USING (true);
```

**Step 2: Create Resume Tables**
Run the content of the migration file located at:
`backend/migrations/02_resume_dashboard.sql`

*This creates the `generated_resumes` and `applications` tables required for the Resume Dashboard.*

**(Important: Ensure you have a 'resumes' bucket in Supabase Storage)**

### 5. Run the Application

```bash
# Terminal 1: Frontend (Dashboard & Generator)
cd frontend
npm run dev
# App will run at http://localhost:3000
```

```bash
# Terminal 2: Backend (Scraper Service - Optional)
cd backend
npm run dev
```

## 📁 Project Structure

```
JobHunter.io/
├── frontend/         # Next.js App (Dashboard, Resume Generator, Profile)
│   ├── app/          # App Router Pages
│   ├── components/   # UI Components (JobCard, ResumeEditor, etc.)
│   └── lib/          # Utilities & Supabase Client
├── backend/          # Express Server & Migrations
│   └── migrations/   # SQL Migration Files
└── extension/        # Chrome Extension Source
```

## 📝 License

MIT © [Asif Ibrahim](https://github.com/Asif-ibrahim101)
