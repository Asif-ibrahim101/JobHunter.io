'use client';

import { useState, useRef, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

interface ResumeUploadProps {
    currentResumeUrl?: string;
    onUploadComplete: (url: string) => void;
}

export default function ResumeUpload({ currentResumeUrl, onUploadComplete }: ResumeUploadProps) {
    const [isDragging, setIsDragging] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
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

    const uploadFile = async (file: File) => {
        const validationError = validateFile(file);
        if (validationError) {
            setError(validationError);
            return;
        }

        setError(null);
        setIsUploading(true);
        setUploadProgress(0);

        try {
            // Generate unique filename
            const fileExt = file.name.split('.').pop();
            const fileName = `resume_${Date.now()}.${fileExt}`;

            // Simulate progress for UX
            const progressInterval = setInterval(() => {
                setUploadProgress(prev => Math.min(prev + 10, 90));
            }, 100);

            const { data, error: uploadError } = await supabase.storage
                .from('resumes')
                .upload(fileName, file, {
                    cacheControl: '3600',
                    upsert: true
                });

            clearInterval(progressInterval);

            if (uploadError) throw uploadError;

            // Get public URL
            const { data: urlData } = supabase.storage
                .from('resumes')
                .getPublicUrl(data.path);

            setUploadProgress(100);
            onUploadComplete(urlData.publicUrl);
        } catch (err) {
            console.error('Upload error:', err);
            setError('Failed to upload resume. Please try again.');
        } finally {
            setIsUploading(false);
        }
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
        if (file) uploadFile(file);
    }, []);

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) uploadFile(file);
    };

    const handleClick = () => {
        fileInputRef.current?.click();
    };

    return (
        <div className="space-y-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Resume
            </label>

            {/* Upload Area */}
            <div
                onClick={handleClick}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`
          relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer
          transition-all duration-200 ease-in-out
          ${isDragging
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                        : 'border-gray-300 dark:border-gray-600 hover:border-blue-400 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                    }
          ${isUploading ? 'pointer-events-none opacity-70' : ''}
        `}
            >
                <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf"
                    onChange={handleFileSelect}
                    className="hidden"
                />

                {isUploading ? (
                    <div className="space-y-3">
                        <div className="animate-pulse">
                            <svg className="mx-auto h-12 w-12 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                            </svg>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Uploading...</p>
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                            <div
                                className="bg-blue-600 h-2 rounded-full transition-all duration-200"
                                style={{ width: `${uploadProgress}%` }}
                            />
                        </div>
                    </div>
                ) : (
                    <>
                        <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                        </svg>
                        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                            <span className="font-semibold text-blue-600 dark:text-blue-400">Click to upload</span> or drag and drop
                        </p>
                        <p className="mt-1 text-xs text-gray-500 dark:text-gray-500">
                            PDF only, max 5MB
                        </p>
                    </>
                )}
            </div>

            {/* Error Message */}
            {error && (
                <div className="flex items-center gap-2 text-red-600 dark:text-red-400 text-sm">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {error}
                </div>
            )}

            {/* Current Resume Preview */}
            {currentResumeUrl && !isUploading && (
                <div className="flex items-center gap-3 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                    <div className="flex-shrink-0">
                        <svg className="h-8 w-8 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-green-800 dark:text-green-200">
                            Resume uploaded
                        </p>
                        <p className="text-xs text-green-600 dark:text-green-400 truncate">
                            Click above to replace
                        </p>
                    </div>
                    <a
                        href={currentResumeUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="flex-shrink-0 text-green-700 dark:text-green-300 hover:text-green-900 dark:hover:text-green-100 p-2 rounded-lg hover:bg-green-100 dark:hover:bg-green-800/30 transition-colors"
                    >
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                    </a>
                </div>
            )}
        </div>
    );
}
