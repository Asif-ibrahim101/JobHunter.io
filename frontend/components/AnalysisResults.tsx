'use client';

import { ResumeAnalysisResult, ScoreBreakdown } from '@/types/analysis';
import {
    CheckCircle2,
    AlertTriangle,
    Tag,
    Lightbulb,
    ArrowLeft,
    Download,
    Share2,
} from 'lucide-react';

interface AnalysisResultsProps {
    analysis: ResumeAnalysisResult;
    onBack?: () => void;
    onAddKeyword?: (keyword: string) => void;
}

const gradeColors: Record<string, { bg: string; text: string; ring: string }> = {
    A: { bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-700 dark:text-green-400', ring: 'ring-green-500' },
    B: { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-700 dark:text-blue-400', ring: 'ring-blue-500' },
    C: { bg: 'bg-yellow-100 dark:bg-yellow-900/30', text: 'text-yellow-700 dark:text-yellow-400', ring: 'ring-yellow-500' },
    D: { bg: 'bg-orange-100 dark:bg-orange-900/30', text: 'text-orange-700 dark:text-orange-400', ring: 'ring-orange-500' },
    F: { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-700 dark:text-red-400', ring: 'ring-red-500' },
};

const breakdownLabels: Record<keyof ScoreBreakdown, { label: string; max: number }> = {
    keyword_match: { label: 'Keyword Match', max: 30 },
    structure: { label: 'Resume Structure', max: 20 },
    formatting: { label: 'Formatting', max: 15 },
    length: { label: 'Content Length', max: 10 },
    quantifiable_achievements: { label: 'Quantifiable Achievements', max: 15 },
    jd_alignment: { label: 'JD Alignment', max: 10 },
};

function ScoreRing({ score, grade }: { score: number; grade: string }) {
    const circumference = 2 * Math.PI * 45;
    const strokeDashoffset = circumference - (score / 100) * circumference;
    const colors = gradeColors[grade] || gradeColors.F;

    return (
        <div className="relative inline-flex items-center justify-center">
            <svg className="w-36 h-36 transform -rotate-90">
                <circle
                    cx="72"
                    cy="72"
                    r="45"
                    className="stroke-gray-200 dark:stroke-gray-700"
                    strokeWidth="10"
                    fill="none"
                />
                <circle
                    cx="72"
                    cy="72"
                    r="45"
                    className={`${colors.ring.replace('ring-', 'stroke-')} transition-all duration-1000`}
                    strokeWidth="10"
                    fill="none"
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                />
            </svg>
            <div className="absolute flex flex-col items-center">
                <span className="text-3xl font-bold text-gray-900 dark:text-white">{score}</span>
                <span className="text-sm text-gray-500 dark:text-gray-400">/ 100</span>
            </div>
        </div>
    );
}

function ProgressBar({ value, max, label }: { value: number; max: number; label: string }) {
    const percentage = (value / max) * 100;
    const getColor = () => {
        if (percentage >= 80) return 'bg-green-500';
        if (percentage >= 60) return 'bg-blue-500';
        if (percentage >= 40) return 'bg-yellow-500';
        return 'bg-red-500';
    };

    return (
        <div className="space-y-1">
            <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">{label}</span>
                <span className="font-medium text-gray-900 dark:text-white">
                    {value}/{max}
                </span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                <div
                    className={`h-2.5 rounded-full transition-all duration-500 ${getColor()}`}
                    style={{ width: `${percentage}%` }}
                />
            </div>
        </div>
    );
}

export default function AnalysisResults({ analysis, onBack, onAddKeyword }: AnalysisResultsProps) {
    const colors = gradeColors[analysis.grade] || gradeColors.F;

    return (
        <div className="space-y-6">
            {/* Header with Back Button */}
            {onBack && (
                <button
                    onClick={onBack}
                    className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Back to Analysis
                </button>
            )}

            {/* Score Card */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 md:p-8">
                <div className="flex flex-col md:flex-row items-center gap-6">
                    <ScoreRing score={analysis.total_score} grade={analysis.grade} />

                    <div className="flex-1 text-center md:text-left">
                        <div className="flex items-center justify-center md:justify-start gap-3 mb-2">
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                                ATS Score
                            </h2>
                            <span
                                className={`px-3 py-1 rounded-full text-lg font-bold ${colors.bg} ${colors.text}`}
                            >
                                Grade: {analysis.grade}
                            </span>
                        </div>
                        {analysis.job_title && (
                            <p className="text-gray-600 dark:text-gray-400">
                                {analysis.job_title}
                                {analysis.company_name && ` at ${analysis.company_name}`}
                            </p>
                        )}
                        <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">
                            Analyzed on {new Date(analysis.created_at).toLocaleDateString()}
                        </p>
                    </div>

                    <div className="flex gap-2">
                        <button className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">
                            <Share2 className="w-5 h-5" />
                        </button>
                        <button className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">
                            <Download className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Score Breakdown */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 md:p-8">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    Score Breakdown
                </h3>
                <div className="grid gap-4">
                    {Object.entries(breakdownLabels).map(([key, { label, max }]) => (
                        <ProgressBar
                            key={key}
                            value={analysis.breakdown[key as keyof ScoreBreakdown]}
                            max={max}
                            label={label}
                        />
                    ))}
                </div>
            </div>

            {/* Strengths & Weaknesses */}
            <div className="grid md:grid-cols-2 gap-6">
                {/* Strengths */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                        <CheckCircle2 className="w-5 h-5 text-green-500" />
                        Strengths
                    </h3>
                    {analysis.strengths.length > 0 ? (
                        <ul className="space-y-3">
                            {analysis.strengths.map((strength, index) => (
                                <li
                                    key={index}
                                    className="flex items-start gap-2 text-gray-700 dark:text-gray-300"
                                >
                                    <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                                    {strength}
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="text-gray-500 dark:text-gray-400 text-sm">
                            No specific strengths identified.
                        </p>
                    )}
                </div>

                {/* Weaknesses */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                        <AlertTriangle className="w-5 h-5 text-yellow-500" />
                        Areas for Improvement
                    </h3>
                    {analysis.weaknesses.length > 0 ? (
                        <ul className="space-y-3">
                            {analysis.weaknesses.map((weakness, index) => (
                                <li
                                    key={index}
                                    className="flex items-start gap-2 text-gray-700 dark:text-gray-300"
                                >
                                    <AlertTriangle className="w-4 h-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                                    {weakness}
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="text-gray-500 dark:text-gray-400 text-sm">
                            No specific weaknesses identified.
                        </p>
                    )}
                </div>
            </div>

            {/* Missing Keywords */}
            {analysis.missing_keywords.length > 0 && (
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                        <Tag className="w-5 h-5 text-blue-500" />
                        Missing Keywords
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                        {onAddKeyword
                            ? "Click a keyword to instantly add it to your Skills section:"
                            : "Consider adding these keywords to your resume to improve your ATS score:"}
                    </p>
                    <div className="flex flex-wrap gap-2">
                        {analysis.missing_keywords.map((keyword, index) => (
                            onAddKeyword ? (
                                <button
                                    key={index}
                                    onClick={() => onAddKeyword(keyword)}
                                    className="group px-3 py-1 bg-red-50 hover:bg-green-50 dark:bg-red-900/20 dark:hover:bg-green-900/20 text-red-700 hover:text-green-700 dark:text-red-300 dark:hover:text-green-300 rounded-full text-sm font-medium border border-red-200 hover:border-green-200 dark:border-red-800 dark:hover:border-green-800 transition-all flex items-center gap-1 cursor-pointer"
                                    title="Click to add to Skills"
                                >
                                    <span>{keyword}</span>
                                    <span className="w-0 overflow-hidden group-hover:w-auto opacity-0 group-hover:opacity-100 transition-all">+</span>
                                </button>
                            ) : (
                                <span
                                    key={index}
                                    className="px-3 py-1 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 rounded-full text-sm font-medium border border-red-200 dark:border-red-800"
                                >
                                    {keyword}
                                </span>
                            )
                        ))}
                    </div>
                </div>
            )}

            {/* Suggestions */}
            {analysis.suggestions.length > 0 && (
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                        <Lightbulb className="w-5 h-5 text-yellow-500" />
                        AI Suggestions
                    </h3>
                    <ul className="space-y-4">
                        {analysis.suggestions.map((suggestion, index) => (
                            <li
                                key={index}
                                className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl"
                            >
                                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 text-sm font-medium flex items-center justify-center">
                                    {index + 1}
                                </span>
                                <span className="text-gray-700 dark:text-gray-300">
                                    {suggestion}
                                </span>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
}
