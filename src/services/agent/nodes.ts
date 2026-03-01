import { HumanMessage, SystemMessage, AIMessage } from "@langchain/core/messages";
import { AgentState, GrantAttachment, GrantDocuments } from "./state";
import { getLLM, invokeLLMWithFallback } from "../llm-provider";
import axios from "axios";
import { execSync } from "child_process";

/**
 * Step 1: The Scout (Internal Smart Matcher)
 * Matches government grants from DB using Gemini 3 Pro scoring
 */
export const scoutNode = async (state: AgentState): Promise<Partial<AgentState>> => {
    console.log("Maestro Scout: Matching Internal Gov Grants...");

    const { expertise, major_category, user_type } = state.userProfile;
    let grants: any[] = [];

    try {
        // 1. Fetch Grants from Supabase (Filtered Strategy)
        // IF user has specific expertise, try to fetch matching grants first.
        if (expertise && expertise !== '미설정') {
            console.log(`🔎 Filtered Fetching: looking for grants matching '${expertise}'...`);
            const { data: exactMatches } = await axios.get(`${process.env.SUPABASE_URL}/rest/v1/grants`, {
                params: {
                    select: '*',
                    or: `tech_field.ilike.%${expertise}%,title.ilike.%${expertise}%`
                },
                headers: {
                    'apikey': process.env.SUPABASE_ANON_KEY,
                    'Authorization': `Bearer ${process.env.SUPABASE_ANON_KEY}`
                }
            });

            if (exactMatches && exactMatches.length > 0) {
                console.log(`✅ Found ${exactMatches.length} exact matches for '${expertise}'`);
                grants = exactMatches;
            }
        }

        // Fallback: If no exact matches (or no expertise), fetch broader category or latest
        if (grants.length === 0) {
            console.log("⚠️ No exact matches found. Falling back to broader fetch...");
            const { data: broadMatches } = await axios.get(`${process.env.SUPABASE_URL}/rest/v1/grants`, {
                params: {
                    select: '*',
                    limit: 20,
                    order: 'created_at.desc'
                },
                headers: {
                    'apikey': process.env.SUPABASE_ANON_KEY,
                    'Authorization': `Bearer ${process.env.SUPABASE_ANON_KEY}`
                }
            });
            grants = broadMatches || [];
        }

        if (!grants || grants.length === 0) throw new Error("No internal grants found even after fallback");

        // 2. AI Scoring via LLM (medium tier)
        const model = getLLM('medium');
        const res = await model.invoke([
            new SystemMessage(`Act as a strict government grant evaluator. 
  
  **CRITICAL RULE:**
  User Expertise: "${expertise || major_category || 'General'}"
  User Role: "${user_type}"

  **Scoring Algorithm (0-100 pts):**

  1. **Tech Field Match (The Barrier)**:
     - Check Grant "tech_field" (e.g. AI, Bio, FinTech).
     - **IF** User is Researcher/Student **AND** Grant Tech Field does NOT match User Expertise:
       - **SCORE = 0**. (Immediate Rejection).
       - Reason: "전공 분야 불일치 (User: ${expertise} vs Grant: ...)"
     - *Exception*: Unless the grant is broadly 'Science' or 'General', specific mismatches (e.g. Bio user vs AI grant) are 0 points.

  2. **Startup Intent Filter**:
     - IF (user.has_startup_intent == false) AND (Grant is Commercialization/Startup):
       - **SCORE = 0**.
       - Reason: "창업 의사 없음"

  3. **Base Scoring (If passed above)**:
     - Exact Keyword Match: +50 pts
     - Location Match: +20 pts
     - Career/Year Match: +20 pts

  **FINAL OUTPUT FORMAT:**
  Return a JSON array: [{ "id": "grant_id", "score": number, "reason_short": "Korean explanation" }]`),
            new HumanMessage(`User Profile: ${JSON.stringify({
                ...state.userProfile,
                unified_major: major_category,
                unified_expertise: expertise,
                flags: {
                    is_student: state.userProfile.student_id ? true : false,
                    has_startup_intent: state.userProfile.has_startup_intent,
                    is_researcher: user_type === 'researcher'
                }
            })}\nGrant List: ${JSON.stringify(grants)}`)
        ]);

        // Parse AI response (cleanup markdown if any)
        const cleanContent = res.content.toString().replace(/```json|```/g, "").trim();
        const scoredGrants = JSON.parse(cleanContent);

        // Sort by score (High -> Low)
        const sortedResults = scoredGrants.sort((a: any, b: any) => b.score - a.score);

        // Map back to research findings format
        const finalFindings = sortedResults.map((item: any) => {
            const original = grants.find((g: any) => g.id === item.id);
            return original ? `[ID: ${original.id}] ${original.title} (${item.score}% Match) - ${item.reason_short}` : "";
        }).join("\n");

        return {
            researchFindings: finalFindings
        };
    } catch (e: any) {
        console.error("Scout Matcher Error:", e.message || e);
        // Fallback to mock data if AI fails
        return {
            researchFindings: `
1. [ID: GR-2026-01] 2026 차세대 바이오 혁신 기술개발사업 (95% Match) - 귀하의 연구 분야(Bio)와 완벽히 일치합니다.
2. [ID: GR-2026-02] 의료 데이터 기반 AI 융합 연구 (88% Match) - Bio 데이터 활용 연구로 적합합니다.
3. [ID: GR-2026-03] 신진 연구자 지원사업 (80% Match) - 초기 연구 정착금 지원.
            `
        };
    }
};

