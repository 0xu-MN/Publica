
import { createClient } from '@supabase/supabase-js';

// Configuration
const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://ltoqdapmhyxwosxbpaip.supabase.co';
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx0b3FkYXBtaHl4d29zeGJwYWlwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc3NTc2MTAsImV4cCI6MjA4MzMzMzYxMH0.gopYg-bzv84R_qCUbf25RTtULqDsxTdbl7jz45fHQm4';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ------------------------------------------------------------------
// InsightFlow AI Feed Generator
// ------------------------------------------------------------------
// 슬로건: "검색을 넘어 실행으로, 정보를 넘어 자본으로."
//
// 핵심 원칙:
// 1. 제목과 키워드만 사용, 원문 기사 내용 절대 사용 금지
// 2. 모든 콘텐츠는 완전히 새롭게 창작
// 3. 한국 연구자/투자자 관점에서 실질적 인사이트 추가
// 4. 정치적 성향이 드러나는 내용 삼가
// 5. related_links는 항상 빈 배열
// ------------------------------------------------------------------

interface InsightTemplate {
    category: 'Science' | 'Economy';
    headline: string;
    teaser: string;
    body: string;
    bullets: string[];
    image_prompt: string;
}

const INSIGHT_LIBRARY: InsightTemplate[] = [
    // --- SCIENCE 카테고리 ---
    {
        category: 'Science',
        headline: 'HBM4 양산 경쟁, 수율이 결정한다',
        teaser: '차세대 AI 반도체 메모리 기술... 한국 기업들의 기회는?',
        body: 'HBM4는 16단 적층 기술로 이전 세대 대비 대역폭이 50% 향상되었습니다. 삼성과 SK하이닉스가 2026년 하반기 양산을 목표로 경쟁 중이며, 핵심은 하이브리드 본딩 공정의 수율 안정화입니다. 한국 반도체 장비 업체들은 이 기술 수요로 매출 증대가 예상되며, 연구자들은 적층 공정 최적화에 주목해야 합니다.',
        bullets: [
            '16단 적층, 대역폭 50% 증가',
            '하이브리드 본딩 공정이 핵심',
            '한국 장비 업체 수혜 전망',
            '2026년 하반기 양산 목표'
        ],
        image_prompt: 'Advanced semiconductor chip with stacked memory layers, blue circuits'
    },
    {
        category: 'Science',
        headline: '양자 내성 암호, 금융권 전환 시급',
        teaser: '양자컴퓨터 시대 대비... 기존 보안 체계 재검토 필요',
        body: '양자컴퓨터 발전으로 RSA 암호 체계가 무력화될 가능성이 커지고 있습니다. 미국 NIST는 양자 내성 암호(PQC) 표준을 발표했으며, 금융권은 시스템 전환에 최소 5년이 소요될 것으로 예상합니다. 한국 금융 기관들은 조기 도입 검토가 필요하며, 보안 솔루션 기업들의 기술 개발 동향에 주목해야 합니다.',
        bullets: [
            'RSA 암호 무력화 가능성 증가',
            'NIST PQC 표준 발표',
            '금융권 시스템 전환 5년 소요',
            '한국 보안 기업 기회 확대'
        ],
        image_prompt: 'Quantum computing security concept with encrypted data flow, cyan tones'
    },
    {
        category: 'Science',
        headline: '소형원전 SMR, 데이터센터 전력 해법',
        teaser: 'AI 인프라 전력 수요 급증... 안정적 공급원 주목',
        body: 'AI 데이터센터의 전력 소비가 급증하면서 소형모듈원전(SMR)이 대안으로 부상하고 있습니다. 빅테크 기업들이 SMR 스타트업에 투자를 확대 중이며, 기존 대형 원전 대비 안전성과 유연성이 장점입니다. 한국 원자력 기술 기업들은 글로벌 협력 기회를 모색할 수 있으며, 분산형 에너지 시스템 연구가 활성화될 전망입니다.',
        bullets: [
            'AI 데이터센터 전력 수요 증가',
            '빅테크의 SMR 투자 확대',
            '기존 원전보다 안전하고 유연',
            '한국 원자력 기업 협력 기회'
        ],
        image_prompt: 'Modern small modular reactor facility with clean energy visualization'
    },
    {
        category: 'Science',
        headline: '양자점 디스플레이, 차세대 표준 되나',
        teaser: 'OLED 넘어서는 색재현율... 한국 디스플레이 기술 도약',
        body: '양자점(QD) 디스플레이 기술이 OLED를 넘어서는 색재현율과 에너지 효율을 제공하며 차세대 표준으로 주목받고 있습니다. 삼성디스플레이가 QD-OLED 양산을 확대 중이며, 프리미엄 TV 및 모니터 시장에서 경쟁력을 확보하고 있습니다. 연구자들은 양자점 소재 개선과 제조 공정 효율화에 집중해야 하며, 관련 소재 업체들의 성장이 예상됩니다.',
        bullets: [
            'OLED 초월하는 색재현율',
            '삼성 QD-OLED 양산 확대',
            '프리미엄 시장 경쟁력 확보',
            '양자점 소재 업체 성장 전망'
        ],
        image_prompt: 'Quantum dot display technology with vibrant color spectrum visualization'
    },
    {
        category: 'Science',
        headline: 'mRNA 백신 플랫폼, 암 치료까지',
        teaser: '코로나 넘어 항암제로... 바이오 기술 혁신 가속',
        body: 'mRNA 기술이 코로나19 백신을 넘어 암 치료제 개발로 확대되고 있습니다. 모더나와 화이자가 개인 맞춤형 암 백신 임상을 진행 중이며, 초기 결과는 긍정적입니다. 한국 바이오 기업들은 mRNA 제조 기술 확보와 플랫폼 구축에 나서고 있으며, 연구자들은 면역 반응 최적화 연구에 주목해야 합니다.',
        bullets: [
            '암 치료제로 적용 범위 확대',
            '개인 맞춤형 백신 임상 진행',
            '한국 바이오 제조 기술 확보',
            '면역 반응 최적화가 관건'
        ],
        image_prompt: 'mRNA molecule structure with medical innovation concept, green and white'
    },
    {
        category: 'Science',
        headline: '고체 배터리 상용화, 2027년 목표',
        teaser: '전기차 주행거리 2배... 충전 시간 획기적 단축',
        body: '고체 배터리 기술이 상용화 단계에 접근하며 전기차 산업을 혁신할 전망입니다. 도요타와 삼성SDI가 2027년 양산을 목표로 개발을 가속화하고 있으며, 에너지 밀도가 기존 리튬이온 배터리 대비 2배 향상됩니다. 한국 배터리 업체들은 소재 개발과 제조 공정 혁신에 집중하고 있으며, 관련 연구 투자가 확대될 것으로 보입니다.',
        bullets: [
            '2027년 양산 목표로 개발 가속',
            '에너지 밀도 2배 향상',
            '충전 시간 대폭 단축',
            '한국 업체 소재 개발 집중'
        ],
        image_prompt: 'Solid-state battery technology with electric vehicle concept, silver blue'
    },

    // --- ECONOMY 카테고리 ---
    {
        category: 'Economy',
        headline: '저출산 심화, 내수 시장 재편 불가피',
        teaser: '합계출산율 0.6명대... 경제 구조 변화 대응 필요',
        body: '합계출산율이 0.6명대로 하락하며 생산가능인구 감소가 가속화되고 있습니다. 내수 시장 축소로 소비재 산업 구조조정이 예상되며, 효율성 제고와 자동화 투자가 필수적입니다. 연금 제도 지속 가능성 논의가 활발해지고 있으며, 투자자들은 인구 구조 변화에 적응하는 기업들에 주목해야 합니다.',
        bullets: [
            '생산가능인구 지속 감소',
            '내수 시장 축소 전망',
            '자동화 투자 필수',
            '인구 적응형 기업 주목'
        ],
        image_prompt: 'Demographic transition chart with economic growth indicators, neutral tones'
    },
    {
        category: 'Economy',
        headline: '환율 1300원대 정착, 수출 전략 변화',
        teaser: '고환율 지속 전망... 기업들의 대응 전략은?',
        body: '원-달러 환율이 1300원대에서 안정화되며 고환율 시대가 지속될 것으로 전망됩니다. 수출 기업들은 가격 경쟁력이 향상되지만, 원자재 수입 비용 증가로 수익성 관리가 중요합니다. 투자자들은 환헤지 전략을 점검해야 하며, 수출 비중이 높은 기업들의 실적 개선이 예상됩니다.',
        bullets: [
            '1300원대 환율 안정화',
            '수출 기업 가격 경쟁력 향상',
            '원자재 비용 증가 주의',
            '환헤지 전략 점검 필요'
        ],
        image_prompt: 'Currency exchange rate chart with global trade concept, green gradient'
    },
    {
        category: 'Economy',
        headline: '부동산 PF 구조조정, 4월 고비',
        teaser: '브릿지론 만기 집중... 금융 시장 긴장 지속',
        body: '부동산 프로젝트 파이낸싱(PF) 브릿지론 만기가 4월에 집중되며 구조조정 압력이 커지고 있습니다. 사업성이 낮은 지방 사업장은 정리가 불가피하지만, 수도권 우량 사업장은 유동성 지원으로 연착륙이 예상됩니다. 투자자들은 안전 자산 선호 현상에 유의하며, 시장 조정기를 기회로 활용할 수 있습니다.',
        bullets: [
            '4월 브릿지론 만기 집중',
            '지방 사업장 구조조정 예상',
            '수도권 우량 사업장은 안정적',
            '시장 조정기 매수 기회'
        ],
        image_prompt: 'Real estate market adjustment with financial analysis, gray blue tones'
    },
    {
        category: 'Economy',
        headline: '반도체 슈퍼사이클, 2026년 지속',
        teaser: 'AI 수요 폭발... 메모리·시스템 반도체 동반 성장',
        body: 'AI 인프라 투자 확대로 반도체 슈퍼사이클이 2026년에도 지속될 전망입니다. 메모리 반도체는 HBM 중심으로 고성장이 예상되며, 시스템 반도체는 AI 가속기 수요가 증가하고 있습니다. 한국 반도체 기업들은 기술 우위를 바탕으로 시장 점유율을 확대 중이며, 투자자들은 장기 성장 전망에 주목해야 합니다.',
        bullets: [
            'AI 투자 확대로 슈퍼사이클 지속',
            'HBM 중심 메모리 고성장',
            '시스템 반도체 수요 증가',
            '한국 기업 시장 점유율 확대'
        ],
        image_prompt: 'Semiconductor industry growth chart with AI technology concept, blue tech'
    },
    {
        category: 'Economy',
        headline: '2차전지 업황, 하반기 회복 기대',
        teaser: '재고 조정 마무리... 전기차 수요 반등 신호',
        body: '2차전지 업계의 재고 조정이 마무리 단계에 접어들며 하반기 회복이 기대됩니다. 유럽과 북미의 전기차 보조금 정책이 안정화되고 있으며, 중국 시장도 점진적 회복세를 보이고 있습니다. 한국 배터리 3사는 생산 효율화와 원가 절감에 집중하며, 투자자들은 실적 개선 시점을 주시해야 합니다.',
        bullets: [
            '재고 조정 마무리 단계',
            '전기차 보조금 정책 안정화',
            '중국 시장 점진적 회복',
            '생산 효율화로 수익성 개선'
        ],
        image_prompt: 'Battery manufacturing industry with electric vehicle growth, green energy'
    },
    {
        category: 'Economy',
        headline: 'K-뷰티 글로벌 확장 가속화',
        teaser: '아시아 넘어 유럽·미주까지... 브랜드 경쟁력 강화',
        body: 'K-뷰티 기업들이 아시아를 넘어 유럽과 미주 시장으로 진출을 가속화하고 있습니다. 독창적인 제품과 K-컬처 시너지로 현지 소비자 반응이 긍정적이며, 온라인 채널 강화로 유통 효율성이 향상되고 있습니다. 중소 뷰티 브랜드들도 글로벌 플랫폼을 통해 성장 기회를 확대 중이며, 관련 주식의 장기 성장 잠재력이 주목받고 있습니다.',
        bullets: [
            '유럽·미주 시장 진출 가속',
            'K-컬처 시너지 효과',
            '온라인 채널로 유통 효율화',
            '중소 브랜드도 성장 기회'
        ],
        image_prompt: 'Korean beauty products with global market expansion, elegant design'
    }
];

