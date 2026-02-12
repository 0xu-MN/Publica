# Publica Parser - PDF Deep Reading Engine

Supabase Edge Function for parsing PDFs and documents using LlamaCloud API.

## Architecture

```
publica-parser/
├── index.ts              # Main edge function with LlamaCloud integration
└── README.md             # This file
```

## Features

- **Direct REST API Integration**: Uses LlamaCloud API without heavy SDK dependencies
- **Async Polling**: Handles long-running parsing jobs with configurable timeout
- **Markdown Output**: Returns structured markdown preserving tables and formatting
- **File Download Support**: Accepts URLs from Supabase Storage or external sources
- **Error Handling**: Comprehensive error handling with timeout protection

## API Specification

### Endpoint
```
POST https://<project-ref>.supabase.co/functions/v1/publica-parser
```

### Request Body
```json
{
  "fileUrl": "https://storage.supabase.co/...",
  "fileName": "research_paper.pdf",
  "fileType": "application/pdf"
}
```

### Response
```json
{
  "success": true,
  "markdown": "# Document Title\n\nContent here...",
  "metadata": {
    "jobId": "llama-job-123",
    "fileName": "research_paper.pdf",
    "fileType": "application/pdf",
    "parsedAt": "2026-02-11T07:30:00.000Z",
    "characterCount": 15420
  }
}
```

## LlamaCloud API Flow

1. **Download**: Download file from provided URL
2. **Upload**: Send file to LlamaCloud via `POST /api/parsing/upload`
3. **Poll**: Check parsing status via `GET /api/parsing/job/{job_id}/result/markdown`
4. **Extract**: Return markdown content when ready

## Deployment

### Prerequisites
1. **LlamaCloud Account**: Sign up at [cloud.llamaindex.ai](https://cloud.llamaindex.ai)
2. **API Key**: Generate API key from LlamaCloud dashboard

### Deploy Command
```bash
# Set API key
supabase secrets set LLAMA_CLOUD_API_KEY=<your-llama-api-key>

# Deploy function
supabase functions deploy publica-parser --no-verify-jwt
```

## Local Testing

### Serve Locally
```bash
# Add to .env.local
echo "LLAMA_CLOUD_API_KEY=your_key_here" >> supabase/.env.local

# Start function
supabase functions serve publica-parser --env-file supabase/.env.local
```

### Test with Curl
```bash
curl -X POST http://localhost:54321/functions/v1/publica-parser \
  -H "Content-Type: application/json" \
  -d '{
    "fileUrl": "https://arxiv.org/pdf/2301.00000.pdf",
    "fileName": "paper.pdf",
    "fileType": "application/pdf"
  }'
```

## Configuration

### Polling Settings
- **Max Attempts**: 30 (default)
- **Interval**: 2000ms (2 seconds)
- **Total Timeout**: ~60 seconds

Adjust in `pollParsingResult()` function:
```typescript
await pollParsingResult(jobId, apiKey, 30, 2000)
//                                    ^^  ^^^^
//                              attempts  interval(ms)
```

### LlamaCloud Parameters
Configurable in `uploadToLlamaCloud()`:
- `language`: Document language (default: 'en')
- `result_type`: Output format (default: 'markdown')
- `gpt4o_mode`: Parsing quality mode
- `parsing_instruction`: Custom extraction instructions

## Error Handling

The function handles:
- **Download Failures**: Invalid URLs or network errors
- **Upload Errors**: LlamaCloud API errors
- **Timeout**: Parsing jobs exceeding max polling attempts
- **Invalid Responses**: Malformed API responses

## Performance

- **Cold Start**: ~2-3 seconds
- **File Download**: Varies by file size and network
- **LlamaCloud Processing**: 5-30 seconds (depends on PDF complexity)
- **Total**: ~10-60 seconds for typical academic papers

## Next Steps

1. Integrate with `FileUploader` component in AgentView
2. Store markdown in Supabase for caching
3. Add chunk splitting for large documents
4. Implement embeddings generation for semantic search
