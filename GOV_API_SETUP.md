# Government API Integration Setup Guide

## Quick Start

### 1. Supabase Database Setup

Run this SQL in your Supabase SQL Editor to update the database schema:

```sql
-- Drop old table if exists
DROP TABLE IF EXISTS government_programs CASCADE;

-- Create enhanced government_programs table
CREATE TABLE government_programs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  program_id TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  agency TEXT NOT NULL,
  department TEXT,
  deadline TIMESTAMP,
  start_date TIMESTAMP,
  end_date TIMESTAMP,
  status TEXT,
  d_day TEXT,
  category TEXT[] DEFAULT '{}',
  tags TEXT[] DEFAULT '{}',
  budget TEXT,
  description TEXT,
  link TEXT,
  requirements TEXT[] DEFAULT '{}',
  api_source TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_programs_deadline ON government_programs(deadline);
CREATE INDEX idx_programs_status ON government_programs(status);
CREATE INDEX idx_programs_agency ON government_programs(agency);
CREATE INDEX idx_programs_category ON government_programs USING GIN(category);

-- Enable RLS
ALTER TABLE government_programs ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Public read access" 
  ON government_programs FOR SELECT 
  USING (true);

CREATE POLICY "Service role write access" 
  ON government_programs FOR ALL 
  USING (auth.role() = 'service_role');

-- Auto-update trigger
CREATE TRIGGER update_government_programs_updated_at
  BEFORE UPDATE ON government_programs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

### 2. Test the API Connection

```bash
cd backend
npx tsx test-gov-api.ts
```

### 3. Fetch Government Programs Data

```bash
cd backend
npx tsx jobs/fetch-gov-programs.ts
```

### 4. View in App

Navigate to: **Support → 정부사업 찾기** 

The `GovernmentProgramList` component will automatically fetch and display programs from your database.

---

## API Endpoint Issues

> **Note**: The public data portal APIs may need endpoint verification.
> 
> **Current Status**: APIs return 500/404 errors
> 
> **Fallback**: App shows mock data from `newsService.ts` when API fails
> 
> **Next Steps**:
> 1. Visit data.go.kr and verify exact endpoint URLs
> 2. Check API documentation for each service
> 3. Update endpoints in `backend/utils/gov-api-client.ts`
> 4. Test again with corrected endpoints

---

## Scheduled Updates (Optional)

To keep programs up-to-date, schedule the fetch job to run daily:

### Using Node Cron (Local)

```bash
npm install node-cron
```

Create `backend/scheduler.ts`:
```typescript
import cron from 'node-cron';
import { fetchAndProcessGovPrograms } from './jobs/fetch-gov-programs';

// Run every day at 3 AM
cron.schedule('0 3 * * *', async () => {
  console.log('🕐 Running scheduled government programs update...');
  await fetchAndProcessGovPrograms();
});
```

### Using GitHub Actions (Free)

Create `.github/workflows/update-programs.yml`:
```yaml
name: Update Government Programs
on:
  schedule:
    - cron: '0 3 * * *'  # Daily at 3 AM UTC
  workflow_dispatch:  # Manual trigger

jobs:
  update:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: cd backend && npm install
      - run: cd backend && npx tsx jobs/fetch-gov-programs.ts
        env:
          SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
          SUPABASE_SERVICE_KEY: ${{ secrets.SUPABASE_SERVICE_KEY }}
          GOV_API_SERVICE_KEY: ${{ secrets.GOV_API_SERVICE_KEY }}
```

---

## Architecture

```
┌─────────────────┐
│  Public Data    │
│  Portal APIs    │
│  (data.go.kr)  │
└────────┬────────┘
         │
         │ REST API Calls
         ▼
┌─────────────────────┐
│  Backend Job        │
│  fetch-gov-programs │  ← Runs daily/manually
└──────────┬──────────┘
           │
           │ Upsert
           ▼
    ┌──────────────┐
    │   Supabase   │
    │  government_ │
    │   programs   │
    └──────┬───────┘
           │
           │ SELECT
           ▼
    ┌──────────────────┐
    │  newsService      │
    │  .fetchGovPrograms│
    └────────┬──────────┘
             │
             ▼
    ┌──────────────────────┐
    │ GovernmentProgramList│
    │    Component         │
    └──────────────────────┘
```
