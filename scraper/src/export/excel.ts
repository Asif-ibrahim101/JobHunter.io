import * as XLSX from 'xlsx';
import { createObjectCsvWriter } from 'csv-writer';
import { getAllJobs } from '../db/operations';
import path from 'path';
import fs from 'fs';

const EXPORT_DIR = path.join(__dirname, '../../export');

export async function exportJobs() {
    console.log('Starting export...');
    const jobs = await getAllJobs();
    console.log(`Fetched ${jobs.length} jobs from database.`);

    if (jobs.length === 0) {
        console.log('No jobs to export.');
        return;
    }

    // Ensure export dir exists
    if (!fs.existsSync(EXPORT_DIR)) {
        fs.mkdirSync(EXPORT_DIR, { recursive: true });
    }

    // 1. Export to Excel
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(jobs);
    XLSX.utils.book_append_sheet(wb, ws, 'Jobs');
    const xlsxPath = path.join(EXPORT_DIR, 'jobs_latest.xlsx');
    XLSX.writeFile(wb, xlsxPath);
    console.log(`Exported Excel to ${xlsxPath}`);

    // 2. Export to CSV
    const csvPath = path.join(EXPORT_DIR, 'jobs_latest.csv');
    const header = Object.keys(jobs[0]).map(k => ({ id: k, title: k }));

    const csvWriter = createObjectCsvWriter({
        path: csvPath,
        header
    });

    await csvWriter.writeRecords(jobs);
    console.log(`Exported CSV to ${csvPath}`);
}
