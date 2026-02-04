import { NextRequest, NextResponse } from 'next/server';
import { generateLatex, ResumeContent } from '@/lib/resume-template';

const LATEX_API_URL = 'https://latex.ytotech.com/builds/sync';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();

        let latexContent: string;

        // Accept either raw LaTeX or structured content
        if (body.latexContent) {
            latexContent = body.latexContent;
        } else if (body.content) {
            latexContent = generateLatex(body.content as ResumeContent);
        } else {
            return NextResponse.json({ error: 'Missing latexContent or content' }, { status: 400 });
        }

        // Call the free LaTeX compilation API
        const response = await fetch(LATEX_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                compiler: 'pdflatex',
                resources: [
                    {
                        main: true,
                        content: latexContent,
                    },
                ],
            }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('LaTeX compilation error:', errorText);
            return NextResponse.json(
                { error: 'LaTeX compilation failed', details: errorText },
                { status: 500 }
            );
        }

        // Get the PDF as a blob
        const pdfBuffer = await response.arrayBuffer();

        // Convert to base64 data URL
        const base64 = Buffer.from(pdfBuffer).toString('base64');
        const pdfUrl = `data:application/pdf;base64,${base64}`;

        return NextResponse.json({
            success: true,
            pdfUrl,
        });
    } catch (error) {
        console.error('PDF compilation error:', error);
        return NextResponse.json(
            { error: 'Failed to compile PDF' },
            { status: 500 }
        );
    }
}
