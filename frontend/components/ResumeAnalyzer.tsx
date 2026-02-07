'use client';

import { useState, useRef, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { ResumeAnalysisResult } from '@/types/analysis';
import { FileText, Upload, Briefcase, Building2, Loader2 } from 'lucide-react';

interface ResumeAnalyzerProps {
    userId: string;
    profileResumeUrl?: string;
    onAnalysisComplete: (analysis: ResumeAnalysisResult) => void;
}

export default function ResumeAnalyzer({
    userId,
    profileResumeUrl,
    onAnalysisComplete,
}: ResumeAnalyzerProps) {
    const [useProfileResume, setUseProfileResume] = useState(!!profileResumeUrl);
    const [uploadedFile, setUploadedFile] = useState<File | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [jobDescription, setJobDescription] = useState('');
    const [jobTitle, setJobTitle] = useState('');
    const [companyName, setCompanyName] = useState('');
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const validateFile = (file: File): string | null => {
        const maxSize = 5 * 1024 * 1024; // 5MB
        const allowedTypes = ['application/pdf'];

        if (!allowedTypes.includes(file.type)) {
            return 'Only PDF files are allowed';
        }
        if (file.size > maxSize) {
            return 'File size must be less than 5MB';
        }
        return null;
    };

    const handleFileSelect = (file: File) => {
        const validationError = validateFile(file);
        if (validationError) {
            setError(validationError);
            return;
        }
        setError(null);
        setUploadedFile(file);
        setUseProfileResume(false);
    };

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    }, []);

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
    }, []);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        const file = e.dataTransfer.files[0];
        if (file) handleFileSelect(file);
    }, []);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) handleFileSelect(file);
    };

    const handleAnalyze = async () => {
        if (!jobDescription.trim()) {
            setError('Please enter a job description');
            return;
        }

        if (!useProfileResume && !uploadedFile && !profileResumeUrl) {
            setError('Please upload a resume or use your profile resume');
            return;
        }

        setError(null);
        setIsAnalyzing(true);

        try {
            let resumeUrl = useProfileResume ? profileResumeUrl : null;

            // If a new file was uploaded, upload it first
            if (uploadedFile && !useProfileResume) {
                const fileName = `analysis_resume_${Date.now()}.pdf`;
                const { data, error: uploadError } = await supabase.storage
                    .from('resumes')
                    .upload(fileName, uploadedFile, {
                        cacheControl: '3600',
                        upsert: true,
                    });

                if (uploadError) throw uploadError;

                const { data: urlData } = supabase.storage
                    .from('resumes')
                    .getPublicUrl(data.path);

                resumeUrl = urlData.publicUrl;
            }

            // Call analyze API
            const response = await fetch('/api/resume/analyze', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId,
                    resumeUrl,
                    jobDescription,
                    jobTitle: jobTitle || undefined,
                    companyName: companyName || undefined,
                }),
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || 'Analysis failed');
            }

            onAnalysisComplete(result.analysis);
        } catch (err) {
            console.error('Analysis error:', err);
            setError(err instanceof Error ? err.message : 'Failed to analyze resume');
        } finally {
            setIsAnalyzing(false);
        }
    };

    return (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 md:p-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                Analyze Your Resume
            </h2>

            <div className="space-y-6">
                {/* Resume Selection */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                        Resume
                    </label>

                    {profileResumeUrl && (
                        <div className="mb-4">
                            <label className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                                <input
                                    type="radio"
                                    name="resumeSource"
                                    checked={useProfileResume}
                                    onChange={() => {
                                        setUseProfileResume(true);
                                        setUploadedFile(null);
                                    }}
                                    className="w-4 h-4 text-blue-600"
                                />
                                <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                                <span className="text-gray-700 dark:text-gray-300">
                                    Use my profile resume
                                </span>
                            </label>
                        </div>
                    )}

                    <div className="mb-2">
                        {profileResumeUrl && (
                            <label className="flex items-center gap-3 mb-3">
                                <input
                                    type="radio"
                                    name="resumeSource"
                                    checked={!useProfileResume}
                                    onChange={() => setUseProfileResume(false)}
                                    className="w-4 h-4 text-blue-600"
                                />
                                <span className="text-gray-700 dark:text-gray-300">
                                    Upload a different resume
                                </span>
                            </label>
                        )}
                    </div>

                    {(!profileResumeUrl || !useProfileResume) && (
                        <div
                            onClick={() => fileInputRef.current?.click()}
                            onDragOver={handleDragOver}
                            onDragLeave={handleDragLeave}
                            onDrop={handleDrop}
                            className={`
                                relative border-2 border-dashed rounded-xl p-6 text-center cursor-pointer
                                transition-all duration-200 ease-in-out
                                ${isDragging
                                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                                    : 'border-gray-300 dark:border-gray-600 hover:border-blue-400 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                                }
                            `}
                        >
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept=".pdf"
                                onChange={handleInputChange}
                                className="hidden"
                            />
                            {uploadedFile ? (
                                <div className="flex items-center justify-center gap-3">
                                    <FileText className="w-8 h-8 text-green-600 dark:text-green-400" />
                                    <span className="text-gray-700 dark:text-gray-300 font-medium">
                                        {uploadedFile.name}
                                    </span>
                                </div>
                            ) : (
                                <>
                                    <Upload className="mx-auto h-10 w-10 text-gray-400" />
                                    <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                                        <span className="font-semibold text-blue-600 dark:text-blue-400">
                                            Click to upload
                                        </span>{' '}
                                        or drag and drop
                                    </p>
                                    <p className="mt-1 text-xs text-gray-500">PDF only, max 5MB</p>
                                </>
                            )}
                        </div>
                    )}
                </div>

                {/* Job Description */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Job Description <span className="text-red-500">*</span>
                    </label>
                    <textarea
                        value={jobDescription}
                        onChange={(e) => setJobDescription(e.target.value)}
                        placeholder="Paste the full job description here..."
                        rows={8}
                        className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600
                            bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                            focus:ring-2 focus:ring-blue-500 focus:border-transparent
                            placeholder-gray-400 dark:placeholder-gray-500 resize-none"
                    />
                </div>

                {/* Optional Fields */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            <Briefcase className="w-4 h-4 inline mr-1" />
                            Job Title (optional)
                        </label>
                        <input
                            type="text"
                            value={jobTitle}
                            onChange={(e) => setJobTitle(e.target.value)}
                            placeholder="e.g., Senior Software Engineer"
                            className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600
                                bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                                focus:ring-2 focus:ring-blue-500 focus:border-transparent
                                placeholder-gray-400 dark:placeholder-gray-500"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            <Building2 className="w-4 h-4 inline mr-1" />
                            Company (optional)
                        </label>
                        <input
                            type="text"
                            value={companyName}
                            onChange={(e) => setCompanyName(e.target.value)}
                            placeholder="e.g., Google"
                            className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600
                                bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                                focus:ring-2 focus:ring-blue-500 focus:border-transparent
                                placeholder-gray-400 dark:placeholder-gray-500"
                        />
                    </div>
                </div>

                {/* Error Message */}
                {error && (
                    <div className="flex items-center gap-2 text-red-600 dark:text-red-400 text-sm p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                        <svg className="h-4 w-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {error}
                    </div>
                )}

                {/* Analyze Button */}
                <button
                    onClick={handleAnalyze}
                    disabled={isAnalyzing || !jobDescription.trim()}
                    className={`
                        w-full py-4 px-6 rounded-xl font-semibold text-white
                        transition-all duration-200 flex items-center justify-center gap-2
                        ${isAnalyzing || !jobDescription.trim()
                            ? 'bg-gray-400 dark:bg-gray-600 cursor-not-allowed'
                            : 'bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600'
                        }
                    `}
                >
                    {isAnalyzing ? (
                        <>
                            <Loader2 className="w-5 h-5 animate-spin" />
                            Analyzing Resume...
                        </>
                    ) : (
                        <>
                            <FileText className="w-5 h-5" />
                            Analyze Resume
                        </>
                    )}
                </button>
            </div>
        </div>
    );
}
