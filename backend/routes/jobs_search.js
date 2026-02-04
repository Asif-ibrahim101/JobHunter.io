const express = require('express');
const axios = require('axios');
const router = express.Router();

// GET /api/jobs/search
router.get('/search', async (req, res) => {
    try {
        const { keywords = 'visa sponsorship', location = 'UK' } = req.query;
        const apiKey = process.env.REED_API_KEY;

        console.log('[Job Search] Request received:', { keywords, location, hasApiKey: !!apiKey });

        if (!apiKey) {
            console.warn('[Job Search] REED_API_KEY is missing - returning mock data');
            // Mock response if API key is missing for development
            return res.json([
                {
                    id: '1',
                    title: 'Software Engineer (Mock)',
                    company: 'Tech Corp',
                    location: 'London',
                    description: 'This is a mock job because REED_API_KEY is missing. Visa sponsorship available.',
                    url: 'https://www.reed.co.uk',
                    source: 'Reed.co.uk',
                    salary: '£50,000 - £70,000',
                    created_at: new Date().toISOString()
                }
            ]);
        }

        // Check if keywords already include "visa" or "sponsorship", if not, append them for better relevance
        // But Reed API is simple, so let's just use what user sent + default logic
        // Ideally we assume user specifically wants visa jobs if they are using this feature, 
        // OR we enforce it. The user prompt was "fetch visa sponsored jobs".
        // So let's append "visa sponsorship" if not present.

        let searchKeywords = keywords;
        if (!searchKeywords.toLowerCase().includes('visa') && !searchKeywords.toLowerCase().includes('sponsorship')) {
            searchKeywords += ' visa sponsorship';
        }

        console.log('[Job Search] Calling Reed API with keywords:', searchKeywords);

        const response = await axios.get('https://www.reed.co.uk/api/1.0/search', {
            params: {
                keywords: searchKeywords,
                locationName: location,
            },
            auth: {
                username: apiKey,
                password: '' // Reed API expects Basic Auth with username=key, password=empty
            }
        });

        // Transform Reed API response to match our Job interface mostly
        // Reed returns: { results: [ { jobId, employerName, jobTitle, locationName, minimumSalary, maximumSalary, currency, expirationDate, date, jobDescription, applications, jobUrl } ] }

        const jobs = response.data.results.map(job => ({
            id: job.jobId.toString(),
            title: job.jobTitle,
            company: job.employerName,
            location: job.locationName,
            description: job.jobDescription, // Note: Reed might return HTML snippets or truncated text
            url: job.jobUrl,
            source: 'Reed.co.uk',
            salary: job.minimumSalary && job.maximumSalary ? `£${job.minimumSalary} - £${job.maximumSalary}` : 'Competitive',
            created_at: job.date
        }));

        console.log(`[Job Search] Returning ${jobs.length} jobs from Reed API`);
        res.json(jobs);

    } catch (error) {
        console.error('[Job Search] Error:', error.message);
        if (error.response) {
            console.error('[Job Search] Reed API Error Status:', error.response.status);
            console.error('[Job Search] Reed API Error Data:', error.response.data);
            return res.status(error.response.status).json({ error: 'External API error' });
        }
        res.status(500).json({ error: 'Failed to search jobs' });
    }
});

module.exports = router;
