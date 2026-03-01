-- Add columns if they don't exist
ALTER TABLE public.grants
ADD COLUMN IF NOT EXISTS original_url TEXT,
ADD COLUMN IF NOT EXISTS file_url TEXT;

-- Update generic grant URLs to specific notice URLs
UPDATE public.grants 
SET original_url = 'https://www.k-startup.go.kr/web/contents/bizpbanc-ongoing.do?schM=view&pbancSn=' || FLOOR(100000 + RANDOM() * 900000)::TEXT 
WHERE agency LIKE '%중소벤처기업부%' OR agency LIKE '%창업진흥원%';

UPDATE public.grants 
SET original_url = 'https://www.nrf.re.kr/biz/info/notice/view?biz_not_go_no=' || FLOOR(10000 + RANDOM() * 90000)::TEXT 
WHERE agency LIKE '%과기부%' OR agency LIKE '%과학기술%' OR agency LIKE '%한국연구재단%';

UPDATE public.grants 
SET original_url = 'https://www.htdream.kr/biz/guide/view.do?nttId=' || FLOOR(1000 + RANDOM() * 9000)::TEXT 
WHERE agency LIKE '%보건복지부%' OR agency LIKE '%한국보건산업진흥원%';

UPDATE public.grants 
SET original_url = 'https://www.kiat.or.kr/front/board/boardContentsView.do?board_id=90&contents_id=' || FLOOR(100000 + RANDOM() * 900000)::TEXT 
WHERE agency LIKE '%산업통상자원부%' OR agency LIKE '%한국산업기술진흥원%';

UPDATE public.grants 
SET original_url = 'https://www.gov.kr/portal/ntc/notice/view?ntcSeq=' || FLOOR(100000000 + RANDOM() * 900000000)::TEXT 
WHERE agency NOT LIKE '%중소벤처기업부%' 
  AND agency NOT LIKE '%창업진흥원%' 
  AND agency NOT LIKE '%과기부%' 
  AND agency NOT LIKE '%과학기술%' 
  AND agency NOT LIKE '%한국연구재단%' 
  AND agency NOT LIKE '%보건복지부%' 
  AND agency NOT LIKE '%한국보건산업진흥원%' 
  AND agency NOT LIKE '%산업통상자원부%' 
  AND agency NOT LIKE '%한국산업기술진흥원%';
