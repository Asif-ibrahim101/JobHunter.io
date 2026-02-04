const axios = require('axios');
const supabase = require('./db');

// Configuration
const CONFIG = {
    keywords: 'software engineer',
    location: 'UK',
    maxJobs: 50,
};

/**
 * Fetch jobs from Reed API
 */
async function scrapeReedJobs(options = {}) {
    const keywords = options.keywords || CONFIG.keywords;
    const location = options.location || CONFIG.location;
    const maxJobs = options.maxJobs || CONFIG.maxJobs;

    const apiKey = process.env.REED_API_KEY;

    if (!apiKey) {
        console.error('❌ [Reed] REED_API_KEY is missing');
        console.error('   Set it in .env.local or as a GitHub Actions secret');
        return [];
    }

    console.log(`🔍 [Reed] Searching for "${keywords}" jobs in "${location}"...`);

    const jobs = [];

    try {
        const response = await axios.get('https://www.reed.co.uk/api/1.0/search', {
            params: {
                keywords: keywords,
                locationName: location,
                resultsToTake: maxJobs,
            },
            auth: {
                username: apiKey,
                password: '',
            },
        });

        console.log(`📋 [Reed] Found ${response.data.results?.length || 0} jobs from API`);

        // Transform Reed API response to match our job schema
        for (const job of response.data.results || []) {
            jobs.push({
                title: job.jobTitle || '',
                company: job.employerName || '',
                location: job.locationName || '',
                description: job.jobDescription || '',
                url: job.jobUrl || '',
                source: 'Reed.co.uk',
            });
        }

        console.log(`✅ [Reed] Extracted ${jobs.length} job listings`);

    } catch (error) {
        console.error('❌ [Reed] API error:', error.message);
        if (error.response) {
            console.error('   Status:', error.response.status);
            console.error('   Data:', error.response.data);
        }
    }

    return jobs;
}

/**
 * Save jobs to Supabase (avoiding duplicates by URL)
 */
async function saveJobsToSupabase(jobs) {
    if (jobs.length === 0) {
        console.log('[Reed] No jobs to save');
        return { saved: 0, skipped: 0 };
    }

    let saved = 0;
    let skipped = 0;

    for (const job of jobs) {
        try {
            // Check if job URL already exists
            const { data: existing } = await supabase
                .from('jobs')
                .select('id')
                .eq('url', job.url)
                .limit(1);

            if (existing && existing.length > 0) {
                skipped++;
                continue;
            }

            // Insert new job
            const { error } = await supabase.from('jobs').insert([job]);

            if (error) {
                console.error('[Reed] Insert error:', error.message);
                skipped++;
            } else {
                saved++;
            }
        } catch (err) {
            console.error('[Reed] Save error:', err.message);
            skipped++;
        }
    }

    console.log(`💾 [Reed] Saved: ${saved}, Skipped (duplicates/errors): ${skipped}`);
    return { saved, skipped };
}

module.exports = { scrapeReedJobs, saveJobsToSupabase, CONFIG };
