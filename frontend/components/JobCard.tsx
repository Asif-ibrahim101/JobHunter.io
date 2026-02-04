'use client';

import { Job } from '@/types/job';
import { supabase } from '@/lib/supabase';
import { normalizeLogoUrl, normalizeSource } from '@/lib/job-utils';
import { useState } from 'react';
import Link from 'next/link';
import AnswerModal from './AnswerModal';

interface JobCardProps {
    job: Job;
    onDelete: (id: string) => void;
    isSaved: boolean;
    onToggleSave: (id: string) => void;
}

export default function JobCard({ job, onDelete, isSaved, onToggleSave }: JobCardProps) {
    const [isDeleting, setIsDeleting] = useState(false);
    const [expanded, setExpanded] = useState(false);
    const [showAnswerModal, setShowAnswerModal] = useState(false);
    const [imageError, setImageError] = useState(false);

    const handleDelete = async () => {
        if (!confirm('Delete this job?')) return;
        setIsDeleting(true);

        const { error } = await supabase.from('jobs').delete().eq('id', job.id);

        if (!error) {
            onDelete(job.id);
        } else {
            alert('Failed to delete job');
        }
        setIsDeleting(false);
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

        if (diffDays === 0) return 'Today';
        if (diffDays === 1) return 'Yesterday';
        if (diffDays < 7) return `${diffDays} days ago`;
        return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
    };

    // Generate company logo placeholder
    const getCompanyInitials = (company: string) => {
        return company.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
    };

    const getLogoColor = (company: string) => {
        const colors = [
            'bg-blue-500', 'bg-purple-500', 'bg-green-500', 'bg-orange-500',
            'bg-pink-500', 'bg-indigo-500', 'bg-teal-500', 'bg-red-500'
        ];
        const index = company.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0) % colors.length;
        return colors[index];
    };

    const getSourceBadge = (source: string) => {
        if (source?.toLowerCase().includes('linkedin')) {
            return { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-700 dark:text-blue-300', icon: '🔗' };
        }
        if (source?.toLowerCase().includes('glassdoor')) {
            return { bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-700 dark:text-green-300', icon: '🚪' };
        }
        return { bg: 'bg-gray-100 dark:bg-gray-700', text: 'text-gray-600 dark:text-gray-300', icon: '📌' };
    };

    const normalizedSource = normalizeSource(job.source);
    const sourceBadge = getSourceBadge(normalizedSource);
    const logoUrl = normalizeLogoUrl(job.logo, job.source);

    return (
        <>
            <div className="group bg-white dark:bg-gray-800 rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 dark:border-gray-700 overflow-hidden">
                {/* Top accent bar */}
                <div className={`h-1 ${getLogoColor(job.company)}`} />

                <div className="p-5">
                    {/* Header with logo and bookmark */}
                    <div className="flex items-start gap-4">
                        {/* Company Logo */}
                        {logoUrl && !imageError ? (
                            <img
                                src={logoUrl}
                                alt={`${job.company} logo`}
                                className="w-12 h-12 rounded-xl object-contain bg-white border border-gray-100 dark:border-gray-700 shadow-sm p-1"
                                onError={() => setImageError(true)}
                            />
                        ) : (
                            <div className={`w-12 h-12 rounded-xl ${getLogoColor(job.company)} flex items-center justify-center text-white font-bold text-sm shadow-sm`}>
                                {getCompanyInitials(job.company)}
                            </div>
                        )}

                        <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white leading-tight line-clamp-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                                    {job.title}
                                </h3>
                                <button
                                    onClick={() => onToggleSave(job.id)}
                                    className="flex-shrink-0 p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                                    title={isSaved ? "Unsave Job" : "Save Job"}
                                >
                                    <svg className={`w-5 h-5 ${isSaved ? 'text-yellow-500 fill-yellow-500' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                                    </svg>
                                </button>
                            </div>
                            <p className="text-blue-600 dark:text-blue-400 font-medium mt-0.5">
                                {job.company}
                            </p>
                        </div>
                    </div>

                    {/* Meta info */}
                    <div className="flex flex-wrap items-center gap-3 mt-4 text-sm">
                        <span className="flex items-center gap-1.5 text-gray-500 dark:text-gray-400">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            {job.location || 'Remote'}
                        </span>
                        <span className="flex items-center gap-1.5 text-gray-500 dark:text-gray-400">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            {formatDate(job.created_at)}
                        </span>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${sourceBadge.bg} ${sourceBadge.text}`}>
                            {sourceBadge.icon} {normalizedSource || job.source}
                        </span>
                    </div>

                    {/* Description */}
                    {job.description && (
                        <div className="mt-4">
                            <p className={`text-gray-600 dark:text-gray-300 text-sm leading-relaxed ${expanded ? '' : 'line-clamp-3'}`}>
                                {job.description}
                            </p>
                            {job.description.length > 200 && (
                                <button
                                    onClick={() => setExpanded(!expanded)}
                                    className="text-blue-600 dark:text-blue-400 text-sm mt-2 hover:underline font-medium"
                                >
                                    {expanded ? '← Show less' : 'Read more →'}
                                </button>
                            )}
                        </div>
                    )}

                    {/* Actions */}
                    <div className="mt-5 pt-4 border-t border-gray-100 dark:border-gray-700 flex items-center gap-2 flex-wrap">
                        <button
                            onClick={() => setShowAnswerModal(true)}
                            className="flex-1 sm:flex-none text-sm bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white px-4 py-2 rounded-lg transition-all duration-200 flex items-center justify-center gap-1.5 shadow-sm hover:shadow-md"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                            </svg>
                            AI Answer
                        </button>
                        <Link
                            href={`/job/${job.id}`}
                            className="flex-1 sm:flex-none text-sm bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center justify-center gap-1.5"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                            View Job
                        </Link>
                        <button
                            onClick={handleDelete}
                            disabled={isDeleting}
                            className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors disabled:opacity-50"
                            title="Delete job"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                        </button>
                    </div>
                </div>
            </div>

            <AnswerModal
                job={job}
                isOpen={showAnswerModal}
                onClose={() => setShowAnswerModal(false)}
            />
        </>
    );
}
