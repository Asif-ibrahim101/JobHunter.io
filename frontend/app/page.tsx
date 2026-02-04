'use client';

import { useEffect, useState, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { Job } from '@/types/job';
import JobCard from '@/components/JobCard';
import { normalizeSource } from '@/lib/job-utils';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useAuth } from '@/context/AuthContext';
import { ThemeToggle } from '@/components/ThemeToggle';
import { MobileNav } from '@/components/MobileNav';

// Date filter options
const DATE_FILTERS = [
  { label: 'All Time', value: '' },
  { label: 'Last 24 hours', value: '24h' },
  { label: 'Last 7 days', value: '7d' },
  { label: 'Last 30 days', value: '30d' },
];

function DashboardContent() {
  const { user, signOut } = useAuth();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [savedJobIds, setSavedJobIds] = useState<Set<string>>(new Set());

  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCompany, setSelectedCompany] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('');
  const [selectedSource, setSelectedSource] = useState('');
  const [selectedDateFilter, setSelectedDateFilter] = useState('');
  const [showSavedOnly, setShowSavedOnly] = useState(false);
  const [showVisaSponsoredOnly, setShowVisaSponsoredOnly] = useState(false);
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  useEffect(() => {
    fetchJobs();
  }, []);

  useEffect(() => {
    if (user) {
      fetchSavedJobs();
    }
  }, [user]);

  const fetchSavedJobs = async () => {
    if (!user) return;
    const { data: savedData } = await supabase
      .from('applications')
      .select('job_id')
      .eq('user_id', user.id)
      .eq('status', 'saved');

    if (savedData) {
      setSavedJobIds(new Set(savedData.map(item => item.job_id)));
    }
  };

  const fetchJobs = async () => {
    setLoading(true);
    setError(null);

    const { data, error } = await supabase
      .from('jobs')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      setError('Failed to fetch jobs');
      console.error(error);
    } else {
      setJobs(data || []);
    }
    setLoading(false);
  };

  const handleDelete = (id: string) => {
    setJobs(jobs.filter((job) => job.id !== id));
  };

  const handleToggleSave = async (jobId: string) => {
    if (!user) return;

    // Optimistic update
    const isSaved = savedJobIds.has(jobId);
    const newSet = new Set(savedJobIds);
    if (isSaved) newSet.delete(jobId);
    else newSet.add(jobId);
    setSavedJobIds(newSet);

    try {
      if (isSaved) {
        // Unsave
        await supabase
          .from('applications')
          .delete()
          .eq('user_id', user.id)
          .eq('job_id', jobId)
          .eq('status', 'saved');
      } else {
        // Save
        await supabase
          .from('applications')
          .upsert({
            user_id: user.id,
            job_id: jobId,
            status: 'saved'
          }, { onConflict: 'user_id, job_id' });
      }
    } catch (err) {
      console.error('Error toggling save:', err);
      // Revert on error would be better but simple logging for now
    }
  };

  const handleSignOut = async () => {
    await signOut();
  };

  // Get unique values for filters
  const companies = useMemo(() => {
    const unique = [...new Set(jobs.map(j => j.company).filter(Boolean))];
    return unique.sort();
  }, [jobs]);

  const locations = useMemo(() => {
    const unique = [...new Set(jobs.map(j => j.location).filter(Boolean))];
    return unique.sort();
  }, [jobs]);

  const sources = useMemo(() => {
    const unique = [...new Set(jobs.map(j => normalizeSource(j.source)).filter(Boolean))];
    return unique.sort();
  }, [jobs]);

  // Get date cutoff based on filter
  const getDateCutoff = (filter: string): Date | null => {
    if (!filter) return null;
    const now = new Date();
    switch (filter) {
      case '24h':
        return new Date(now.getTime() - 24 * 60 * 60 * 1000);
      case '7d':
        return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      case '30d':
        return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      default:
        return null;
    }
  };

  // Filtered jobs
  const filteredJobs = useMemo(() => {
    const dateCutoff = getDateCutoff(selectedDateFilter);

    return jobs.filter(job => {
      const matchesSearch = !searchQuery ||
        job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        job.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
        job.description?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesCompany = !selectedCompany || job.company === selectedCompany;
      const matchesLocation = !selectedLocation || job.location === selectedLocation;
      const matchesSource = !selectedSource || normalizeSource(job.source) === selectedSource;

      const matchesDate = !dateCutoff || new Date(job.created_at) >= dateCutoff;
      const matchesSaved = !showSavedOnly || savedJobIds.has(job.id);

      const isReed = normalizeSource(job.source) === 'Reed.co.uk';
      const hasVisaKeywords = (job.description || '').toLowerCase().includes('visa') ||
        (job.description || '').toLowerCase().includes('sponsorship') ||
        job.title.toLowerCase().includes('visa');

      const matchesVisa = !showVisaSponsoredOnly || isReed || hasVisaKeywords;

      return matchesSearch && matchesCompany && matchesLocation && matchesSource && matchesDate && matchesSaved && matchesVisa;
    });
  }, [jobs, searchQuery, selectedCompany, selectedLocation, selectedSource, selectedDateFilter, showSavedOnly, savedJobIds]);

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedCompany('');
    setSelectedLocation('');
    setSelectedSource('');
    setSelectedDateFilter('');
    setShowSavedOnly(false);
    setShowVisaSponsoredOnly(false);
  };

  const hasActiveFilters = searchQuery || selectedCompany || selectedLocation || selectedSource || selectedDateFilter || showSavedOnly || showVisaSponsoredOnly;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 md:py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                JobLee
              </h1>
              <p className="text-sm md:text-base text-gray-500 dark:text-gray-400 mt-1">
                Your saved job listings
              </p>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-4">
              <span className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-3 py-1 rounded-full text-sm font-medium">
                {filteredJobs.length} of {jobs.length} jobs
              </span>
              <a
                href="/jobs/search"
                className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <span>Search Jobs</span>
              </a>
              <a
                href="/dashboard"
                className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span>My Resumes</span>
              </a>
              <a
                href="/profile"
                className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <span>Profile</span>
              </a>

              {/* Theme Toggle */}
              <ThemeToggle />

              {/* User Menu */}
              <div className="relative">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                >
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-medium text-sm">
                    {user?.email?.charAt(0).toUpperCase() || 'U'}
                  </div>
                  <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 py-2 z-50">
                    <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                        {user?.email}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        Signed in
                      </p>
                    </div>
                    <button
                      onClick={handleSignOut}
                      className="w-full px-4 py-2 text-left text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                      Sign out
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Mobile: Job count badge + Hamburger menu */}
            <div className="flex md:hidden items-center gap-3">
              <span className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-1 rounded-full text-xs font-medium">
                {filteredJobs.length}/{jobs.length}
              </span>
              <MobileNav user={user} onSignOut={handleSignOut} />
            </div>
          </div>
        </div>
      </header>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          {/* Mobile: Collapsible filters */}
          <div className="md:hidden space-y-3">
            {/* Search - always visible on mobile */}
            <div className="relative">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Search jobs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 min-h-[44px] border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Filter toggle button */}
            <button
              onClick={() => setShowMobileFilters(!showMobileFilters)}
              className="w-full flex items-center justify-between px-4 py-3 min-h-[44px] bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600"
            >
              <span className="flex items-center gap-2 text-gray-700 dark:text-gray-300 font-medium">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                </svg>
                Filters
                {hasActiveFilters && (
                  <span className="bg-blue-600 text-white text-xs px-2 py-0.5 rounded-full">
                    Active
                  </span>
                )}
              </span>
              <svg
                className={`w-5 h-5 text-gray-500 transition-transform ${showMobileFilters ? 'rotate-180' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {/* Collapsible filter content */}
            {showMobileFilters && (
              <div className="space-y-3 pt-2">
                {/* Date Filter */}
                <select
                  value={selectedDateFilter}
                  onChange={(e) => setSelectedDateFilter(e.target.value)}
                  className="w-full px-4 py-3 min-h-[44px] border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                >
                  {DATE_FILTERS.map(filter => (
                    <option key={filter.value} value={filter.value}>{filter.label}</option>
                  ))}
                </select>

                {/* Company Filter */}
                <select
                  value={selectedCompany}
                  onChange={(e) => setSelectedCompany(e.target.value)}
                  className="w-full px-4 py-3 min-h-[44px] border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Companies</option>
                  {companies.map(company => (
                    <option key={company} value={company}>{company}</option>
                  ))}
                </select>

                {/* Location Filter */}
                <select
                  value={selectedLocation}
                  onChange={(e) => setSelectedLocation(e.target.value)}
                  className="w-full px-4 py-3 min-h-[44px] border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Locations</option>
                  {locations.map(location => (
                    <option key={location} value={location}>{location}</option>
                  ))}
                </select>

                {/* Source Filter */}
                <select
                  value={selectedSource}
                  onChange={(e) => setSelectedSource(e.target.value)}
                  className="w-full px-4 py-3 min-h-[44px] border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Sources</option>
                  {sources.map(source => (
                    <option key={source} value={source}>{source}</option>
                  ))}
                </select>

                {/* Toggle buttons - 2 column grid */}
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setShowSavedOnly(!showSavedOnly)}
                    className={`px-4 py-3 min-h-[44px] rounded-lg border transition-colors flex items-center justify-center gap-2 ${showSavedOnly
                      ? 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 text-yellow-700 dark:text-yellow-400'
                      : 'bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300'
                      }`}
                  >
                    <svg className="w-4 h-4" fill={showSavedOnly ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                    </svg>
                    Saved
                  </button>

                  <button
                    onClick={() => setShowVisaSponsoredOnly(!showVisaSponsoredOnly)}
                    className={`px-4 py-3 min-h-[44px] rounded-lg border transition-colors flex items-center justify-center gap-2 ${showVisaSponsoredOnly
                      ? 'bg-purple-50 dark:bg-purple-900/20 border-purple-200 text-purple-700 dark:text-purple-400'
                      : 'bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300'
                      }`}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Visa
                  </button>
                </div>

                {/* Clear Filters */}
                {hasActiveFilters && (
                  <button
                    onClick={clearFilters}
                    className="w-full px-4 py-3 min-h-[44px] text-red-600 hover:text-red-700 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors flex items-center justify-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    Clear All Filters
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Desktop: Original inline filters */}
          <div className="hidden md:flex flex-wrap gap-3">
            {/* Search */}
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  placeholder="Search jobs..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Date Filter */}
            <select
              value={selectedDateFilter}
              onChange={(e) => setSelectedDateFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
            >
              {DATE_FILTERS.map(filter => (
                <option key={filter.value} value={filter.value}>{filter.label}</option>
              ))}
            </select>

            {/* Company Filter */}
            <select
              value={selectedCompany}
              onChange={(e) => setSelectedCompany(e.target.value)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Companies</option>
              {companies.map(company => (
                <option key={company} value={company}>{company}</option>
              ))}
            </select>

            {/* Location Filter */}
            <select
              value={selectedLocation}
              onChange={(e) => setSelectedLocation(e.target.value)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Locations</option>
              {locations.map(location => (
                <option key={location} value={location}>{location}</option>
              ))}
            </select>

            {/* Source Filter */}
            <select
              value={selectedSource}
              onChange={(e) => setSelectedSource(e.target.value)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Sources</option>
              {sources.map(source => (
                <option key={source} value={source}>{source}</option>
              ))}
            </select>

            {/* Saved Toggle */}
            <button
              onClick={() => setShowSavedOnly(!showSavedOnly)}
              className={`px-4 py-2 rounded-lg border transition-colors flex items-center gap-2 ${showSavedOnly
                ? 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 text-yellow-700 dark:text-yellow-400'
                : 'bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50'
                }`}
            >
              <svg className="w-4 h-4" fill={showSavedOnly ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
              </svg>
              Saved
            </button>

            {/* Visa Sponsored Toggle */}
            <button
              onClick={() => setShowVisaSponsoredOnly(!showVisaSponsoredOnly)}
              className={`px-4 py-2 rounded-lg border transition-colors flex items-center gap-2 ${showVisaSponsoredOnly
                ? 'bg-purple-50 dark:bg-purple-900/20 border-purple-200 text-purple-700 dark:text-purple-400'
                : 'bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50'
                }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Visa Sponsored
            </button>

            {/* Clear Filters */}
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="px-4 py-2 text-red-600 hover:text-red-700 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors flex items-center gap-1"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                Clear
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : error ? (
          <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-4 rounded-lg text-center">
            {error}
          </div>
        ) : filteredJobs.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">{hasActiveFilters ? '🔍' : '📭'}</div>
            <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-300">
              {hasActiveFilters ? 'No jobs match your filters' : 'No jobs saved yet'}
            </h2>
            <p className="text-gray-500 dark:text-gray-400 mt-2">
              {hasActiveFilters
                ? 'Try adjusting your filters or search query.'
                : 'Use the Chrome extension or run the scraper to add jobs.'}
            </p>
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="mt-4 text-blue-600 hover:text-blue-700 underline"
              >
                Clear all filters
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredJobs.map((job) => (
              <JobCard
                key={job.id}
                job={job}
                onDelete={handleDelete}
                isSaved={savedJobIds.has(job.id)}
                onToggleSave={handleToggleSave}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}


// Landing Page Components
import LandingHero from '@/components/LandingHero';
import CategoryGrid from '@/components/CategoryGrid';
import Testimonials from '@/components/Testimonials';
import { LandingMobileNav } from '@/components/LandingMobileNav'; // Import the new component
import Link from 'next/link';

// ... (Keep existing DashboardContent and other helper functions like fetchJobs, handleDelete etc. if relevant, 
// OR better yet, move DashboardContent locally or keep it but render conditionally)

// We need to keep DashboardContent purely separate or as a sub-component.
// Let's assume DashboardContent is the existing giant component.

function LandingPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <header className="absolute top-0 w-full z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">JobLee</span>
          </div>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-8 font-medium text-gray-600 dark:text-gray-300">
            <a href="#" className="hover:text-blue-600 dark:hover:text-blue-400">Demos</a>
            <a href="#" className="hover:text-blue-600 dark:hover:text-blue-400">Features</a>
            <a href="#" className="hover:text-blue-600 dark:hover:text-blue-400">Pages</a>
            <a href="#" className="hover:text-blue-600 dark:hover:text-blue-400">Blog</a>
            <a href="#" className="hover:text-blue-600 dark:hover:text-blue-400">Contact</a>
          </nav>

          <div className="flex items-center gap-4">
            <ThemeToggle />

            {/* Desktop CTA */}
            <Link href="/login" className="hidden md:block bg-red-500 hover:bg-red-600 text-white px-6 py-2.5 rounded-full font-medium transition-colors shadow-lg hover:shadow-red-500/30">
              Try It Free
            </Link>

            {/* Mobile Nav Toggle */}
            <LandingMobileNav />
          </div>
        </div>
      </header>

      <main>
        <LandingHero />
        <CategoryGrid />

        {/* Features Section */}
        <section className="py-20 bg-gray-50 dark:bg-gray-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col lg:flex-row items-center gap-16">
            <div className="flex-1 order-2 lg:order-1">
              <div className="relative">
                <div className="bg-blue-100 dark:bg-blue-900/40 rounded-[2rem] p-8 relative z-10">
                  <img src="https://illustrations.popsy.co/amber/working-vacation.svg" alt="Features" className="w-full h-auto" />
                </div>
                <div className="absolute top-10 -left-10 w-24 h-24 bg-blue-200 rounded-full blur-2xl opacity-50"></div>
              </div>
            </div>
            <div className="flex-1 order-1 lg:order-2">
              <p className="text-red-500 font-medium mb-3 text-sm tracking-wider uppercase">Team Management</p>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-6">
                We help build skilled <br /> teams for you
              </h2>
              <p className="text-gray-500 dark:text-gray-400 mb-8 leading-relaxed">
                Search all the open positions on the web. Get your own personalized salary estimate. Read reviews on over 30000+ companies worldwide.
              </p>
              <ul className="space-y-4">
                <li className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-full bg-green-100 text-green-600 flex items-center justify-center text-xs">✓</span>
                  <span className="text-gray-700 dark:text-gray-300 font-medium">Easily recruit the staff you need</span>
                </li>
                <li className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-full bg-green-100 text-green-600 flex items-center justify-center text-xs">✓</span>
                  <span className="text-gray-700 dark:text-gray-300 font-medium">Many employees can be found together</span>
                </li>
                <li className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-full bg-green-100 text-green-600 flex items-center justify-center text-xs">✓</span>
                  <span className="text-gray-700 dark:text-gray-300 font-medium">Improve business quality with skilled people</span>
                </li>
              </ul>
            </div>
          </div>
        </section>

        <Testimonials />

        {/* Pricing Section Placeholder */}
        <section className="py-20 bg-white dark:bg-gray-900">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <p className="text-red-500 font-medium mb-3 text-sm tracking-wider uppercase">Pricing & Plans</p>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-12">
              Our Pricing Plans Suits <br /> Your <span className="underline decoration-blue-400 decoration-4 underline-offset-4">Every Needs</span>
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
              {/* Basic */}
              <div className="p-8 rounded-2xl border border-gray-100 dark:border-gray-800 hover:shadow-xl transition-all">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Starter</h3>
                <div className="text-4xl font-bold text-blue-600 mb-2">$5.00</div>
                <p className="text-sm text-gray-500 mb-8">Per Month</p>
                <ul className="space-y-3 mb-8 text-left text-sm text-gray-600 dark:text-gray-400">
                  <li>✓ 10 Job Posting</li>
                  <li>✓ 2 Featured jobs</li>
                  <li>✓ Displayed for 15 days</li>
                </ul>
                <button className="w-full py-3 rounded-xl border border-blue-600 text-blue-600 font-medium hover:bg-blue-50 transition-colors">Get Started</button>
              </div>
              {/* Standard - Featured */}
              <div className="p-8 rounded-2xl bg-gray-900 text-white hover:shadow-xl transition-all relative transform md:-translate-y-4">
                <div className="absolute top-0 right-0 bg-red-500 text-white text-xs font-bold px-3 py-1 rounded-bl-lg rounded-tr-lg">POPULAR</div>
                <h3 className="text-lg font-bold mb-4">Basic</h3>
                <div className="text-4xl font-bold text-white mb-2">$45.00</div>
                <p className="text-sm text-gray-400 mb-8">Per Month</p>
                <ul className="space-y-3 mb-8 text-left text-gray-300 text-sm">
                  <li>✓ 20 Job Posting</li>
                  <li>✓ 5 Featured jobs</li>
                  <li>✓ Displayed for 30 days</li>
                </ul>
                <button className="w-full py-3 rounded-xl bg-red-500 text-white font-medium hover:bg-red-600 transition-colors shadow-lg shadow-red-500/30">Get Started</button>
              </div>
              {/* Premium */}
              <div className="p-8 rounded-2xl border border-gray-100 dark:border-gray-800 hover:shadow-xl transition-all">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Premium</h3>
                <div className="text-4xl font-bold text-blue-600 mb-2">$230.00</div>
                <p className="text-sm text-gray-500 mb-8">Per Month</p>
                <ul className="space-y-3 mb-8 text-left text-sm text-gray-600 dark:text-gray-400">
                  <li>✓ 50 Job Posting</li>
                  <li>✓ 10 Featured jobs</li>
                  <li>✓ Displayed for 60 days</li>
                </ul>
                <button className="w-full py-3 rounded-xl border border-blue-600 text-blue-600 font-medium hover:bg-blue-50 transition-colors">Get Started</button>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-[2.5rem] p-12 md:p-16 flex flex-col md:flex-row items-center justify-between text-center md:text-left relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl translate-x-1/2 -translate-y-1/2"></div>
              <div className="relative z-10">
                <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Download now! A great app <br /> for modern living</h2>
                <p className="text-blue-100 max-w-lg">Fully layered dolor sit amet, nobis id expedita dolores officiis layered dolor sit amet laboriosam.</p>
              </div>
              <div className="relative z-10 flex gap-4 mt-8 md:mt-0">
                <button className="bg-black text-white px-6 py-3 rounded-xl flex items-center gap-3 hover:bg-gray-900 transition-colors">
                  <span className="text-2xl">🍎</span>
                  <div className="text-left">
                    <div className="text-[10px] uppercase tracking-wider">Download on the</div>
                    <div className="text-sm font-bold leading-none">App Store</div>
                  </div>
                </button>
                <button className="bg-black text-white px-6 py-3 rounded-xl flex items-center gap-3 hover:bg-gray-900 transition-colors">
                  <span className="text-2xl">🤖</span>
                  <div className="text-left">
                    <div className="text-[10px] uppercase tracking-wider">Get it on</div>
                    <div className="text-sm font-bold leading-none">Google Play</div>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </section>

        <footer className="bg-gray-50 dark:bg-gray-900 py-12 border-t border-gray-200 dark:border-gray-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">JobLee</div>
            <div className="flex gap-8 text-gray-500 text-sm">
              <a href="#" className="hover:text-gray-900 dark:hover:text-white">About Us</a>
              <a href="#" className="hover:text-gray-900 dark:hover:text-white">Contact</a>
              <a href="#" className="hover:text-gray-900 dark:hover:text-white">Privacy Policy</a>
              <a href="#" className="hover:text-gray-900 dark:hover:text-white">Terms of Service</a>
            </div>
            <div className="text-gray-400 text-sm">© 2026 JobLee. All rights reserved.</div>
          </div>
        </footer>

      </main>
    </div>
  );
}

export default function Home() {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div></div>;
  }

  // If user is logged in, show Dashboard
  if (user) {
    return <DashboardContent />;
  }

  // If guest, show Landing Page
  return <LandingPage />;
}

