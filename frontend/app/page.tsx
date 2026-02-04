'use client';

import { useEffect, useState, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { Job } from '@/types/job';
import JobCard from '@/components/JobCard';
import { normalizeSource } from '@/lib/job-utils';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useAuth } from '@/context/AuthContext';
import { ThemeToggle } from '@/components/ThemeToggle';

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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                JobAutomate
              </h1>
              <p className="text-gray-500 dark:text-gray-400 mt-1">
                Your saved job listings
              </p>
            </div>
            <div className="flex items-center gap-4">
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
                <span className="hidden sm:inline">Search Jobs</span>
              </a>
              <a
                href="/dashboard"
                className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span className="hidden sm:inline">My Resumes</span>
              </a>
              <a
                href="/profile"
                className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <span className="hidden sm:inline">Profile</span>
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
          </div>
        </div>
      </header>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-wrap gap-3">
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

export default function Dashboard() {
  return (
    <ProtectedRoute>
      <DashboardContent />
    </ProtectedRoute>
  );
}
