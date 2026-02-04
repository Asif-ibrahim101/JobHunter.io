'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

const jobCategories = [
    { name: 'IT / Computer', jobs: 68, icon: '💻', color: 'bg-blue-100 text-blue-600' },
    { name: 'Financial Associate', jobs: 36, icon: '💰', color: 'bg-green-100 text-green-600' },
    { name: 'Advertising / Media', jobs: 52, icon: '📢', color: 'bg-pink-100 text-pink-600' },
    { name: 'Healthcare', jobs: 23, icon: '🏥', color: 'bg-red-100 text-red-600' },
    { name: 'Office Executive', jobs: 85, icon: '📋', color: 'bg-purple-100 text-purple-600' },
    { name: 'Engineer / Architect', jobs: 78, icon: '🏗️', color: 'bg-orange-100 text-orange-600' },
    { name: 'Data Science', jobs: 45, icon: '📊', color: 'bg-cyan-100 text-cyan-600' },
    { name: 'Customer Service', jobs: 34, icon: '🎧', color: 'bg-yellow-100 text-yellow-600' },
];

const features = [
    { title: 'AI-Powered Resume Builder', description: 'Generate tailored resumes that match job descriptions perfectly', icon: '🤖' },
    { title: 'ATS Score Analysis', description: 'Get instant feedback on how well your resume matches the job', icon: '📈' },
    { title: 'Visa Sponsorship Filter', description: 'Easily find jobs that offer visa sponsorship in the UK', icon: '🛂' },
    { title: 'One-Click Applications', description: 'Save time with streamlined job application process', icon: '⚡' },
];

const testimonials = [
    {
        name: 'Mike Callahan',
        role: 'Software Engineer',
        image: 'https://randomuser.me/api/portraits/men/32.jpg',
        text: "JobHunter helped me land my dream job in just 2 weeks! The AI resume builder is incredibly accurate.",
    },
    {
        name: 'Sarah Chen',
        role: 'Data Analyst',
        image: 'https://randomuser.me/api/portraits/women/44.jpg',
        text: "The visa sponsorship filter saved me hours of searching. Found a great company that sponsored my visa!",
    },
    {
        name: 'James Wilson',
        role: 'Product Manager',
        image: 'https://randomuser.me/api/portraits/men/67.jpg',
        text: "The ATS score feature helped me understand why I wasn't getting callbacks. After optimizing, I got 5 interviews!",
    },
];

const stats = [
    { value: '10K+', label: 'Active Jobs' },
    { value: '5K+', label: 'Companies' },
    { value: '50K+', label: 'Job Seekers' },
    { value: '95%', label: 'Success Rate' },
];

