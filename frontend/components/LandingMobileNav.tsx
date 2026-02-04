'use client';

import { useState } from 'react';
import Link from 'next/link';

export function LandingMobileNav() {
    const [isOpen, setIsOpen] = useState(false);

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
                    <nav className="flex flex-col gap-4 font-medium text-gray-600 dark:text-gray-300">
                        <a href="#" className="hover:text-blue-600 dark:hover:text-blue-400">Demos</a>
                        <a href="#" className="hover:text-blue-600 dark:hover:text-blue-400">Features</a>
                        <a href="#" className="hover:text-blue-600 dark:hover:text-blue-400">Pages</a>
                        <a href="#" className="hover:text-blue-600 dark:hover:text-blue-400">Blog</a>
                        <a href="#" className="hover:text-blue-600 dark:hover:text-blue-400">Contact</a>
                    </nav>
                    <div className="border-t border-gray-100 dark:border-gray-800 pt-4">
                        <Link href="/login" className="block w-full text-center bg-red-500 hover:bg-red-600 text-white px-6 py-2.5 rounded-xl font-medium transition-colors">
                            Try It Free
                        </Link>
                    </div>
                </div>
            )}
        </div>
    );
}