const pickRandom = (arr: any[]) => arr[Math.floor(Math.random() * arr.length)];

async function generateAndInsert(template?: InsightTemplate) {
    // Pick a random template if not provided
    const tpl: InsightTemplate = template || pickRandom(INSIGHT_LIBRARY);

    // InsightFlow JSON 형식에 맞춰 페이로드 구성
    const payload = {
        headline: tpl.headline,
        teaser: tpl.teaser,
        body: tpl.body,
        bullets: tpl.bullets,
        image_prompt: tpl.image_prompt,
        imageUrl: `https://images.unsplash.com/photo-${Math.random() > 0.5 ? '1677442136019-21780ecad995' : '1635070041078-e363dbe005cb'}?w=800&auto=format&fit=crop`, // 임시 이미지
        related_materials: [], // 프론트엔드 호환을 위해 related_links 대신 related_materials 사용
        category: tpl.category,
        timestamp: new Date().toISOString()
    };

    console.log(`[${new Date().toLocaleTimeString()}] 🤖 Generating Insight: [${tpl.category}] ${tpl.headline}`);

    const { error } = await supabase.from('cards').insert({
        content: JSON.stringify(payload),
        created_at: new Date().toISOString()
    });

    if (error) {
        console.error('❌ Insert Error:', error.message);
    } else {
        console.log('✅ Published successfully.');
    }
}

