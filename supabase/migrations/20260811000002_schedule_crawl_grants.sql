-- Migration: crawl-grants를 매일 자동 실행하도록 pg_cron 예약
-- 지금까지 이 함수는 아무도 스케줄을 걸지 않아서 수동 POST 없이는 평생 실행되지 않았다.

CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

SELECT cron.unschedule(jobid)
FROM cron.job
WHERE jobname = 'crawl-grants-daily';

-- 매일 06:00 KST(=UTC 21:00 전날)에 실행
SELECT cron.schedule(
    'crawl-grants-daily',
    '0 21 * * *',
    $$
    SELECT net.http_post(
        url := 'https://qgcrlyubyibwbhncnqaq.supabase.co/functions/v1/crawl-grants',
        headers := jsonb_build_object(
            'Content-Type', 'application/json',
            'apikey', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFnY3JseXVieWlid2JobmNucWFxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODEzNzI3NzAsImV4cCI6MjA5Njk0ODc3MH0.DELZC8n3GZCqSUoufREyIwar48qQLZ7ZgRhG4Zj23WQ',
            'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFnY3JseXVieWlid2JobmNucWFxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODEzNzI3NzAsImV4cCI6MjA5Njk0ODc3MH0.DELZC8n3GZCqSUoufREyIwar48qQLZ7ZgRhG4Zj23WQ'
        ),
        body := '{}'::jsonb
    );
    $$
);
