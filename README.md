# JobHunter.io 🎯

A comprehensive job hunting automation suite featuring a Chrome extension, LinkedIn scraper, and AI-powered application assistant.

![Dashboard Screenshot](https://raw.githubusercontent.com/Asif-ibrahim101/JobHunter.io/main/screenshots/dashboard.png)

## ✨ Features

| Feature | Description |
|---------|-------------|
| 🔌 **Chrome Extension** | Extract job details from LinkedIn with one click |
| 🕷️ **LinkedIn Scraper** | Automatically scrape job listings from LinkedIn |
| 🌐 **Web Dashboard** | Beautiful Next.js dashboard to manage saved jobs |
| 🤖 **AI Answers** | Generate personalized application answers with OpenAI |
| ☁️ **Cloud Storage** | All data synced to Supabase (PostgreSQL) |

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Supabase account (free tier works)
- OpenAI API key

### 1. Clone & Install

```bash
git clone https://github.com/Asif-ibrahim101/JobHunter.io.git
cd JobHunter.io

# Install all dependencies
cd backend && npm install && cd ..
cd frontend && npm install && cd ..
cd scraper && npm install && cd ..
```

### 2. Configure Environment

Create `.env.local` in the root directory:

```env
# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key

# OpenAI
OPENAI_API_KEY=sk-your-openai-key
```

Create `frontend/.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### 3. Setup Supabase Database

Run this SQL in your Supabase SQL Editor:

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

### 4. Run the App

```bash
# Terminal 1: Backend API
cd backend && npm run dev

# Terminal 2: Frontend Dashboard
cd frontend && npm run dev

# Terminal 3 (optional): Run scraper
cd scraper && npm run scrape
```

- **Backend:** http://localhost:3001
- **Frontend:** http://localhost:3000

### 5. Install Chrome Extension

1. Open `chrome://extensions/`
2. Enable "Developer mode"
3. Click "Load unpacked"
4. Select the `/extension` folder

## 📁 Project Structure

```
JobHunter.io/
├── backend/          # Express.js API server
├── extension/        # Chrome extension (Manifest V3)
├── frontend/         # Next.js web dashboard
└── scraper/          # Puppeteer LinkedIn scraper
```

## 🛠️ Tech Stack

- **Frontend:** Next.js 16, TypeScript, Tailwind CSS
- **Backend:** Node.js, Express
- **Database:** Supabase (PostgreSQL)
- **AI:** OpenAI GPT-4o-mini
- **Scraping:** Puppeteer with stealth plugin
- **Extension:** Chrome Manifest V3

## 📸 Screenshots

### Web Dashboard
View and manage all your saved jobs in a beautiful card grid.

### AI Answer Generation
Click "AI Answer" on any job to generate personalized responses for common application questions.

## 📝 License

MIT © [Asif Ibrahim](https://github.com/Asif-ibrahim101)
