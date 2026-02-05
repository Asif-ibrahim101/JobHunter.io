'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function LandingHero() {
    const [keywords, setKeywords] = useState('');
    const [location, setLocation] = useState('Worldwide');

    const popularTags = ['Remote', 'Engineering', 'Design', 'Marketing', 'Data'];
    const liveJobs = [
        {
            title: 'Senior Product Designer',
            company: 'Spotify',
            salary: '$140k',
            badge: 'Just posted',
        },
        {
            title: 'Frontend Engineer',
            company: 'Stripe',
            salary: '$165k',
            badge: 'Hiring now',
        },
        {
            title: 'Data Analyst',
            company: 'Airbnb',
            salary: '$120k',
            badge: 'New',
        },
    ];
    const trustedBy = ['Google', 'Meta', 'Stripe', 'Airbnb', 'Netflix'];

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (keywords || location) {
            window.location.href = `/jobs/search?keywords=${encodeURIComponent(keywords)}&location=${encodeURIComponent(location)}`;
        }
    };

    return (
        <section id="find-jobs" className="relative overflow-hidden bg-white dark:bg-gray-900 pt-24 pb-20 sm:pt-28 sm:pb-28">
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute -top-24 right-0 h-64 w-64 rounded-full bg-indigo-100 blur-3xl opacity-60" />
                <div className="absolute bottom-0 left-0 h-72 w-72 rounded-full bg-indigo-200/40 blur-3xl opacity-60" />
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
                <div className="grid lg:grid-cols-2 gap-12 items-center">
                    <div className="text-center lg:text-left">
                        <p className="text-xs font-semibold tracking-[0.2em] text-gray-500 uppercase mb-4">
                            Find your next career
                        </p>
                        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-gray-900 dark:text-white leading-tight">
                            Search 50,000+ opportunities
                            <span className="block text-indigo-600">from companies hiring now</span>
                        </h1>
                        <p className="mt-5 text-lg text-gray-600 dark:text-gray-300 max-w-xl mx-auto lg:mx-0">
                            One smart search to filter by role, company, location, and remote.
                            Discover your next job in seconds.
                        </p>

                        <form onSubmit={handleSearch} className="mt-8 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-lg p-3">
                            <div className="flex flex-col sm:flex-row gap-3">
                                <div className="flex-1 flex items-center gap-3 px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
                                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                    </svg>
                                    <input
                                        type="text"
                                        placeholder="What role are you looking for?"
                                        className="w-full bg-transparent border-none focus:ring-0 text-gray-900 dark:text-white placeholder-gray-400"
                                        value={keywords}
                                        onChange={(e) => setKeywords(e.target.value)}
                                    />
                                </div>
                                <div className="flex items-center gap-3 px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
                                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                    </svg>
                                    <select
                                        className="bg-transparent w-full text-gray-900 dark:text-white focus:ring-0 border-none"
                                        value={location}
                                        onChange={(e) => setLocation(e.target.value)}
                                    >
                                        <option>Worldwide</option>
                                        <option>United States</option>
                                        <option>United Kingdom</option>
                                        <option>Remote</option>
                                    </select>
                                </div>
                                <button
                                    type="submit"
                                    className="min-h-[56px] px-6 rounded-xl bg-indigo-600 text-white font-semibold hover:bg-indigo-700 transition-colors shadow-md shadow-indigo-200"
                                >
                                    Search Jobs
                                </button>
                            </div>
                        </form>

                        <div className="mt-6 flex flex-wrap items-center justify-center lg:justify-start gap-2 text-sm">
                            <span className="text-gray-500">Popular:</span>
                            {popularTags.map((tag) => (
                                <Link
                                    key={tag}
                                    href={`/jobs/search?keywords=${encodeURIComponent(tag)}`}
                                    className="px-3 py-1.5 rounded-full bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
                                >
                                    {tag}
                                </Link>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-lg p-6">
                            <div className="flex items-center justify-between">
                                <p className="text-sm font-semibold text-gray-900 dark:text-white">Live Job Feed</p>
                                <span className="text-xs text-emerald-600">Updated now</span>
                            </div>
                            <div className="mt-4 space-y-4">
                                {liveJobs.map((job) => (
                                    <div key={job.title} className="rounded-xl border border-gray-100 dark:border-gray-700 p-4 bg-gray-50/70 dark:bg-gray-900/40">
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs uppercase tracking-wide text-orange-600">{job.badge}</span>
                                            <span className="text-xs text-gray-500">{job.salary}</span>
                                        </div>
                                        <h3 className="mt-2 text-sm font-semibold text-gray-900 dark:text-white">{job.title}</h3>
                                        <p className="text-sm text-gray-500">{job.company}</p>
                                        <button className="mt-3 text-sm font-medium text-indigo-600 hover:text-indigo-700">
                                            Apply in 1 tap
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div>
                            <p className="text-xs uppercase tracking-wide text-gray-400">Trusted by</p>
                            <div className="mt-3 flex flex-wrap gap-4 text-sm font-semibold text-gray-500">
                                {trustedBy.map((brand) => (
                                    <span key={brand}>{brand}</span>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="mt-12 text-center text-sm text-gray-400">
                    Scroll to explore ↓
                </div>
            </div>
        </section>
    );
}
