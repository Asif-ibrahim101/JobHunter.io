import { supabase } from './client';

export interface Employer {
    id?: string;
    name: string;
    careers_url?: string | null;
    source: string;
}

export interface Job {
    id: string; // Hash
    employer_id: string; // UUID from employers table
    employer_name: string;
    title: string;
    location?: string;
    job_url: string; // Unique constraint
    source_careers_url?: string;
    employment_type?: string;
    posted_at?: string; // ISO string
    closing_date?: string; // ISO string
    raw_text_snippet?: string;
    description?: string;
    source?: string;
}

export async function upsertEmployer(employer: Employer): Promise<string | null> {
    const { data, error } = await supabase
        .from('employers')
        .upsert({
            name: employer.name,
            careers_url: employer.careers_url,
            source: employer.source,
            updated_at: new Date().toISOString()
        }, { onConflict: 'name' })
        .select('id')
        .single();

    if (error) {
        console.error(`Error upserting employer ${employer.name}:`, error.message);
        return null;
    }
    return data?.id;
}

export async function upsertJob(job: Job): Promise<void> {
    // First check if job exists to update last_seen_at
    const { data: existing } = await supabase
        .from('jobs')
        .select('id')
        .eq('id', job.id)
        .single();

    if (existing) {
        // Update last_seen_at
        const { error } = await supabase
            .from('jobs')
            .update({
                last_seen_at: new Date().toISOString(),
                // Update other fields if they might have changed
                closing_date: job.closing_date,
                posted_at: job.posted_at || undefined, // Only update if we have a new date
                description: job.description || undefined
            })
            .eq('id', job.id);

        if (error) console.error(`Error updating job ${job.id}:`, error.message);
    } else {
        // Insert new
        const { error } = await supabase
            .from('jobs')
            .insert({
                ...job,
                first_seen_at: new Date().toISOString(),
                last_seen_at: new Date().toISOString()
            });

        if (error) console.error(`Error inserting job ${job.title}:`, error.message);
    }
}

export async function getEmployersWithoutCareersUrl(): Promise<Employer[]> {
    const { data, error } = await supabase
        .from('employers')
        .select('*')
        .is('careers_url', null);

    if (error) {
        console.error('Error fetching employers:', error.message);
        return [];
    }
    return data || [];
}

export async function getAllEmployers(): Promise<Employer[]> {
    const { data, error } = await supabase
        .from('employers')
        .select('*');

    if (error) {
        console.error('Error fetching all employers:', error.message);
        return [];
    }
    return data || [];
}

export async function getEmployersWithCareersUrl(): Promise<Employer[]> {
    const { data, error } = await supabase
        .from('employers')
        .select('*')
        .not('careers_url', 'is', null);

    if (error) {
        console.error('Error fetching employers with URLs:', error.message);
        return [];
    }
    return data || [];
}

export async function getAllJobs(): Promise<Job[]> {
    const { data, error } = await supabase
        .from('jobs')
        .select('*')
        .order('posted_at', { ascending: false, nullsFirst: false });

    if (error) {
        console.error('Error fetching all jobs:', error.message);
        return [];
    }
    return data || [];
}
