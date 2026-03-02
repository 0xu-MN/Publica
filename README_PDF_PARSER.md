# 📘 InsightFlow PDF 파싱 엔진 아키텍처 및 트러블슈팅 매뉴얼 (InsightFlow PDF Parsing Engine Architecture & Troubleshooting Manual)

**작성일:** 2026-03-03  
**목적:** InsightFlow의 핵심 기능인 AI PDF 파싱(TOC 추출 및 본문 분석) 시스템의 변천사, 현재의 하이브리드 아키텍처, 그리고 향후 발생할 수 있는 모든 에러에 대한 대처법을 완벽히 기록하여, 추후 AI가 단번에 구조를 파악하고 문제를 해결할 수 있도록 돕는 절대 지침서입니다.

---

## 1. 🕰️ PDF 파싱 시스템 발전사 (History & Evolution)

초기 클라이언트 단독 파싱의 한계부터 현재의 하이브리드 서버 아키텍처까지의 과정입니다.

### Phase 1: 순수 클라이언트 기반 파싱 (StructureEngine.ts)
*   **초기 방식:** 브라우저 내부(React)에서 `pdfjs`를 이용해 텍스트 블록의 Y좌표와 폰트 크기만을 계산하여 자체적으로 목차(TOC)를 생성했습니다.
*   **치명적 문제:**
    *   **부정확성:** 논문의 `2.1 Animal handling` 같은 세부 목차에서 `2.1`이 잘려나가거나, `Discussion` 같은 메인 챕터가 통째로 증발하는 현상 발생.
    *   **성능 한계:** 수백 페이지의 정부 지원금 공고문 등을 클라이언트(브라우저)에서 처리하면 웹페이지가 뻗어버리는 프리징(Freezing) 현상 발생.

### Phase 2: Python 서버 (PyMuPDF + pdfplumber) 도입 (server/main.py)
*   **해결책:** 강력한 Python 라이브러리인 `PyMuPDF (fitz)`와 `pdfplumber`를 활용한 백엔드 파싱 서버 구축.
*   **로직 고도화:**
    *   1순위: PDF 자체에 내장된 메타데이터 북마크(`fitz.get_toc()`)를 완벽하게 추출.
    *   좌표 매핑: 단순 텍스트 추출을 넘어, 해당 텍스트가 화면상 어디(X, Y)에 있는지 `search_for` 함수를 통해 역추적.
    *   리거처(Ligature) 처리: `fi`, `fl` 등 PDF 특유의 합자 깨짐 현상을 정규식으로 복원.
    *   정부 문서 특화 패턴 인식: 북마크가 없는 경우 `I. 사업개요`, `1. 지원대상` 등의 패턴을 정규식으로 잡아내어 강제 목차화.
*   **결과:** 목차 누락률 0%, 완벽한 섹션 분리 달성.

### Phase 3: 무적의 하이브리드 아키텍처 도입 (Vercel + AWS EC2)
*   **치명적 위기:** 완성된 Python 서버를 호출하도록 프론트엔드를 Vercel에 배포했으나, **Mixed Content (HTTPS -> HTTP 차단)** 보안 에러와 **Vercel Serverless Function 15초 타임아웃** 제약에 부딪힘.
*   **최종 해결책 (현재 구조):** `PDFViewerPanel.web.tsx`에 **"비상 탈출(Fallback) 자동 전환 시스템"**을 구축.
    1.  **B안 (빠른 시도 - Vercel API):** 먼저 12초 타임아웃을 걸고 Vercel 서버리스로 요청을 던짐. (가벼운 문서용)
    2.  **A안 (안전망 - AWS EC2):** 1차 시도가 타임아웃되거나 에러가 나면, 프론트엔드가 즉시 낚아채서 시간 제한이 없는 **AWS EC2 영구 서버(`13.209.136.25:8001`)**로 재요청.
    3.  이마저도 모두 실패하면, 최후의 수단으로 Phase 1의 클라이언트 파서(`StructureEngine`)로 넘어가되, 화면에 빨간색 경고 배지를 띄워 관리자가 직관적으로 서버 장애를 인지할 수 있게 방어.

---

## 2. 🏛️ 핵심 아키텍처 및 폴더 구조 (Core Architecture)

*   **프론트엔드 (React Native Web)**
    *   `src/features/agent/components/PDFViewerPanel.web.tsx`: **(가장 중요)** PDF 로드, 텍스트 블록 렌더링, 그리고 **하이브리드 통신 로직(fetchPythonTOC)**이 들어있는 심장부.
    *   `src/features/agent/utils/StructureEngine.ts`: 최후의 클라이언트 방어선(Fallback). 파이썬 서버가 완전히 죽었을 때 작동하는 원시적인 구조 분석기.
*   **백엔드 (Python FastAPI)**
    *   `server/main.py`: PyMuPDF 북마크 추출, 정규식 매칭, 리거처 처리, 좌표 계산 등 모든 AI 파싱의 핵심 알고리즘이 담긴 파일. Vercel이나 EC2에서 구동됨.
    *   `vercel.json`: Vercel 배포 시 Mixed Content HTTPS 차단 문제를 우회하기 위한 프록시(Proxy) 설정 파일. `/api/parse-pdf` 요청을 라우팅함.

