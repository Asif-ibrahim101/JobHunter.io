'use client';

import { useState } from 'react';
import Link from 'next/link';

export function LandingMobileNav() {
    const [isOpen, setIsOpen] = useState(false);
    const [audience, setAudience] = useState<'jobs' | 'employers'>('jobs');

    const navItems = [
        { href: '#find-jobs', label: 'Find Jobs' },
        { href: '#employers', label: 'Post a Job' },
        { href: '#pricing', label: 'Pricing' },
        { href: '#resources', label: 'Resources' },
    ];

    return (
        <div className="md:hidden">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="p-2 text-gray-600 dark:text-gray-300"
            >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={isOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"} />
                </svg>
            </button>

            {isOpen && (
                <div className="absolute top-full left-0 right-0 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 p-4 shadow-lg z-50 flex flex-col gap-4">
                    <div className="inline-flex items-center rounded-lg bg-gray-100 dark:bg-gray-800 p-1">
                        <button
                            onClick={() => setAudience('jobs')}
                            className={`px-3 py-2 text-sm rounded-md transition-colors ${audience === 'jobs'
                                ? 'bg-white dark:bg-gray-900 text-gray-900 dark:text-white shadow-sm'
                                : 'text-gray-600 dark:text-gray-300'
                                }`}
                        >
                            Find Jobs
                        </button>
                        <button
                            onClick={() => setAudience('employers')}
                            className={`px-3 py-2 text-sm rounded-md transition-colors ${audience === 'employers'
                                ? 'bg-white dark:bg-gray-900 text-gray-900 dark:text-white shadow-sm'
                                : 'text-gray-600 dark:text-gray-300'
                                }`}
                        >
                            Post Job
                        </button>
                    </div>

                    <nav className="flex flex-col gap-4 font-medium text-gray-600 dark:text-gray-300">
                        {navItems.map((item) => (
                            <a
                                key={item.href}
                                href={item.href}
                                onClick={() => setIsOpen(false)}
                                className="hover:text-indigo-600 dark:hover:text-indigo-300"
                            >
                                {item.label}
                            </a>
                        ))}
                    </nav>
                    <div className="border-t border-gray-100 dark:border-gray-800 pt-4 flex flex-col gap-3">
                        <Link href="/login" className="text-gray-600 dark:text-gray-300 font-medium text-center">
                            Log in
                        </Link>
                        <Link href="/login" className="block w-full text-center bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-full font-medium transition-colors">
                            Get Started - Free
                        </Link>
                    </div>
                </div>
            )}
        </div>
    );
}
