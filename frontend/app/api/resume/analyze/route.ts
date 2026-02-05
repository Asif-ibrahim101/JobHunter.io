import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { createClient } from '@supabase/supabase-js';
import { extractText } from 'unpdf';
import {
    ParsedResumeData,
    ParsedJDData,
    ScoreBreakdown,
    ResumeAnalysisResult,
} from '@/types/analysis';

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

        return Array.isArray(text) ? text.join('\n\n') : (text || '');
    } catch (error) {
        console.error('Error extracting PDF text:', error);
        return '';
    }
}

/**
 * Parse resume text into structured data using AI
 */
async function parseResumeWithAI(resumeText: string): Promise<ParsedResumeData> {
    const systemPrompt = `You are a resume parser. Extract structured data from resumes and return valid JSON only.`;

    const userPrompt = `Parse this resume and return ONLY a JSON object with this structure:
{
  "name": "full name or null",
  "email": "email address or null",
  "phone": "phone number or null",
  "summary": "professional summary or null",
  "skills": ["skill1", "skill2"],
  "experience": [{"title": "job title", "company": "company name", "dates": "duration", "bullets": ["achievement1"]}],
  "education": [{"degree": "degree name", "school": "school name", "year": "year"}],
  "projects": [{"name": "project name", "description": "description"}],
  "certifications": ["cert1", "cert2"]
}

Resume text:
${resumeText}

Return ONLY the JSON object, no additional text.`;

    const completion = await getOpenAI().chat.completions.create({
        model: 'gpt-4o',
        messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
        ],
        temperature: 0.3,
        response_format: { type: 'json_object' },
    });

    const responseText = completion.choices[0].message.content || '{}';
    const parsed = JSON.parse(responseText);

    return {
        name: parsed.name || null,
        email: parsed.email || null,
        phone: parsed.phone || null,
        summary: parsed.summary || null,
        skills: parsed.skills || [],
        experience: parsed.experience || [],
        education: parsed.education || [],
        projects: parsed.projects || [],
        certifications: parsed.certifications || [],
    };
}

/**
 * Extract key elements from job description using AI
 */
async function extractJDData(jdText: string): Promise<ParsedJDData> {
    const systemPrompt = `You are a job description analyzer. Extract key requirements and return valid JSON only.`;

    const userPrompt = `Analyze this job description and return ONLY a JSON object with:
{
  "required_skills": ["skill1", "skill2"],
  "qualifications": ["qual1", "qual2"],
  "keywords": ["keyword1", "keyword2"],
  "must_haves": ["must1", "must2"]
}

Job Description:
${jdText}

Return ONLY the JSON object, no additional text.`;

    const completion = await getOpenAI().chat.completions.create({
        model: 'gpt-4o',
        messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
        ],
        temperature: 0.3,
        response_format: { type: 'json_object' },
    });

    const responseText = completion.choices[0].message.content || '{}';
    const parsed = JSON.parse(responseText);

    return {
        required_skills: parsed.required_skills || [],
        qualifications: parsed.qualifications || [],
        keywords: parsed.keywords || [],
        must_haves: parsed.must_haves || [],
    };
}

/**
 * Calculate ATS score based on 6 criteria
 */
