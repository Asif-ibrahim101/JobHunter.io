'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

type ApplicationStatus = 'applied' | 'screening' | 'interview' | 'offer' | 'accepted' | 'rejected' | 'ghosted';

interface ApplicationRow {
    id: string;
    status: ApplicationStatus;
    created_at: string;
    updated_at: string | null;
    job_id: string;
    resume_id: string | null;
    jobs: {
        id: string;
        title: string;
        company: string | null;
        location: string | null;
        url: string | null;
        created_at: string | null;
    } | null;
    generated_resumes: {
        id: string;
        pdf_url: string | null;
        file_name: string | null;
        ats_score: number | null;
        created_at: string;
    } | null;
}

const STATUS_CONFIG: Record<ApplicationStatus, { label: string; badge: string; border: string }> = {
    applied: {
        label: 'Applied',
        badge: 'bg-blue-100 text-blue-800',
        border: 'border-l-blue-500'
    },
    screening: {
        label: 'Screening',
        badge: 'bg-purple-100 text-purple-800',
        border: 'border-l-purple-500'
    },
    interview: {
        label: 'Interview',
        badge: 'bg-orange-100 text-orange-800',
        border: 'border-l-orange-500'
    },
    offer: {
        label: 'Offer',
        badge: 'bg-green-100 text-green-800',
        border: 'border-l-green-500'
    },
    accepted: {
        label: 'Accepted',
        badge: 'bg-emerald-100 text-emerald-800',
        border: 'border-l-emerald-500'
    },
    rejected: {
        label: 'Rejected',
        badge: 'bg-red-100 text-red-800',
        border: 'border-l-red-500'
    },
    ghosted: {
        label: 'Ghosted',
        badge: 'bg-gray-100 text-gray-600',
        border: 'border-l-gray-400'
    },
};

const PIPELINE_STEPS = ['Applied', 'Screening', 'Interview', 'Offer', 'Accepted'];
const STATUS_OPTIONS: ApplicationStatus[] = ['applied', 'screening', 'interview', 'offer', 'accepted', 'rejected', 'ghosted'];
const STATUS_FLOW: ApplicationStatus[] = ['applied', 'screening', 'interview', 'offer', 'accepted'];

const APPLIED_DATE_FILTERS = [
    { label: 'Applied: All time', value: 'all' },
    { label: 'Applied: Last 24h', value: '1d' },
    { label: 'Applied: Last 7 days', value: '7d' },
    { label: 'Applied: Last 30 days', value: '30d' },
];

const POSTED_DATE_FILTERS = [
    { label: 'Posted: All time', value: 'all' },
    { label: 'Posted: Last 24h', value: '1d' },
    { label: 'Posted: Last 7 days', value: '7d' },
    { label: 'Posted: Last 30 days', value: '30d' },
];

const SALARY_FILTERS = [
    { label: 'Any salary', value: 'all' },
    { label: '£60k+', value: '60k' },
    { label: '£100k+', value: '100k' },
    { label: '£150k+', value: '150k' },
];

const SALARY_BANDS = ['£60k', '£100k+', '£150k+', '£200k+'];
const LOCATION_OPTIONS = ['London', 'Remote', 'New York', 'Berlin', 'Toronto'];
const REMOTE_OPTIONS = ['Remote', 'Hybrid', 'On-site'];

const dayMs = 24 * 60 * 60 * 1000;

const getAtsTone = (score?: number | null) => {
    if (score == null) {
        return {
            label: 'No score',
            pill: 'bg-gray-100 text-gray-600',
            bar: 'bg-gray-300',
            text: 'text-gray-500'
        };
    }
    if (score <= 50) {
        return { label: 'Poor', pill: 'bg-red-100 text-red-700', bar: 'bg-red-500', text: 'text-red-600' };
    }
    if (score <= 70) {
        return { label: 'Fair', pill: 'bg-amber-100 text-amber-700', bar: 'bg-amber-500', text: 'text-amber-600' };
    }
    if (score <= 85) {
        return { label: 'Good', pill: 'bg-blue-100 text-blue-700', bar: 'bg-blue-500', text: 'text-blue-600' };
    }
    return { label: 'Excellent', pill: 'bg-emerald-100 text-emerald-700', bar: 'bg-emerald-500', text: 'text-emerald-600' };
};

const getPipelineIndex = (status: ApplicationStatus) => {
    switch (status) {
        case 'applied':
            return 0;
        case 'screening':
            return 1;
        case 'interview':
            return 2;
        case 'offer':
            return 3;
        case 'accepted':
            return 4;
        default:
            return -1;
    }
};

