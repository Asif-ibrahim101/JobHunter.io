const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const supabase = require('./db');

// Use stealth plugin to avoid detection
puppeteer.use(StealthPlugin());

// Configuration
const CONFIG = {
    keywords: 'software engineer', // Default search keywords
    location: 'United Kingdom',
    maxJobs: 25, // Max jobs to scrape per run
    delayBetweenPages: 2000, // ms delay to avoid rate limiting
};

/**
 * Scrape LinkedIn job listings (public, no login required)
 */
async function scrapeLinkedInJobs(options = {}) {
    const keywords = options.keywords || CONFIG.keywords;
    const location = options.location || CONFIG.location;
    const maxJobs = options.maxJobs || CONFIG.maxJobs;

    console.log(`🔍 Searching for "${keywords}" jobs in "${location}"...`);

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

    // Set a realistic user agent
    await page.setUserAgent(
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    );

    const jobs = [];

    try {
        // LinkedIn public job search URL
        const searchUrl = `https://www.linkedin.com/jobs/search/?keywords=${encodeURIComponent(keywords)}&location=${encodeURIComponent(location)}`;

        console.log(`📄 Navigating to: ${searchUrl}`);
        await page.goto(searchUrl, { waitUntil: 'networkidle2', timeout: 30000 });

        // Wait for job cards to load
        await page.waitForSelector('.jobs-search__results-list', { timeout: 10000 }).catch(() => {
            console.log('⚠️ Job list selector not found, trying alternative...');
        });

        // Scroll to load more jobs
        for (let i = 0; i < 3; i++) {
            await page.evaluate(() => window.scrollBy(0, 1000));
            await new Promise(r => setTimeout(r, 1000));
        }

        // Extract job data
        const jobCards = await page.$$('li.jobs-search__results-list > li, .job-search-card');

        console.log(`📋 Found ${jobCards.length} job cards`);

        for (let i = 0; i < Math.min(jobCards.length, maxJobs); i++) {
            try {
                const jobData = await page.evaluate((index) => {
                    const cards = document.querySelectorAll('.job-search-card, .base-card');
                    const card = cards[index];
                    if (!card) return null;

                    const titleEl = card.querySelector('.base-search-card__title, h3');
                    const companyEl = card.querySelector('.base-search-card__subtitle, h4');
                    const locationEl = card.querySelector('.job-search-card__location, .job-card-container__metadata-item');
                    const linkEl = card.querySelector('a.base-card__full-link, a');
                    const logoEl = card.querySelector('img.artdeco-entity-image, .job-search-card__logo-image, img.job-card-list__entity-image');

                    return {
                        title: titleEl?.textContent?.trim() || '',
                        company: companyEl?.textContent?.trim() || '',
                        location: locationEl?.textContent?.trim() || '',
                        url: linkEl?.href || '',
                        logo: logoEl?.getAttribute('src') || logoEl?.getAttribute('data-delayed-url') || '',
                    };
                }, i);

                if (jobData && jobData.title && jobData.url) {
                    jobData.source = 'LinkedIn Scraper';
                    jobs.push(jobData);
                }
            } catch (err) {
                console.log(`⚠️ Error extracting job ${i}:`, err.message);
            }
        }

        console.log(`✅ Extracted ${jobs.length} job listings`);

        // Fetch descriptions for each job by visiting the job detail page
        console.log('📝 Fetching job descriptions...');
        for (let i = 0; i < jobs.length; i++) {
            const job = jobs[i];
            try {
                console.log(`  [${i + 1}/${jobs.length}] Fetching description for: ${job.title}`);

                await page.goto(job.url, { waitUntil: 'domcontentloaded', timeout: 25000 });

                // Wait for page to stabilize
                await new Promise(r => setTimeout(r, 2000));

                // Wait for description to load
                await page.waitForSelector('.description__text, .show-more-less-html__markup, .jobs-description', { timeout: 8000 }).catch(() => { });

                // Try to click "Show more" button if it exists
                await page.evaluate(() => {
                    const showMoreBtn = document.querySelector('.show-more-less-html__button, button[aria-label*="Show more"]');
                    if (showMoreBtn) showMoreBtn.click();
                });

                await new Promise(r => setTimeout(r, 1000));

                // Extract description with multiple selector attempts
                const description = await page.evaluate(() => {
                    const selectors = [
                        '.description__text .show-more-less-html__markup',
                        '.show-more-less-html__markup',
                        '.description__text',
                        '.jobs-description__content',
                        '.jobs-description',
                        '[class*="description"]',
                        '.job-view-layout',
                    ];

                    for (const selector of selectors) {
                        const el = document.querySelector(selector);
                        if (el && el.textContent?.trim().length > 100) {
                            return el.textContent.trim();
                        }
                    }
                    return '';
                });

                job.description = description;
                console.log(`    ✓ Description: ${description.length} chars`);

                // Add a small delay to avoid rate limiting
                await new Promise(r => setTimeout(r, CONFIG.delayBetweenPages));

            } catch (err) {
                console.log(`  ⚠️ Could not fetch description for ${job.title}: ${err.message}`);
                job.description = '';
            }
        }

        console.log(`✅ Completed fetching descriptions`);

    } catch (error) {
        console.error('❌ Scraping error:', error.message);
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
        console.log('No jobs to save');
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
                console.error('Insert error:', error.message);
                skipped++;
            } else {
                saved++;
            }
        } catch (err) {
            console.error('Save error:', err.message);
            skipped++;
        }
    }

    console.log(`💾 Saved: ${saved}, Skipped (duplicates/errors): ${skipped}`);
    return { saved, skipped };
}

module.exports = { scrapeLinkedInJobs, saveJobsToSupabase, CONFIG };
