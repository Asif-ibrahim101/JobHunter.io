'use client';

import { useState, useEffect } from 'react';
import { Job } from '@/types/job';
import JobCard from '@/components/JobCard';
import ProtectedRoute from '@/components/ProtectedRoute';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';

function SearchPageContent() {
    const { user } = useAuth();
    const [jobs, setJobs] = useState<Job[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [keywords, setKeywords] = useState(''); // Default empty to show more results initially if specific keywords aren't provided
    const [location, setLocation] = useState('Germany'); // Arbeitnow has many German jobs, good default or keep 'UK'? Let's default to empty or generic. The user had 'UK'.
    // Actually, let's keep user defaults but maybe set visaSponsored to true by default if that's the main goal?
    // Plan said default false or true. Let's make it false but easy to toggle, or match the user request "filter to find all".
    const [visaSponsored, setVisaSponsored] = useState(false);
    const [savedJobIds, setSavedJobIds] = useState<Set<string>>(new Set());

    useEffect(() => {
        if (user) {
            fetchSavedJobs();
        }
        // Initial search
        handleSearch();
    }, [user]);

    const fetchSavedJobs = async () => {
        if (!user) return;
        const { data: savedData } = await supabase
            .from('applications')
            .select('job_id')
            .eq('user_id', user.id)
            .eq('status', 'saved');

        if (savedData) {
            setSavedJobIds(new Set(savedData.map(item => item.job_id)));
        }
    };

    const handleSearch = async () => {
        setLoading(true);
        setError(null);
        try {
            const queryParams = new URLSearchParams({
                keywords,
                location,
                visa_sponsorship: visaSponsored.toString()
            });
            const res = await fetch(`/api/jobs/search?${queryParams}`);

            if (!res.ok) {
                const errData = await res.json().catch(() => ({}));
                throw new Error(errData.error || 'Failed to fetch jobs');
            }

            const data = await res.json();
            setJobs(data);
        } catch (err: any) {
            console.error('Search error:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleFormSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        handleSearch();
    };

    const handleToggleSave = async (jobId: string) => {
        if (!user) return;

        // Since these are external jobs, we must first SAVE the job definition to our 'jobs' table
        // if it doesn't verify exist, before we can link it in 'applications' table.
        // However, our backend POST /api/jobs endpoint handles saving new jobs.
        // But here we want to just "bookmark" it.
        // The JobCard's interface expects onToggleSave to just take an ID.
        // But for external jobs that might not be in our DB yet, this is tricky.

        // Wait, JobCard calls onToggleSave(id). 
        // If the job is NOT in our local DB, we need to add it first.
        // Let's implement logic here: if saving, first POST the job to /api/jobs (upsert), then save application.
        // Actually, our current JobCard "save" logic in page.tsx assumes job exists in DB.

        // We need to modify this behavior or ensure job exists.
        // Let's find the job object from our state
        const jobToSave = jobs.find(j => j.id === jobId);
        if (!jobToSave) return;

        const isSaved = savedJobIds.has(jobId);

        try {
            if (isSaved) {
                // Unsave - just remove from applications
                // (We leave the job in 'jobs' table as cached)
                await supabase
                    .from('applications')
                    .delete()
                    .eq('user_id', user.id)
                    .eq('job_id', jobId)
                    .eq('status', 'saved');

                const newSet = new Set(savedJobIds);
                newSet.delete(jobId);
                setSavedJobIds(newSet);
            } else {
                // Save - First ensure job is in DB
                // We use our existing POST /api/jobs backend route or direct Supabase.
                // Let's use direct Supabase upsert for 'jobs' for simplicity and speed here

                const { error: jobError } = await supabase.from('jobs').upsert({
                    id: jobToSave.id, // Use the ID from Reed (string)
                    title: jobToSave.title,
                    company: jobToSave.company,
                    location: jobToSave.location,
                    description: jobToSave.description || '',
                    url: jobToSave.url,
                    source: jobToSave.source,
                    created_at: jobToSave.created_at || new Date().toISOString()
                }, { onConflict: 'id' });

                if (jobError) throw jobError;

                // Then link in applications
                const { error: appError } = await supabase.from('applications').upsert({
                    user_id: user.id,
                    job_id: jobId,
                    status: 'saved'
                }, { onConflict: 'user_id, job_id' });

                if (appError) throw appError;

                const newSet = new Set(savedJobIds);
                newSet.add(jobId);
                setSavedJobIds(newSet);
            }
        } catch (error) {
            console.error('Error saving job:', error);
            alert('Failed to save job');
        }
    };

    // We can reuse JobCard but we need to handle "Delete" - actually we probably don't want to allow deleting external results from this view, or "hiding" them.
    // JobCard has onDelete prop. We can pass a dummy function or handle it by removing from view.
    const handleHide = (id: string) => {
        setJobs(jobs.filter(j => j.id !== id));
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">Search Jobs</h1>
                        <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400 mt-1">Find visa-sponsored jobs across the UK</p>
                    </div>
                    <Link href="/" className="text-blue-600 dark:text-blue-400 hover:underline min-h-[44px] flex items-center">
                        &larr; Back to Dashboard
                    </Link>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
                {/* Search Form */}
                <form onSubmit={handleFormSubmit} className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-xl shadow-sm mb-6 sm:mb-8 border border-gray-100 dark:border-gray-700 flex flex-col md:flex-row gap-4">
                    <div className="flex-1">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Keywords</label>
                        <input
                            type="text"
                            value={keywords}
                            onChange={(e) => setKeywords(e.target.value)}
                            className="w-full px-4 py-3 min-h-[48px] border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                            placeholder="e.g. software engineer visa sponsorship"
                        />
                    </div>
                    <div className="w-full md:w-64">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Location</label>
                        <input
                            type="text"
                            value={location}
                            onChange={(e) => setLocation(e.target.value)}
                            className="w-full px-4 py-3 min-h-[48px] border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                            placeholder="e.g. London or UK"
                        />
                    </div>
                    <div className="flex items-center">
                        <label className="flex items-center space-x-2 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={visaSponsored}
                                onChange={(e) => setVisaSponsored(e.target.checked)}
                                className="w-5 h-5 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                            />
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Visa Sponsorship</span>
                        </label>
                    </div>
                    <div className="flex items-end">
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full md:w-auto px-6 py-3 min-h-[48px] bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            {loading ? (
                                <>
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                    Searching...
                                </>
                            ) : (
                                'Search'
                            )}
                        </button>
                    </div>
                </form>

                {error && (
                    <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-4 rounded-lg mb-6">
                        {error}
                    </div>
                )}

                {/* Results */}
                {loading ? (
                    <div className="flex justify-center py-12">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                    </div>
                ) : jobs.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {jobs.map((job) => (
                            <JobCard
                                key={job.id}
                                job={job}
                                onDelete={handleHide} // Just hide from view, don't actually delete from API (read-only)
                                isSaved={savedJobIds.has(job.id)}
                                onToggleSave={handleToggleSave}
                            />
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 border-dashed">
                        <div className="text-4xl mb-4">🔍</div>
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white">No jobs found</h3>
                        <p className="text-gray-500 dark:text-gray-400 mt-1">Try adjusting your keywords or location.</p>
                    </div>
                )}
            </main>
        </div>
    );
}

export default function SearchPage() {
    return (
        <ProtectedRoute>
            <SearchPageContent />
        </ProtectedRoute>
    );
}
