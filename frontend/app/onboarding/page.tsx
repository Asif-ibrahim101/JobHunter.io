'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';

const steps = [
    { id: 1, title: 'Personal Info', description: 'Tell us about yourself' },
    { id: 2, title: 'Online Presence', description: 'Your professional links' },
    { id: 3, title: 'Summary', description: 'A brief bio' },
];

export default function OnboardingPage() {
    const { user } = useAuth();
    const router = useRouter();
    const [currentStep, setCurrentStep] = useState(1);
    const [saving, setSaving] = useState(false);
    const [formData, setFormData] = useState({
        full_name: '',
        email: '',
        phone: '',
        location: '',
        linkedin_url: '',
        github_url: '',
        portfolio_url: '',
        summary: '',
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleNext = () => {
        if (currentStep < 3) {
            setCurrentStep(currentStep + 1);
        }
    };

    const handleBack = () => {
        if (currentStep > 1) {
            setCurrentStep(currentStep - 1);
        }
    };

    const handleComplete = async () => {
        if (!user) return;

        setSaving(true);
        try {
            const { error } = await supabase
                .from('user_profiles')
                .insert([{
                    ...formData,
                    user_id: user.id,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                }]);

            if (error) throw error;
            router.push('/');
        } catch (err) {
            console.error('Error saving profile:', err);
        } finally {
            setSaving(false);
        }
    };

    const inputClasses = "w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all";
    const labelClasses = "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2";

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center px-4 py-12">
            <div className="w-full max-w-2xl">
                {/* Header */}
                <div className="text-center mb-8">
                    <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                        Welcome to JobLee! 🎉
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-2">
                        Let&apos;s set up your profile to get started
                    </p>
                </div>

                {/* Progress Steps */}
                <div className="flex justify-center mb-8">
                    {steps.map((step, index) => (
                        <div key={step.id} className="flex items-center">
                            <div className={`flex items-center justify-center w-10 h-10 rounded-full font-semibold transition-all ${step.id <= currentStep
                                ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white'
                                : 'bg-gray-200 dark:bg-gray-700 text-gray-500'
                                }`}>
                                {step.id < currentStep ? (
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                ) : (
                                    step.id
                                )}
                            </div>
                            {index < steps.length - 1 && (
                                <div className={`w-16 h-1 mx-2 rounded transition-all ${step.id < currentStep ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-700'
                                    }`} />
                            )}
                        </div>
                    ))}
                </div>

                {/* Form Card */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-8">
                    {/* Step 1: Personal Info */}
                    {currentStep === 1 && (
                        <div className="space-y-6">
                            <div className="text-center mb-6">
                                <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900 dark:text-white">
                                    Welcome to JobLee
                                </h2>                      <p className="text-gray-500 dark:text-gray-400 mt-1">Basic details about you</p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label htmlFor="full_name" className={labelClasses}>Full Name</label>
                                    <input
                                        type="text"
                                        id="full_name"
                                        name="full_name"
                                        value={formData.full_name}
                                        onChange={handleChange}
                                        className={inputClasses}
                                        placeholder="John Doe"
                                    />
                                </div>

                                <div>
                                    <label htmlFor="email" className={labelClasses}>Email</label>
                                    <input
                                        type="email"
                                        id="email"
                                        name="email"
                                        value={formData.email}
                                        onChange={handleChange}
                                        className={inputClasses}
                                        placeholder="john@example.com"
                                    />
                                </div>

                                <div>
                                    <label htmlFor="phone" className={labelClasses}>Phone</label>
                                    <input
                                        type="tel"
                                        id="phone"
                                        name="phone"
                                        value={formData.phone}
                                        onChange={handleChange}
                                        className={inputClasses}
                                        placeholder="+1 (555) 123-4567"
                                    />
                                </div>

                                <div>
                                    <label htmlFor="location" className={labelClasses}>Location</label>
                                    <input
                                        type="text"
                                        id="location"
                                        name="location"
                                        value={formData.location}
                                        onChange={handleChange}
                                        className={inputClasses}
                                        placeholder="San Francisco, CA"
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Step 2: Online Presence */}
                    {currentStep === 2 && (
                        <div className="space-y-6">
                            <div className="text-center mb-6">
                                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Online Presence</h2>
                                <p className="text-gray-500 dark:text-gray-400 mt-1">Your professional profiles (optional)</p>
                            </div>

                            <div>
                                <label htmlFor="linkedin_url" className={labelClasses}>LinkedIn URL</label>
                                <input
                                    type="url"
                                    id="linkedin_url"
                                    name="linkedin_url"
                                    value={formData.linkedin_url}
                                    onChange={handleChange}
                                    className={inputClasses}
                                    placeholder="https://linkedin.com/in/johndoe"
                                />
                            </div>

                            <div>
                                <label htmlFor="github_url" className={labelClasses}>GitHub URL</label>
                                <input
                                    type="url"
                                    id="github_url"
                                    name="github_url"
                                    value={formData.github_url}
                                    onChange={handleChange}
                                    className={inputClasses}
                                    placeholder="https://github.com/johndoe"
                                />
                            </div>

                            <div>
                                <label htmlFor="portfolio_url" className={labelClasses}>Portfolio URL</label>
                                <input
                                    type="url"
                                    id="portfolio_url"
                                    name="portfolio_url"
                                    value={formData.portfolio_url}
                                    onChange={handleChange}
                                    className={inputClasses}
                                    placeholder="https://johndoe.com"
                                />
                            </div>
                        </div>
                    )}

                    {/* Step 3: Summary */}
                    {currentStep === 3 && (
                        <div className="space-y-6">
                            <div className="text-center mb-6">
                                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Professional Summary</h2>
                                <p className="text-gray-500 dark:text-gray-400 mt-1">Tell employers about yourself</p>
                            </div>

                            <div>
                                <label htmlFor="summary" className={labelClasses}>About You</label>
                                <textarea
                                    id="summary"
                                    name="summary"
                                    value={formData.summary}
                                    onChange={handleChange}
                                    rows={6}
                                    className={inputClasses}
                                    placeholder="I'm a software engineer with 5 years of experience in full-stack development..."
                                />
                                <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                                    This will be used to help customize your job applications
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Navigation Buttons */}
                    <div className="flex justify-between mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
                        {currentStep > 1 ? (
                            <button
                                onClick={handleBack}
                                className="px-6 py-3 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors flex items-center gap-2"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                                </svg>
                                Back
                            </button>
                        ) : (
                            <div></div>
                        )}

                        {currentStep < 3 ? (
                            <button
                                onClick={handleNext}
                                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-xl transition-all flex items-center gap-2"
                            >
                                Next
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                                </svg>
                            </button>
                        ) : (
                            <button
                                onClick={handleComplete}
                                disabled={saving}
                                className={`px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold rounded-xl transition-all flex items-center gap-2 ${saving ? 'opacity-70 cursor-not-allowed' : ''}`}
                            >
                                {saving ? (
                                    <>
                                        <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Saving...
                                    </>
                                ) : (
                                    <>
                                        Complete Setup
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                    </>
                                )}
                            </button>
                        )}
                    </div>

                    {/* Skip Link */}
                    <div className="text-center mt-4">
                        <button
                            onClick={() => router.push('/')}
                            className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                        >
                            Skip for now
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