export default function LandingPage() {
    const [keywords, setKeywords] = useState('');
    const [location, setLocation] = useState('');
    const router = useRouter();

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        router.push(`/jobs/search?keywords=${encodeURIComponent(keywords)}&location=${encodeURIComponent(location)}`);
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-pink-50">
            {/* Navigation */}
            <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16 sm:h-20">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-orange-500 to-pink-500 rounded-xl flex items-center justify-center">
                                <span className="text-white font-bold text-lg sm:text-xl">J</span>
                            </div>
                            <span className="text-xl sm:text-2xl font-bold">
                                Job<span className="text-orange-500">Hunter</span>
                            </span>
                        </div>

                        <div className="hidden md:flex items-center gap-8">
                            <Link href="#features" className="text-gray-600 hover:text-orange-500 transition-colors">Features</Link>
                            <Link href="#categories" className="text-gray-600 hover:text-orange-500 transition-colors">Categories</Link>
                            <Link href="#testimonials" className="text-gray-600 hover:text-orange-500 transition-colors">Testimonials</Link>
                            <Link href="#about" className="text-gray-600 hover:text-orange-500 transition-colors">About</Link>
                        </div>

                        <div className="flex items-center gap-3">
                            <Link
                                href="/auth/login"
                                className="hidden sm:block text-gray-600 hover:text-orange-500 transition-colors px-4 py-2"
                            >
                                Sign In
                            </Link>
                            <Link
                                href="/auth/login"
                                className="bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600 text-white px-4 sm:px-6 py-2 sm:py-2.5 rounded-full font-medium transition-all shadow-lg shadow-orange-500/25 hover:shadow-xl hover:shadow-orange-500/30 text-sm sm:text-base"
                            >
                                Get Started
                            </Link>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="pt-24 sm:pt-32 pb-16 sm:pb-24 px-4 sm:px-6 lg:px-8">
                <div className="max-w-7xl mx-auto">
                    <div className="grid lg:grid-cols-2 gap-12 items-center">
                        <div>
                            <span className="inline-block px-4 py-2 bg-orange-100 text-orange-600 rounded-full text-sm font-medium mb-6">
                                Looking for a Job?
                            </span>
                            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight mb-6">
                                Find your{' '}
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-pink-500">
                                    dream job
                                </span>{' '}
                                with us easily
                            </h1>
                            <p className="text-lg sm:text-xl text-gray-600 mb-8 leading-relaxed">
                                Find jobs, employment and career opportunities easily through JobHunter.
                                AI-powered tools to help you land your perfect role with visa sponsorship support.
                            </p>

                            {/* Search Form */}
                            <form onSubmit={handleSearch} className="bg-white rounded-2xl shadow-xl shadow-gray-200/50 p-3 sm:p-4 flex flex-col sm:flex-row gap-3">
                                <div className="flex-1 relative">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                        </svg>
                                    </span>
                                    <input
                                        type="text"
                                        value={keywords}
                                        onChange={(e) => setKeywords(e.target.value)}
                                        placeholder="Job title or keywords"
                                        className="w-full pl-12 pr-4 py-3 sm:py-4 rounded-xl border border-gray-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 outline-none transition-all"
                                    />
                                </div>
                                <div className="flex-1 relative">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-orange-500">
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                        </svg>
                                    </span>
                                    <input
                                        type="text"
                                        value={location}
                                        onChange={(e) => setLocation(e.target.value)}
                                        placeholder="Location"
                                        className="w-full pl-12 pr-4 py-3 sm:py-4 rounded-xl border border-gray-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 outline-none transition-all"
                                    />
                                </div>
                                <button
                                    type="submit"
                                    className="bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600 text-white px-8 py-3 sm:py-4 rounded-xl font-semibold transition-all shadow-lg shadow-orange-500/25 hover:shadow-xl whitespace-nowrap"
                                >
                                    Find Jobs
                                </button>
                            </form>

                            {/* Popular searches */}
                            <div className="mt-6 flex flex-wrap items-center gap-2 text-sm">
                                <span className="text-gray-500">Popular:</span>
                                <button onClick={() => setKeywords('Software Engineer')} className="px-3 py-1 bg-gray-100 hover:bg-orange-100 hover:text-orange-600 rounded-full transition-colors">
                                    Software Engineer
                                </button>
                                <button onClick={() => setKeywords('Data Analyst')} className="px-3 py-1 bg-gray-100 hover:bg-orange-100 hover:text-orange-600 rounded-full transition-colors">
                                    Data Analyst
                                </button>
                                <button onClick={() => setKeywords('Product Manager')} className="px-3 py-1 bg-gray-100 hover:bg-orange-100 hover:text-orange-600 rounded-full transition-colors">
                                    Product Manager
                                </button>
                            </div>
                        </div>

                        {/* Hero Image/Illustration Area */}
                        <div className="relative hidden lg:block">
                            <div className="relative z-10">
                                {/* 3D Character placeholder with gradient background */}
                                <div className="w-full aspect-square max-w-lg mx-auto bg-gradient-to-br from-orange-200 via-pink-100 to-purple-200 rounded-[3rem] flex items-center justify-center overflow-hidden">
                                    <div className="text-center p-8">
                                        <div className="text-8xl mb-4">👨‍💻</div>
                                        <p className="text-gray-600 font-medium">Find Your Dream Career</p>
                                    </div>
                                </div>

                                {/* Floating Stats Card */}
                                <div className="absolute -right-4 top-1/4 bg-white rounded-2xl shadow-xl p-4 animate-bounce-slow">
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-emerald-500 rounded-xl flex items-center justify-center text-white font-bold">
                                            300+
                                        </div>
                                        <div>
                                            <p className="font-semibold text-gray-900">Jobs Available</p>
                                            <div className="flex gap-1 mt-1">
                                                <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-600 rounded">Design</span>
                                                <span className="text-xs px-2 py-0.5 bg-pink-100 text-pink-600 rounded">Marketing</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Floating Company Logos */}
                                <div className="absolute -left-8 bottom-1/4 bg-white rounded-2xl shadow-xl p-3 flex items-center gap-2">
                                    <div className="flex -space-x-2">
                                        <div className="w-8 h-8 rounded-full bg-blue-500 border-2 border-white"></div>
                                        <div className="w-8 h-8 rounded-full bg-green-500 border-2 border-white"></div>
                                        <div className="w-8 h-8 rounded-full bg-purple-500 border-2 border-white"></div>
                                    </div>
                                    <span className="text-sm font-medium text-gray-600">50+ Hiring</span>
                                </div>
                            </div>

                            {/* Background Decorations */}
                            <div className="absolute top-0 right-0 w-72 h-72 bg-orange-300/30 rounded-full blur-3xl"></div>
                            <div className="absolute bottom-0 left-0 w-72 h-72 bg-pink-300/30 rounded-full blur-3xl"></div>
                        </div>
                    </div>

                    {/* Stats */}
                    <div className="mt-16 sm:mt-24 grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8">
                        {stats.map((stat, index) => (
                            <div key={index} className="text-center p-6 bg-white/50 backdrop-blur-sm rounded-2xl border border-white/80">
                                <div className="text-3xl sm:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-pink-500 mb-2">
                                    {stat.value}
                                </div>
                                <p className="text-gray-600 font-medium">{stat.label}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Job Categories Section */}
            <section id="categories" className="py-16 sm:py-24 px-4 sm:px-6 lg:px-8 bg-white">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-12 sm:mb-16">
                        <span className="inline-block px-4 py-2 bg-orange-100 text-orange-600 rounded-full text-sm font-medium mb-4">
                            Popular Job Categories
                        </span>
                        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
                            Let's help you choose the{' '}
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-pink-500">
                                category
                            </span>{' '}
                            you want
                        </h2>
                        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                            Explore thousands of job opportunities across various industries and find the perfect match for your skills.
                        </p>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
                        {jobCategories.map((category, index) => (
                            <Link
                                key={index}
                                href={`/jobs/search?keywords=${encodeURIComponent(category.name)}`}
                                className="group p-6 bg-white rounded-2xl border border-gray-100 hover:border-orange-200 hover:shadow-xl hover:shadow-orange-100/50 transition-all duration-300"
                            >
                                <div className={`w-14 h-14 ${category.color} rounded-2xl flex items-center justify-center text-2xl mb-4 group-hover:scale-110 transition-transform`}>
                                    {category.icon}
                                </div>
                                <h3 className="font-semibold text-gray-900 mb-1 group-hover:text-orange-500 transition-colors">
                                    {category.name}
                                </h3>
                                <p className="text-sm text-gray-500">{category.jobs} Jobs</p>
                            </Link>
                        ))}
                    </div>

                    <div className="text-center mt-10">
                        <Link
                            href="/jobs/search"
                            className="inline-flex items-center gap-2 text-orange-500 hover:text-orange-600 font-semibold transition-colors"
                        >
                            See All Categories
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                            </svg>
                        </Link>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section id="features" className="py-16 sm:py-24 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-orange-50 via-white to-pink-50">
                <div className="max-w-7xl mx-auto">
                    <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
                        {/* Left - Illustration */}
                        <div className="relative order-2 lg:order-1">
                            <div className="relative z-10 bg-gradient-to-br from-orange-100 via-pink-50 to-purple-100 rounded-[3rem] p-8 sm:p-12">
                                <div className="text-center">
                                    <div className="text-9xl mb-6">🏃‍♂️💼</div>
                                    <div className="inline-flex items-center gap-2 bg-white rounded-full px-4 py-2 shadow-lg">
                                        <div className="flex -space-x-2">
                                            <img src="https://randomuser.me/api/portraits/men/1.jpg" className="w-8 h-8 rounded-full border-2 border-white" alt="" />
                                            <img src="https://randomuser.me/api/portraits/women/2.jpg" className="w-8 h-8 rounded-full border-2 border-white" alt="" />
                                            <img src="https://randomuser.me/api/portraits/men/3.jpg" className="w-8 h-8 rounded-full border-2 border-white" alt="" />
                                        </div>
                                        <span className="text-sm font-medium text-gray-700">10k+ people got their job</span>
                                    </div>
                                </div>
                            </div>
                            <div className="absolute -bottom-4 -right-4 w-32 h-32 bg-gradient-to-br from-orange-400 to-pink-500 rounded-full blur-2xl opacity-30"></div>
                        </div>

                        {/* Right - Content */}
                        <div className="order-1 lg:order-2">
                            <span className="inline-block px-4 py-2 bg-orange-100 text-orange-600 rounded-full text-sm font-medium mb-6">
                                What we provide
                            </span>
                            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-6 leading-tight">
                                Among the myriad jobs we help you find{' '}
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-pink-500">
                                    the right one
                                </span>
                            </h2>
                            <p className="text-lg text-gray-600 mb-8 leading-relaxed">
                                Search all the open positions on the web. Get your own personalized salary estimate. Read reviews on over 600,000+ companies worldwide.
                            </p>

                            <div className="space-y-4">
                                {[
                                    'Get a job for yourself easily',
                                    'Get salary according to your qualifications',
                                    'Make money through your skills',
                                    'AI-powered resume matching',
                                ].map((item, index) => (
                                    <div key={index} className="flex items-center gap-3">
                                        <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                                            <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                            </svg>
                                        </div>
                                        <span className="text-gray-700 font-medium">{item}</span>
                                    </div>
                                ))}
                            </div>

                            <Link
                                href="/auth/login"
                                className="inline-flex items-center gap-2 mt-10 bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600 text-white px-8 py-4 rounded-xl font-semibold transition-all shadow-lg shadow-orange-500/25 hover:shadow-xl"
                            >
                                Get Started Now
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                                </svg>
                            </Link>
                        </div>
                    </div>
                </div>
            </section>

            {/* How It Works Section */}
            <section id="about" className="py-16 sm:py-24 px-4 sm:px-6 lg:px-8 bg-white">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-12 sm:mb-16">
                        <span className="inline-block px-4 py-2 bg-orange-100 text-orange-600 rounded-full text-sm font-medium mb-4">
                            Our Features
                        </span>
                        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
                            We help build{' '}
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-pink-500">
                                skilled teams
                            </span>{' '}
                            for you
                        </h2>
                        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                            Our AI-powered platform helps you create the perfect resume and find jobs that match your skills.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
                        {features.map((feature, index) => (
                            <div
                                key={index}
                                className="p-6 sm:p-8 bg-gradient-to-br from-white to-gray-50 rounded-2xl border border-gray-100 hover:shadow-xl hover:shadow-orange-100/50 transition-all duration-300 group"
                            >
                                <div className="w-16 h-16 bg-gradient-to-br from-orange-100 to-pink-100 rounded-2xl flex items-center justify-center text-3xl mb-6 group-hover:scale-110 transition-transform">
                                    {feature.icon}
                                </div>
                                <h3 className="text-xl font-bold text-gray-900 mb-3">{feature.title}</h3>
                                <p className="text-gray-600 leading-relaxed">{feature.description}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Testimonials Section */}
            <section id="testimonials" className="py-16 sm:py-24 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-orange-50 via-white to-pink-50">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-12 sm:mb-16">
                        <span className="inline-block px-4 py-2 bg-orange-100 text-orange-600 rounded-full text-sm font-medium mb-4">
                            Customer Reviews
                        </span>
                        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
                            What our clients say{' '}
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-pink-500">
                                about us
                            </span>
                        </h2>
                    </div>

                    <div className="grid md:grid-cols-3 gap-6 sm:gap-8">
                        {testimonials.map((testimonial, index) => (
                            <div
                                key={index}
                                className="bg-white p-6 sm:p-8 rounded-2xl shadow-lg shadow-gray-100/50 border border-gray-100 hover:shadow-xl transition-all duration-300"
                            >
                                <div className="flex items-center gap-4 mb-6">
                                    <img
                                        src={testimonial.image}
                                        alt={testimonial.name}
                                        className="w-14 h-14 rounded-full object-cover"
                                    />
                                    <div>
                                        <h4 className="font-semibold text-gray-900">{testimonial.name}</h4>
                                        <p className="text-sm text-gray-500">{testimonial.role}</p>
                                    </div>
                                </div>
                                <p className="text-gray-600 leading-relaxed">"{testimonial.text}"</p>
                                <div className="flex gap-1 mt-4">
                                    {[...Array(5)].map((_, i) => (
                                        <svg key={i} className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                        </svg>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-16 sm:py-24 px-4 sm:px-6 lg:px-8">
                <div className="max-w-5xl mx-auto">
                    <div className="bg-gradient-to-r from-orange-500 to-pink-500 rounded-3xl p-8 sm:p-12 lg:p-16 text-center relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-40 h-40 bg-white/10 rounded-full blur-2xl"></div>
                        <div className="absolute bottom-0 right-0 w-60 h-60 bg-white/10 rounded-full blur-3xl"></div>

                        <div className="relative z-10">
                            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-6">
                                Ready to find your dream job?
                            </h2>
                            <p className="text-lg sm:text-xl text-white/90 mb-8 max-w-2xl mx-auto">
                                Join thousands of job seekers who have found their perfect career through JobHunter.
                                Start your journey today!
                            </p>
                            <div className="flex flex-col sm:flex-row gap-4 justify-center">
                                <Link
                                    href="/auth/login"
                                    className="bg-white text-orange-500 hover:bg-gray-100 px-8 py-4 rounded-xl font-semibold transition-all shadow-lg hover:shadow-xl"
                                >
                                    Get Started Free
                                </Link>
                                <Link
                                    href="/jobs/search"
                                    className="bg-white/20 hover:bg-white/30 text-white px-8 py-4 rounded-xl font-semibold transition-all border border-white/30"
                                >
                                    Browse Jobs
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="bg-gray-900 text-white py-16 px-4 sm:px-6 lg:px-8">
                <div className="max-w-7xl mx-auto">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
                        <div className="col-span-2 md:col-span-1">
                            <div className="flex items-center gap-2 mb-4">
                                <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-pink-500 rounded-xl flex items-center justify-center">
                                    <span className="text-white font-bold text-xl">J</span>
                                </div>
                                <span className="text-2xl font-bold">
                                    Job<span className="text-orange-500">Hunter</span>
                                </span>
                            </div>
                            <p className="text-gray-400 mb-6">
                                Find your dream job with AI-powered resume building and visa sponsorship support.
                            </p>
                            <div className="flex gap-4">
                                <a href="#" className="w-10 h-10 bg-gray-800 hover:bg-orange-500 rounded-lg flex items-center justify-center transition-colors">
                                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z"/></svg>
                                </a>
                                <a href="#" className="w-10 h-10 bg-gray-800 hover:bg-orange-500 rounded-lg flex items-center justify-center transition-colors">
                                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/></svg>
                                </a>
                                <a href="#" className="w-10 h-10 bg-gray-800 hover:bg-orange-500 rounded-lg flex items-center justify-center transition-colors">
                                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
                                </a>
                            </div>
                        </div>

                        <div>
                            <h4 className="font-semibold text-lg mb-4">Product</h4>
                            <ul className="space-y-3">
                                <li><Link href="/jobs/search" className="text-gray-400 hover:text-orange-500 transition-colors">Find Jobs</Link></li>
                                <li><Link href="/auth/login" className="text-gray-400 hover:text-orange-500 transition-colors">Resume Builder</Link></li>
                                <li><Link href="#features" className="text-gray-400 hover:text-orange-500 transition-colors">Features</Link></li>
                                <li><Link href="#" className="text-gray-400 hover:text-orange-500 transition-colors">Pricing</Link></li>
                            </ul>
                        </div>

                        <div>
                            <h4 className="font-semibold text-lg mb-4">Resources</h4>
                            <ul className="space-y-3">
                                <li><Link href="#" className="text-gray-400 hover:text-orange-500 transition-colors">Blog</Link></li>
                                <li><Link href="#" className="text-gray-400 hover:text-orange-500 transition-colors">Career Tips</Link></li>
                                <li><Link href="#" className="text-gray-400 hover:text-orange-500 transition-colors">Help Center</Link></li>
                                <li><Link href="#" className="text-gray-400 hover:text-orange-500 transition-colors">FAQ</Link></li>
                            </ul>
                        </div>

                        <div>
                            <h4 className="font-semibold text-lg mb-4">Company</h4>
                            <ul className="space-y-3">
                                <li><Link href="#about" className="text-gray-400 hover:text-orange-500 transition-colors">About Us</Link></li>
                                <li><Link href="#" className="text-gray-400 hover:text-orange-500 transition-colors">Contact</Link></li>
                                <li><Link href="#" className="text-gray-400 hover:text-orange-500 transition-colors">Privacy Policy</Link></li>
                                <li><Link href="#" className="text-gray-400 hover:text-orange-500 transition-colors">Terms of Service</Link></li>
                            </ul>
                        </div>
                    </div>

                    <div className="border-t border-gray-800 pt-8 flex flex-col sm:flex-row justify-between items-center gap-4">
                        <p className="text-gray-400 text-sm">
                            © 2024 JobHunter. All rights reserved.
                        </p>
                        <p className="text-gray-400 text-sm">
                            Made with ❤️ for job seekers worldwide
                        </p>
                    </div>
                </div>
            </footer>
        </div>
    );
}
