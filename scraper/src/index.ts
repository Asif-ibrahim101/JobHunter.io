import { Command } from 'commander';
import { fetchEmployers } from './scrapers/employers';
import { discoverCareersUrls } from './discover/careersUrl';
import { scrapeJobs } from './scrapers/jobs';
import { exportJobs } from './export/excel';
import { supabase } from './db/client';
import fs from 'fs';
import path from 'path';

const program = new Command();

program
    .name('graduate-harvester')
    .description('CLI to harvest graduate jobs from top UK employers')
    .version('1.0.0');

program
    .command('init-db')
    .description('Initialize database schema')
    .action(async () => {
        console.log('To initialize the database, please run the SQL in src/db/schema.sql in your Supabase SQL Editor.');
        const schemaPath = path.join(__dirname, 'db/schema.sql');
        console.log(`Schema file location: ${schemaPath}`);
        // Optionally read and print it
        try {
            const sql = fs.readFileSync(schemaPath, 'utf8');
            console.log('\n--- SQL SCHEMA ---\n');
            console.log(sql);
            console.log('\n------------------\n');
        } catch (e) {
            console.error('Could not read schema file.');
        }
    });

program
    .command('fetch-employers')
    .description('Scrape employers list from UK300/Cibyl')
    .action(async () => {
        await fetchEmployers();
    });

program
    .command('discover-urls')
    .description('Discover careers URLs for employers')
    .action(async () => {
        await discoverCareersUrls();
    });

program
    .command('scrape-jobs')
    .description('Harvest jobs from employers with careers URLs')
    .action(async () => {
        await scrapeJobs();
    });

program
    .command('export')
    .description('Export jobs to Excel/CSV')
    .action(async () => {
        await exportJobs();
    });

program
    .command('run-all')
    .description('Run the full pipeline')
    .action(async () => {
        console.log('Running full pipeline...');
        await fetchEmployers();
        await discoverCareersUrls();
        await scrapeJobs();
        await exportJobs();
        console.log('Pipeline complete.');
    });

program.parse();
