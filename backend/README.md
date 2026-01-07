# InsightFlow Backend 설정 가이드

## 🚀 빠른 시작

### 1. Supabase 프로젝트 생성

1. [Supabase](https://supabase.com) 접속 및 회원가입
2. "New Project" 클릭
3. 프로젝트 정보 입력:
   - Name: `insightflow`
   - Database Password: 강력한 비밀번호 설정
   - Region: `Northeast Asia (Seoul)` 선택 (한국 서버)
4. 프로젝트 생성 완료 (약 2분 소요)

### 2. 데이터베이스 스키마 생성

1. Supabase Dashboard 접속
2. 왼쪽 메뉴에서 **SQL Editor** 클릭
3. `backend/supabase/schema.sql` 파일 내용 복사
4. SQL Editor에 붙여넣기
5. "RUN" 버튼 클릭하여 실행

### 3. API 키 확인

1. Supabase Dashboard에서 **Settings** > **API** 클릭
2. 다음 정보 복사:
   - `Project URL` → SUPABASE_URL
   - `anon public` 키 → SUPABASE_ANON_KEY
   - `service_role` 키 → SUPABASE_SERVICE_KEY (비밀 유지!)

### 4. Gemini API 키 발급

1. [Google AI Studio](https://aistudio.google.com/app/apikey) 접속
2. "Create API Key" 클릭
3. API 키 복사 → GEMINI_API_KEY

### 5. 환경 변수 설정

```bash
cd backend
cp .env.example .env
```

`.env` 파일 편집:
```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_KEY=your-service-key

GEMINI_API_KEY=your-gemini-api-key

NEWS_FETCH_INTERVAL=3600000
MAX_NEWS_PER_FETCH=20
NODE_ENV=development
```

### 6. 의존성 설치 및 실행

```bash
# 패키지 설치
npm install

# 뉴스 수집 테스트 (1회 실행)
npm run fetch-news

# 성공 시 출력 예시:
# 🔍 뉴스 수집 시작...
# 📰 CES Official 수집 중...
# 📰 Nature News 수집 중...
# ✅ 총 145개 뉴스 수집 완료
# 🎉 CES 2026 관련 뉴스: 12개
```

---

## 📊 데이터 구조

### news_items 테이블

| 컬럼 | 타입 | 설명 |
|------|------|------|
| `id` | UUID | 고유 ID |
| `title` | TEXT | 뉴스 제목 |
| `summary` | TEXT | 원문 요약 |
| `ai_summary` | TEXT | AI 생성 요약 (2-3문장) |
| `ai_insight` | TEXT | AI 핵심 인사이트 |
| `image_url` | TEXT | 썸네일 이미지 URL |
| `category` | TEXT | 'Science' 또는 'Economy' |
| `source` | TEXT | 출처 (예: 'TechCrunch') |
| `source_url` | TEXT | 원문 링크 (UNIQUE) |
| `published_at` | TIMESTAMP | 발행 시각 |
| `tags` | TEXT[] | 태그 배열 (예: ['#AI', '#CES2026']) |
| `read_time` | TEXT | 읽기 시간 (예: '3분') |
| `priority_score` | INTEGER | 우선순위 점수 (1-10) |
| `is_trending` | BOOLEAN | 트렌딩 여부 (CES 등) |

---

## 🔄 자동화 설정 (선택사항)

### Supabase Cron Job으로 자동 수집

1. Supabase Dashboard > **Database** > **Cron Jobs**
2. "Create a new cron job" 클릭
3. 설정:
   ```sql
   -- 매 시간마다 실행
   select cron.schedule(
     'fetch-news-hourly',
     '0 * * * *',
     $$
     SELECT net.http_post(
       url := 'YOUR_BACKEND_URL/api/fetch-news',
       headers := '{"Content-Type": "application/json"}'::jsonb
     ) AS request_id;
     $$
   );
   ```

**또는 GitHub Actions 사용 (권장):**

`.github/workflows/fetch-news.yml` 생성:
```yaml
name: Fetch News

on:
  schedule:
    - cron: '0 * * * *'  # 매 시간
  workflow_dispatch:  # 수동 실행 가능

jobs:
  fetch:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: cd backend && npm install
      - run: cd backend && npm run fetch-news
        env:
          SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
          SUPABASE_SERVICE_KEY: ${{ secrets.SUPABASE_SERVICE_KEY }}
          GEMINI_API_KEY: ${{ secrets.GEMINI_API_KEY }}
```

---

## 🎯 CES 2026 특별 기능

현재 시스템은 **CES 2026** 관련 뉴스를 우선적으로 수집합니다:

- ✅ CES 공식 RSS 피드 포함
- ✅ 'CES 2026' 키워드 자동 탐지
- ✅ 우선순위 점수 최대치 (10점) 부여
- ✅ `#CES2026` 태그 자동 추가
- ✅ `is_trending: true` 마킹

---

## 🧪 테스트

```bash
# 단일 뉴스 수집 테스트
npm run fetch-news

# Supabase에서 결과 확인
# Dashboard > Table Editor > news_items
```

---

## 📈 다음 단계

1. ✅ Frontend 연동 (Supabase Client)
2. ⬜ 이미지 자동 수집 (Unsplash API)
3. ⬜ 사용자 피드백 시스템
4. ⬜ 개인화 추천 알고리즘

---

## 💡 문제 해결

### "Cannot find module" 에러
```bash
npm install
```

### Gemini API 할당량 초과
- 무료 티어: 15 RPM (Requests Per Minute)
- 해결: `ai-summarizer.ts`에서 배치 크기 줄이기 (5 → 3)

### Supabase 연결 실패
- `.env` 파일의 URL과 KEY 확인
- Supabase 프로젝트가 활성화 상태인지 확인
