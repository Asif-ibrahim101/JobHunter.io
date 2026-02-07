'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import ResumeAnalyzer from '@/components/ResumeAnalyzer';
import AnalysisResults from '@/components/AnalysisResults';
import AnalysisHistory from '@/components/AnalysisHistory';
import { ResumeAnalysisResult } from '@/types/analysis';
import { FileSearch, ArrowLeft } from 'lucide-react';

export default function AnalyzePage() {
    const { user } = useAuth();
    const [profileResumeUrl, setProfileResumeUrl] = useState<string | undefined>();
    const [currentAnalysis, setCurrentAnalysis] = useState<ResumeAnalysisResult | null>(null);
    const [selectedAnalysisId, setSelectedAnalysisId] = useState<string | null>(null);
    const [isLoadingAnalysis, setIsLoadingAnalysis] = useState(false);
    const [refreshTrigger, setRefreshTrigger] = useState(0);

    // Fetch user profile to get resume URL
    useEffect(() => {
        if (!user) return;

        const fetchProfile = async () => {
            const { data } = await supabase
                .from('user_profiles')
                .select('resume_url')
                .eq('user_id', user.id)
                .single();

            if (data?.resume_url) {
                setProfileResumeUrl(data.resume_url);
            }
        };

        fetchProfile();
    }, [user]);

    // Fetch selected analysis from history
    useEffect(() => {
        if (!selectedAnalysisId || !user) return;

        const fetchAnalysis = async () => {
            setIsLoadingAnalysis(true);
            try {
                const response = await fetch(
                    `/api/resume/analyze/${selectedAnalysisId}?userId=${user.id}`
                );
                const data = await response.json();
                if (data.success) {
                    setCurrentAnalysis(data.analysis);
                }
            } catch (error) {
                console.error('Error fetching analysis:', error);
            } finally {
                setIsLoadingAnalysis(false);
            }
        };

        fetchAnalysis();
    }, [selectedAnalysisId, user]);

    const handleAnalysisComplete = (analysis: ResumeAnalysisResult) => {
        setCurrentAnalysis(analysis);
        setSelectedAnalysisId(null);
        setRefreshTrigger((prev) => prev + 1);
    };

    const handleSelectAnalysis = (analysisId: string) => {
        setSelectedAnalysisId(analysisId);
    };

    const handleBackToForm = () => {
        setCurrentAnalysis(null);
        setSelectedAnalysisId(null);
    };

    if (!user) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pt-24 px-4">
                <div className="max-w-7xl mx-auto text-center">
                    <FileSearch className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                    <p className="text-gray-600 dark:text-gray-400 mb-4">
                        Please log in to analyze your resume.
                    </p>
                    <Link
                        href="/login"
                        className="text-blue-600 hover:underline inline-block"
                    >
                        Login
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pt-16 sm:pt-24 pb-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 sm:mb-8">
                    <div className="flex items-center gap-4">
                        <Link
                            href="/dashboard"
                            className="p-2 rounded-lg bg-white dark:bg-gray-800 shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                        >
                            <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                        </Link>
                        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
                            Resume Analysis
                        </h1>
                    </div>
                    <Link
                        href="/jobs/search"
                        className="w-full sm:w-auto text-center bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 min-h-[48px] rounded-lg text-sm font-medium transition-colors flex items-center justify-center"
                    >
                        Find Jobs
                    </Link>
                </div>

                {isLoadingAnalysis ? (
                    <div className="flex items-center justify-center py-20">
                        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
                    </div>
                ) : currentAnalysis ? (
                    /* Show Results */
                    <AnalysisResults analysis={currentAnalysis} onBack={handleBackToForm} />
                ) : (
                    /* Show Form and History */
                    <div className="grid lg:grid-cols-3 gap-6">
                        {/* Analyzer Form - Takes 2 columns on large screens */}
                        <div className="lg:col-span-2">
                            <ResumeAnalyzer
                                userId={user.id}
                                profileResumeUrl={profileResumeUrl}
                                onAnalysisComplete={handleAnalysisComplete}
                            />
                        </div>

                        {/* History Sidebar */}
                        <div className="lg:col-span-1">
                            <AnalysisHistory
                                userId={user.id}
                                onSelectAnalysis={handleSelectAnalysis}
                                refreshTrigger={refreshTrigger}
                            />
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
