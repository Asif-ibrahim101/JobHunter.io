// Parsed resume data structure
export interface ParsedResumeData {
  name: string | null;
  email: string | null;
  phone: string | null;
  summary: string | null;
  skills: string[];
  experience: {
    title: string;
    company: string;
    dates: string;
    bullets: string[];
  }[];
  education: {
    degree: string;
    school: string;
    year: string;
  }[];
  projects: {
    name: string;
    description: string;
  }[];
  certifications: string[];
}

// Parsed job description data
export interface ParsedJDData {
  required_skills: string[];
  qualifications: string[];
  keywords: string[];
  must_haves: string[];
}

// Score breakdown structure
export interface ScoreBreakdown {
  keyword_match: number;      // Max 30 points
  structure: number;          // Max 20 points
  formatting: number;         // Max 15 points
  length: number;             // Max 10 points
  quantifiable_achievements: number;  // Max 15 points
  jd_alignment: number;       // Max 10 points
}

// Full analysis result
export interface ResumeAnalysisResult {
  id: string;
  user_id: string;
  resume_url: string | null;
  job_description: string;
  job_title: string | null;
  company_name: string | null;
  total_score: number;
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
  breakdown: ScoreBreakdown;
  strengths: string[];
  weaknesses: string[];
  missing_keywords: string[];
  suggestions: string[];
  resume_data: ParsedResumeData | null;
  jd_data: ParsedJDData | null;
  created_at: string;
  updated_at: string;
}

// API request body
export interface AnalyzeResumeRequest {
  userId: string;
  resumeUrl?: string;       // Optional: use profile resume or provide URL
  resumeText?: string;      // Optional: direct text input
  jobDescription: string;
  jobTitle?: string;
  companyName?: string;
}

// API response
export interface AnalyzeResumeResponse {
  success: boolean;
  analysis?: ResumeAnalysisResult;
  error?: string;
}

// History list item (lighter version for lists)
export interface AnalysisListItem {
  id: string;
  total_score: number;
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
  job_title: string | null;
  company_name: string | null;
  created_at: string;
}
