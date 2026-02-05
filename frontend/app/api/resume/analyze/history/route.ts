import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { AnalysisListItem } from '@/types/analysis';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const userId = searchParams.get('userId');

        if (!userId) {
            return NextResponse.json({ error: 'Missing userId' }, { status: 400 });
        }

        const { data: analyses, error } = await supabase
            .from('resume_analyses')
            .select('id, total_score, grade, job_title, company_name, created_at')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .limit(50);

        if (error) {
            console.error('Error fetching analyses:', error);
            return NextResponse.json({ error: 'Failed to fetch analyses' }, { status: 500 });
        }

        const analysisHistory: AnalysisListItem[] = analyses || [];

        return NextResponse.json({ success: true, analyses: analysisHistory });
    } catch (error) {
        console.error('History fetch error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch analysis history' },
            { status: 500 }
        );
    }
}
