-- Create table for storing resume analysis results
CREATE TABLE IF NOT EXISTS resume_analyses (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) NOT NULL,

    -- Input data
    resume_url TEXT,                    -- URL of analyzed resume
    job_description TEXT NOT NULL,      -- The JD text
    job_title TEXT,                     -- Optional: extracted or provided job title
    company_name TEXT,                  -- Optional: extracted or provided company

    -- Scores
    total_score INTEGER NOT NULL,       -- 0-100
    grade CHAR(1) NOT NULL,             -- A, B, C, D, F

    -- Score breakdown (JSONB for flexibility)
    breakdown JSONB NOT NULL,           -- {keyword_match, structure, formatting, length, quantifiable_achievements, jd_alignment}

    -- Analysis results
    strengths TEXT[] DEFAULT '{}',
    weaknesses TEXT[] DEFAULT '{}',
    missing_keywords TEXT[] DEFAULT '{}',
    suggestions TEXT[] DEFAULT '{}',

    -- Parsed data (for reference/debugging)
    resume_data JSONB,                  -- Parsed resume structure
    jd_data JSONB,                      -- Parsed JD structure

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE resume_analyses ENABLE ROW LEVEL SECURITY;

-- Policies for resume_analyses
CREATE POLICY "Users can view own analyses" ON resume_analyses
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own analyses" ON resume_analyses
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own analyses" ON resume_analyses
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own analyses" ON resume_analyses
    FOR DELETE USING (auth.uid() = user_id);

-- Index for faster lookups
CREATE INDEX idx_resume_analyses_user_id ON resume_analyses(user_id);
CREATE INDEX idx_resume_analyses_created_at ON resume_analyses(created_at DESC);
