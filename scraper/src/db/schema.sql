-- Enable UUID extension if not enabled
create extension if not exists "uuid-ossp";

-- Employers Table
create table if not exists employers (
    id uuid primary key default uuid_generate_v4(),
    name text unique not null,
    careers_url text,
    source text not null, -- 'uk300', 'times_top_100', etc.
    created_at timestamp with time zone default now(),
    updated_at timestamp with time zone default now()
);

-- Jobs Table (Updated/New Schema)
-- We check if 'jobs' exists. If so, we might need to alter it.
-- This script assumes strict adherence to the requested schema.

create table if not exists jobs (
    id text primary key, -- Stable hash of employer+title+url
    employer_id uuid references employers(id),
    employer_name text, -- Denormalized
    title text not null,
    location text,
    job_url text not null,
    source_careers_url text,
    employment_type text, -- 'Graduate Scheme', 'Entry Level'
    posted_at timestamp with time zone,
    closing_date timestamp with time zone,
    first_seen_at timestamp with time zone default now(),
    last_seen_at timestamp with time zone default now(),
    raw_text_snippet text,
    description text, -- Keeping consistent with existing app
    source text, -- 'LinkedIn', 'Glassdoor', or newly 'EmployerSite'
    
    -- Constraint to ensure uniqueness logic if not using ID as hash (but we are)
    constraint jobs_url_unique unique (job_url)
);

-- Index for searching jobs by employer
create index if not exists idx_jobs_employer_id on jobs(employer_id);

-- Index for date filtering
create index if not exists idx_jobs_posted_at on jobs(posted_at);
