import { NextResponse } from 'next/server';

const mockJobs = [
    {
        id: '1',
        title: 'Software Engineer (Mock)',
        company: 'Tech Corp',
        location: 'London',
        description: 'This is a mock job because REED_API_KEY is missing. Visa sponsorship available.',
        url: 'https://www.reed.co.uk',
        source: 'Reed.co.uk',
        salary: '£50,000 - £70,000',
        created_at: new Date().toISOString(),
    },
];

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const keywords = searchParams.get('keywords') || '';
        const location = searchParams.get('location') || '';
        const visaSponsorship = searchParams.get('visa_sponsorship') === 'true';
        const apiKey = process.env.REED_API_KEY;

        // Use Arbeitnow if visa sponsorship is requested OR if Reed API key is missing
        if (visaSponsorship || !apiKey) {
            // Arbeitnow API
            const params = new URLSearchParams();
            // Arbeitnow uses a single 'search' param for keywords and location combined often works best, 
            // but let's try to be smart. The docs say "search" is for keywords.
            // Let's combine them into the search query designated for keywords if both exist.
            const searchQuery = [keywords, location].filter(Boolean).join(' ');
            if (searchQuery) params.append('search', searchQuery);
            if (visaSponsorship) params.append('visa_sponsorship', 'true');

            // Should be page 1 by default
            params.append('page', '1');

            const res = await fetch(`https://www.arbeitnow.com/api/job-board-api?${params.toString()}`);

            if (!res.ok) {
                throw new Error(`Arbeitnow API error: ${res.status}`);
            }

            const data = await res.json();

            const jobs = (data.data || []).map((job: any) => ({
                id: job.slug, // Use slug as stable ID
                title: job.title,
                company: job.company_name,
                location: job.location,
                description: job.description,
                url: job.url,
                source: 'Arbeitnow',
                salary: 'Competitive', // Arbeitnow often doesn't provide structured salary in this list
                tags: job.tags,
                created_at: new Date(job.created_at * 1000).toISOString(), // timestamp is usually unix seconds
                visa_sponsorship: visaSponsorship === true ? true : !!job.visa_sponsorship // Force true when filter is active
            }));

            return NextResponse.json(jobs);
        }

        // Fallback to Reed (Existing Logic) if key exists and NOT looking specifically for visa sponsorship
        let searchKeywords = keywords;
        if (!/visa|sponsorship/i.test(searchKeywords) && visaSponsorship) {
            // This path shouldn't be reached due to the `if (visaSponsorship ...)` block above, 
            // but keeping logic clean:
            searchKeywords += ' visa sponsorship';
        }

        // If keywords is empty for Reed, it might fail or return everything. Default to "sponsorship" if nothing else?
        // Original logic had a default.
        if (!searchKeywords) searchKeywords = 'visa sponsorship';

        const params = new URLSearchParams({
            keywords: searchKeywords,
            locationName: location || 'UK', // Reed defaults
        });

        const authToken = Buffer.from(`${apiKey}:`).toString('base64');
        const reedResponse = await fetch(`https://www.reed.co.uk/api/1.0/search?${params.toString()}`, {
            headers: {
                Authorization: `Basic ${authToken}`,
            },
        });

        if (!reedResponse.ok) {
            return NextResponse.json(
                { error: 'External API error' },
                { status: reedResponse.status }
            );
        }

        const data = await reedResponse.json();
        const jobs = (data.results || []).map((job: any) => ({
            id: job.jobId.toString(),
            title: job.jobTitle,
            company: job.employerName,
            location: job.locationName,
            description: job.jobDescription,
            url: job.jobUrl,
            source: 'Reed.co.uk',
            salary: job.minimumSalary && job.maximumSalary
                ? `£${job.minimumSalary} - £${job.maximumSalary}`
                : 'Competitive',
            created_at: job.date,
        }));

        return NextResponse.json(jobs);
    } catch (error) {
        console.error('[Search API] Error:', error);
        return NextResponse.json({ error: 'Failed to search jobs' }, { status: 500 });
    }
}
