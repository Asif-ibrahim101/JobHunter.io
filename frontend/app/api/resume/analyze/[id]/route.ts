import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { ResumeAnalysisResult } from '@/types/analysis';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const { searchParams } = new URL(request.url);
        const userId = searchParams.get('userId');

        if (!id) {
            return NextResponse.json({ error: 'Missing analysis ID' }, { status: 400 });
        }

        let query = supabase
            .from('resume_analyses')
            .select('*')
            .eq('id', id);

        // If userId provided, also filter by user for security
        if (userId) {
            query = query.eq('user_id', userId);
        }

        const { data: analysis, error } = await query.single();

        if (error || !analysis) {
            console.error('Error fetching analysis:', error);
            return NextResponse.json({ error: 'Analysis not found' }, { status: 404 });
        }

        return NextResponse.json({ success: true, analysis: analysis as ResumeAnalysisResult });
    } catch (error) {
        console.error('Analysis fetch error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch analysis' },
            { status: 500 }
        );
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const { searchParams } = new URL(request.url);
        const userId = searchParams.get('userId');

        if (!id) {
            return NextResponse.json({ error: 'Missing analysis ID' }, { status: 400 });
        }

        if (!userId) {
            return NextResponse.json({ error: 'Missing userId' }, { status: 400 });
        }

        const { error } = await supabase
            .from('resume_analyses')
            .delete()
            .eq('id', id)
            .eq('user_id', userId);

        if (error) {
            console.error('Error deleting analysis:', error);
            return NextResponse.json({ error: 'Failed to delete analysis' }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Analysis delete error:', error);
        return NextResponse.json(
            { error: 'Failed to delete analysis' },
            { status: 500 }
        );
    }
}