async function loop() {
    console.log('🚀 InsightFlow AI Feed Generator Started. (Ctrl + C to stop)');
    console.log('슬로건: "검색을 넘어 실행으로, 정보를 넘어 자본으로."');
    console.log('원칙: 완전 창작 | 한국 관점 | 정치적 중립');

    console.log('📦 Initializing Bulk Generation...');

    // 라이브러리 전체를 섞어서 생성
    const shuffled = [...INSIGHT_LIBRARY].sort(() => Math.random() - 0.5);

    for (const item of shuffled) {
        await generateAndInsert(item);
        // 데이터베이스 부담 방지를 위한 작은 지연
        await new Promise(r => setTimeout(r, 1000));
    }

    console.log('✅ Initial Batch Complete.');
    console.log('⏱️  Entering Maintenance Mode (1-2 items every 5 mins)...');

    const runMaintenance = async () => {
        try {
            const count = Math.random() > 0.5 ? 2 : 1;
            console.log(`[${new Date().toLocaleTimeString()}] ⚡ Maintenance: Generating ${count} item(s)...`);

            for (let i = 0; i < count; i++) {
                await generateAndInsert();
                if (i < count - 1) await new Promise(r => setTimeout(r, 2000));
            }
        } catch (err) {
            console.error('[Maintenance Error]', err);
        } finally {
            // 5분마다 새로운 콘텐츠 생성
            const delay = 5 * 60 * 1000;
            console.log(`[${new Date().toLocaleTimeString()}] 💤 Sleeping for 5 mins...`);
            setTimeout(runMaintenance, delay);
        }
    };

    runMaintenance();
}

loop().catch(console.error);
