const cron = require('node-cron');
const { scrapeLinkedInJobs, saveJobsToSupabase, CONFIG } = require('./scraper');

const isRunNow = process.argv.includes('--run-now');

/**
 * Main scraping function
 */
async function runScraper() {
    console.log('\n🚀 Starting LinkedIn job scraper...');
    console.log(`⏰ Time: ${new Date().toISOString()}`);

    try {
        const jobs = await scrapeLinkedInJobs({
            keywords: process.env.SCRAPE_KEYWORDS || CONFIG.keywords,
            location: process.env.SCRAPE_LOCATION || CONFIG.location,
            maxJobs: parseInt(process.env.SCRAPE_MAX_JOBS) || CONFIG.maxJobs,
        });

        await saveJobsToSupabase(jobs);

        console.log('✅ Scraping complete!\n');
    } catch (error) {
        console.error('❌ Scraper failed:', error);
    }
}

// Run immediately if --run-now flag is passed
if (isRunNow) {
    console.log('🔧 Running scraper immediately (--run-now flag detected)');
    runScraper().then(() => {
        console.log('Done!');
        process.exit(0);
    });
} else {
    // Schedule to run every 6 hours
    console.log('📅 Scheduling scraper to run every 6 hours...');
    console.log('   (Use "npm run scrape" or pass --run-now to run immediately)\n');

    cron.schedule('0 */6 * * *', () => {
        runScraper();
    });

    // Keep process alive
    console.log('⏳ Scraper is waiting for scheduled runs...');
}
