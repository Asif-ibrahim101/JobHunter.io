import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

// Lazy initialization
let openaiClient: OpenAI | null = null;
function getOpenAI() {
    if (!openaiClient) {
        openaiClient = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY,
        });
    }
    return openaiClient;
}

export async function POST(request: NextRequest) {
    try {
        const { currentPoints, type, context, jobDescription } = await request.json();

        if (!type || !context) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const systemPrompt = `You are a resume optimization expert. Your task is to generate 3 additional, high-impact bullet points for a resume ${type} section.
        
Rules:
1. Generate 3 DISTINCT new bullet points that are not already in the "Current Points" list.
2. Focus on achievements, metrics, and actionable results (e.g., "Increased X by Y%").
3. Tailor the content to the provided Job Description if available.
4. Keep the tone professional and concise.
5. Return ONLY a JSON object with a "points" array of strings.`;

        const userPrompt = `
SECTION TYPE: ${type}
CONTEXT:
${Object.entries(context).map(([k, v]) => `${k}: ${v}`).join('\n')}

JOB DESCRIPTION:
${jobDescription || 'Not provided'}

CURRENT POINTS (Do not duplicate these):
${currentPoints?.join('\n') || 'None'}

Generate 3 new bullet points.
`;

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

        const result = JSON.parse(aiResponse);

        return NextResponse.json({
            points: result.points || []
        });

    } catch (error) {
        console.error('Point generation error:', error);
        return NextResponse.json(
            { error: 'Failed to generate points' },
            { status: 500 }
        );
    }
}
