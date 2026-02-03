const cron = require('node-cron');
const { scrapeLinkedInJobs, saveJobsToSupabase: saveLinkedInJobs, CONFIG: linkedInConfig } = require('./scraper');
const { scrapeGlassdoorJobs, saveJobsToSupabase: saveGlassdoorJobs, CONFIG: glassdoorConfig } = require('./glassdoor');

const isRunNow = process.argv.includes('--run-now');

/**
 * Run LinkedIn scraper
 */
async function runLinkedInScraper() {
    console.log('\n🔵 Starting LinkedIn scraper...');
    console.log(`⏰ Time: ${new Date().toISOString()}`);

    try {
        const jobs = await scrapeLinkedInJobs({
            keywords: process.env.SCRAPE_KEYWORDS || linkedInConfig.keywords,
            location: process.env.SCRAPE_LOCATION || linkedInConfig.location,
            maxJobs: parseInt(process.env.SCRAPE_MAX_JOBS) || linkedInConfig.maxJobs,
        });

        await saveLinkedInJobs(jobs);
        console.log('✅ LinkedIn scraping complete!');
    } catch (error) {
        console.error('❌ LinkedIn scraper failed:', error);
    }
}

/**
 * Run Glassdoor scraper
 */
async function runGlassdoorScraper() {
    console.log('\n🟢 Starting Glassdoor scraper...');
    console.log(`⏰ Time: ${new Date().toISOString()}`);

    try {
        const jobs = await scrapeGlassdoorJobs({
            keywords: process.env.SCRAPE_KEYWORDS || glassdoorConfig.keywords,
            location: process.env.SCRAPE_LOCATION || glassdoorConfig.location,
            maxJobs: parseInt(process.env.SCRAPE_MAX_JOBS) || glassdoorConfig.maxJobs,
        });

        await saveGlassdoorJobs(jobs);
        console.log('✅ Glassdoor scraping complete!');
    } catch (error) {
        console.error('❌ Glassdoor scraper failed:', error);
    }
}

/**
 * Run all scrapers
 */
async function runAllScrapers() {
    console.log('\n🚀 Running all job scrapers...');
    console.log('================================\n');

    await runLinkedInScraper();
    await runGlassdoorScraper();

    console.log('\n================================');
    console.log('✅ All scrapers complete!\n');
}

// Run immediately if --run-now flag is passed
if (isRunNow) {
    console.log('🔧 Running scrapers immediately (--run-now flag detected)');
    runAllScrapers().then(() => {
        console.log('Done!');
        process.exit(0);
    });
} else {
    // Schedule to run every 6 hours
    console.log('📅 Scheduling scrapers to run every 6 hours...');
    console.log('   Sources: LinkedIn, Glassdoor');
    console.log('   (Use "npm run scrape" to run immediately)\n');

    cron.schedule('0 */6 * * *', () => {
        runAllScrapers();
    });

    // Keep process alive
    console.log('⏳ Scrapers waiting for scheduled runs...');
}
