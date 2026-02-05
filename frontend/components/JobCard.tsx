'use client';

import { Job } from '@/types/job';
import { supabase } from '@/lib/supabase';
import { normalizeLogoUrl } from '@/lib/job-utils';
import { useMemo, useState } from 'react';
import Link from 'next/link';

interface JobCardProps {
    job: Job;
    onDelete: (id: string) => void;
    isSaved: boolean;
    onToggleSave: (id: string) => void;
    layout?: 'grid' | 'list';
}

export default function JobCard({ job, onDelete, isSaved, onToggleSave, layout = 'grid' }: JobCardProps) {
    const [isDeleting, setIsDeleting] = useState(false);
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

    const isNew = useMemo(() => {
        const posted = new Date(job.created_at);
        const now = new Date();
        return now.getTime() - posted.getTime() < 24 * 60 * 60 * 1000;
    }, [job.created_at]);

    const getCompanyInitials = (company: string) => {
        return company
            .split(' ')
            .map((w) => w[0])
            .join('')
            .slice(0, 2)
            .toUpperCase();
    };

    const getCompanyColor = (company: string) => {
        let hash = 0;
        for (let i = 0; i < company.length; i += 1) {
            hash = company.charCodeAt(i) + ((hash << 5) - hash);
        }
        const hue = Math.abs(hash) % 360;
        return `hsl(${hue} 70% 45%)`;
    };

    const logoUrl = normalizeLogoUrl(job.logo, job.source);
    const accentColor = getCompanyColor(job.company);

    const locationLabel = job.location || 'Remote';
    const contentText = `${job.title} ${job.description || ''}`.toLowerCase();
    const isRemote = /remote/i.test(locationLabel) || contentText.includes('remote');
    const isVisaSponsored = contentText.includes('visa') || contentText.includes('sponsorship');
    const isEntryLevel = /(entry level|junior|graduate|intern)/i.test(contentText);

    const jobTypeLabel = job.job_type
        || (/full[-\s]?time/i.test(contentText) ? 'Full-time'
            : /part[-\s]?time/i.test(contentText) ? 'Part-time'
                : /contract/i.test(contentText) ? 'Contract'
                    : /temporary/i.test(contentText) ? 'Temporary'
                        : '');

    const tags = [
        isRemote ? 'Remote' : '',
        isVisaSponsored ? 'Visa Sponsor' : '',
        isEntryLevel ? 'Entry Level' : '',
    ].filter(Boolean);

    const isList = layout === 'list';
    const layoutClass = isList ? 'max-w-none w-full' : 'max-w-[340px] mx-auto';
    const bodyClass = isList
        ? 'p-5 md:p-6 flex flex-col md:flex-row md:items-start md:gap-6'
        : 'p-6 flex flex-col h-full gap-4 min-h-[200px]';
    const mainClass = isList ? 'flex-1 flex flex-col gap-3' : 'flex flex-col gap-4 flex-1';
    const actionsShellClass = isList
        ? 'mt-4 md:mt-0 md:w-56 md:shrink-0 md:border-l md:border-gray-200 dark:md:border-gray-700 md:pl-4 flex md:flex-col md:justify-between'
        : 'mt-auto';
    const actionsClass = isList ? 'flex flex-col gap-2' : 'pt-2 flex items-center gap-2 flex-wrap';

    return (
        <article
            className={`group h-full w-full ${layoutClass} flex flex-col bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 border-t-[3px] shadow-[0_1px_3px_rgba(0,0,0,0.1)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.15)] transition-all duration-200 hover:scale-[1.01] motion-reduce:transform-none motion-reduce:transition-none`}
            style={{ borderTopColor: accentColor }}
        >
            <div className={bodyClass}>
                <div className={mainClass}>
                    <div className="flex items-start gap-3">
                        {logoUrl && !imageError ? (
                            <img
                                src={logoUrl}
                                alt={`${job.company} logo`}
                                className="w-10 h-10 rounded-lg object-contain bg-white border border-gray-100 dark:border-gray-700 shadow-sm p-1"
                                onError={() => setImageError(true)}
                            />
                        ) : (
                            <div
                                className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-semibold text-xs shadow-sm"
                                style={{ backgroundColor: accentColor }}
                            >
                                {getCompanyInitials(job.company)}
                            </div>
                        )}

                        <div className="min-w-0 flex-1">
                            <Link
                                href={`/job/${job.id}`}
                                className="block text-[16px] font-semibold text-gray-900 dark:text-white leading-snug line-clamp-2 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                            >
                                {job.title}
                            </Link>
                            <p className="text-[14px] font-medium text-indigo-600 dark:text-indigo-400 mt-0.5 truncate">
                                {job.company}
                            </p>
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-4 text-[13px] text-gray-500 dark:text-gray-400">
                        <span className="flex items-center gap-1.5">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            {locationLabel}
                        </span>
                        <span className="flex items-center gap-1.5">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            {formatDate(job.created_at)}
                            {isNew && (
                                <span className="ml-1 inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
                                    New
                                </span>
                            )}
                        </span>
                        {jobTypeLabel && (
                            <span className="flex items-center gap-1.5">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m8 0V4m0 2H8m8 0h2a2 2 0 012 2v5.5" />
                                </svg>
                                {jobTypeLabel}
                            </span>
                        )}
                        {job.salary && (
                            <span className="flex items-center gap-1.5">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8V6m0 12v-2m9-4a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                {job.salary}
                            </span>
                        )}
                    </div>

                    <p className="text-[14px] text-gray-700 dark:text-gray-300 leading-relaxed line-clamp-2">
                        {job.description || 'No description provided.'}
                    </p>

                    {tags.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                            {tags.map((tag) => (
                                <span
                                    key={tag}
                                    className="px-2.5 py-1 rounded-full text-[12px] font-medium bg-gray-100 text-gray-700 dark:bg-gray-700/60 dark:text-gray-200"
                                >
                                    {tag}
                                </span>
                            ))}
                        </div>
                    )}
                </div>

                <div className={actionsShellClass}>
                    <div className={actionsClass}>
                        {job.applied ? (
                            <span className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-[13px] font-medium bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                                Applied
                            </span>
                        ) : (
                            <Link
                                href={`/job/${job.id}`}
                                className="flex-1 sm:flex-none text-[14px] bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 min-h-[44px] rounded-lg transition-colors flex items-center justify-center gap-1.5"
                            >
                                View Details
                            </Link>
                        )}
                        <div className={isList ? 'flex gap-2' : 'flex items-center gap-2 flex-wrap'}>
                            <button
                                onClick={() => onToggleSave(job.id)}
                                aria-pressed={isSaved}
                                className={`flex items-center justify-center gap-2 px-3 py-2.5 min-h-[44px] rounded-lg border transition-colors text-[14px] ${isSaved
                                    ? 'border-indigo-200 bg-indigo-50 text-indigo-700 dark:border-indigo-900/40 dark:bg-indigo-900/30 dark:text-indigo-200'
                                    : 'border-gray-200 text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-700/50'
                                    } ${isList ? 'flex-1' : ''}`}
                                title={isSaved ? 'Unsave Job' : 'Save Job'}
                            >
                                <svg
                                    className={`w-4 h-4 ${isSaved ? 'text-indigo-600 fill-indigo-600 dark:text-indigo-300 dark:fill-indigo-300' : 'text-gray-500'}`}
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                                </svg>
                                {isSaved ? 'Saved' : 'Save'}
                            </button>
                            <button
                                onClick={handleDelete}
                                disabled={isDeleting}
                                className={`px-3 py-2.5 min-h-[44px] rounded-lg text-[14px] text-gray-500 hover:text-red-600 hover:bg-red-50 dark:text-gray-300 dark:hover:text-red-300 dark:hover:bg-red-900/20 transition-colors disabled:opacity-50 flex items-center justify-center gap-2 ${isList ? 'flex-1' : ''}`}
                                title="Remove job"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                                Remove
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </article>
    );
}
