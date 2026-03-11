-- Delete old 2016 bizinfo grants
DELETE FROM public.grants
WHERE title ILIKE '%2016%';

DELETE FROM public.grants
WHERE source = 'bizinfo' OR source = 'seed';
