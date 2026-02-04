'use client';

import { useState } from 'react';
import { Job } from '@/types/job';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import PDFPreview from './PDFPreview';
import ResumeEditor from './ResumeEditor';
import { ResumeContent } from '@/lib/resume-template';

interface ResumeGeneratorProps {
    job: Job;
}

// Helper to convert Data URI to Blob
function dataURItoBlob(dataURI: string) {
    const byteString = atob(dataURI.split(',')[1]);
    const mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0];
    const ab = new ArrayBuffer(byteString.length);
    const ia = new Uint8Array(ab);
    for (let i = 0; i < byteString.length; i++) {
        ia[i] = byteString.charCodeAt(i);
    }
    return new Blob([ab], { type: mimeString });
}

export default function ResumeGenerator({ job }: ResumeGeneratorProps) {
    const { user } = useAuth();
    const [generating, setGenerating] = useState(false);
    const [compiling, setCompiling] = useState(false);
    const [resumeContent, setResumeContent] = useState<ResumeContent | null>(null);
    const [pdfUrl, setPdfUrl] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [showPdfModal, setShowPdfModal] = useState(false);
    const [saving, setSaving] = useState(false);
    const [mobileView, setMobileView] = useState<'preview' | 'editor'>('preview');

    const handleGenerate = async () => {
        if (!user) return;

        setGenerating(true);
        setError(null);

        try {
            // Call the generate API
            const response = await fetch('/api/resume/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    jobId: job.id,
                    userId: user.id,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to generate resume');
            }

            setResumeContent(data.content);

            // Auto-compile to PDF
            await compilePdf(data.latexContent, data.content); // Pass content for naming
        } catch (err: any) {
            console.error('Generation error:', err);
            setError(err.message || 'Failed to generate resume. Please try again.');
        } finally {
            setGenerating(false);
        }
    };

    const compilePdf = async (latexContent: string, currentContent?: ResumeContent) => {
        setCompiling(true);
        setError(null);

        try {
            const response = await fetch('/api/resume/compile', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ latexContent }),
            });

            if (!response.ok) {
                throw new Error('Failed to compile PDF');
            }

            const data = await response.json();
            setPdfUrl(data.pdfUrl);

            // Removed auto-save logic
        } catch (err) {
            console.error('Compilation error:', err);
            setError('Failed to compile PDF. Please try again.');
        } finally {
            setCompiling(false);
        }
    };

    const saveResume = async (pdfDataUrl: string, content: ResumeContent) => {
        if (!user) return;

        setSaving(true);
        try {
            // 1. Construct Filename: FirstName_CompanyName.pdf
            const firstName = content.name.split(' ')[0] || 'Resume';
            const companyName = job.company.replace(/[^a-z0-9]/gi, '');
            const fileName = `${firstName}_${companyName}.pdf`;
            const filePath = `${user.id}/${Date.now()}_${fileName}`;

            // 2. Upload to Supabase Storage
            const pdfBlob = dataURItoBlob(pdfDataUrl);
            const { error: uploadError } = await supabase.storage
                .from('resumes')
                .upload(filePath, pdfBlob, {
                    contentType: 'application/pdf',
                    upsert: true
                });

            if (uploadError) {
                console.error('Storage upload error:', uploadError);
                // Continue anyway to try saving the record with the generated URL (less ideal but functional)
            }

            // Get Public URL (if bucket is public) or just use the path
            const { data: { publicUrl } } = supabase.storage.from('resumes').getPublicUrl(filePath);

            // 3. Save Record to DB
            const response = await fetch('/api/resume/save', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: user.id,
                    jobId: job.id,
                    pdfUrl: publicUrl, // Save the persistent storage URL
                    fileName: fileName,
                    content: content,
                    atsScore: content.atsScore
                }),
            });



            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to save resume record');
            }

            // Optional: Success feedback could involve a toast or just stopping the loading spinner

        } catch (error) {
            console.error('Error saving resume record:', error);
            setError('Failed to save resume. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    // Wrapper for manual save button
    const handleManualSave = () => {
        if (pdfUrl && resumeContent) {
            saveResume(pdfUrl, resumeContent);
        }
    };

    const handleContentUpdate = async (updatedContent: ResumeContent) => {
        setResumeContent(updatedContent);

        // Recompile with updated content
        try {
            const response = await fetch('/api/resume/compile', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ content: updatedContent }),
            });

            if (response.ok) {
                const data = await response.json();
                setPdfUrl(data.pdfUrl);
                // Note: We could auto-save here too, but maybe overkill on every edit?
                // Let's only auto-save on initial generation or explicit save action.
                // For now, I won't auto-save on every edit to avoid spamming the DB.
            }
        } catch (err) {
            console.error('Recompilation error:', err);
        }
    };

    const handleDownload = () => {
        if (pdfUrl && resumeContent) {
            const link = document.createElement('a');
            link.href = pdfUrl;
            // Format: FirstName_CompanyName.pdf
            const firstName = resumeContent.name.split(' ')[0] || 'Resume';
            const companyName = job.company.replace(/[^a-z0-9]/gi, '');
            link.download = `${firstName}_${companyName}.pdf`;
            link.click();
        }
    };

    // Initial state - show generate button
    if (!resumeContent && !generating) {
        return (
            <div className="flex-1 flex items-center justify-center p-4 sm:p-8">
                <div className="text-center max-w-md">
                    <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-purple-100 to-indigo-100 dark:from-purple-900/30 dark:to-indigo-900/30 rounded-2xl flex items-center justify-center mx-auto mb-4 sm:mb-6">
                        <svg className="w-8 h-8 sm:w-10 sm:h-10 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                    </div>
                    <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-2">
                        Generate Tailored Resume
                    </h2>
                    <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mb-6">
                        AI will create a resume tailored to this job description using your profile data.
                    </p>
                    <button
                        onClick={handleGenerate}
                        className="w-full sm:w-auto bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white px-6 sm:px-8 py-3 sm:py-4 min-h-[48px] rounded-xl font-semibold text-base sm:text-lg transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-3 mx-auto"
                    >
                        <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                        Generate Resume
                    </button>
                </div>
            </div>
        );
    }

    // Loading state
    if (generating) {
        return (
            <div className="flex-1 flex items-center justify-center p-8">
                <div className="text-center">
                    <div className="relative">
                        <div className="animate-spin rounded-full h-16 w-16 border-4 border-purple-200 border-t-purple-600 mx-auto"></div>
                        <div className="absolute inset-0 flex items-center justify-center">
                            <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                            </svg>
                        </div>
                    </div>
                    <p className="mt-6 text.lg font-medium text-gray-900 dark:text-white">
                        Generating your tailored resume...
                    </p>
                    <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                        AI is optimizing your experience for this role
                    </p>
                </div>
            </div>
        );
    }

    // Error state
    if (error) {
        return (
            <div className="flex-1 flex items-center justify-center p-8">
                <div className="text-center max-w-md">
                    <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                    <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
                    <button
                        onClick={handleGenerate}
                        className="text-blue-600 hover:underline"
                    >
                        Try Again
                    </button>
                </div>
            </div>
        );
    }

    // Split view with PDF and Editor
    return (
        <div className="flex-1 flex flex-col md:flex-row h-[calc(100vh-64px)]">
            {/* Mobile Tab Navigation */}
            <div className="md:hidden flex border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                <button
                    onClick={() => setMobileView('preview')}
                    className={`flex-1 py-3 px-4 text-center font-medium min-h-[48px] transition-colors ${
                        mobileView === 'preview'
                            ? 'text-purple-600 dark:text-purple-400 border-b-2 border-purple-600 dark:border-purple-400 bg-purple-50 dark:bg-purple-900/20'
                            : 'text-gray-600 dark:text-gray-400'
                    }`}
                >
                    <span className="flex items-center justify-center gap-2">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        Preview
                    </span>
                </button>
                <button
                    onClick={() => setMobileView('editor')}
                    className={`flex-1 py-3 px-4 text-center font-medium min-h-[48px] transition-colors ${
                        mobileView === 'editor'
                            ? 'text-purple-600 dark:text-purple-400 border-b-2 border-purple-600 dark:border-purple-400 bg-purple-50 dark:bg-purple-900/20'
                            : 'text-gray-600 dark:text-gray-400'
                    }`}
                >
                    <span className="flex items-center justify-center gap-2">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                        Editor
                    </span>
                </button>
            </div>

            {/* PDF Preview - Left Side on desktop, conditional on mobile */}
            <div className={`md:w-1/2 md:border-r border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-900 overflow-hidden ${
                mobileView === 'preview' ? 'flex-1' : 'hidden'
            } md:block`}>
                <PDFPreview
                    pdfUrl={pdfUrl}
                    loading={compiling}
                    onDownload={handleDownload}
                    onMaximize={() => setShowPdfModal(true)}
                    onSave={handleManualSave}
                    saving={saving}
                />
            </div>

            {/* Editor - Right Side on desktop, conditional on mobile */}
            <div className={`md:w-1/2 overflow-y-auto bg-white dark:bg-gray-800 ${
                mobileView === 'editor' ? 'flex-1' : 'hidden'
            } md:block`}>
                <ResumeEditor
                    content={resumeContent!}
                    onUpdate={handleContentUpdate}
                    onRegenerate={handleGenerate}
                    generating={generating}
                    jobDescription={job.description}
                />
            </div>

            {/* Full Screen PDF Modal - full screen on mobile */}
            {showPdfModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-0 sm:p-4">
                    <div className="bg-white dark:bg-gray-900 w-full h-full sm:max-w-6xl sm:h-[90vh] sm:rounded-2xl shadow-2xl flex flex-col overflow-hidden">
                        <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-200 dark:border-gray-700">
                            <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">Full Screen Preview</h3>
                            <button
                                onClick={() => setShowPdfModal(false)}
                                className="p-2 min-h-[44px] min-w-[44px] flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
                            >
                                <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                        <div className="flex-1 overflow-hidden p-2 sm:p-4 bg-gray-100 dark:bg-gray-900/50">
                            <iframe
                                src={pdfUrl!}
                                className="w-full h-full sm:rounded-xl shadow-inner bg-white"
                                title="Resume PDF Full Screen"
                            />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
