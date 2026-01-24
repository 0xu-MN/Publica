# Supabase 백엔드 배포 가이드

AI 뉴스 카드 기능을 작동시키기 위해 Supabase에 다음 설정들을 적용해야 합니다. 단계별로 따라해 주세요.

---

### Step 1: 데이터베이스 테이블 생성 (SQL Editor)

1. [Supabase Dashboard](https://supabase.com/dashboard)에 접속합니다.
2. 왼쪽 메뉴에서 **SQL Editor**를 클릭합니다.
3. **New Query** 버튼을 눌러 새 쿼리창을 엽니다.
4. 아래 SQL 코드의 **내용만(백틱 ``` 제외)** 복사해서 붙여넣고 **Run** 버튼을 클릭합니다.

> [!WARNING]
> 아래의 ` ```sql ` 과 마지막 ` ``` ` 부분은 복사하지 마세요! 그 안의 텍스트만 복사해야 합니다.

```sql
-- AI 뉴스 카드 저장용 테이블 생성
CREATE TABLE IF NOT EXISTS cards (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  content TEXT NOT NULL, 
  created_at TIMESTAMP DEFAULT NOW()
);

-- 보안 설정 (모두 읽기 가능, 서비스 키만 쓰기 가능)
ALTER TABLE cards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read access cards" 
  ON cards FOR SELECT 
  USING (true);

CREATE POLICY "Service role write access cards" 
  ON cards 
  FOR ALL 
  USING (auth.role() = 'service_role');
```


---

### Step 2: Supabase CLI 설치 및 로그인

터미널(Terminal)에서 아래 명령어를 순서대로 입력해 주세요.

1. **CLI 설치** (이미 설치되어 있다면 건너뛰세요)
   ```bash
   brew install supabase/tap/supabase
   ```

2. **로그인**
   ```bash
   supabase login
   ```
   *브라우저 창이 뜨면 로그인을 완료해주세요.*

3. **프로젝트 연결**
   ```bash
   supabase link --project-ref <사용자님의-프로젝트-REF-ID>
   ```
   *Project Ref ID는 Supabase 프로젝트 설정(Project Settings > General)에서 확인할 수 있습니다.*

---

### Step 3: Edge Function 배포

터미널에서 프로젝트 루트 디렉토리(`/Users/admin/Desktop/insightflow`)로 이동한 뒤 아래 명령어를 입력하여 제가 작성한 코드를 업로드합니다.

```bash
supabase functions deploy generate-cards
```

---

### Step 4: 환경변수(Secrets) 설정

AI가 정상적으로 답변을 생성할 수 있도록 API 키를 설정해야 합니다. 터미널 혹은 Supabase Dashbaord 내 **Edge Functions > generate-cards > Settings**에서도 설정 가능합니다.

**터미널에서 설정하는 법:**
```bash
supabase secrets set GROQ_KEY="사용자님의_GROQ_API_KEY"
supabase secrets set SUPABASE_URL="사용자님의_프로젝트_URL"
supabase secrets set SUPABASE_ANON_KEY="사용자님의_ANON_KEY"
```

---

### Step 5: 테스트 확인

배포가 완료되면 Supabase 대시보드의 **Edge Functions** 탭에 `generate-cards`가 나타납니다. 
이제 프론트엔드에서 이 API를 호출하면 과학/경제 에디터 AI가 뉴스 카드를 생성해 줄 것입니다.

**준비가 되셨나요? 막히는 부분이 있다면 말씀해주세요!**
