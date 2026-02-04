const express = require('express');
const cors = require('cors');
const OpenAI = require('openai');
const supabase = require('./db');
const path = require('path');

// Load environment variables from backend/.env.local
require('dotenv').config({ path: path.join(__dirname, '.env.local') });

const app = express();
const PORT = process.env.PORT || 3001;

// Initialize OpenAI
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

// Middleware
app.use(cors());
app.use(express.json());

// Routes
const jobSearchRoute = require('./routes/jobs_search');
app.use('/api/jobs', jobSearchRoute); // Mounts at /api/jobs/search

// GET /api/jobs - List all saved jobs
app.get('/api/jobs', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('jobs')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;
        res.json(data);
    } catch (error) {
        console.error('Error fetching jobs:', error);
        res.status(500).json({ error: 'Failed to fetch jobs' });
    }
});

// POST /api/jobs - Save a new job
app.post('/api/jobs', async (req, res) => {
    try {
        const { title, company, location, description, url, source } = req.body;

        if (!title) {
            return res.status(400).json({ error: 'Title is required' });
        }

        const { data, error } = await supabase
            .from('jobs')
            .insert([{
                title,
                company: company || '',
                location: location || '',
                description: description || '',
                url: url || '',
                source: source || 'LinkedIn'
            }])
            .select();

        if (error) throw error;

        res.status(201).json({
            id: data[0].id,
            message: 'Job saved successfully'
        });
    } catch (error) {
        console.error('Error saving job:', error);
        res.status(500).json({ error: 'Failed to save job' });
    }
});

// DELETE /api/jobs/:id - Delete a job
app.delete('/api/jobs/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const { error } = await supabase
            .from('jobs')
            .delete()
            .eq('id', id);

        if (error) throw error;

        res.json({ message: 'Job deleted successfully' });
    } catch (error) {
        console.error('Error deleting job:', error);
        res.status(500).json({ error: 'Failed to delete job' });
    }
});

// POST /api/generate-answer - Generate AI answer for job application
app.post('/api/generate-answer', async (req, res) => {
    try {
        const { job, question } = req.body;

        if (!job || !question) {
            return res.status(400).json({ error: 'Job and question are required' });
        }

        const prompt = `You are a professional job application assistant. Generate a compelling, personalized answer for the following job application question.

Job Details:
- Title: ${job.title}
- Company: ${job.company}
- Location: ${job.location}
${job.description ? `- Description: ${job.description}` : ''}

Question: ${question}

Instructions:
- Write a professional, confident answer (150-200 words)
- Reference the specific company and role where appropriate
- Be authentic and avoid generic phrases
- Show enthusiasm for the opportunity

Answer:`;

        const completion = await openai.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: [{ role: 'user', content: prompt }],
            max_tokens: 500,
            temperature: 0.7,
        });

        const answer = completion.choices[0].message.content.trim();
        res.json({ answer });

    } catch (error) {
        console.error('Error generating answer:', error);
        res.status(500).json({ error: 'Failed to generate answer' });
    }
});

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Start server
app.listen(PORT, () => {
    console.log(`JobAutomate API running on http://localhost:${PORT}`);
});
