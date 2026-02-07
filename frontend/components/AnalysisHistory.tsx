'use client';

import { useState, useEffect } from 'react';
import { AnalysisListItem } from '@/types/analysis';
import { Clock, Trash2, ChevronRight, FileSearch } from 'lucide-react';

interface AnalysisHistoryProps {
    userId: string;
    onSelectAnalysis: (analysisId: string) => void;
    refreshTrigger?: number;
}

const gradeColors: Record<string, string> = {
    A: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    B: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    C: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
    D: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
    F: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
};

export default function AnalysisHistory({
    userId,
    onSelectAnalysis,
    refreshTrigger = 0,
}: AnalysisHistoryProps) {
    const [analyses, setAnalyses] = useState<AnalysisListItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [deletingId, setDeletingId] = useState<string | null>(null);

    const fetchHistory = async () => {
        try {
            const response = await fetch(`/api/resume/analyze/history?userId=${userId}`);
            const data = await response.json();
            if (data.success) {
                setAnalyses(data.analyses);
            }
        } catch (error) {
            console.error('Error fetching history:', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchHistory();
    }, [userId, refreshTrigger]);

    const handleDelete = async (e: React.MouseEvent, analysisId: string) => {
        e.stopPropagation();
        if (!confirm('Are you sure you want to delete this analysis?')) return;

        setDeletingId(analysisId);
        try {
            const response = await fetch(`/api/resume/analyze/${analysisId}?userId=${userId}`, {
                method: 'DELETE',
            });

            if (response.ok) {
                setAnalyses((prev) => prev.filter((a) => a.id !== analysisId));
            }
        } catch (error) {
            console.error('Error deleting analysis:', error);
        } finally {
            setDeletingId(null);
        }
    };

    if (isLoading) {
        return (
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    Past Analyses
                </h3>
                <div className="animate-pulse space-y-3">
                    {[1, 2, 3].map((i) => (
                        <div
                            key={i}
                            className="h-16 bg-gray-200 dark:bg-gray-700 rounded-xl"
                        />
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <Clock className="w-5 h-5 text-gray-500" />
                Past Analyses
            </h3>

            {analyses.length === 0 ? (
                <div className="text-center py-8">
                    <FileSearch className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                    <p className="text-gray-500 dark:text-gray-400">
                        No previous analyses found.
                    </p>
                    <p className="text-sm text-gray-400 dark:text-gray-500">
                        Your analysis history will appear here.
                    </p>
                </div>
            ) : (
                <div className="space-y-3">
                    {analyses.map((analysis) => (
                        <div
                            key={analysis.id}
                            onClick={() => onSelectAnalysis(analysis.id)}
                            className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors group"
                        >
                            <div className="flex items-center gap-4 flex-1 min-w-0">
                                {/* Score Badge */}
                                <div className="flex flex-col items-center">
                                    <span className="text-lg font-bold text-gray-900 dark:text-white">
                                        {analysis.total_score}
                                    </span>
                                    <span
                                        className={`text-xs font-medium px-2 py-0.5 rounded ${
                                            gradeColors[analysis.grade] || gradeColors.F
                                        }`}
                                    >
                                        {analysis.grade}
                                    </span>
                                </div>

                                {/* Details */}
                                <div className="flex-1 min-w-0">
                                    <p className="font-medium text-gray-900 dark:text-white truncate">
                                        {analysis.job_title || 'Untitled Analysis'}
                                    </p>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">
                                        {analysis.company_name && `${analysis.company_name} • `}
                                        {new Date(analysis.created_at).toLocaleDateString()}
                                    </p>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={(e) => handleDelete(e, analysis.id)}
                                    disabled={deletingId === analysis.id}
                                    className="p-2 text-gray-400 hover:text-red-500 dark:hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"
                                >
                                    {deletingId === analysis.id ? (
                                        <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                                    ) : (
                                        <Trash2 className="w-4 h-4" />
                                    )}
                                </button>
                                <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300 transition-colors" />
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
