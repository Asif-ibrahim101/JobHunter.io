# Product Requirements Document: Resume Generation Feature

---

## Overview

Generate a tailored resume based on a job description using the user's profile data. The resume uses a fixed LaTeX template (Jake's Resume), with content dynamically generated via OpenAI and compiled to PDF via a free API.

---

## User Flow

1. User views a Job Description in-app
2. User clicks "Generate Resume"
3. System pulls user profile data + JD
4. OpenAI generates tailored content (skills, experience bullets, projects)
5. Content is injected into LaTeX template
6. LaTeX is compiled to PDF via API
7. User sees split view: **PDF preview** (left) | **Editor** (right)
8. User edits content in editor → PDF re-renders
9. User downloads final PDF

---

## Technical Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Frontend                             │
│  ┌─────────────┐    ┌─────────────┐    ┌────────────────┐  │
│  │  JD Viewer  │    │ PDF Preview │    │ Resume Editor  │  │
│  └─────────────┘    └─────────────┘    └────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                        Backend API                          │
│  ┌─────────────────┐    ┌─────────────────────────────────┐│
│  │ /api/generate   │    │ /api/compile                    ││
│  │ (OpenAI call)   │    │ (LaTeX API call)                ││
│  └─────────────────┘    └─────────────────────────────────┘│
└─────────────────────────────────────────────────────────────┘
                              │
              ┌───────────────┴───────────────┐
              ▼                               ▼
      ┌──────────────┐               ┌──────────────────┐
      │  OpenAI API  │               │  LaTeX API       │
      │  (content)   │               │  (PDF compile)   │
      └──────────────┘               └──────────────────┘
```

---

## Data Models

### User Profile (existing)

```typescript
interface UserProfile {
  name: string
  email: string
  phone: string
  linkedin?: string
  github?: string
  summary: string
  skills: string[]
  experience: Experience[]
  projects: Project[]
  education: Education[]
}

interface Experience {
  company: string
  title: string
  startDate: string
  endDate: string
  bullets: string[]  // Original bullets from user
}

interface Project {
  name: string
  technologies: string[]
  description: string
  bullets: string[]
}
```

### Generated Resume

```typescript
interface GeneratedResume {
  id: string
  jobId: string
  userId: string
  latexContent: string      // Full LaTeX source
  generatedAt: Date
  sections: {
    skills: string[]        // Tailored skills
    experience: TailoredExperience[]
    projects: TailoredProject[]
  }
}
```

---

## API Endpoints

### `POST /api/resume/generate`

**Input:**
```json
{
  "jobId": "string",
  "userId": "string"
}
```

**Process:**
1. Fetch user profile
2. Fetch job description
3. Call OpenAI to generate tailored content
4. Return structured content

**Output:**
```json
{
  "skills": ["React", "TypeScript", "Node.js"],
  "experience": [...],
  "projects": [...],
  "latexContent": "\\documentclass..."
}
```

### `POST /api/resume/compile`

**Input:**
```json
{
  "latexContent": "string"
}
```

**Process:**
1. Send LaTeX to compilation API (latex.ytotech.com)
2. Return PDF blob/URL

**Output:**
```json
{
  "pdfUrl": "string",
  "success": true
}
```

### `POST /api/resume/recompile`

**Input:**
```json
{
  "latexContent": "string"
}
```

**Output:** Same as compile

---

## OpenAI Prompt Strategy

### System Prompt

```
You are a resume optimization expert. Given a user's experience and a job description, rewrite the experience bullets and select relevant skills to match the JD. Keep content truthful - only rephrase and highlight, never fabricate.
```

### User Prompt

```
Job Description:
{jd_content}

User Profile:
{user_profile_json}

Generate:
1. Top 8-10 skills from user's skillset that match this JD
2. Rewritten experience bullets that highlight relevant achievements
3. Select and tailor 2-3 most relevant projects

Output as JSON.
```

---

## LaTeX Template (Jake's Resume)

Store as template string with placeholders:

```latex
\documentclass[letterpaper,11pt]{article}
% ... preamble ...

\begin{document}

\begin{center}
  \textbf{\Huge {{NAME}}} \\
  {{PHONE}} | {{EMAIL}} | {{LINKEDIN}} | {{GITHUB}}
\end{center}

\section{Skills}
{{SKILLS}}

\section{Experience}
{{EXPERIENCE}}

\section{Projects}
{{PROJECTS}}

\section{Education}
{{EDUCATION}}

\end{document}
```

---

## Frontend Components

| Component | Purpose |
|-----------|---------|
| `ResumeGenerator.tsx` | Main container, orchestrates flow |
| `ResumeEditor.tsx` | Text editor for LaTeX/content editing |
| `PDFPreview.tsx` | Renders PDF (use `react-pdf` or iframe) |
| `GenerateButton.tsx` | Triggers generation with loading state |
| `SplitView.tsx` | Layout wrapper for editor + preview |

---

## Editor Options

### Option A: Edit structured content (Recommended for MVP)
- User edits skills, bullets in form fields
- System re-generates LaTeX and recompiles
- Easier UX, less error-prone

### Option B: Edit raw LaTeX
- Power user feature
- Risk of syntax errors breaking compilation
- Add for later

**Recommendation:** Start with Option A, add Option B as "Advanced Mode" later

---

## UI Layout

```
┌─────────────────────────────────────────────────────────────┐
│  [← Back to Job]              Generate Resume        [Save] │
├────────────────────────────┬────────────────────────────────┤
│                            │                                │
│      PDF PREVIEW           │         EDITOR                 │
│                            │                                │
│   ┌──────────────────┐     │   Skills: [chip][chip][+]      │
│   │                  │     │                                │
│   │   Resume.pdf     │     │   Experience:                  │
│   │                  │     │   ┌─────────────────────────┐  │
│   │                  │     │   │ • Built dashboard...    │  │
│   │                  │     │   │ • Reduced latency...    │  │
│   │                  │     │   └─────────────────────────┘  │
│   │                  │     │                                │
│   └──────────────────┘     │   [Regenerate] [Download PDF]  │
│                            │                                │
└────────────────────────────┴────────────────────────────────┘
```

---

## Edge Cases

| Case | Handling |
|------|----------|
| LaTeX compilation fails | Show error, allow user to fix in advanced mode |
| OpenAI rate limit | Queue request, show loading state |
| User has incomplete profile | Prompt to complete profile first |
| JD too short | Warn user, generate with available info |
| PDF render fails | Fallback to download link |

---

## Implementation Phases

### Phase 1: Core Generation
- OpenAI integration for content generation
- LaTeX template with placeholder injection
- PDF compilation via API
- Basic preview

### Phase 2: Editing
- Structured content editor
- Real-time recompilation on edit
- Download functionality

### Phase 3: Polish
- Save/load generated resumes
- Multiple template options
- Raw LaTeX editor (advanced mode)
- Version history

---

## Dependencies

```json
{
  "openai": "^4.x",
  "react-pdf": "^7.x",
  "@react-pdf-viewer/core": "^3.x"
}
```

---

## Cost Estimate

| Service | Cost |
|---------|------|
| OpenAI GPT-4 | ~$0.01-0.03 per generation |
| LaTeX API | Free |
| Total per resume | ~$0.03 |
