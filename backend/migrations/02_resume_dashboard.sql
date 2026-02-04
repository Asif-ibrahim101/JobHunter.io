-- Create table for storing generated resumes
CREATE TABLE IF NOT EXISTS generated_resumes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    job_id UUID REFERENCES jobs(id) NOT NULL,
    pdf_url TEXT,
    file_name TEXT, -- Formatted as FirstName_CompanyName
    content JSONB, -- Store the full resume content structure
    ats_score INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create table for tracking job applications
CREATE TABLE IF NOT EXISTS applications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    job_id UUID REFERENCES jobs(id) NOT NULL,
    resume_id UUID REFERENCES generated_resumes(id),
    status TEXT DEFAULT 'applied', -- 'applied', 'interviewing', 'offer', 'rejected'
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE generated_resumes ENABLE ROW LEVEL SECURITY;
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;

-- Policies for generated_resumes
CREATE POLICY "Users can view own resumes" ON generated_resumes
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own resumes" ON generated_resumes
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own resumes" ON generated_resumes
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own resumes" ON generated_resumes
    FOR DELETE USING (auth.uid() = user_id);

-- Policies for applications
CREATE POLICY "Users can view own applications" ON applications
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own applications" ON applications
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own applications" ON applications
    FOR UPDATE USING (auth.uid() = user_id);
