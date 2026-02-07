import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { userId, jobId, pdfUrl, fileName, content, atsScore } = body;

        if (!userId || !jobId) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const { data, error } = await supabase
            .from('generated_resumes')
            .insert({
                user_id: userId,
                job_id: jobId,
                pdf_url: pdfUrl,
                file_name: fileName,
                content: content,
                ats_score: atsScore
            })
            .select()
            .single();

        if (error) {
            console.error('Error saving resume:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        const { error: appError } = await supabase
            .from('applications')
            .upsert({
                user_id: userId,
                job_id: jobId,
                resume_id: data.id,
                status: 'applied'
            }, { onConflict: 'user_id, job_id' });

        if (appError) {
            console.error('Error creating application:', appError);
        }

        return NextResponse.json({ success: true, resume: data });

    } catch (error) {
        console.error('Save resume error:', error);
        return NextResponse.json(
            { error: 'Failed to save resume' },
            { status: 500 }
        );
    }
}