function calculateATSScore(
    resume: ParsedResumeData,
    jd: ParsedJDData
): { totalScore: number; breakdown: ScoreBreakdown; missingKeywords: string[] } {
    // 1. Keyword Match (30 points)
    const resumeKeywords = new Set(resume.skills.map(s => s.toLowerCase()));
    const jdKeywords = new Set([...jd.keywords, ...jd.required_skills].map(k => k.toLowerCase()));

    const matchedKeywords = [...resumeKeywords].filter(k => jdKeywords.has(k));
    const keywordMatchRatio = jdKeywords.size > 0 ? matchedKeywords.length / jdKeywords.size : 0;
    const keywordScore = keywordMatchRatio * 30;

    const missingKeywords = [...jdKeywords].filter(k => !resumeKeywords.has(k));

    // 2. Structure (20 points)
    const hasSummary = resume.summary ? 1 : 0;
    const hasSkills = resume.skills.length > 0 ? 1 : 0;
    const hasExperience = resume.experience.length > 0 ? 1 : 0;
    const hasEducation = resume.education.length > 0 ? 1 : 0;
    const structureScore = ((hasSummary + hasSkills + hasExperience + hasEducation) / 4) * 20;

    // 3. Formatting (15 points) - assume good if parsed successfully
    const formattingScore = 15;

    // 4. Length (10 points) - assume adequate if document parsed
    const lengthScore = 10;

    // 5. Quantifiable Achievements (15 points)
    let totalBullets = 0;
    let quantifiedBullets = 0;
    for (const exp of resume.experience) {
        for (const bullet of exp.bullets || []) {
            totalBullets++;
            if (/\d|%/.test(bullet)) {
                quantifiedBullets++;
            }
        }
    }
    const achievementScore = totalBullets > 0 ? (quantifiedBullets / totalBullets) * 15 : 0;

    // 6. JD Alignment (10 points)
    const alignmentScore = Math.min(10, matchedKeywords.length * 2);

    const breakdown: ScoreBreakdown = {
        keyword_match: Math.round(keywordScore * 10) / 10,
        structure: Math.round(structureScore * 10) / 10,
        formatting: Math.round(formattingScore * 10) / 10,
        length: Math.round(lengthScore * 10) / 10,
        quantifiable_achievements: Math.round(achievementScore * 10) / 10,
        jd_alignment: Math.round(alignmentScore * 10) / 10,
    };

    const totalScore = Math.round(
        keywordScore + structureScore + formattingScore + lengthScore + achievementScore + alignmentScore
    );

    return { totalScore, breakdown, missingKeywords };
}

/**
 * Convert score to letter grade
 */
function getGrade(score: number): 'A' | 'B' | 'C' | 'D' | 'F' {
    if (score >= 90) return 'A';
    if (score >= 80) return 'B';
    if (score >= 70) return 'C';
    if (score >= 60) return 'D';
    return 'F';
}

/**
 * Generate tailored suggestions using AI
 */
async function generateSuggestions(
    resume: ParsedResumeData,
    jd: ParsedJDData,
    missingKeywords: string[],
    score: number
): Promise<string[]> {
    try {
        const systemPrompt = `You are an ATS optimization expert. Provide specific, actionable suggestions.`;

        const userPrompt = `Based on this ATS analysis, provide 5-7 specific, actionable suggestions to improve the resume.

Current Score: ${score}/100
Missing Keywords: ${missingKeywords.slice(0, 10).join(', ')}
Resume Skills: ${resume.skills.slice(0, 10).join(', ')}
Required Skills: ${jd.required_skills.slice(0, 10).join(', ')}

Provide suggestions as a JSON object with a "suggestions" array:
{"suggestions": ["suggestion 1", "suggestion 2", ...]}

Return ONLY the JSON object.`;

        const completion = await getOpenAI().chat.completions.create({
            model: 'gpt-4o',
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userPrompt },
            ],
            temperature: 0.7,
            response_format: { type: 'json_object' },
        });

        const responseText = completion.choices[0].message.content || '{}';
        const parsed = JSON.parse(responseText);
        return parsed.suggestions || [];
    } catch (error) {
        console.error('Suggestion generation error:', error);
        return [
            `Add missing keywords: ${missingKeywords.slice(0, 5).join(', ')}`,
            'Quantify your achievements with metrics and percentages',
            'Tailor your professional summary to match the job description',
            'Use action verbs to start each bullet point',
            'Ensure your resume is ATS-friendly (no tables, images, or complex formatting)',
        ];
    }
}

/**
 * Identify strengths based on score breakdown
 */
function identifyStrengths(breakdown: ScoreBreakdown, resume: ParsedResumeData): string[] {
    const strengths: string[] = [];

    if (breakdown.keyword_match >= 24) {
        strengths.push('Strong keyword match with job requirements');
    }
    if (breakdown.structure >= 16) {
        strengths.push('Well-structured resume with all key sections');
    }
    if (breakdown.quantifiable_achievements >= 12) {
        strengths.push('Good use of quantifiable achievements');
    }
    if (resume.skills.length > 10) {
        strengths.push('Comprehensive skills list');
    }
    if (resume.experience.length >= 3) {
        strengths.push('Strong work experience history');
    }

    return strengths;
}

/**
 * Identify weaknesses based on score breakdown
 */