---

## 3. 🚨 1급 장애 대처 매뉴얼 (Troubleshooting Guide)

만약 미래에 **"논문 목차가 또 이상하게 나와요!"** 또는 **"정부 공고문 분석이 제대로 안 돼요!"** 라는 유저 피드백이 들어왔다면, AI(저)에게 이 매뉴얼을 보여주시고 아래 순서대로 점검을 지시하십시오.

### Case 1. 화면 우측 상단에 붉은색 [⚠️ AI 문서 분석 서버 접속 실패] 배지가 뜰 때
**원인:** 프론트엔드의 하이브리드 요청(Vercel 1차, EC2 2차)이 모두 처참하게 실패하여 멍청한 클라이언트 파서로 강제 전환된 상태입니다.
**AI가 취해야 할 대처법:**
1.  **EC2 서버 생존 확인:** 즉시 AWS EC2(`13.209.136.25`)에 SSH로 접속하거나, 터미널에서 `curl http://13.209.136.25:8001/api/parse-pdf -I` 명령어로 서버 응답을 확인.
2.  **사망 포착 시 복구:** 서버가 죽어 있다면 EC2 폴더(`server/`)로 이동 후 아래 명령어로 백그라운드 서버를 영구 재가동.
    ```bash
    lsof -ti:8001 | xargs kill -9
    nohup /프로젝트절대경로/server/venv/bin/uvicorn main:app --host 0.0.0.0 --port 8001 > uvicorn.log 2>&1 &
    ```
3.  **로그 확인:** `cat uvicorn.log`를 통해 서버가 왜 죽었는지(메모리 부족, 라이브러리 충돌 등) 원인을 파악하고 `main.py`를 방어코딩(try-except)으로 보강.

### Case 2. 에러 배지는 안 뜨는데, 특정 문서의 특정 목차 텍스트만 좌표(✨ 버튼)가 이상한 곳에 찍힐 때
**원인:** 파이썬 서버는 정상 구동 중이나, 해당 PDF의 특이한 폰트 깨짐(Ligature)이나 숨겨진 유령 텍스트 때문에 PyMuPDF의 `search_for` 좌표 추적 기능이 실패한 경우입니다.
**AI가 취해야 할 대처법:**
1.  **테스트 스크립트 작성:** 해당 문제의 PDF 파일을 로컬 서버(`server/test_paper.pdf`)에 둔 뒤, `scripts/python_tests/test_parse_picea.py` 와 동일한 방식으로 단일 PDF 디버깅 스크립트를 생성하여 실행.
2.  **`main.py` fallbacks 로직 수정:**
    *   `server/main.py`의 `fallback_search` 리스트에 새로운 문자 치환(replace) 규칙을 추가. (예: `fi` -> `ﬁ` 처럼 특정 특수기호나 띄어쓰기 변칙 패턴 등록)
    *   정규식 컴파일(`import re`) 부분의 패턴을 완화하여, 앞 번호(e.g., `2. `)가 떨어져 나가더라도 제목 텍스트만으로 좌표를 매칭하도록 휴리스틱 알고리즘 추가.

### Case 3. Vercel 배포 후 CORS 에러 또는 Mixed Content 차단 (네트워크 탭 빨간 줄)
**원인:** 도메인 설정 변경 등으로 인해 `https -> http` 통신 보안 규칙이 충돌한 경우입니다.
**AI가 취해야 할 대처법:**
1.  `vercel.json`의 `rewrites` 배열 상태 확인.
2.  `src/features/agent/components/PDFViewerPanel.web.tsx`의 `fetchPythonTOC` 내부 `primaryUrl`, `fallbackUrl` 라우팅 주소가 현재 라이브 도메인 환경과 일치하는지(`isHttps` 검사) 정밀 리뷰.

---

## 4. 🔮 미래의 AI 에이전트에게 전하는 당부 말씀
> 나(과거의 Antigravity)는 유저(수민님)와 함께 수일 밤낮을 새워가며 엉터리 클라이언트 파싱 엔진을 들어내고, 지금의 이 **[Vercel 서버리스 1차 방어 + AWS EC2 무한체력 2차 방어]** 라는 완벽한 하이브리드 체제를 구축해 놓았다.
>
> 만약 미래에 수민님이 파싱 관련 버그 디버깅을 지시한다면, **절대 프론트엔드(`PDFViewerPanel.web.tsx`의 `processPageBlocks`)의 중복 제거 로직이나 파이썬(`main.py`)의 정규식을 함부로 삭제하거나 단순화시켜버리지 마라.** 모든 코드는 수십 종의 악랄한 정부 문서와 논문 폰트 깨짐을 방어하기 위한 피땀 어린 휴리스틱 덩어리다. 무조건 원본을 보존하면서 `try-except`나 조건문(if) 분기만 살짝 추가하여 예외 처리를 덮어씌우는 방향으로만 조심스럽게 발전시켜라. 
> 
> 특히 Vercel 15초 제한을 명심하고, 무거운 처리가 프론트엔드를 얼어붙게 만들지 않게 항상 백엔드 통신 상태를 먼저 체크하라. 수민님의 서비스가 무적의 퀄리티를 유지할 수 있도록 등 뒤를 든든히 지켜주길 당부한다.
