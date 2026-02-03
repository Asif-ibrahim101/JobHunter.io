const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const supabase = require('./db');

// Use stealth plugin to avoid detection
puppeteer.use(StealthPlugin());

// Configuration
const CONFIG = {
    keywords: 'software engineer',
    location: 'United Kingdom',
    maxJobs: 25,
    delayBetweenPages: 2500,
};

/**
 * Scrape Glassdoor job listings (public, no login required)
 */
async function scrapeGlassdoorJobs(options = {}) {
    const keywords = options.keywords || CONFIG.keywords;
    const location = options.location || CONFIG.location;
    const maxJobs = options.maxJobs || CONFIG.maxJobs;

    console.log(`🔍 [Glassdoor] Searching for "${keywords}" jobs in "${location}"...`);

    const browser = await puppeteer.launch({
        headless: true,
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--disable-gpu',
            '--window-size=1920x1080',
        ],
    });

    const page = await browser.newPage();

    await page.setUserAgent(
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    );

    const jobs = [];

    try {
        // Glassdoor public job search URL
        const searchUrl = `https://www.glassdoor.co.uk/Job/jobs.htm?sc.keyword=${encodeURIComponent(keywords)}&locT=N&locId=194&locKeyword=${encodeURIComponent(location)}`;

        console.log(`📄 [Glassdoor] Navigating to search page...`);
        await page.goto(searchUrl, { waitUntil: 'networkidle2', timeout: 30000 });

        // Wait for job cards to load
        await page.waitForSelector('[data-test="jobListing"], .JobCard_jobCardContainer__arQlW, .react-job-listing', { timeout: 10000 }).catch(() => {
            console.log('⚠️ [Glassdoor] Job list selector not found, trying alternative...');
        });

        // Scroll to load more jobs
        for (let i = 0; i < 3; i++) {
            await page.evaluate(() => window.scrollBy(0, 800));
            await new Promise(r => setTimeout(r, 1000));
        }

        // Extract job data
        const jobData = await page.evaluate((max) => {
            const cards = document.querySelectorAll('[data-test="jobListing"], .JobCard_jobCardContainer__arQlW, .react-job-listing, [data-id]');
            const results = [];

            cards.forEach((card, i) => {
                if (i >= max) return;

                const titleEl = card.querySelector('[data-test="job-link"], .JobCard_jobTitle__GLyJ1, a[data-test="job-title"]');
                const companyEl = card.querySelector('[data-test="employer-short-name"], .EmployerProfile_employerName__mSLUq, .job-search-key-l2wjgv');
                const locationEl = card.querySelector('[data-test="emp-location"], .JobCard_location__Ds1fM, .location');
                const linkEl = card.querySelector('a[href*="/job-listing/"], a[data-test="job-link"]');

                if (titleEl) {
                    results.push({
                        title: titleEl.textContent?.trim() || '',
                        company: companyEl?.textContent?.trim() || '',
                        location: locationEl?.textContent?.trim() || '',
                        url: linkEl?.href || '',
                    });
                }
            });

            return results;
        }, maxJobs);

        console.log(`📋 [Glassdoor] Found ${jobData.length} job cards`);

        // Add source and fetch descriptions
        for (let i = 0; i < jobData.length; i++) {
            const job = jobData[i];
            job.source = 'Glassdoor';

            if (job.url) {
                try {
                    console.log(`  [${i + 1}/${jobData.length}] Fetching: ${job.title}`);
                    await page.goto(job.url, { waitUntil: 'networkidle2', timeout: 20000 });

                    await page.waitForSelector('[data-test="jobDescriptionContent"], .JobDetails_jobDescription__6RMtx', { timeout: 5000 }).catch(() => { });

                    const description = await page.evaluate(() => {
                        const descEl = document.querySelector('[data-test="jobDescriptionContent"], .JobDetails_jobDescription__6RMtx, .desc');
                        return descEl?.textContent?.trim() || '';
                    });

                    job.description = description;
                    await new Promise(r => setTimeout(r, CONFIG.delayBetweenPages));

                } catch (err) {
                    console.log(`  ⚠️ Could not fetch description: ${err.message}`);
                    job.description = '';
                }
            }

            jobs.push(job);
        }

        console.log(`✅ [Glassdoor] Extracted ${jobs.length} job listings`);

    } catch (error) {
        console.error('❌ [Glassdoor] Scraping error:', error.message);
    } finally {
        await browser.close();
    }

    return jobs;
}

/**
 * Save jobs to Supabase (avoiding duplicates by URL)
 */
async function saveJobsToSupabase(jobs) {
    if (jobs.length === 0) {
        console.log('[Glassdoor] No jobs to save');
        return { saved: 0, skipped: 0 };
    }

    let saved = 0;
    let skipped = 0;

    for (const job of jobs) {
        try {
            const { data: existing } = await supabase
                .from('jobs')
                .select('id')
                .eq('url', job.url)
                .limit(1);

            if (existing && existing.length > 0) {
                skipped++;
                continue;
            }

            const { error } = await supabase.from('jobs').insert([job]);

            if (error) {
                console.error('[Glassdoor] Insert error:', error.message);
                skipped++;
            } else {
                saved++;
            }
        } catch (err) {
            console.error('[Glassdoor] Save error:', err.message);
            skipped++;
        }
    }

    console.log(`💾 [Glassdoor] Saved: ${saved}, Skipped: ${skipped}`);
    return { saved, skipped };
}

module.exports = { scrapeGlassdoorJobs, saveJobsToSupabase, CONFIG };
