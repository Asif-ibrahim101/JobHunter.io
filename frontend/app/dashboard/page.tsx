'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

interface GeneratedResume {
    id: string;
    pdf_url: string;
    file_name: string;
    ats_score: number;
    created_at: string;
    jobs: { title: string; company: string } | { title: string; company: string }[];
}

export default function Dashboard() {
    const { user } = useAuth();
    const [resumes, setResumes] = useState<GeneratedResume[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!user) return;

        const fetchResumes = async () => {
            try {
                const { data, error } = await supabase
                    .from('generated_resumes')
                    .select(`
                        id,
                        pdf_url,
                        file_name,
                        ats_score,
                        created_at,
                        jobs (
                            title,
                            company
                        )
                    `)
                    .eq('user_id', user.id)
                    .order('created_at', { ascending: false });

                if (error) throw error;
                // Supabase types might be loose, cast data
                setResumes((data as any) || []);
            } catch (err: any) {
                console.error('Error fetching resumes:', err);
                setError(err.message || 'Failed to fetch resumes');
            } finally {
                setLoading(false);
            }
        };

        fetchResumes();
    }, [user]);

    // Helper to get job details
    const getJobParams = (resume: GeneratedResume) => {
        if (Array.isArray(resume.jobs)) {
            return resume.jobs[0] || { title: 'Unknown Job', company: 'Unknown Company' };
        }
        return resume.jobs || { title: 'Unknown Job', company: 'Unknown Company' };
    };

    if (!user) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pt-24 px-4">
                <div className="max-w-7xl mx-auto text-center">
                    <p>Please log in to view your dashboard.</p>
                    <Link href="/login" className="text-blue-600 hover:underline mt-4 inline-block">
                        Login
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pt-16 sm:pt-24 pb-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 sm:mb-8">
                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
                    <Link
                        href="/"
                        className="w-full sm:w-auto text-center bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 min-h-[48px] rounded-lg text-sm font-medium transition-colors flex items-center justify-center"
                    >
                        Find New Jobs
                    </Link>
                </div>

                {/* Resumes Section */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Generated Resumes</h2>
                    </div>

                    {loading ? (
                        <div className="p-8 text-center">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                        </div>
                    ) : resumes.length === 0 ? (
                        <div className="p-12 text-center text-gray-500 dark:text-gray-400">
                            <p className="mb-4">You haven't generated any resumes yet.</p>
                            <Link href="/" className="text-blue-600 hover:underline">
                                Browse jobs to get started
                            </Link>
                        </div>
                    ) : (
                        <>
                            {/* Mobile: Card View */}
                            <div className="md:hidden p-4 space-y-4">
                                {resumes.map((resume) => {
                                    const job = getJobParams(resume);
                                    return (
                                        <div
                                            key={resume.id}
                                            className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4 border border-gray-100 dark:border-gray-600"
                                        >
                                            <div className="flex justify-between items-start mb-3">
                                                <div className="flex-1 min-w-0">
                                                    <h3 className="font-medium text-gray-900 dark:text-white truncate">
                                                        {job.title}
                                                    </h3>
                                                    <p className="text-sm text-gray-500 dark:text-gray-400">
                                                        {job.company}
                                                    </p>
                                                </div>
                                                {resume.ats_score && (
                                                    <span className={`ml-2 shrink-0 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                                        resume.ats_score >= 80 ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' :
                                                        resume.ats_score >= 60 ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300' :
                                                        'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                                                    }`}>
                                                        {resume.ats_score}/100
                                                    </span>
                                                )}
                                            </div>
                                            <div className="flex justify-between items-center">
                                                <span className="text-xs text-gray-500 dark:text-gray-400">
                                                    {new Date(resume.created_at).toLocaleDateString()}
                                                </span>
                                                {resume.pdf_url ? (
                                                    <a
                                                        href={resume.pdf_url}
                                                        download={resume.file_name}
                                                        className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 font-medium text-sm min-h-[44px] flex items-center"
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                    >
                                                        Download PDF
                                                    </a>
                                                ) : (
                                                    <span className="text-gray-400 italic text-sm">Processing...</span>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Desktop: Table View */}
                            <div className="hidden md:block overflow-x-auto">
                                <table className="w-full text-left text-sm">
                                    <thead className="bg-gray-50 dark:bg-gray-700/50">
                                        <tr>
                                            <th className="px-6 py-3 font-medium text-gray-500 dark:text-gray-400">Job Title</th>
                                            <th className="px-6 py-3 font-medium text-gray-500 dark:text-gray-400">Company</th>
                                            <th className="px-6 py-3 font-medium text-gray-500 dark:text-gray-400">Created</th>
                                            <th className="px-6 py-3 font-medium text-gray-500 dark:text-gray-400">ATS Score</th>
                                            <th className="px-6 py-3 font-medium text-gray-500 dark:text-gray-400 text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                        {resumes.map((resume) => {
                                            const job = getJobParams(resume);
                                            return (
                                                <tr key={resume.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                                    <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">
                                                        {job.title}
                                                    </td>
                                                    <td className="px-6 py-4 text-gray-600 dark:text-gray-300">
                                                        {job.company}
                                                    </td>
                                                    <td className="px-6 py-4 text-gray-500 dark:text-gray-400">
                                                        {new Date(resume.created_at).toLocaleDateString()}
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        {resume.ats_score ? (
                                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${resume.ats_score >= 80 ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' :
                                                                resume.ats_score >= 60 ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300' :
                                                                    'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                                                                }`}>
                                                                {resume.ats_score}/100
                                                            </span>
                                                        ) : (
                                                            <span className="text-gray-400">-</span>
                                                        )}
                                                    </td>
                                                    <td className="px-6 py-4 text-right">
                                                        {resume.pdf_url ? (
                                                            <a
                                                                href={resume.pdf_url}
                                                                download={resume.file_name}
                                                                className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 font-medium hover:underline"
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                            >
                                                                Download PDF
                                                            </a>
                                                        ) : (
                                                            <span className="text-gray-400 italic">Processing...</span>
                                                        )}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
