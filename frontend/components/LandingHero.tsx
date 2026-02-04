'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function LandingHero() {
    const [keywords, setKeywords] = useState('');
    const [location, setLocation] = useState('');

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (keywords || location) {
            window.location.href = `/jobs/search?keywords=${encodeURIComponent(keywords)}&location=${encodeURIComponent(location)}`;
        }
    };

    return (
        <section className="relative overflow-hidden bg-gradient-to-br from-white via-white to-blue-50 dark:from-gray-900 dark:via-gray-900 dark:to-blue-900/20 pt-16 pb-20 sm:pt-24 sm:pb-32">
            {/* Background blobs */}
            <div className="absolute top-0 right-0 -translate-y-12 translate-x-12 w-64 h-64 bg-blue-100/50 rounded-full blur-3xl opacity-50 pointer-events-none"></div>
            <div className="absolute bottom-0 left-0 translate-y-12 -translate-x-12 w-96 h-96 bg-blue-200/50 rounded-full blur-3xl opacity-50 pointer-events-none"></div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
                <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-20">

                    {/* Left Content */}
                    <div className="flex-1 text-center lg:text-left z-10">
                        <p className="text-blue-600 font-medium mb-4 tracking-wide uppercase text-sm">Looking For Job?</p>
                        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-gray-900 dark:text-white leading-tight mb-6">
                            Find your <br className="hidden lg:block" />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">dream job</span> <br className="hidden lg:block" />
                            with us easily
                        </h1>
                        <p className="text-lg text-gray-600 dark:text-gray-300 mb-8 max-w-lg mx-auto lg:mx-0">
                            Find jobs, employment, and career opportunities easily through JobHunter.
                        </p>

                        {/* Search Box */}
                        <form onSubmit={handleSearch} className="bg-white dark:bg-gray-800 p-2 rounded-2xl shadow-xl w-full max-w-2xl mx-auto lg:mx-0 flex flex-col sm:flex-row gap-2 border border-blue-50 dark:border-gray-700">
                            <div className="flex-1 flex items-center px-4 py-3 border-b sm:border-b-0 sm:border-r border-gray-100 dark:border-gray-700">
                                <svg className="w-5 h-5 text-gray-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                                <input
                                    type="text"
                                    placeholder="Job Title or Keywords"
                                    className="w-full bg-transparent border-none focus:ring-0 text-gray-900 dark:text-white placeholder-gray-400"
                                    value={keywords}
                                    onChange={(e) => setKeywords(e.target.value)}
                                />
                            </div>
                            <div className="flex-1 flex items-center px-4 py-3">
                                <svg className="w-5 h-5 text-gray-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                                <input
                                    type="text"
                                    placeholder="Location"
                                    className="w-full bg-transparent border-none focus:ring-0 text-gray-900 dark:text-white placeholder-gray-400"
                                    value={location}
                                    onChange={(e) => setLocation(e.target.value)}
                                />
                            </div>
                            <button
                                type="submit"
                                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-8 rounded-xl transition-colors shadow-lg hover:shadow-blue-600/30"
                            >
                                Find Jobs
                            </button>
                        </form>

                        <div className="mt-8 flex items-center justify-center lg:justify-start gap-4 text-sm text-gray-500">
                            <span className="flex items-center gap-1">
                                <span className="w-2 h-2 rounded-full bg-green-500"></span>
                                300+ Jobs available
                            </span>
                            <span className="flex items-center gap-1">
                                <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs">Design</span>
                                <span className="px-2 py-0.5 bg-purple-100 text-purple-700 rounded text-xs">Marketing</span>
                            </span>
                        </div>
                    </div>

                    {/* Right Image/Illustration */}
                    <div className="flex-1 w-full max-w-lg lg:max-w-xl relative">
                        <div className="relative w-full aspect-square flex items-center justify-center">
                            <div className="absolute inset-0 bg-gradient-to-tr from-blue-100 to-indigo-100 dark:from-blue-900/40 dark:to-indigo-900/40 rounded-[2rem] transform rotate-2"></div>
                            <img
                                src="/hero-illustration.png"
                                alt="Cheeful Gnome Working"
                                className="relative z-10 w-full h-full object-contain drop-shadow-2xl hover:scale-105 transition-transform duration-500"
                            />

                            {/* Floating Elements */}
                            <div className="absolute top-10 right-10 bg-white dark:bg-gray-800 p-3 rounded-xl shadow-lg animate-bounce delay-700 z-20">
                                <span className="text-2xl">⚡</span>
                            </div>
                            <div className="absolute bottom-20 left-10 bg-white dark:bg-gray-800 p-3 rounded-xl shadow-lg animate-bounce z-20">
                                <span className="text-2xl">💼</span>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </section>
    );
}
