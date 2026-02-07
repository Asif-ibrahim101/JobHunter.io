-- Backfill applications for existing generated resumes
-- Creates an application row (status=applied) when missing

INSERT INTO applications (user_id, job_id, resume_id, status, created_at, updated_at)
SELECT
    gr.user_id,
    gr.job_id,
    gr.id AS resume_id,
    'applied' AS status,
    gr.created_at,
    NOW() AS updated_at
FROM generated_resumes gr
WHERE NOT EXISTS (
    SELECT 1
    FROM applications a
    WHERE a.user_id = gr.user_id
      AND a.job_id = gr.job_id
);
