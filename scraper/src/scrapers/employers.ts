import puppeteer, { Page } from 'puppeteer';
import { upsertEmployer } from '../db/operations';

const TARGET_JOBS_URL = 'https://targetjobs.co.uk/careers-advice/uk300';
const CIBYL_URL = 'https://cibyl.com/rankings/uk-300';

async function scrapeTargetJobs(page: Page): Promise<string[]> {
    console.log(`Navigating to ${TARGET_JOBS_URL}...`);
    await page.goto(TARGET_JOBS_URL, { waitUntil: 'networkidle2', timeout: 60000 });

    // Heuristics for finding the list
    // Usually these are in a table or list
    const employers = await page.evaluate(() => {
        const names: string[] = [];
        // Try to find table rows with rankings
        const rows = document.querySelectorAll('tr, .ranking-row, li');
        rows.forEach(row => {
            const text = row.textContent?.trim() || '';
            // Very naive filter: assume company names are short-ish and don't contain "Rank"
            if (text.length > 2 && text.length < 50 && !text.includes('Rank') && !text.includes('Employer')) {
                // Try to pick the second column if it's a table row (Rank, Name)
                const cells = row.querySelectorAll('td');
                if (cells.length >= 2) {
                    names.push(cells[1].textContent?.trim() || '');
                } else {
                    // Just push the text if it looks like a name
                    // This is risky, so let's stick to cells if found, or specific classes
                }
            }
        });

        // Specific selector backup (if known)
        document.querySelectorAll('h3, h4').forEach(h => {
            // Sometimes rankings are H3s
            const t = h.textContent?.trim();
            if (t && !t.includes('The UK 300')) names.push(t);
        });

        return names.filter(n => n.length > 1);
    });
    return [...new Set(employers)];
}

export async function fetchEmployers() {
    console.log('Fetching employers...');
    const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
    const page = await browser.newPage();

    let names: string[] = [];

    try {
        names = await scrapeTargetJobs(page);
        if (names.length < 10) {
            console.log('TargetJobs yield low, trying fallback...');
            // Logic to try CIBYL or other source could go here
        }
    } catch (e: any) {
        console.error('Error scraping employers:', e.message);
    } finally {
        await browser.close();
    }

    console.log(`Found ${names.length} potential employers.`);

    // Save to DB
    for (const name of names) {
        // Clean name
        const cleanName = name.replace(/^\d+\.?\s*/, '').trim(); // Remove "1. Google"
        if (cleanName) {
            await upsertEmployer({
                name: cleanName,
                source: 'uk300'
            });
        }
    }
    console.log('Employer fetch complete.');
}