function identifyWeaknesses(
    breakdown: ScoreBreakdown,
    missingKeywords: string[]
): string[] {
    const weaknesses: string[] = [];

    if (breakdown.keyword_match < 15) {
        weaknesses.push(`Low keyword match (${Math.round((breakdown.keyword_match / 30) * 100)}%)`);
    }
    if (breakdown.quantifiable_achievements < 8) {
        weaknesses.push('Needs more quantifiable achievements with metrics');
    }
    if (missingKeywords.length > 5) {
        weaknesses.push(`Missing ${missingKeywords.length} important keywords`);
    }
    if (breakdown.structure < 15) {
        weaknesses.push('Resume structure could be improved');
    }

    return weaknesses;
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { userId, resumeUrl, resumeText, jobDescription, jobTitle, companyName } = body;

        if (!userId) {
            return NextResponse.json({ error: 'Missing userId' }, { status: 400 });
        }

        if (!jobDescription) {
            return NextResponse.json({ error: 'Missing job description' }, { status: 400 });
        }

        // Get resume text from URL or direct input
        let finalResumeText = resumeText || '';

        if (!finalResumeText && resumeUrl) {
            console.log('Extracting text from resume PDF:', resumeUrl);
            finalResumeText = await extractPdfText(resumeUrl);
            console.log('Extracted resume text length:', finalResumeText.length);
        }

        // If no resume provided, try to get from user profile
        if (!finalResumeText) {
            const { data: profile } = await supabase
                .from('user_profiles')
                .select('resume_url')
                .eq('user_id', userId)
                .single();

            if (profile?.resume_url) {
                console.log('Using profile resume:', profile.resume_url);
                finalResumeText = await extractPdfText(profile.resume_url);
            }
        }

        if (!finalResumeText || finalResumeText.length < 100) {
            return NextResponse.json({
                error: 'Could not extract text from resume. Please upload a valid PDF.'
            }, { status: 400 });
        }

        // Parse resume and JD with AI
        console.log('Parsing resume with AI...');
        const resumeData = await parseResumeWithAI(finalResumeText);

        console.log('Parsing job description with AI...');
        const jdData = await extractJDData(jobDescription);

        // Calculate ATS score
        console.log('Calculating ATS score...');
        const { totalScore, breakdown, missingKeywords } = calculateATSScore(resumeData, jdData);
        const grade = getGrade(totalScore);

        // Identify strengths and weaknesses
        const strengths = identifyStrengths(breakdown, resumeData);
        const weaknesses = identifyWeaknesses(breakdown, missingKeywords);

        // Generate suggestions
        console.log('Generating suggestions...');
        const suggestions = await generateSuggestions(resumeData, jdData, missingKeywords, totalScore);

        // Save to database
        const { data: savedAnalysis, error: saveError } = await supabase
            .from('resume_analyses')
            .insert({
                user_id: userId,
                resume_url: resumeUrl || null,
                job_description: jobDescription,
                job_title: jobTitle || null,
                company_name: companyName || null,
                total_score: totalScore,
                grade,
                breakdown,
                strengths,
                weaknesses,
                missing_keywords: missingKeywords.slice(0, 15),
                suggestions,
                resume_data: resumeData,
                jd_data: jdData,
            })
            .select()
            .single();

        if (saveError) {
            console.error('Error saving analysis:', saveError);
            // Continue without saving - still return results
        }

        const analysis: ResumeAnalysisResult = {
            id: savedAnalysis?.id || crypto.randomUUID(),
            user_id: userId,
            resume_url: resumeUrl || null,
            job_description: jobDescription,
            job_title: jobTitle || null,
            company_name: companyName || null,
            total_score: totalScore,
            grade,
            breakdown,
            strengths,
            weaknesses,
            missing_keywords: missingKeywords.slice(0, 15),
            suggestions,
            resume_data: resumeData,
            jd_data: jdData,
            created_at: savedAnalysis?.created_at || new Date().toISOString(),
            updated_at: savedAnalysis?.updated_at || new Date().toISOString(),
        };

        return NextResponse.json({ success: true, analysis });
    } catch (error) {
        console.error('Resume analysis error:', error);
        return NextResponse.json(
            { error: 'Failed to analyze resume' },
            { status: 500 }
        );
    }
}