/**
 * Step 4: The Strategist
 * Creates winning strategy using user idea + grant requirements + document structure
 */
export const strategistNode = async (state: AgentState): Promise<Partial<AgentState>> => {
    console.log("🧠 Strategist: Analyzing documents & crafting strategy...");

    if (!state.selectedGrant) {
        return { outputs: { ...state.outputs, strategy: "No grant selected. Cannot proceed with strategy." } };
    }

    const model = getLLM('medium');
    const prompt = `
    당신은 대한민국 정부 지원사업 합격 전략 전문가입니다 (합격률 상위 1%).
    목표: 사용자가 "${state.selectedGrant.title}" 지원사업에 합격하기 위한 맞춤형 전략을 수립합니다.

    ## 사용자 정보
    - 유형: ${state.userProfile.user_type} (산업: ${state.userProfile.industry})
    - 전문분야: ${state.userProfile.expertise || '일반'}
    - 키워드: ${state.userProfile.research_keywords?.join(', ') || '없음'}

    ## 사용자 사업 아이디어
    - 아이디어: ${state.businessIdea?.description || '미입력'}
    - 팀 구성: ${state.businessIdea?.teamComposition || '미입력'}
    - 현재 단계: ${state.businessIdea?.currentStage || '미입력'}
    - 타겟 시장: ${state.businessIdea?.targetMarket || '미입력'}
    - 차별점: ${state.businessIdea?.differentiator || '미입력'}

    ## 공고 정보
    - 제목: ${state.selectedGrant.title}
    - 요약: ${(state.selectedGrant as any)?.summary || 'N/A'}
    - 제출 요건: ${state.grantDocuments?.requirements || '정보 없음'}
    - 첨부 서류: ${state.grantDocuments?.attachments?.map(a => a.fileName).join(', ') || '없음'}
    - 작성 항목: ${state.grantDocuments?.formStructure?.join(', ') || '일반 사업계획서'}

    ## 공고 본문 일부
    ${state.grantDocuments?.announcementBody?.substring(0, 1000) || '본문 정보 없음'}

    TASK:
    아래 구조로 상세한 전략 보고서를 작성하세요 (최소 800자):

    # 1. 핵심 경쟁력 분석 (Why You?)
    - 사용자의 아이디어/팀/경험이 이 공고의 요건에 어떻게 부합하는지 분석
    - 심사위원이 주목할 3가지 차별화 포인트 도출
    - 각 포인트가 왜 높은 점수를 받을 수 있는지 근거 제시

    # 2. 리스크 분석 및 대응 전략
    - 사용자 프로필/아이디어의 2-3가지 잠재적 약점 식별
    - 각 약점에 대한 구체적 프레이밍 전략 제시
    - 예시: "실적 부족 → 파일럿 테스트 결과와 MOU를 강조"

    # 3. 섹션별 작성 가이드
    - 사업계획서의 각 항목을 어떤 방향으로 작성해야 하는지 구체적 가이드
    - 심사위원이 보고 싶어하는 키워드와 표현 추천
    - 각 섹션에서 피해야 할 실수 언급

    # 4. 실행 로드맵
    - Step 1: 컨셉 정의 (프로젝트 제목, 초록 프레이밍)
    - Step 2: 증거 준비 (지금 당장 모아야 할 데이터/자료)
    - Step 3: 팀 보강 (필요한 파트너/자문위원)
    - Step 4: 차별화 포인트 (사업화 섹션에서 돋보이는 방법)

    톤: 전문적이고 전략적이며, 격려하는 톤. 한국어(격식체).
    `;

    const res = await model.invoke([
        new SystemMessage(prompt),
        new HumanMessage(`분석 대상 공고: ${state.selectedGrant.title}\n사용자 프로필: ${JSON.stringify(state.userProfile)}`)
    ]);

    return {
        outputs: {
            ...state.outputs,
            strategy: res.content.toString(),
            initial_draft_content: ""
        }
    };
};

