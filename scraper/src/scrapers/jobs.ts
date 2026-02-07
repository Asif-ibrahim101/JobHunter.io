import puppeteer, { Page } from 'puppeteer';
import { upsertJob, getEmployersWithCareersUrl, Job } from '../db/operations';
import crypto from 'crypto';

// Universal selectors configuration
const JOB_SELECTORS = {
    container: ['[data-test="job-card"]', '.job-card', 'li.job', '.posting', 'div[class*="job"]'],
    title: ['h2', 'h3', '.job-title', '[data-field="title"]'],
    location: ['.location', '[data-field="location"]', 'span[class*="loc"]'],
    link: ['a', 'a[href*="job"]', 'a[href*="career"]']
};

const GRADUATE_KEYWORDS = ['graduate', 'grad scheme', 'early career', 'analyst', 'intern', 'placement'];

function hashId(str: string) {
    return crypto.createHash('md5').update(str).digest('hex');
}

async function scrapeEmployerJobs(page: Page, employer: any) {
    if (!employer.careers_url) return;

    console.log(`Scraping ${employer.name} at ${employer.careers_url}...`);
    try {
        await page.goto(employer.careers_url, { waitUntil: 'networkidle2', timeout: 30000 });

        // Wait for potential job cards
        // Try broad selector
        try {
            await page.waitForSelector('a[href]', { timeout: 5000 });
        } catch { }

        // Extract jobs
        const jobsRaw = await page.evaluate((keywords) => {
            const results: any[] = [];
            // Heuristic: Find all anchor tags that might be jobs
            const links = Array.from(document.querySelectorAll('a'));
            links.forEach(a => {
                const text = a.innerText.trim();
                const href = a.href;
                if (text.length > 5 && text.length < 100 && href) {
                    // Check if text matches graduate keywords
                    const lower = text.toLowerCase();
                    const matches = keywords.some((k: string) => lower.includes(k));
                    if (matches) {
                        results.push({
                            title: text,
                            job_url: href,
                            location: 'Unknown', // Hard to get reliably without specific selectors
                            raw_text: text
                        });
                    }
                }
            });
            return results;
        }, GRADUATE_KEYWORDS);

        console.log(`Found ${jobsRaw.length} potential jobs for ${employer.name}.`);

        for (const j of jobsRaw) {
            const id = hashId(`${employer.name}-${j.title}-${j.job_url}`);
            const job: Job = {
                id,
                employer_id: employer.id,
                employer_name: employer.name,
                title: j.title,
                location: j.location,
                job_url: j.job_url,
                source_careers_url: employer.careers_url,
                employment_type: 'Graduate',
                raw_text_snippet: j.raw_text,
                source: 'EmployerSite'
            };
            await upsertJob(job);
        }

    } catch (e: any) {
        console.error(`Failed to scrape ${employer.name}:`, e.message);
    }
}

export async function scrapeJobs() {
    console.log('Starting job harvest...');
    const employers = await getEmployersWithCareersUrl();
    console.log(`Harvesting from ${employers.length} employers.`);

    const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
    const page = await browser.newPage();

    for (const employer of employers) {
        await scrapeEmployerJobs(page, employer);
    }

    await browser.close();
    console.log('Harvest complete.');
}
