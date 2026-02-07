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
 * Parse relative date strings like "2 days ago", "1 week ago", "New" into ISO timestamps
 */
function parseRelativeDate(dateString) {
    if (!dateString) return new Date().toISOString();

    const now = new Date();
    const lowerStr = dateString.toLowerCase().trim();

    // Handle "New", "Just now", "Today"
    if (lowerStr === 'new' || lowerStr === 'just now' || lowerStr === 'today') {
        return now.toISOString();
    }

    // Handle "Yesterday"
    if (lowerStr === 'yesterday') {
        now.setDate(now.getDate() - 1);
        return now.toISOString();
    }

    // Handle "Xd" format (Glassdoor often uses this)
    const shortDaysMatch = lowerStr.match(/^(\d+)d$/);
    if (shortDaysMatch) {
        now.setDate(now.getDate() - parseInt(shortDaysMatch[1], 10));
        return now.toISOString();
    }

    // Handle "X days ago", "X day ago"
    const daysMatch = lowerStr.match(/(\d+)\s*days?\s*ago/);
    if (daysMatch) {
        now.setDate(now.getDate() - parseInt(daysMatch[1], 10));
        return now.toISOString();
    }

    // Handle "X weeks ago", "X week ago"
    const weeksMatch = lowerStr.match(/(\d+)\s*weeks?\s*ago/);
    if (weeksMatch) {
        now.setDate(now.getDate() - parseInt(weeksMatch[1], 10) * 7);
        return now.toISOString();
    }

    // Handle "X months ago", "X month ago"
    const monthsMatch = lowerStr.match(/(\d+)\s*months?\s*ago/);
    if (monthsMatch) {
        now.setMonth(now.getMonth() - parseInt(monthsMatch[1], 10));
        return now.toISOString();
    }

    // Handle "X hours ago", "X hour ago", "Xh"
    const hoursMatch = lowerStr.match(/(\d+)\s*h(?:ours?)?\s*(?:ago)?/);
    if (hoursMatch) {
        now.setHours(now.getHours() - parseInt(hoursMatch[1], 10));
        return now.toISOString();
    }

    // Default to now if we can't parse
    return now.toISOString();
}

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
                const logoEl = card.querySelector('[data-test="employer-logo"] img, .JobCard_logo__2mS8Z img, img[alt*="Logo"]');
                let logo = '';
                if (logoEl) {
                    const direct =
                        logoEl.getAttribute('src') ||
                        logoEl.getAttribute('data-src') ||
                        logoEl.getAttribute('data-original') ||
                        logoEl.getAttribute('data-delayed-url') ||
                        logoEl.getAttribute('data-lazy') ||
                        '';
                    const srcset =
                        logoEl.getAttribute('srcset') ||
                        logoEl.getAttribute('data-srcset') ||
                        '';
                    logo = direct;
                    if (!logo && srcset) {
                        const first = srcset.split(',')[0]?.trim().split(' ')[0];
                        if (first) logo = first;
                    }
                    if (logo) {
                        try {
                            logo = new URL(logo, window.location.origin).href;
                        } catch (e) {
                            // keep original if URL parsing fails
                        }
                    }
                }

                // Date selectors - Glassdoor shows "2d", "1w", "3 days ago", etc.
                const dateEl = card.querySelector('[data-test="job-age"], .JobCard_listingAge__KuaxZ, .job-age, [class*="listingAge"]');

                if (titleEl) {
                    results.push({
                        title: titleEl.textContent?.trim() || '',
                        company: companyEl?.textContent?.trim() || '',
                        location: locationEl?.textContent?.trim() || '',
                        url: linkEl?.href || '',
                        logo,
                        postedDateRaw: dateEl?.textContent?.trim() || '',
                    });
                }
            });

            return results;
        }, maxJobs);

        console.log(`📋 [Glassdoor] Found ${jobData.length} job cards`);

        // Add source, parse dates, and fetch descriptions
        for (let i = 0; i < jobData.length; i++) {
            const job = jobData[i];
            job.source = 'Glassdoor';
            job.created_at = parseRelativeDate(job.postedDateRaw);
            delete job.postedDateRaw; // Clean up temp field

            if (job.url) {
                try {
                    console.log(`  [${i + 1}/${jobData.length}] Fetching: ${job.title}`);
                    await page.goto(job.url, { waitUntil: 'domcontentloaded', timeout: 25000 });

                    // Wait for page to stabilize
                    await new Promise(r => setTimeout(r, 2000));

                    // Try to click "Show More" button if it exists
                    await page.evaluate(() => {
                        const showMoreBtn = document.querySelector('button[data-test="showMore"], .css-t3xrds, [class*="ShowMore"]');
                        if (showMoreBtn) showMoreBtn.click();
                    });

                    await new Promise(r => setTimeout(r, 1000));

                    // Extract description with multiple selector attempts
                    const description = await page.evaluate(() => {
                        // Try multiple selectors in order of likelihood
                        const selectors = [
                            '.JobDetails_jobDescription__6RMtx',
                            '[data-test="jobDescriptionContent"]',
                            '.jobDescriptionContent',
                            '.description',
                            '.desc',
                            '[class*="jobDescription"]',
                            '[class*="JobDescription"]',
                            '.css-1glx05o', // Common Glassdoor class
                            'div[data-brandviews="MODULE:n=jobDetails:oc=joDescription"]',
                            '#JobDescriptionContainer',
                            'section[data-test="jobDescription"]',
                        ];

                        for (const selector of selectors) {
                            const el = document.querySelector(selector);
                            if (el && el.textContent?.trim().length > 50) {
                                return el.textContent.trim();
                            }
                        }

                        // Fallback: find the longest text block on the page
                        const allDivs = document.querySelectorAll('div, section, article');
                        let longest = '';
                        allDivs.forEach(div => {
                            const text = div.textContent?.trim() || '';
                            if (text.length > longest.length && text.length > 200 && text.length < 10000) {
                                longest = text;
                            }
                        });
                        return longest;
                    });

                    job.description = description;
                    console.log(`    ✓ Description: ${description.length} chars`);
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
