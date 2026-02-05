'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Job } from '@/types/job';
import JobCard from '@/components/JobCard';
import { normalizeSource } from '@/lib/job-utils';
import { useAuth } from '@/context/AuthContext';
import { ThemeToggle } from '@/components/ThemeToggle';
import { MobileNav } from '@/components/MobileNav';
import LandingHero from '@/components/LandingHero';
import CategoryGrid from '@/components/CategoryGrid';
import Testimonials from '@/components/Testimonials';
import { LandingMobileNav } from '@/components/LandingMobileNav';

// Date filter options
const DATE_FILTERS = [
  { label: 'Today', value: '24h' },
  { label: 'This Week', value: '7d' },
  { label: 'This Month', value: '30d' },
  { label: 'All Time', value: '' },
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
  const [selectedDateFilter, setSelectedDateFilter] = useState('24h');
  const [showSavedOnly, setShowSavedOnly] = useState(false);
  const [showVisaSponsoredOnly, setShowVisaSponsoredOnly] = useState(false);
  const [showRemoteOnly, setShowRemoteOnly] = useState(false);
  const [showEntryLevelOnly, setShowEntryLevelOnly] = useState(false);
  const [showFullTimeOnly, setShowFullTimeOnly] = useState(false);
  const [showPartTimeOnly, setShowPartTimeOnly] = useState(false);
  const [showContractOnly, setShowContractOnly] = useState(false);
  const [showInternshipOnly, setShowInternshipOnly] = useState(false);
  const [showEasyApplyOnly, setShowEasyApplyOnly] = useState(false);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [sortBy, setSortBy] = useState<'relevance' | 'newest' | 'salary_high' | 'salary_low' | 'company_az'>('newest');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const pathname = usePathname();

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

  const navItems = [
    {
      href: '/jobs/search',
      label: 'Search',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      ),
    },
    {
      href: '/dashboard',
      label: 'My Resumes',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
    },
    {
      href: '/analyze',
      label: 'Analyze',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
    },
    {
      href: '/profile',
      label: 'Profile',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      ),
    },
  ];

  const isActiveRoute = (href: string) => (href === '/' ? pathname === '/' : pathname.startsWith(href));

  const getSalaryValue = (salary: string | undefined, mode: 'min' | 'max') => {
    if (!salary) return null;
    const numbers = salary.replace(/,/g, '').match(/\d+/g);
    if (!numbers) return null;
    const values = numbers.map(Number);
    return mode === 'min' ? Math.min(...values) : Math.max(...values);
  };

  const getRelevanceScore = (job: Job, query: string) => {
    const trimmed = query.trim().toLowerCase();
    if (!trimmed) return 0;
    let score = 0;
    if (job.title.toLowerCase().includes(trimmed)) score += 3;
    if (job.company.toLowerCase().includes(trimmed)) score += 2;
    if ((job.description || '').toLowerCase().includes(trimmed)) score += 1;
    return score;
  };

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

    const filtered = jobs.filter(job => {
      const contentText = `${job.title} ${job.company} ${job.location || ''} ${job.description || ''}`.toLowerCase();

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
      const hasVisaKeywords = contentText.includes('visa') || contentText.includes('sponsorship') || contentText.includes('sponsor');
      const matchesVisa = !showVisaSponsoredOnly || isReed || hasVisaKeywords;

      const isRemote = contentText.includes('remote');
      const isEntryLevel = /entry level|junior|graduate/.test(contentText);
      const isInternship = /intern/.test(contentText);
      const isFullTime = /full[-\s]?time/.test(contentText);
      const isPartTime = /part[-\s]?time/.test(contentText);
      const isContract = /contract/.test(contentText);
      const isEasyApply = /easy apply|one[-\s]?click|quick apply/.test(contentText);

      const matchesRemote = !showRemoteOnly || isRemote;
      const matchesEntryLevel = !showEntryLevelOnly || isEntryLevel;
      const matchesFullTime = !showFullTimeOnly || isFullTime;
      const matchesPartTime = !showPartTimeOnly || isPartTime;
      const matchesContract = !showContractOnly || isContract;
      const matchesInternship = !showInternshipOnly || isInternship;
      const matchesEasyApply = !showEasyApplyOnly || isEasyApply;

      return matchesSearch
        && matchesCompany
        && matchesLocation
        && matchesSource
        && matchesDate
        && matchesSaved
        && matchesVisa
        && matchesRemote
        && matchesEntryLevel
        && matchesFullTime
        && matchesPartTime
        && matchesContract
        && matchesInternship
        && matchesEasyApply;
    });

    const sorted = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'company_az':
          return a.company.localeCompare(b.company);
        case 'salary_high': {
          const aVal = getSalaryValue(a.salary, 'max');
          const bVal = getSalaryValue(b.salary, 'max');
          if (aVal == null && bVal == null) return 0;
          if (aVal == null) return 1;
          if (bVal == null) return -1;
          return bVal - aVal;
        }
        case 'salary_low': {
          const aVal = getSalaryValue(a.salary, 'min');
          const bVal = getSalaryValue(b.salary, 'min');
          if (aVal == null && bVal == null) return 0;
          if (aVal == null) return 1;
          if (bVal == null) return -1;
          return aVal - bVal;
        }
        case 'relevance': {
          const scoreDiff = getRelevanceScore(b, searchQuery) - getRelevanceScore(a, searchQuery);
          if (scoreDiff !== 0) return scoreDiff;
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        }
        case 'newest':
        default:
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
    });

    return sorted;
  }, [
    jobs,
    searchQuery,
    selectedCompany,
    selectedLocation,
    selectedSource,
    selectedDateFilter,
    showSavedOnly,
    showVisaSponsoredOnly,
    showRemoteOnly,
    showEntryLevelOnly,
    showFullTimeOnly,
    showPartTimeOnly,
    showContractOnly,
    showInternshipOnly,
    showEasyApplyOnly,
    sortBy,
    savedJobIds
  ]);

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedCompany('');
    setSelectedLocation('');
    setSelectedSource('');
    setSelectedDateFilter('24h');
    setShowSavedOnly(false);
    setShowVisaSponsoredOnly(false);
    setShowRemoteOnly(false);
    setShowEntryLevelOnly(false);
    setShowFullTimeOnly(false);
    setShowPartTimeOnly(false);
    setShowContractOnly(false);
    setShowInternshipOnly(false);
    setShowEasyApplyOnly(false);
  };

  const hasActiveFilters = searchQuery
    || selectedCompany
    || selectedLocation
    || selectedSource
    || showSavedOnly
    || showVisaSponsoredOnly
    || showRemoteOnly
    || showEntryLevelOnly
    || showFullTimeOnly
    || showPartTimeOnly
    || showContractOnly
    || showInternshipOnly
    || showEasyApplyOnly;

  const activeFilterChips = [
    searchQuery ? { label: `"${searchQuery}"`, onClear: () => setSearchQuery('') } : null,
    selectedCompany ? { label: selectedCompany, onClear: () => setSelectedCompany('') } : null,
    selectedLocation ? { label: selectedLocation, onClear: () => setSelectedLocation('') } : null,
    selectedSource ? { label: selectedSource, onClear: () => setSelectedSource('') } : null,
    showSavedOnly ? { label: 'Saved', onClear: () => setShowSavedOnly(false) } : null,
    showVisaSponsoredOnly ? { label: 'Visa Sponsored', onClear: () => setShowVisaSponsoredOnly(false) } : null,
    showRemoteOnly ? { label: 'Remote', onClear: () => setShowRemoteOnly(false) } : null,
    showEntryLevelOnly ? { label: 'Entry Level', onClear: () => setShowEntryLevelOnly(false) } : null,
    showFullTimeOnly ? { label: 'Full-time', onClear: () => setShowFullTimeOnly(false) } : null,
    showPartTimeOnly ? { label: 'Part-time', onClear: () => setShowPartTimeOnly(false) } : null,
    showContractOnly ? { label: 'Contract', onClear: () => setShowContractOnly(false) } : null,
    showInternshipOnly ? { label: 'Internship', onClear: () => setShowInternshipOnly(false) } : null,
    showEasyApplyOnly ? { label: 'Easy Apply', onClear: () => setShowEasyApplyOnly(false) } : null,
  ].filter((item): item is { label: string; onClear: () => void } => Boolean(item));
  const isFilteredEmpty = filteredJobs.length === 0 && jobs.length > 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 md:py-6">
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <a href="/" className="flex items-center gap-3">
                  <span className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
                    JobLee
                  </span>
                </a>
              </div>

              <nav className="hidden lg:flex items-center gap-1">
                {navItems.map((item) => {
                  const active = isActiveRoute(item.href);
                  return (
                    <a
                      key={item.href}
                      href={item.href}
                      aria-current={active ? 'page' : undefined}
                      className={`relative flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${active
                        ? 'text-indigo-600 dark:text-indigo-300 bg-indigo-50/70 dark:bg-indigo-900/30 after:absolute after:left-3 after:right-3 after:-bottom-1 after:h-0.5 after:rounded-full after:bg-indigo-500'
                        : 'text-gray-600 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                        }`}
                    >
                      {item.icon}
                      <span>{item.label}</span>
                    </a>
                  );
                })}
              </nav>

              <div className="hidden md:flex items-center gap-3">
                <ThemeToggle />

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

              <div className="flex md:hidden items-center gap-3">
                <MobileNav user={user} onSignOut={handleSignOut} />
              </div>
            </div>

            <div className="flex flex-col gap-4">
              <div className="flex flex-col md:flex-row md:items-center gap-3">
                <div className="flex items-center gap-2 flex-1">
                  <div className="relative flex-1">
                    <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <input
                      type="text"
                      placeholder="Search jobs, companies..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 min-h-[44px] border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowAdvancedFilters(true)}
                    className="inline-flex items-center justify-center min-h-[44px] min-w-[44px] rounded-lg border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    aria-label="Open filters"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M6 12h12M10 18h4" />
                    </svg>
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                    <span>Sort</span>
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                      className="px-3 py-2 min-h-[40px] rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="relevance">Relevance</option>
                      <option value="newest">Newest</option>
                      <option value="salary_high">Salary (High → Low)</option>
                      <option value="salary_low">Salary (Low → High)</option>
                      <option value="company_az">Company A–Z</option>
                    </select>
                  </div>

                  <div className="inline-flex items-center rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                    <button
                      onClick={() => setViewMode('grid')}
                      aria-pressed={viewMode === 'grid'}
                      className={`p-2.5 rounded-l-lg transition-colors ${viewMode === 'grid'
                        ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-200'
                        : 'text-gray-500 hover:text-gray-700 dark:text-gray-300 dark:hover:text-white'
                        }`}
                      aria-label="Grid view"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h4v4H4V6zm6 0h4v4h-4V6zm6 0h4v4h-4V6zM4 14h4v4H4v-4zm6 0h4v4h-4v-4zm6 0h4v4h-4v-4z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => setViewMode('list')}
                      aria-pressed={viewMode === 'list'}
                      className={`p-2.5 rounded-r-lg transition-colors ${viewMode === 'list'
                        ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-200'
                        : 'text-gray-500 hover:text-gray-700 dark:text-gray-300 dark:hover:text-white'
                        }`}
                      aria-label="List view"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div className="inline-flex items-center rounded-lg bg-gray-100 dark:bg-gray-700 p-1 overflow-x-auto">
                  {DATE_FILTERS.map((filter) => {
                    const isActive = selectedDateFilter === filter.value;
                    return (
                      <button
                        key={filter.value}
                        onClick={() => setSelectedDateFilter(filter.value)}
                        aria-pressed={isActive}
                        className={`px-3 py-1.5 text-sm rounded-md whitespace-nowrap transition-colors ${isActive
                          ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm'
                          : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
                          }`}
                      >
                        {filter.label}
                      </button>
                    );
                  })}
                </div>
                <div className="flex items-center gap-3 text-sm text-gray-500 dark:text-gray-400">
                  <button
                    type="button"
                    onClick={() => setShowAdvancedFilters(true)}
                    className="font-medium text-indigo-600 hover:text-indigo-700 dark:text-indigo-300 dark:hover:text-indigo-200"
                  >
                    More filters
                  </button>
                  <span>{filteredJobs.length} jobs</span>
                </div>
              </div>

              {hasActiveFilters && (
                <div className="flex flex-wrap items-center gap-2">
                  {activeFilterChips.map((chip) => (
                    <button
                      key={chip.label}
                      onClick={chip.onClear}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700/60 dark:text-gray-200 dark:hover:bg-gray-700 transition-colors"
                    >
                      {chip.label}
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  ))}
                  <button
                    onClick={clearFilters}
                    className="text-xs font-medium text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                  >
                    Clear all
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {showAdvancedFilters && (
        <>
          <div
            className="fixed inset-0 bg-black/40 z-40"
            onClick={() => setShowAdvancedFilters(false)}
            aria-hidden="true"
          />
          <div
            role="dialog"
            aria-modal="true"
            className="fixed inset-x-0 bottom-0 z-50 bg-white dark:bg-gray-800 rounded-t-2xl border border-gray-200 dark:border-gray-700 shadow-2xl md:inset-y-0 md:right-0 md:left-auto md:w-[420px] md:rounded-none"
          >
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
              <div>
                <p className="text-sm font-semibold text-gray-900 dark:text-white">Filters</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Refine your results</p>
              </div>
              <button
                onClick={() => setShowAdvancedFilters(false)}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                aria-label="Close filters"
              >
                <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-4 space-y-5 overflow-y-auto max-h-[75vh] md:max-h-full">
              <div>
                <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-2">Job type</p>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setShowFullTimeOnly(!showFullTimeOnly)}
                    className={`px-3 py-2 text-sm rounded-full border transition-colors ${showFullTimeOnly
                      ? 'bg-indigo-600 border-indigo-600 text-white'
                      : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700'
                      }`}
                  >
                    Full-time
                  </button>
                  <button
                    onClick={() => setShowPartTimeOnly(!showPartTimeOnly)}
                    className={`px-3 py-2 text-sm rounded-full border transition-colors ${showPartTimeOnly
                      ? 'bg-indigo-600 border-indigo-600 text-white'
                      : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700'
                      }`}
                  >
                    Part-time
                  </button>
                  <button
                    onClick={() => setShowContractOnly(!showContractOnly)}
                    className={`px-3 py-2 text-sm rounded-full border transition-colors ${showContractOnly
                      ? 'bg-indigo-600 border-indigo-600 text-white'
                      : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700'
                      }`}
                  >
                    Contract
                  </button>
                  <button
                    onClick={() => setShowInternshipOnly(!showInternshipOnly)}
                    className={`px-3 py-2 text-sm rounded-full border transition-colors ${showInternshipOnly
                      ? 'bg-indigo-600 border-indigo-600 text-white'
                      : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700'
                      }`}
                  >
                    Internship
                  </button>
                </div>
              </div>

              <div>
                <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-2">Location</p>
                <select
                  value={selectedLocation}
                  onChange={(e) => setSelectedLocation(e.target.value)}
                  className="w-full px-3 py-2.5 min-h-[44px] border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">All Locations</option>
                  {locations.map(location => (
                    <option key={location} value={location}>{location}</option>
                  ))}
                </select>
                <div className="flex flex-wrap gap-2 mt-3">
                  <button
                    onClick={() => setShowRemoteOnly(!showRemoteOnly)}
                    className={`px-3 py-2 text-sm rounded-full border transition-colors ${showRemoteOnly
                      ? 'bg-indigo-600 border-indigo-600 text-white'
                      : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700'
                      }`}
                  >
                    Remote
                  </button>
                </div>
              </div>

              <div>
                <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-2">Companies</p>
                <select
                  value={selectedCompany}
                  onChange={(e) => setSelectedCompany(e.target.value)}
                  className="w-full px-3 py-2.5 min-h-[44px] border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">All Companies</option>
                  {companies.map(company => (
                    <option key={company} value={company}>{company}</option>
                  ))}
                </select>
              </div>

              <div>
                <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-2">Source</p>
                <select
                  value={selectedSource}
                  onChange={(e) => setSelectedSource(e.target.value)}
                  className="w-full px-3 py-2.5 min-h-[44px] border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">All Sources</option>
                  {sources.map(source => (
                    <option key={source} value={source}>{source}</option>
                  ))}
                </select>
              </div>

              <div>
                <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-2">Other</p>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setShowVisaSponsoredOnly(!showVisaSponsoredOnly)}
                    className={`px-3 py-2 text-sm rounded-full border transition-colors ${showVisaSponsoredOnly
                      ? 'bg-indigo-600 border-indigo-600 text-white'
                      : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700'
                      }`}
                  >
                    Visa Sponsored
                  </button>
                  <button
                    onClick={() => setShowEntryLevelOnly(!showEntryLevelOnly)}
                    className={`px-3 py-2 text-sm rounded-full border transition-colors ${showEntryLevelOnly
                      ? 'bg-indigo-600 border-indigo-600 text-white'
                      : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700'
                      }`}
                  >
                    Entry Level
                  </button>
                  <button
                    onClick={() => setShowEasyApplyOnly(!showEasyApplyOnly)}
                    className={`px-3 py-2 text-sm rounded-full border transition-colors ${showEasyApplyOnly
                      ? 'bg-indigo-600 border-indigo-600 text-white'
                      : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700'
                      }`}
                  >
                    Easy Apply
                  </button>
                  <button
                    onClick={() => setShowSavedOnly(!showSavedOnly)}
                    className={`px-3 py-2 text-sm rounded-full border transition-colors ${showSavedOnly
                      ? 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/30 dark:text-amber-200 dark:border-amber-900/40'
                      : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700'
                      }`}
                  >
                    Saved only
                  </button>
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <button
                onClick={clearFilters}
                className="text-sm font-medium text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
              >
                Clear all
              </button>
              <button
                onClick={() => setShowAdvancedFilters(false)}
                className="px-4 py-2.5 min-h-[44px] rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 transition-colors"
              >
                Show {filteredJobs.length} jobs
              </button>
            </div>
          </div>
        </>
      )}

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
            <div className="text-6xl mb-4">{(hasActiveFilters || isFilteredEmpty) ? '🔍' : '📭'}</div>
            <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-300">
              {(hasActiveFilters || isFilteredEmpty) ? 'No jobs match your filters' : 'No jobs saved yet'}
            </h2>
            <p className="text-gray-500 dark:text-gray-400 mt-2">
              {(hasActiveFilters || isFilteredEmpty)
                ? 'Try adjusting your filters or search query.'
                : 'Use the Chrome extension or run the scraper to add jobs.'}
            </p>
            {(hasActiveFilters || isFilteredEmpty) && (
              <button
                onClick={clearFilters}
                className="mt-4 text-blue-600 hover:text-blue-700 underline"
              >
                Clear all filters
              </button>
            )}
          </div>
        ) : (
          <div
            className={viewMode === 'grid'
              ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
              : 'grid grid-cols-1 gap-6'}
          >
            {filteredJobs.map((job) => (
              <JobCard
                key={job.id}
                job={job}
                onDelete={handleDelete}
                isSaved={savedJobIds.has(job.id)}
                onToggleSave={handleToggleSave}
                layout={viewMode}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

function LandingPage() {
  const [annualBilling, setAnnualBilling] = useState(false);

  const navLinks = [
    { href: '#find-jobs', label: 'Find Jobs' },
    { href: '#employers', label: 'Post a Job' },
    { href: '#pricing', label: 'Pricing' },
    { href: '#resources', label: 'Resources' },
  ];

  const pricingPlans = [
    {
      name: 'Starter',
      monthly: 5,
      annual: 48,
      cta: 'Start Free',
      ctaNote: 'No CC required',
      features: ['10 job postings', '2 featured jobs', '15 days visibility', 'Email support'],
    },
    {
      name: 'Most Popular',
      monthly: 45,
      annual: 432,
      cta: 'Start Free Trial',
      ctaNote: '14 days free',
      features: ['20 job postings', '5 featured jobs', '30 days visibility', 'Priority support', 'Analytics dashboard'],
      highlight: true,
    },
    {
      name: 'Premium',
      monthly: 230,
      annual: 2208,
      cta: 'Talk to Sales',
      ctaNote: 'Custom onboarding',
      features: ['50 job postings', '10 featured jobs', '60 days visibility', 'Dedicated manager', 'API access', 'White-label', 'Custom contracts'],
    },
  ];

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <header className="sticky top-0 z-50 bg-white/80 dark:bg-gray-900/80 backdrop-blur border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="h-16 sm:h-18 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white font-bold flex items-center justify-center">
                J
              </div>
              <span className="text-lg font-bold text-gray-900 dark:text-white">JobLee</span>
            </Link>

            <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-600 dark:text-gray-300">
              {navLinks.map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  className="hover:text-indigo-600 dark:hover:text-indigo-300 transition-colors"
                >
                  {item.label}
                </a>
              ))}
            </nav>

            <div className="hidden md:flex items-center gap-3">
              <Link href="/login" className="text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-indigo-600">
                Log in
              </Link>
              <Link
                href="/login"
                className="text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 px-5 py-2.5 rounded-full transition-colors"
              >
                Get Started
              </Link>
            </div>

            <div className="flex items-center gap-3 md:hidden">
              <ThemeToggle />
              <LandingMobileNav />
            </div>
          </div>
        </div>
      </header>

      <main>
        <LandingHero />

        <section id="employers" className="py-20 bg-sky-50 dark:bg-sky-950/40">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid lg:grid-cols-2 gap-12 items-center">
            <div className="relative">
              <div className="bg-white dark:bg-gray-900 rounded-2xl border border-sky-100 dark:border-sky-900 shadow-lg p-6">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">Hiring dashboard</p>
                  <span className="text-xs text-sky-600">Live</span>
                </div>
                <div className="mt-6 grid grid-cols-3 gap-3 text-center">
                  <div className="rounded-xl bg-sky-50 dark:bg-sky-900/40 p-3">
                    <p className="text-xl font-semibold text-sky-600">127</p>
                    <p className="text-xs text-gray-500">Applicants</p>
                  </div>
                  <div className="rounded-xl bg-sky-50 dark:bg-sky-900/40 p-3">
                    <p className="text-xl font-semibold text-sky-600">12</p>
                    <p className="text-xs text-gray-500">Shortlisted</p>
                  </div>
                  <div className="rounded-xl bg-sky-50 dark:bg-sky-900/40 p-3">
                    <p className="text-xl font-semibold text-sky-600">3</p>
                    <p className="text-xs text-gray-500">Interviews</p>
                  </div>
                </div>
                <div className="mt-6 h-32 rounded-xl bg-gradient-to-r from-sky-100 to-sky-50 dark:from-sky-900/40 dark:to-sky-900/10 flex items-end gap-2 p-4">
                  <div className="w-4 h-10 bg-sky-400 rounded"></div>
                  <div className="w-4 h-16 bg-sky-500 rounded"></div>
                  <div className="w-4 h-20 bg-sky-600 rounded"></div>
                  <div className="w-4 h-12 bg-sky-400 rounded"></div>
                  <div className="w-4 h-24 bg-sky-500 rounded"></div>
                </div>
              </div>
            </div>

            <div>
              <p className="text-xs font-semibold tracking-[0.2em] text-sky-600 uppercase mb-3">For employers</p>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white">
                Hire top talent in 48 hours, not 48 days
              </h2>
              <p className="text-gray-600 dark:text-gray-300 mt-4">
                Post once, reach everywhere. Let AI rank and screen candidates while you focus on hiring.
              </p>
              <ul className="mt-6 space-y-3 text-gray-600 dark:text-gray-300">
                <li>✓ One-click multi-board posting</li>
                <li>✓ AI ranks best candidates</li>
                <li>✓ Auto-screen resumes and schedule interviews</li>
                <li>✓ Send offers from one dashboard</li>
              </ul>
              <div className="mt-8 flex flex-wrap items-center gap-4">
                <Link href="/login" className="bg-sky-600 hover:bg-sky-700 text-white px-6 py-3 rounded-full font-medium transition-colors">
                  Post Your First Job - Free
                </Link>
                <span className="text-sm text-gray-500">Starting at $5/post</span>
              </div>
              <p className="mt-6 text-sm text-gray-500">
                "Hired 3 engineers in a week." — Sarah, CTO at TechStart
              </p>
            </div>
          </div>
        </section>

        <CategoryGrid />
        <Testimonials />

        <section id="pricing" className="py-20 bg-white dark:bg-gray-900">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <p className="text-xs font-semibold tracking-[0.2em] text-gray-500 uppercase mb-3">Simple, transparent pricing</p>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Start free. Scale as you grow.
            </h2>

            <div className="flex items-center justify-center gap-4 mt-8">
              <span className={`text-sm font-medium ${annualBilling ? 'text-gray-400' : 'text-gray-900 dark:text-white'}`}>Monthly</span>
              <button
                onClick={() => setAnnualBilling(!annualBilling)}
                className="relative w-14 h-7 bg-gray-200 rounded-full transition-colors"
                aria-label="Toggle annual billing"
              >
                <span
                  className={`absolute top-0.5 left-0.5 w-6 h-6 bg-white rounded-full shadow-sm transition-transform ${annualBilling ? 'translate-x-7' : ''}`}
                />
              </button>
              <span className={`text-sm font-medium ${annualBilling ? 'text-gray-900 dark:text-white' : 'text-gray-400'}`}>Annual -20%</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto mt-12">
              {pricingPlans.map((plan) => {
                const price = annualBilling ? plan.annual : plan.monthly;
                const savings = plan.monthly * 12 - plan.annual;
                return (
                  <div
                    key={plan.name}
                    className={`p-8 rounded-2xl border transition-all ${plan.highlight
                      ? 'bg-gray-900 text-white border-gray-900 shadow-xl md:-translate-y-4'
                      : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:shadow-xl'
                      }`}
                  >
                    {plan.highlight && (
                      <div className="text-xs font-semibold uppercase tracking-wide bg-white/10 rounded-full px-3 py-1 inline-flex mb-4">
                        Most Popular
                      </div>
                    )}
                    <h3 className="text-lg font-bold mb-3">{plan.name}</h3>
                    <div className={`text-4xl font-bold ${plan.highlight ? 'text-white' : 'text-indigo-600'}`}>
                      ${price}
                      <span className="text-base font-medium">/{annualBilling ? 'yr' : 'mo'}</span>
                    </div>
                    <p className={`text-sm mt-2 ${plan.highlight ? 'text-gray-300' : 'text-gray-500'}`}>
                      {annualBilling ? `or $${plan.monthly}/mo billed annually` : 'billed monthly'}
                    </p>
                    {annualBilling && (
                      <p className="text-sm text-emerald-500 mt-2">You save ${savings}</p>
                    )}
                    <ul className={`space-y-3 mt-6 text-sm ${plan.highlight ? 'text-gray-300' : 'text-gray-600 dark:text-gray-300'}`}>
                      {plan.features.map((feature) => (
                        <li key={feature}>✓ {feature}</li>
                      ))}
                    </ul>
                    <button className={`w-full py-3 mt-8 rounded-full font-medium transition-colors ${plan.highlight
                      ? 'bg-indigo-600 hover:bg-indigo-700 text-white'
                      : 'border border-indigo-600 text-indigo-600 hover:bg-indigo-50'
                      }`}
                    >
                      {plan.cta}
                    </button>
                    <p className={`text-xs mt-2 ${plan.highlight ? 'text-gray-400' : 'text-gray-500'}`}>
                      {plan.ctaNote}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        <section id="app" className="py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="bg-gradient-to-r from-indigo-600 to-violet-600 rounded-[2.5rem] p-10 md:p-16 text-white grid lg:grid-cols-[1.1fr_0.9fr] gap-10 items-center relative overflow-hidden">
              <div className="absolute top-0 right-0 w-72 h-72 bg-white/10 rounded-full blur-3xl translate-x-1/2 -translate-y-1/2"></div>
              <div className="relative z-10">
                <p className="text-xs uppercase tracking-[0.2em] text-indigo-100 mb-3">Never miss an opportunity</p>
                <h2 className="text-3xl md:text-4xl font-bold mb-4">
                  Get instant alerts and apply in one tap
                </h2>
                <p className="text-indigo-100 mb-6">
                  Track every application, message employers, and get push notifications for matches.
                </p>
                <ul className="space-y-2 text-indigo-50 text-sm">
                  <li>• Apply in one tap</li>
                  <li>• Track all applications</li>
                  <li>• Message employers directly</li>
                </ul>

                <div className="mt-8 flex flex-wrap items-center gap-4">
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
                  <div className="bg-white rounded-xl p-3 text-indigo-700">
                    <div className="w-20 h-20 bg-indigo-100 rounded-lg flex items-center justify-center text-xs font-semibold">
                      QR Code
                    </div>
                    <p className="text-xs mt-2 text-indigo-700">Scan to download</p>
                  </div>
                </div>

                <div className="mt-6 text-sm text-indigo-100">
                  ⭐ 4.8 (12K reviews) • 50K+ downloads • Editor's Choice
                </div>
              </div>

              <div className="relative z-10 flex justify-center">
                <div className="w-60 sm:w-72 aspect-[9/19] bg-white/10 border border-white/20 rounded-[2rem] shadow-2xl rotate-3">
                  <div className="h-full w-full rounded-[2rem] bg-white/90 text-gray-900 p-4 flex flex-col justify-between">
                    <div className="text-xs text-gray-500">JobLee</div>
                    <div className="rounded-xl bg-indigo-50 p-4 text-sm shadow-sm">
                      <p className="font-semibold">New match</p>
                      <p className="text-xs text-gray-500 mt-1">Product Designer • Remote</p>
                    </div>
                    <div className="text-xs text-gray-400">Swipe to apply</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <footer id="resources" className="bg-gray-50 dark:bg-gray-900 py-16 border-t border-gray-200 dark:border-gray-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-10">
              <div className="md:col-span-2">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white font-bold flex items-center justify-center">J</div>
                  <span className="text-lg font-bold text-gray-900 dark:text-white">JobLee</span>
                </div>
                <p className="mt-4 text-sm text-gray-600 dark:text-gray-400 max-w-sm">
                  Making job search human again. Find roles faster, apply smarter, and track everything in one place.
                </p>
                <div className="mt-6 flex items-center gap-3 text-gray-500">
                  <span>Twitter</span>
                  <span>LinkedIn</span>
                  <span>GitHub</span>
                  <span>Instagram</span>
                </div>
              </div>

              <div>
                <p className="text-sm font-semibold text-gray-900 dark:text-white mb-3">For Job Seekers</p>
                <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                  <li>Browse Jobs</li>
                  <li>Career Resources</li>
                  <li>Salary Guide</li>
                  <li>Resume Builder</li>
                  <li>Job Alerts</li>
                </ul>
              </div>

              <div>
                <p className="text-sm font-semibold text-gray-900 dark:text-white mb-3">For Employers</p>
                <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                  <li>Post a Job</li>
                  <li>Pricing</li>
                  <li>Enterprise</li>
                  <li>ATS Integrations</li>
                </ul>
              </div>

              <div>
                <p className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Company</p>
                <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                  <li>About Us</li>
                  <li>Careers</li>
                  <li>Press</li>
                  <li>Contact</li>
                </ul>
              </div>
            </div>

            <div className="mt-12 pt-6 border-t border-gray-200 dark:border-gray-800 flex flex-col sm:flex-row justify-between items-center gap-4 text-sm text-gray-500">
              <span>English</span>
              <span>© 2026 JobLee. All rights reserved.</span>
            </div>
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
