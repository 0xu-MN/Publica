# InsightFlow

<div align="center">
  <h3>🌊 AI-Powered News Curation Platform</h3>
  <p>실시간 AI 뉴스 큐레이션 - 과학과 경제의 핵심 인사이트</p>
</div>

---

## ✨ Features

- **🤖 AI-Powered Summarization**: Gemini 1.5 Flash로 뉴스 자동 요약
- **📰 Trusted Sources**: Nature, Bloomberg 등 검증된 언론사만 사용
- **🎯 CES 2026 Special**: CES 관련 뉴스 우선 수집
- **🛡️ Fake News Prevention**: 가짜뉴스 자동 감지 및 필터링
- **⚡ Real-time Updates**: Supabase Realtime으로 즉시 업데이트
- **🎨 Premium UI**: 글래스모피즘 디자인, 다크 테마

## 🚀 Tech Stack

### Frontend
- **React Native** (Expo) - 크로스 플랫폼
- **TypeScript** - 타입 안정성
- **Expo Image** - 최적화된 이미지
- **React Native Reanimated** - 부드러운 애니메이션

### Backend
- **Supabase** - PostgreSQL + Realtime
- **Google Gemini 1.5** - AI 요약
- **RSS Parser** - 뉴스 수집
- **TypeScript** - 백엔드 로직

## 📦 Project Structure

```
insightflow/
├── src/
│   ├── components/        # UI 컴포넌트
│   │   ├── InsightCard.tsx
│   │   └── InsightDetailModal.tsx
│   ├── screens/          # 화면
│   │   └── FeedScreen.tsx
│   ├── data/             # Mock 데이터
│   └── services/         # API 서비스
├── backend/
│   ├── config/           # 설정
│   │   ├── news-sources.ts
│   │   └── trending-topics.ts
│   ├── utils/            # 유틸리티
│   │   ├── rss-parser.ts
│   │   └── ai-summarizer.ts
│   ├── jobs/             # 크론 작업
│   │   └── fetch-news.ts
│   └── supabase/         # DB 스키마
└── README.md
```

## 🛠️ Setup

### 1. Clone & Install

```bash
git clone https://github.com/0xu-MN/insightflow.git
cd insightflow
npm install
```

### 2. Backend Setup

자세한 설정은 [`backend/README.md`](./backend/README.md) 참고

```bash
cd backend
npm install
cp .env.example .env
# .env 파일 편집 (Supabase, Gemini API 키)
```

### 3. Run

```bash
# Frontend
npm start

# Backend (뉴스 수집)
cd backend
npm run fetch-news
```

## 🌐 Deployment

- **Frontend**: Vercel (Web) / Expo Go (Mobile)
- **Backend**: Supabase Edge Functions
- **Database**: Supabase PostgreSQL

## 📱 Screenshots

<div align="center">
  <img src=".github/screenshots/main.png" width="300" alt="Main Screen" />
  <img src=".github/screenshots/modal.png" width="300" alt="Detail Modal" />
</div>

## 🎯 Roadmap

- [x] AI 뉴스 요약 시스템
- [x] CES 2026 특집
- [x] 가짜뉴스 필터링
- [x] 글래스모피즘 UI
- [ ] 사용자 맞춤 추천
- [ ] 북마크 기능
- [ ] 소셜 공유
- [ ] 다크/라이트 테마 전환

## 📄 License

MIT License

## 👨‍💻 Author

**0xu-MN** - [GitHub](https://github.com/0xu-MN)

---

<div align="center">
  Made with ❤️ and AI
</div>
