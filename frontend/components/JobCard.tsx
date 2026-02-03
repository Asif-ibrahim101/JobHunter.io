'use client';

import { Job } from '@/types/job';
import { supabase } from '@/lib/supabase';
import { useState } from 'react';
import AnswerModal from './AnswerModal';

interface JobCardProps {
    job: Job;
    onDelete: (id: string) => void;
}

export default function JobCard({ job, onDelete }: JobCardProps) {
    const [isDeleting, setIsDeleting] = useState(false);
    const [expanded, setExpanded] = useState(false);
    const [showAnswerModal, setShowAnswerModal] = useState(false);

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
        return new Date(dateString).toLocaleDateString('en-GB', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
        });
    };

    return (
        <>
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md hover:shadow-lg transition-shadow p-6 border border-gray-100 dark:border-gray-700">
                <div className="flex justify-between items-start gap-4">
                    <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white truncate">
                            {job.title}
                        </h3>
                        <p className="text-blue-600 dark:text-blue-400 font-medium mt-1">
                            {job.company}
                        </p>
                        <p className="text-gray-500 dark:text-gray-400 text-sm mt-1 flex items-center gap-1">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            {job.location || 'Location not specified'}
                        </p>
                    </div>
                    <span className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-2 py-1 rounded-full whitespace-nowrap">
                        {job.source}
                    </span>
                </div>

                {job.description && (
                    <div className="mt-4">
                        <p className={`text-gray-600 dark:text-gray-300 text-sm ${expanded ? '' : 'line-clamp-3'}`}>
                            {job.description}
                        </p>
                        {job.description.length > 200 && (
                            <button
                                onClick={() => setExpanded(!expanded)}
                                className="text-blue-600 dark:text-blue-400 text-sm mt-1 hover:underline"
                            >
                                {expanded ? 'Show less' : 'Show more'}
                            </button>
                        )}
                    </div>
                )}

                <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700 flex justify-between items-center">
                    <span className="text-xs text-gray-400">
                        Added {formatDate(job.created_at)}
                    </span>
                    <div className="flex gap-2 flex-wrap justify-end">
                        <button
                            onClick={() => setShowAnswerModal(true)}
                            className="text-sm bg-purple-600 hover:bg-purple-700 text-white px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                            </svg>
                            AI Answer
                        </button>
                        {job.url && (
                            <a
                                href={job.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg transition-colors"
                            >
                                View Job
                            </a>
                        )}
                        <button
                            onClick={handleDelete}
                            disabled={isDeleting}
                            className="text-sm bg-red-100 hover:bg-red-200 text-red-600 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
                        >
                            {isDeleting ? 'Deleting...' : 'Delete'}
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