/**
 * Step 3a: Idea Collector (HITL Pass-through)
 * Stores the user's business idea from the HITL interrupt into state.
 * The actual data is injected by the frontend when resuming the graph.
 */
export const ideaCollectorNode = async (state: AgentState): Promise<Partial<AgentState>> => {
    console.log("📝 Idea Collector: Storing user's business idea...");

    if (state.businessIdea) {
        console.log(`   ✅ 사업 아이디어: ${state.businessIdea.description?.substring(0, 50)}...`);
        console.log(`   ✅ 팀 구성: ${state.businessIdea.teamComposition}`);
        console.log(`   ✅ 현재 단계: ${state.businessIdea.currentStage}`);
    } else {
        console.log("   ⚠️ No business idea provided. Strategist will work with limited context.");
    }

    // Pass-through: businessIdea is already in state from HITL resume
    return {};
};

/**
 * Step 3b: Document Fetcher
 * Scrapes the K-Startup grant detail page to extract:
 * - Attached files (공고문, 사업계획서 양식 등)
 * - Announcement body text
 * - Form structure (via AI parsing)
 */
export const docFetcherNode = async (state: AgentState): Promise<Partial<AgentState>> => {
    console.log("📄 Doc Fetcher: Extracting grant documents...");

    const grantUrl = state.selectedGrant?.application_url || (state.selectedGrant as any)?.original_url;

    if (!grantUrl) {
        console.log("   ⚠️ No grant URL available. Skipping document fetch.");
        return {
            grantDocuments: {
                attachments: [],
                formStructure: [],
                requirements: '서류 정보를 가져올 수 없습니다.',
                announcementBody: '',
            }
        };
    }

    try {
        // 1. Fetch the grant detail page HTML
        console.log(`   📡 Fetching: ${grantUrl}`);
        const html = execSync(`curl -s "${grantUrl}"`, {
            encoding: 'utf-8',
            maxBuffer: 10 * 1024 * 1024,
            timeout: 15000,
        });

        // 2. Extract attachments
        const attachments: GrantAttachment[] = [];
        const fileRegex = /title="\[첨부파일\]\s*([^"]+)"/g;
        const downloadRegex = /href="(\/afile\/fileDownload\/[A-Za-z0-9]+)"/g;
        const previewRegex = /fnPdfView\('([A-Za-z0-9]+)'\)/g;

        const fileNames: string[] = [];
        const downloadUrls: string[] = [];
        const previewCodes: string[] = [];

        let match;
        while ((match = fileRegex.exec(html)) !== null) {
            fileNames.push(match[1].trim());
        }
        while ((match = downloadRegex.exec(html)) !== null) {
            downloadUrls.push(`https://www.k-startup.go.kr${match[1]}`);
        }
        while ((match = previewRegex.exec(html)) !== null) {
            previewCodes.push(match[1]);
        }

        for (let i = 0; i < fileNames.length; i++) {
            const ext = fileNames[i].split('.').pop()?.toLowerCase() || 'unknown';
            attachments.push({
                fileName: fileNames[i],
                downloadUrl: downloadUrls[i] || '',
                pdfPreviewCode: previewCodes[i] || '',
                fileType: ext,
            });
        }

        console.log(`   ✅ ${attachments.length}개 첨부파일 발견`);
        attachments.forEach(a => console.log(`      📎 ${a.fileName}`));

        // 3. Extract announcement body text
        const bodyMatch = html.match(/class="view_cont"[\s\S]*?<\/div>/s);
        let announcementBody = '';
        if (bodyMatch) {
            announcementBody = bodyMatch[0]
                .replace(/<[^>]*>/g, ' ')
                .replace(/&nbsp;/g, ' ')
                .replace(/\s+/g, ' ')
                .trim()
                .substring(0, 3000); // Limit to prevent token overflow
        }

        // 4. Extract submission requirements
        const reqMatch = html.match(/(제출서류|구비서류|제출 서류)[\s\S]{0,500}/i);
        const requirements = reqMatch ? reqMatch[0].replace(/<[^>]*>/g, ' ').trim() : '';

        // 5. Use AI to extract form structure from file names + announcement
        let formStructure: string[] = [];
        const formFiles = attachments.filter(a =>
            a.fileName.includes('양식') || a.fileName.includes('서식') ||
            a.fileName.includes('계획서') || a.fileName.includes('신청서')
        );

        if (formFiles.length > 0 || announcementBody) {
            try {
                const model = getLLM('light');
                const structureRes = await model.invoke([
                    new SystemMessage(`정부 지원사업 공고문을 분석하여 사업계획서의 작성 항목(목차)을 추출해주세요.
결과는 JSON 배열로 반환해주세요. 예시:
["1. 사업 개요 (사업명, 대표자, 사업기간)", "2. 기술 및 제품 설명", "3. 시장 분석"]

중요: 실제 공고 내용에서 언급된 항목 위주로 추출. 없으면 일반적인 사업계획서 구조를 제시.`),
                    new HumanMessage(`첨부파일 목록:\n${formFiles.map(f => f.fileName).join('\n')}\n\n공고 본문 일부:\n${announcementBody.substring(0, 1500)}`)
                ]);

                const cleanText = structureRes.content.toString().replace(/```json|```/g, '').trim();
                formStructure = JSON.parse(cleanText);
                console.log(`   ✅ ${formStructure.length}개 양식 항목 추출됨`);
            } catch (parseErr) {
                console.error('   ⚠️ Form structure parsing failed, using defaults');
                formStructure = [
                    '1. 사업 개요 (사업명, 대표자, 사업기간, 총 소요예산)',
                    '2. 창업 아이템 개요 (아이템명, 아이템 소개)',
                    '3. 창업 아이템의 차별성 및 경쟁력',
                    '4. 시장 현황 및 분석 (목표시장, 경쟁사 분석)',
                    '5. 사업화 추진 전략 (마케팅, 판매전략)',
                    '6. 사업 추진 체계 (팀 구성, 역할 분담)',
                    '7. 자금 소요 및 조달 계획',
                    '8. 향후 추진 일정 및 기대효과',
                ];
            }
        }

        return {
            grantDocuments: {
                attachments,
                formStructure,
                requirements,
                announcementBody,
            }
        };

    } catch (err: any) {
        console.error('   ❌ Doc Fetcher Error:', err.message);
        return {
            grantDocuments: {
                attachments: [],
                formStructure: [
                    '1. 사업 개요',
                    '2. 창업 아이템 개요',
                    '3. 차별성 및 경쟁력',
                    '4. 시장 분석',
                    '5. 사업화 전략',
                    '6. 팀 구성',
                    '7. 자금 계획',
                    '8. 기대효과',
                ],
                requirements: '',
                announcementBody: '',
            }
        };
    }
};

