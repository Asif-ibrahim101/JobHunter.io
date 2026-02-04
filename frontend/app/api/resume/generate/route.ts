import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { createClient } from '@supabase/supabase-js';
import { generateLatex, ResumeContent } from '@/lib/resume-template';
import { extractText } from 'unpdf';

// Lazy initialization to avoid build-time errors
let openaiClient: OpenAI | null = null;
function getOpenAI() {
    if (!openaiClient) {
        openaiClient = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY,
        });
    }
    return openaiClient;
}

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

/**
 * Fetch and extract text content from a PDF URL
 */
async function extractPdfText(pdfUrl: string): Promise<string> {
    try {
        const response = await fetch(pdfUrl);
        if (!response.ok) {
            console.error('Failed to fetch PDF:', response.status);
            return '';
        }

        const arrayBuffer = await response.arrayBuffer();
        const { text } = await extractText(arrayBuffer);

        // text is an array of strings (one per page), join them
        return Array.isArray(text) ? text.join('\n\n') : (text || '');
    } catch (error) {
        console.error('Error extracting PDF text:', error);
        return '';
    }
}

export async function POST(request: NextRequest) {
    try {
        const { jobId, userId } = await request.json();

        if (!jobId || !userId) {
            return NextResponse.json({ error: 'Missing jobId or userId' }, { status: 400 });
        }

        // Fetch job description
        const { data: job, error: jobError } = await supabase
            .from('jobs')
            .select('*')
            .eq('id', jobId)
            .single();

        if (jobError || !job) {
            return NextResponse.json({ error: 'Job not found' }, { status: 404 });
        }

        // Fetch user profile
        const { data: profile, error: profileError } = await supabase
            .from('user_profiles')
            .select('*')
            .eq('user_id', userId)
            .single();

        if (profileError || !profile) {
            console.error('Profile lookup error:', profileError);
            console.error('Looking for user_id:', userId);
            return NextResponse.json({
                error: 'User profile not found. Please complete your profile first.',
                details: profileError?.message || 'No profile found for this user'
            }, { status: 404 });
        }

        // Build user profile context
        const userProfileContext = {
            name: profile.full_name || 'John Doe',
            email: profile.email || '',
            phone: profile.phone || '',
            linkedin: profile.linkedin_url || '',
            github: profile.github_url || '',
            summary: profile.summary || '',
        };

        // Extract text from user's uploaded resume PDF if available
        let resumeText = '';
        if (profile.resume_url) {
            console.log('Extracting text from resume PDF:', profile.resume_url);
            resumeText = await extractPdfText(profile.resume_url);
            console.log('Extracted resume text length:', resumeText.length);
        }

        // Call OpenAI to generate tailored resume content
        const systemPrompt = `You are a resume optimization expert. Given a user's existing resume content and a job description, generate a tailored resume that highlights relevant skills and experience for the specific job.

IMPORTANT RULES:
1. You MUST use the information from the user's existing resume - do NOT fabricate companies, roles, projects, or education
2. Rephrase and optimize bullet points to better match the job requirements
3. Prioritize and reorder content to highlight the most relevant experience first
4. Extract skills that are both in the resume AND relevant to the job
5. Keep all factual information (dates, company names, school names, etc.) accurate from the original resume
6. ANALYZE the match between the resume and job description to provide an ATS score (0-100) and keyword analysis

Output ONLY valid JSON with this exact structure:
{
  "atsScore": 85,
  "analysis": {
    "matchedKeywords": ["React", "TypeScript", "Node.js"],
    "missingKeywords": ["GraphQL", "AWS"]
  },
  "skills": ["skill1", "skill2", ...],
  "experience": [
    {
      "company": "Company Name",
      "title": "Job Title",
      "location": "City, State",
      "startDate": "Month Year",
      "endDate": "Month Year or Present",
      "bullets": ["Achievement 1...", "Achievement 2..."]
    }
  ],
  "projects": [
    {
      "name": "Project Name",
      "technologies": ["tech1", "tech2"],
      "bullets": ["Description 1...", "Description 2..."]
    }
  ],
  "achievements": [
    "Achievement 1",
    "Achievement 2"
  ],
  "education": [
    {
      "school": "University Name",
      "degree": "Degree and Major",
      "location": "City, State",
      "dates": "Year - Year"
    }
  ]
}
`;

        const hasResumeContent = resumeText.length > 100;

        const userPrompt = hasResumeContent
            ? `JOB DESCRIPTION:
Title: ${job.title}
Company: ${job.company}
Location: ${job.location}
Description: ${job.description}

USER'S CURRENT RESUME:
${resumeText}

Based on the user's ACTUAL resume content above, create a tailored version optimized for this ${job.title} role at ${job.company}.
- Use ONLY the experience, projects, and education from the resume
- Rephrase bullet points to emphasize skills relevant to this job
- Select the top 8-10 skills that match both the resume and job description
- Prioritize the most relevant 2-3 experiences and 2-3 projects
- Extract 2-3 key achievements or awards if available
- Calculate an ATS match score based on how well the user's experience matches the job requirements`
            : `Job Description:
Title: ${job.title}
Company: ${job.company}
Location: ${job.location}
Description: ${job.description}

User Profile:
Name: ${userProfileContext.name}
Summary: ${userProfileContext.summary}

Note: The user has not uploaded a resume. Generate placeholder content that they can edit later.
Generate:
1. Top 8-10 skills that match this job description
2. 2-3 sample work experiences with 3-4 achievement bullets each
3. 2-3 sample projects with 2-3 bullets each
4. 2-3 sample achievements
5. Education section placeholder
6. Estimated ATS score for this profile`;

        const completion = await getOpenAI().chat.completions.create({
            model: 'gpt-4o',
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userPrompt },
            ],
            temperature: 0.7,
            response_format: { type: 'json_object' },
        });

        const aiResponse = completion.choices[0].message.content;
        if (!aiResponse) {
            throw new Error('No response from AI');
        }

        const generatedContent = JSON.parse(aiResponse);

        // Build the full resume content
        const resumeContent: ResumeContent = {
            name: userProfileContext.name,
            email: userProfileContext.email,
            phone: userProfileContext.phone,
            linkedin: userProfileContext.linkedin,
            github: userProfileContext.github,
            skills: generatedContent.skills || [],
            experience: generatedContent.experience || [],
            projects: generatedContent.projects || [],
            achievements: generatedContent.achievements || [],
            education: generatedContent.education || [],
            atsScore: generatedContent.atsScore,
            analysis: generatedContent.analysis,
        };

        // Generate LaTeX
        const latexContent = generateLatex(resumeContent);

        return NextResponse.json({
            content: resumeContent,
            latexContent,
        });
    } catch (error) {
        console.error('Resume generation error:', error);
        return NextResponse.json(
            { error: 'Failed to generate resume' },
            { status: 500 }
        );
    }
}