const normalizeStatus = (status?: string | null): ApplicationStatus => {
    if (!status) return 'applied';
    switch (status) {
        case 'interviewing':
            return 'interview';
        case 'in_progress':
            return 'screening';
        case 'offer':
        case 'accepted':
        case 'rejected':
        case 'ghosted':
        case 'screening':
        case 'interview':
        case 'applied':
            return status;
        default:
            return 'applied';
    }
};

const getNextStatus = (status: ApplicationStatus) => {
    const currentIndex = STATUS_FLOW.indexOf(status);
    if (currentIndex === -1 || currentIndex === STATUS_FLOW.length - 1) return null;
    return STATUS_FLOW[currentIndex + 1];
};

const formatDate = (date: Date) =>
    date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

const formatRelativeDays = (days: number) => {
    if (days <= 0) return 'Today';
    if (days === 1) return 'Yesterday';
    return `${days} days ago`;
};

const getInitials = (name: string) =>
    name
        .split(' ')
        .map((part) => part[0])
        .join('')
        .slice(0, 2)
        .toUpperCase();

export default function Dashboard() {
    const { user, signOut } = useAuth();
    const [applicationsData, setApplicationsData] = useState<ApplicationRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<ApplicationStatus | 'all'>('all');
    const [appliedDateFilter, setAppliedDateFilter] = useState('all');
    const [postedDateFilter, setPostedDateFilter] = useState('all');
    const [salaryFilter, setSalaryFilter] = useState('all');
    const [companyFilter, setCompanyFilter] = useState('all');
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [showNotifications, setShowNotifications] = useState(false);
    const [showProfileMenu, setShowProfileMenu] = useState(false);
    const [toastMessage, setToastMessage] = useState<string | null>(null);

    const searchInputRef = useRef<HTMLInputElement | null>(null);

    useEffect(() => {
        if (!user) return;

        const fetchApplications = async () => {
            try {
                const { data, error } = await supabase
                    .from('applications')
                    .select(`
                        id,
                        created_at,
                        updated_at,
                        status,
                        job_id,
                        resume_id,
                        jobs (
                            id,
                            title,
                            company,
                            location,
                            url,
                            created_at
                        ),
                        generated_resumes (
                            id,
                            pdf_url,
                            file_name,
                            ats_score,
                            created_at
                        )
                    `)
                    .eq('user_id', user.id)
                    .order('created_at', { ascending: false });

                if (error) throw error;
                const normalized = (data as any[] || [])
                    .filter((row) => row.status !== 'saved')
                    .map((row) => ({
                        ...row,
                        status: normalizeStatus(row.status),
                    }));
                setApplicationsData(normalized as ApplicationRow[]);
            } catch (err: any) {
                console.error('Error fetching applications:', err);
                setError(err.message || 'Failed to fetch applications');
            } finally {
                setLoading(false);
            }
        };

        fetchApplications();
    }, [user]);

    const applications = useMemo(() => {
        return applicationsData.map((appRow, index) => {
            const job = appRow.jobs;
            const status = appRow.status;
            const createdAt = new Date(appRow.created_at);
            const jobPostedAt = job?.created_at ? new Date(job.created_at) : null;
            const daysSinceApplied = Math.max(0, Math.floor((Date.now() - createdAt.getTime()) / dayMs));
            const daysSincePosted = jobPostedAt ? Math.max(0, Math.floor((Date.now() - jobPostedAt.getTime()) / dayMs)) : null;
            const lastActivityDays = Math.max(1, Math.floor(daysSinceApplied / 2));
            const dueDate = status === 'interview'
                ? new Date(Date.now() + 2 * dayMs)
                : status === 'offer'
                    ? new Date(Date.now() + 10 * dayMs)
                    : undefined;

            return {
                id: appRow.id,
                title: job?.title || 'Unknown Role',
                company: job?.company || 'Unknown Company',
                subtitle: 'Hiring Team',
                status,
                atsScore: appRow.generated_resumes?.ats_score ?? null,
                createdAt,
                jobPostedAt,
                daysSinceApplied,
                daysSincePosted,
                lastActivityDays,
                dueDate,
                salary: SALARY_BANDS[index % SALARY_BANDS.length],
                location: job?.location || LOCATION_OPTIONS[index % LOCATION_OPTIONS.length],
                remote: REMOTE_OPTIONS[index % REMOTE_OPTIONS.length],
                pdfUrl: appRow.generated_resumes?.pdf_url || null,
                fileName: appRow.generated_resumes?.file_name || null,
                jobUrl: job?.url || null,
            };
        });
    }, [applicationsData]);

    const companyOptions = useMemo(() => {
        const companies = new Set(applications.map(app => app.company));
        return Array.from(companies).filter(Boolean).sort();
    }, [applications]);

    const filteredApplications = useMemo(() => {
        return applications.filter((app) => {
            const matchesSearch = !searchQuery
                || app.company.toLowerCase().includes(searchQuery.toLowerCase())
                || app.title.toLowerCase().includes(searchQuery.toLowerCase());

            const matchesStatus = statusFilter === 'all' || app.status === statusFilter;
            const matchesCompany = companyFilter === 'all' || app.company === companyFilter;

            const matchesAppliedDate = (() => {
                if (appliedDateFilter === 'all') return true;
                const cutoffDays = appliedDateFilter === '1d' ? 1 : appliedDateFilter === '7d' ? 7 : 30;
                return app.daysSinceApplied <= cutoffDays;
            })();

            const matchesPostedDate = (() => {
                if (postedDateFilter === 'all') return true;
                if (app.daysSincePosted === null) return true;
                const cutoffDays = postedDateFilter === '1d' ? 1 : postedDateFilter === '7d' ? 7 : 30;
                return app.daysSincePosted <= cutoffDays;
            })();

            const matchesSalary = salaryFilter === 'all' || app.salary.includes(salaryFilter.replace('k', ''));

            return matchesSearch && matchesStatus && matchesCompany && matchesAppliedDate && matchesPostedDate && matchesSalary;
        });
    }, [applications, searchQuery, statusFilter, appliedDateFilter, postedDateFilter, salaryFilter, companyFilter]);

    const stats = useMemo(() => {
        const activeStatuses: ApplicationStatus[] = ['applied', 'screening', 'interview', 'offer'];
        const active = applications.filter((app) => activeStatuses.includes(app.status)).length;
        const interviews = applications.filter((app) => app.status === 'interview').length;
        const offers = applications.filter((app) => app.status === 'offer').length;
        const rejected = applications.filter((app) => app.status === 'rejected').length;

        return {
            active,
            interviews,
            offers,
            rejected,
        };
    }, [applications]);

    const actionItem = applications.find((app) => app.status === 'applied' && app.daysSinceApplied >= 3);

    const hasActiveFilters = searchQuery || statusFilter !== 'all' || appliedDateFilter !== 'all' || postedDateFilter !== 'all' || salaryFilter !== 'all' || companyFilter !== 'all';

    useEffect(() => {
        if (!toastMessage) return;
        const timer = setTimeout(() => setToastMessage(null), 2500);
        return () => clearTimeout(timer);
    }, [toastMessage]);

    const toggleSelected = (id: string) => {
        setSelectedIds((prev) => {
            const next = new Set(prev);
            if (next.has(id)) {
                next.delete(id);
            } else {
                next.add(id);
            }
            return next;
        });
    };

    const toggleSelectAll = () => {
        if (selectedIds.size === filteredApplications.length) {
            setSelectedIds(new Set());
            return;
        }
        setSelectedIds(new Set(filteredApplications.map((app) => app.id)));
    };

    const openDetails = (id: string) => {
        setExpandedId((prev) => (prev === id ? null : id));
    };

    const showToast = (message: string) => {
        setToastMessage(message);
    };

    const focusSearch = () => {
        searchInputRef.current?.focus();
    };

    const jumpToList = () => {
        document.getElementById('application-list')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };

    const handleStatusChange = async (id: string, nextStatus: ApplicationStatus) => {
        const previousStatus = applicationsData.find((row) => row.id === id)?.status || 'applied';
        setApplicationsData((prev) =>
            prev.map((row) => (row.id === id ? { ...row, status: nextStatus } : row))
        );

        const { error } = await supabase
            .from('applications')
            .update({ status: nextStatus, updated_at: new Date().toISOString() })
            .eq('id', id);

        if (error) {
            console.error('Failed to update status', error);
            showToast('Failed to update status');
            setApplicationsData((prev) =>
                prev.map((row) => (row.id === id ? { ...row, status: previousStatus } : row))
            );
            return;
        }

        showToast(`Status updated to ${STATUS_CONFIG[nextStatus].label}`);
    };

    if (!user) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pt-24 px-4">
                <div className="max-w-7xl mx-auto text-center">
                    <p>Please log in to view your dashboard.</p>
                    <Link href="/login" className="text-blue-600 hover:underline mt-4 inline-block">
                        Login
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white font-bold flex items-center justify-center">
                            J
                        </div>
                        <div>
                            <p className="text-sm font-semibold text-gray-900 dark:text-white">JobLee</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">Dashboard</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <button
                            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                            aria-label="Search"
                            onClick={focusSearch}
                        >
                            <svg className="w-5 h-5 text-gray-600 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        </button>
                        <div className="relative">
                            <button
                                className="relative p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                                aria-label="Notifications"
                                onClick={() => setShowNotifications((prev) => !prev)}
                            >
                                <svg className="w-5 h-5 text-gray-600 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                                </svg>
                                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-indigo-600 text-white text-[10px] flex items-center justify-center">
                                    3
                                </span>
                            </button>
                            {showNotifications && (
                                <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg p-3 text-sm">
                                    <p className="font-semibold text-gray-900 dark:text-white mb-2">Notifications</p>
                                    <div className="space-y-2 text-gray-600 dark:text-gray-300">
                                        <p>Interview scheduled for Stripe</p>
                                        <p>ATS report ready for Google</p>
                                        <p>Follow up with Meta</p>
                                    </div>
                                </div>
                            )}
                        </div>
                        <div className="relative">
                            <button
                                className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-100 dark:bg-gray-800 text-sm font-medium text-gray-700 dark:text-gray-200"
                                onClick={() => setShowProfileMenu((prev) => !prev)}
                            >
                                <span className="w-7 h-7 rounded-full bg-indigo-500 text-white flex items-center justify-center text-xs">
                                    {user.email?.charAt(0).toUpperCase() || 'U'}
                                </span>
                                Profile
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                            </button>
                            {showProfileMenu && (
                                <div className="absolute right-0 mt-2 w-44 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg p-2 text-sm">
                                    <Link href="/profile" className="block px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800">
                                        View profile
                                    </Link>
                                    <button
                                        onClick={() => signOut?.()}
                                        className="w-full text-left px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-red-600"
                                    >
                                        Sign out
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="flex flex-col gap-6">
                    <div>
                        <p className="text-xs uppercase tracking-[0.2em] text-gray-500">My Applications</p>
                        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">Track and manage your job search journey</h1>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {[
                            { label: 'Active', value: stats.active, action: 'View all' },
                            { label: 'Interviews', value: stats.interviews, action: 'Schedule', trend: stats.interviews > 0 ? `↑ ${stats.interviews} new` : undefined },
                            { label: 'Offers', value: stats.offers, action: 'Compare', trend: stats.offers > 0 ? '🎉' : undefined },
                            { label: 'Rejected', value: stats.rejected, action: 'Review' },
                        ].map((card) => (
                            <div key={card.label} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6 shadow-sm">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-3xl font-bold text-indigo-600">{card.value}</p>
                                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{card.label}</p>
                                    </div>
                                    {card.trend && (
                                        <span className="text-xs text-emerald-600 font-medium">{card.trend}</span>
                                    )}
                                </div>
                                <button
                                    className="mt-4 text-sm font-medium text-indigo-600 hover:text-indigo-700"
                                    onClick={() => {
                                        if (card.label === 'Active') setStatusFilter('all');
                                        if (card.label === 'Interviews') setStatusFilter('interview');
                                        if (card.label === 'Offers') setStatusFilter('offer');
                                        if (card.label === 'Rejected') setStatusFilter('rejected');
                                        jumpToList();
                                    }}
                                >
                                    {card.action}
                                </button>
                            </div>
                        ))}
                    </div>

                    {actionItem && (
                        <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div className="text-sm text-indigo-800">
                                <span className="font-semibold">Action needed:</span> Follow up with {actionItem.company} ({actionItem.daysSinceApplied} days since application)
                            </div>
                            <div className="flex items-center gap-3">
                                <button
                                    className="px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium"
                                    onClick={() => {
                                        openDetails(actionItem.id);
                                        showToast(`Follow-up queued for ${actionItem.company}`);
                                    }}
                                >
                                    Send follow-up
                                </button>
                                <button
                                    className="text-sm text-indigo-700 font-medium"
                                    onClick={() => showToast('Marked as reached out')}
                                >
                                    Mark as reached out
                                </button>
                            </div>
                        </div>
                    )}

                    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4">
                        <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                            <div className="flex-1">
                                <div className="relative">
                                    <svg className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                    </svg>
                                    <input
                                        type="text"
                                        placeholder="Search companies or roles..."
                                        value={searchQuery}
                                        onChange={(event) => setSearchQuery(event.target.value)}
                                        ref={searchInputRef}
                                        className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-sm"
                                    />
                                </div>
                            </div>
                            <div className="flex flex-wrap items-center gap-3">
                                <select
                                    value={statusFilter}
                                    onChange={(event) => setStatusFilter(event.target.value as ApplicationStatus | 'all')}
                                    className="px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm"
                                >
                                    <option value="all">Status</option>
                                    {Object.keys(STATUS_CONFIG).map((status) => (
                                        <option key={status} value={status}>{STATUS_CONFIG[status as ApplicationStatus].label}</option>
                                    ))}
                                </select>
                                <select
                                    value={companyFilter}
                                    onChange={(event) => setCompanyFilter(event.target.value)}
                                    className="px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm max-w-[150px] truncate"
                                >
                                    <option value="all">Company</option>
                                    {companyOptions.map((company) => (
                                        <option key={company} value={company}>{company}</option>
                                    ))}
                                </select>
                                <select
                                    value={appliedDateFilter}
                                    onChange={(event) => setAppliedDateFilter(event.target.value)}
                                    className="px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm"
                                >
                                    {APPLIED_DATE_FILTERS.map((item) => (
                                        <option key={item.value} value={item.value}>{item.label}</option>
                                    ))}
                                </select>
                                <select
                                    value={postedDateFilter}
                                    onChange={(event) => setPostedDateFilter(event.target.value)}
                                    className="px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm"
                                >
                                    {POSTED_DATE_FILTERS.map((item) => (
                                        <option key={item.value} value={item.value}>{item.label}</option>
                                    ))}
                                </select>
                                <select
                                    value={salaryFilter}
                                    onChange={(event) => setSalaryFilter(event.target.value)}
                                    className="px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm"
                                >
                                    {SALARY_FILTERS.map((item) => (
                                        <option key={item.value} value={item.value}>{item.label}</option>
                                    ))}
                                </select>
                                <button className="px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-sm">
                                    📊
                                </button>
                            </div>
                        </div>

                        {hasActiveFilters && (
                            <div className="mt-4 flex flex-wrap items-center gap-2 text-sm">
                                {searchQuery && (
                                    <button
                                        onClick={() => setSearchQuery('')}
                                        className="px-3 py-1 rounded-full bg-gray-100 text-gray-700 hover:bg-gray-200"
                                    >
                                        "{searchQuery}" ✕
                                    </button>
                                )}
                                {statusFilter !== 'all' && (
                                    <button
                                        onClick={() => setStatusFilter('all')}
                                        className="px-3 py-1 rounded-full bg-gray-100 text-gray-700 hover:bg-gray-200"
                                    >
                                        {STATUS_CONFIG[statusFilter].label} ✕
                                    </button>
                                )}
                                {companyFilter !== 'all' && (
                                    <button
                                        onClick={() => setCompanyFilter('all')}
                                        className="px-3 py-1 rounded-full bg-gray-100 text-gray-700 hover:bg-gray-200"
                                    >
                                        {companyFilter} ✕
                                    </button>
                                )}
                                {appliedDateFilter !== 'all' && (
                                    <button
                                        onClick={() => setAppliedDateFilter('all')}
                                        className="px-3 py-1 rounded-full bg-gray-100 text-gray-700 hover:bg-gray-200"
                                    >
                                        {APPLIED_DATE_FILTERS.find((item) => item.value === appliedDateFilter)?.label} ✕
                                    </button>
                                )}
                                {postedDateFilter !== 'all' && (
                                    <button
                                        onClick={() => setPostedDateFilter('all')}
                                        className="px-3 py-1 rounded-full bg-gray-100 text-gray-700 hover:bg-gray-200"
                                    >
                                        {POSTED_DATE_FILTERS.find((item) => item.value === postedDateFilter)?.label} ✕
                                    </button>
                                )}
                                {salaryFilter !== 'all' && (
                                    <button
                                        onClick={() => setSalaryFilter('all')}
                                        className="px-3 py-1 rounded-full bg-gray-100 text-gray-700 hover:bg-gray-200"
                                    >
                                        {SALARY_FILTERS.find((item) => item.value === salaryFilter)?.label} ✕
                                    </button>
                                )}
                                <button
                                    onClick={() => {
                                        setSearchQuery('');
                                        setStatusFilter('all');
                                        setAppliedDateFilter('all');
                                        setPostedDateFilter('all');
                                        setSalaryFilter('all');
                                        setCompanyFilter('all');
                                    }}
                                    className="text-sm text-indigo-600 font-medium"
                                >
                                    Clear all
                                </button>
                            </div>
                        )}
                    </div>

                    {selectedIds.size > 1 && (
                        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 flex flex-wrap items-center gap-3 shadow-sm">
                            <div className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    checked={selectedIds.size === filteredApplications.length}
                                    onChange={toggleSelectAll}
                                    className="w-4 h-4 text-indigo-600"
                                />
                                <span className="text-sm font-medium text-gray-700">{selectedIds.size} selected</span>
                            </div>
                            <div className="flex flex-wrap items-center gap-2">
                                <button className="px-3 py-2 rounded-lg border border-gray-200 text-sm">Change Status</button>
                                <button className="px-3 py-2 rounded-lg border border-gray-200 text-sm">Add Tag</button>
                                <button className="px-3 py-2 rounded-lg border border-gray-200 text-sm">Export PDFs</button>
                                <button className="px-3 py-2 rounded-lg border border-gray-200 text-sm">Archive</button>
                                <button className="px-3 py-2 rounded-lg border border-gray-200 text-sm">Delete</button>
                            </div>
                        </div>
                    )}

                    {loading ? (
                        <div className="p-12 text-center">
                            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600 mx-auto"></div>
                        </div>
                    ) : error ? (
                        <div className="bg-red-50 text-red-600 p-4 rounded-lg text-center">
                            {error}
                        </div>
                    ) : applications.length === 0 ? (
                        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-12 text-center">
                            <div className="text-4xl mb-4">📄</div>
                            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">No applications yet</h2>
                            <p className="text-gray-500 mt-2">Start by applying to jobs or generating a resume.</p>
                            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                                <Link href="/jobs/search" className="px-5 py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium">
                                    Browse Jobs
                                </Link>
                                <Link href="/analyze" className="px-5 py-2 rounded-lg border border-gray-200 text-sm font-medium">
                                    Analyze Resume
                                </Link>
                            </div>
                        </div>
                    ) : filteredApplications.length === 0 ? (
                        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-12 text-center">
                            <div className="text-4xl mb-4">🔍</div>
                            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">No applications match your filters</h2>
                            <p className="text-gray-500 mt-2">Try adjusting your search or clearing filters.</p>
                            <button
                                onClick={() => {
                                    setSearchQuery('');
                                    setStatusFilter('all');
                                    setAppliedDateFilter('all');
                                    setPostedDateFilter('all');
                                    setSalaryFilter('all');
                                }}
                                className="mt-4 px-5 py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium"
                            >
                                Clear all filters
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-4" id="application-list">
                            <div className="flex items-center gap-3 text-xs text-gray-500">
                                <input
                                    type="checkbox"
                                    checked={selectedIds.size === filteredApplications.length}
                                    onChange={toggleSelectAll}
                                    className="w-4 h-4 text-indigo-600"
                                />
                                Company
                                <span className="ml-auto pr-32 hidden lg:inline">Status</span>
                            </div>

                            {filteredApplications.map((app) => {
                                const statusStyle = STATUS_CONFIG[app.status];
                                const atsTone = getAtsTone(app.atsScore);
                                const dueDays = app.dueDate ? Math.ceil((app.dueDate.getTime() - Date.now()) / dayMs) : null;
                                const dueLabel = dueDays == null
                                    ? '—'
                                    : dueDays <= 0
                                        ? 'Today'
                                        : dueDays === 1
                                            ? 'Tomorrow'
                                            : `${dueDays} days`;
                                const dueClass = dueDays == null
                                    ? 'text-gray-400'
                                    : dueDays <= 1
                                        ? 'text-red-600'
                                        : dueDays <= 3
                                            ? 'text-orange-600'
                                            : 'text-gray-500';
                                const urgentBorder = dueDays != null && dueDays <= 3 ? (dueDays <= 1 ? 'border-l-red-500' : 'border-l-orange-500') : statusStyle.border;
                                const isSelected = selectedIds.has(app.id);
                                const nextStatus = getNextStatus(app.status);

                                const actionPrimary = app.status === 'interview'
                                    ? 'Prepare'
                                    : app.status === 'offer'
                                        ? 'Review'
                                        : app.status === 'ghosted'
                                            ? 'Follow up'
                                            : 'View Job';
                                const isViewJob = actionPrimary === 'View Job';
                                const searchLink = `/jobs/search?keywords=${encodeURIComponent(`${app.title} ${app.company}`)}`;

                                return (
                                    <div
                                        key={app.id}
                                        className={`bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5 ${urgentBorder} border-l-4 ${app.status === 'ghosted' ? 'opacity-80' : ''} ${isSelected ? 'bg-indigo-50/60 border-indigo-200' : ''}`}
                                    >
                                        <div className="p-4 flex flex-col gap-4">
                                            <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                                                <div className="flex items-start gap-4 flex-1">
                                                    <input
                                                        type="checkbox"
                                                        checked={isSelected}
                                                        onChange={() => toggleSelected(app.id)}
                                                        className="mt-2 w-4 h-4 text-indigo-600"
                                                        aria-label={`Select ${app.company}`}
                                                    />
                                                    <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center text-gray-600 font-semibold">
                                                        {getInitials(app.company)}
                                                    </div>
                                                    <div className="flex-1">
                                                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                                                            <div>
                                                                <p className="text-base font-semibold text-gray-900 dark:text-white">{app.company}</p>
                                                                <p className="text-sm text-gray-500">{app.subtitle}</p>
                                                            </div>
                                                            <div className="flex items-center gap-2">
                                                                <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold uppercase ${statusStyle.badge}`} aria-label={`Status ${statusStyle.label}`}>
                                                                    {statusStyle.label}
                                                                </span>
                                                                <select
                                                                    value={app.status}
                                                                    onChange={(event) => handleStatusChange(app.id, event.target.value as ApplicationStatus)}
                                                                    className="text-xs px-2 py-1 rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900"
                                                                    aria-label="Change application status"
                                                                >
                                                                    {STATUS_OPTIONS.map((status) => (
                                                                        <option key={status} value={status}>
                                                                            {STATUS_CONFIG[status].label}
                                                                        </option>
                                                                    ))}
                                                                </select>
                                                            </div>
                                                        </div>
                                                        <div className="mt-3">
                                                            <p className="text-base font-semibold text-gray-900 dark:text-white">{app.title}</p>
                                                            <p className="text-sm text-gray-500">
                                                                {app.salary} • {app.location} • {app.remote}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="flex flex-wrap items-center gap-4 justify-between lg:justify-end">
                                                    <div className={`px-3 py-1 rounded-full text-xs font-semibold ${atsTone.pill}`}>
                                                        {app.atsScore ?? '--'}/100 • {atsTone.label}
                                                    </div>
                                                    <div className={`text-sm font-medium ${dueClass}`}>
                                                        {dueLabel}
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        {isViewJob ? (
                                                            app.jobUrl ? (
                                                                <a
                                                                    href={app.jobUrl}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    className="px-3 py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium"
                                                                >
                                                                    View Job
                                                                </a>
                                                            ) : (
                                                                <Link
                                                                    href={searchLink}
                                                                    className="px-3 py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium"
                                                                >
                                                                    View Job
                                                                </Link>
                                                            )
                                                        ) : (
                                                            <button
                                                                className="px-3 py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium"
                                                                onClick={() => {
                                                                    openDetails(app.id);
                                                                    showToast(`${actionPrimary} checklist opened`);
                                                                }}
                                                            >
                                                                {actionPrimary}
                                                            </button>
                                                        )}
                                                        <button
                                                            className="px-3 py-2 rounded-lg border border-gray-200 text-sm"
                                                            onClick={() => openDetails(app.id)}
                                                        >
                                                            {expandedId === app.id ? 'Hide' : 'Details'}
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="border-t border-gray-200 dark:border-gray-700 pt-4 text-xs text-gray-500 flex flex-wrap gap-3">
                                                <span>Applied: {formatDate(app.createdAt)}</span>
                                                <span>Last activity: {formatRelativeDays(app.lastActivityDays)}</span>
                                                <span>Recruiter: Unassigned</span>
                                            </div>

                                            <div className="flex flex-wrap gap-3 text-sm">
                                                {app.pdfUrl ? (
                                                    <a
                                                        href={app.pdfUrl}
                                                        download={app.fileName || undefined}
                                                        className="px-3 py-2 rounded-lg border border-gray-200"
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                    >
                                                        Download PDF
                                                    </a>
                                                ) : (
                                                    <span className="px-3 py-2 rounded-lg border border-gray-100 text-gray-400">PDF processing</span>
                                                )}
                                                <button
                                                    className="px-3 py-2 rounded-lg border border-gray-200"
                                                    onClick={() => openDetails(app.id)}
                                                >
                                                    Score Details
                                                </button>
                                                <button
                                                    className="px-3 py-2 rounded-lg border border-gray-200"
                                                    onClick={() => showToast(`Message queued for ${app.company}`)}
                                                >
                                                    Message Recruiter
                                                </button>
                                            </div>

                                            {expandedId === app.id && (
                                                <div className="mt-4 bg-gray-50 dark:bg-gray-900/40 border border-gray-200 dark:border-gray-700 rounded-xl p-4">
                                                    {getPipelineIndex(app.status) >= 0 ? (
                                                        <div>
                                                            <p className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Application Progress</p>
                                                            <div className="flex items-center gap-2">
                                                                {PIPELINE_STEPS.map((step, idx) => {
                                                                    const currentIndex = getPipelineIndex(app.status);
                                                                    const isCompleted = idx < currentIndex;
                                                                    const isCurrent = idx === currentIndex;
                                                                    return (
                                                                        <div key={step} className="flex items-center gap-2">
                                                                            <div className={`w-3 h-3 rounded-full ${isCompleted || isCurrent ? 'bg-indigo-600' : 'bg-gray-300'}`} />
                                                                            {idx < PIPELINE_STEPS.length - 1 && (
                                                                                <div className={`w-8 h-0.5 ${isCompleted ? 'bg-indigo-600' : 'bg-gray-300'}`} />
                                                                            )}
                                                                        </div>
                                                                    );
                                                                })}
                                                            </div>
                                                            <div className="flex justify-between text-xs text-gray-500 mt-3">
                                                                {PIPELINE_STEPS.map((step) => (
                                                                    <span key={step}>{step}</span>
                                                                ))}
                                                            </div>
                                                            <div className="mt-4 text-xs text-gray-500">
                                                                Next step: {app.status === 'interview' ? 'Technical interview scheduled' : 'Awaiting recruiter update'}
                                                            </div>
                                                            {nextStatus && (
                                                                <div className="mt-4 flex flex-wrap items-center gap-3">
                                                                    <button
                                                                        className="px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium"
                                                                        onClick={() => handleStatusChange(app.id, nextStatus)}
                                                                    >
                                                                        Move to {STATUS_CONFIG[nextStatus].label}
                                                                    </button>
                                                                    <span className="text-xs text-gray-500">
                                                                        One-click progression through your pipeline.
                                                                    </span>
                                                                </div>
                                                            )}
                                                        </div>
                                                    ) : (
                                                        <div className="text-sm text-gray-500">Status: {STATUS_CONFIG[app.status].label}</div>
                                                    )}

                                                    <div className="mt-6 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4">
                                                        <div className="flex items-center justify-between">
                                                            <p className="text-sm font-semibold text-gray-900 dark:text-white">ATS Score: {app.atsScore ?? '--'}/100 — {atsTone.label}</p>
                                                            <span className={`text-xs font-medium ${atsTone.text}`}>{atsTone.label}</span>
                                                        </div>
                                                        <div className="mt-3 h-2 rounded-full bg-gray-200">
                                                            <div className={`h-2 rounded-full ${atsTone.bar}`} style={{ width: `${app.atsScore ?? 0}%` }} />
                                                        </div>
                                                        <div className="mt-4 text-sm text-gray-600 dark:text-gray-300 space-y-2">
                                                            <p>✅ Keywords matched: Python, Finance, Analytics</p>
                                                            <p>⚠️ Missing: Leadership, Kubernetes, 5+ years experience</p>
                                                            <p>❌ Issues: Add quantified achievements, reduce passive voice</p>
                                                        </div>
                                                        <div className="mt-4 flex flex-wrap gap-3">
                                                            <button className="px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm">Improve Resume</button>
                                                            <button className="px-4 py-2 rounded-lg border border-gray-200 text-sm">See Full Report</button>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </main>

            {toastMessage && (
                <div className="fixed bottom-6 right-6 bg-gray-900 text-white text-sm px-4 py-3 rounded-xl shadow-lg">
                    {toastMessage}
                </div>
            )}
        </div>
    );
}