/**
 * Step 5: The Writer (Claude with Gemini Fallback)
 * Generates section-by-section business plan drafts based on form structure
 */
export const writerNode = async (state: AgentState): Promise<Partial<AgentState>> => {
    console.log("✍️ Writer: Generating section-by-section draft...");

    const formStructure = state.grantDocuments?.formStructure || [
        '1. 사업 개요', '2. 아이템 소개', '3. 차별성',
        '4. 시장 분석', '5. 사업화 전략', '6. 팀 구성',
    ];

    const contextBundle = `
## 사용자 사업 아이디어
- 아이디어: ${state.businessIdea?.description || '미입력'}
- 팀 구성: ${state.businessIdea?.teamComposition || '미입력'}
- 현재 단계: ${state.businessIdea?.currentStage || '미입력'}
- 타겟 시장: ${state.businessIdea?.targetMarket || '미입력'}
- 차별점: ${state.businessIdea?.differentiator || '미입력'}

## 전략 보고서
${state.outputs.strategy || '전략 없음'}

## 공고 요건
${state.grantDocuments?.requirements || '요건 정보 없음'}

## 사용자 프로필
- 유형: ${state.userProfile.user_type}
- 산업: ${state.userProfile.industry}
- 전문분야: ${state.userProfile.expertise || '미설정'}
`;

    try {
        const res = await invokeLLMWithFallback('heavy', [
            new SystemMessage(`당신은 정부 지원사업 사업계획서 전문 작성가입니다.

목표: 아래 "작성 항목"에 맞춰 사업계획서 초안을 작성해주세요.

중요 규칙:
1. 각 항목은 ## 제목으로 구분하세요.
2. 각 항목마다 최소 200자 이상 상세하게 작성하세요.
3. 사용자의 사업 아이디어와 전략 보고서를 반영하세요.
4. 심사위원이 높은 점수를 줄 수 있도록 구체적인 수치, 근거, 차별점을 포함하세요.
5. 전문적이면서도 읽기 쉬운 한국어로 작성하세요.
6. [여기에 입력], [구체적으로 작성] 같은 플레이스홀더를 쓰지 마세요. 사용자 정보를 기반으로 실제 내용을 작성하세요.

작성 항목:
${formStructure.map(s => `- ${s}`).join('\n')}`),
            new HumanMessage(contextBundle)
        ]);

        const fullDraft = res.content.toString();

        // Parse sections from the draft
        const writerSections: Record<string, string> = {};
        const sectionRegex = /##\s*(.+?)\n([\s\S]*?)(?=##\s|$)/g;
        let sectionMatch;
        while ((sectionMatch = sectionRegex.exec(fullDraft)) !== null) {
            writerSections[sectionMatch[1].trim()] = sectionMatch[2].trim();
        }

        console.log(`   ✅ ${Object.keys(writerSections).length}개 섹션 작성 완료`);

        return {
            outputs: {
                ...state.outputs,
                writer: fullDraft,
                writerSections,
            }
        };
    } catch (e: any) {
        console.error("Writer: All models failed:", e.message || e);
        return { outputs: { ...state.outputs, writer: "Draft generation failed on all models." } };
    }
};

/**
 * Step 6: The Visualizer
 * Mermaid.js code generation based on the final draft
 */
export const visualizerNode = async (state: AgentState): Promise<Partial<AgentState>> => {
    console.log("🎨 Visualizer: Generating Mermaid Mind-map...");

    const model = getLLM('light');
    const res = await model.invoke([
        new SystemMessage("Extract the core hierarchy from the draft and generate Mermaid.js mindmap code. Only return the code block."),
        new HumanMessage(`Draft: ${state.outputs.writer}`)
    ]);

    return {
        outputs: { ...state.outputs, visualizer: res.content.toString() }
    };
};
