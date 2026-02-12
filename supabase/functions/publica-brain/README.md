# Publica Brain - Supabase Edge Function

AI-powered government funding strategist using LangGraph and Gemini 1.5 Pro.

## Architecture

```
publica-brain/
├── index.ts              # Deno edge function entry point
├── graph/
│   └── state.ts         # AgentState interface
├── nodes/
│   └── strategist.ts    # Gemini-powered strategy logic
└── deno.json            # Import map for dependencies
```

## Features

- **LangGraph Orchestration**: State-based workflow management
- **Gemini 1.5 Pro**: Advanced AI reasoning for strategic analysis
- **Zod Structured Output**: Guaranteed JSON schema compliance
- **Korean Language**: All outputs in professional Korean

## API Specification

### Endpoint
```
POST https://<project-ref>.supabase.co/functions/v1/publica-brain
```

### Request Body
```json
{
  "userProfile": "연구자, 전공: 바이오, 경력: 5년, 소속: 서울대학교...",
  "targetData": "2026년 차세대 바이오 혁신 기술개발사업 공고문 전문..."
}
```

### Response
```json
{
  "success": true,
  "strategyPlan": {
    "hypothesis": "바이오 데이터와 AI를 융합한 차세대 진단 플랫폼으로 차별화",
    "steps": [
      {
        "step_number": 1,
        "title": "핵심 기술 차별점 명확화",
        "description": "기존 진단 기술 대비 정확도 30% 향상 데이터 준비...",
        "action_type": "research"
      },
      // ... 3-7 steps total
    ]
  }
}
```

## Deployment

### Prerequisites
1. **Supabase CLI** installed (`brew install supabase/tap/supabase`)
2. **Google API Key** for Gemini 1.5 Pro (stored as `GEMINI_API_KEY` or `GOOGLE_API_KEY`)

### Step-by-Step Deployment

#### 1. Link Supabase Project
```bash
cd /Users/admin/Desktop/insightflow
supabase link --project-ref <your-project-ref>
```

#### 2. Set Secret
If you haven't set it already for other functions:
```bash
supabase secrets set GEMINI_API_KEY=<your-gemini-api-key>
```
*(Note: If you already set `GEMINI_API_KEY` for `insight-agent-gateway` or `generate-cards`, you can skip this step.)*

#### 3. Deploy Function
```bash
supabase functions deploy publica-brain --no-verify-jwt
```

## Local Testing

```bash
# Serve locally
supabase functions serve publica-brain --env-file .env.local

# Test with curl
curl -X POST http://localhost:54321/functions/v1/publica-brain \
  -H "Content-Type: application/json" \
  -d '{
    "userProfile": "연구자, AI 전공",
    "targetData": "2026 AI 기술 개발 지원사업"
  }'
```

## Schema Details

### StrategySchema (Zod)
```typescript
{
  hypothesis: string,
  steps: Array<{
    step_number: number,
    title: string,
    description: string,
    action_type: "research" | "documentation" | "networking" | "validation" | "submission"
  }>
}
```

## Error Handling

The function includes comprehensive error handling:
- Input validation (400 Bad Request)
- AI model failures (fallback strategy provided)
- Structured error responses with stack traces in dev mode

## Performance

- **Cold Start**: ~2-3 seconds (Deno + LangGraph initialization)
- **Warm Execution**: ~1-2 seconds (Gemini API latency)
- **Timeout**: 60 seconds (Supabase Edge Function limit)

## Next Steps

1. Add `scoutNode` for intelligent grant matching
2. Implement `writerNode` for draft generation
3. Add human-in-the-loop checkpoints with `interruptAfter`
4. Integrate with frontend `AgentView.tsx`
