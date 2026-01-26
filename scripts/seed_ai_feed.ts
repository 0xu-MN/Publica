
import { createClient } from '@supabase/supabase-js';

// Configuration
const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://ltoqdapmhyxwosxbpaip.supabase.co';
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx0b3FkYXBtaHl4d29zeGJwYWlwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc3NTc2MTAsImV4cCI6MjA4MzMzMzYxMH0.gopYg-bzv84R_qCUbf25RTtULqDsxTdbl7jz45fHQm4';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ------------------------------------------------------------------
// InsightFlow AI Feed Seeder
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

const feedItems = [
    // --- SCIENCE 카테고리 ---
    {
        headline: 'HBM4 반도체 경쟁, 수율이 승부처',
        teaser: '16단 적층 기술... 한국 반도체 업체들의 기술 경쟁',
        body: 'HBM4는 차세대 AI 반도체의 핵심 메모리로, 16단 적층 기술이 적용됩니다. 삼성전자와 SK하이닉스가 양산 경쟁을 벌이고 있으며, 하이브리드 본딩 공정의 수율 안정화가 관건입니다. 한국 반도체 장비 업체들은 이 기술 수요로 성장이 예상되며, 연구자들은 적층 최적화 기술에 주목해야 합니다.',
        bullets: ['16단 적층 대역폭 향상', '하이브리드 본딩 핵심 공정', '한국 장비 업체 수혜', '2026년 양산 목표'],
        image_prompt: 'Advanced semiconductor chip layers, blue technology visualization',
        imageUrl: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=800&auto=format&fit=crop',
        related_materials: [],
        category: 'Science'
    },
    {
        headline: '양자 내성 암호 전환, 금융권 과제',
        teaser: '양자컴퓨터 시대 대비... 보안 시스템 재구축 필요',
        body: '양자컴퓨터 발전으로 기존 암호 체계의 안전성이 위협받고 있습니다. 미국 NIST가 양자 내성 암호 표준을 발표하며, 금융 기관들은 시스템 전환 준비에 나서고 있습니다. 한국 금융권도 조기 도입을 검토 중이며, 보안 솔루션 기업들의 기술 개발이 활발해질 전망입니다.',
        bullets: ['양자컴퓨터 보안 위협 증가', 'NIST 표준 발표', '금융권 시스템 전환', '보안 기업 기회 확대'],
        image_prompt: 'Quantum security concept with encrypted network, cyan digital art',
        imageUrl: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=800&auto=format&fit=crop',
        related_materials: [],
        category: 'Science'
    },
    {
        headline: '소형원전 SMR, AI 전력 해법 주목',
        teaser: '데이터센터 전력 급증... 안정적 공급원 필요',
        body: 'AI 데이터센터의 전력 소비가 급증하면서 소형모듈원전(SMR)이 대안으로 떠오르고 있습니다. 빅테크 기업들이 SMR 기술에 투자하며, 기존 원전 대비 안전성과 유연성이 강점입니다. 한국 원자력 기술 기업들은 글로벌 협력 기회를 모색할 수 있으며, 분산형 에너지 연구가 확대될 것으로 보입니다.',
        bullets: ['AI 데이터센터 전력 수요', '빅테크 SMR 투자', '안전성과 유연성 장점', '한국 기업 협력 기회'],
        image_prompt: 'Modern small modular reactor with clean energy theme, professional',
        imageUrl: 'https://images.unsplash.com/photo-1541185933-710f5092f470?w=800&auto=format&fit=crop',
        related_materials: [],
        category: 'Science'
    },
    {
        headline: 'mRNA 암 치료제, 임상 성과 주목',
        teaser: '코로나 백신 넘어... 맞춤형 항암제로 확대',
        body: 'mRNA 기술이 암 치료제 개발로 확장되며 바이오 산업의 새로운 장을 열고 있습니다. 모더나와 화이자가 개인 맞춤형 암 백신 임상에서 긍정적 결과를 보이고 있습니다. 한국 바이오 기업들은 mRNA 제조 기술 확보에 나서고 있으며, 면역 반응 최적화 연구가 핵심입니다.',
        bullets: ['암 치료제 적용 확대', '맞춤형 백신 임상 성과', '한국 제조 기술 확보', '면역 최적화 연구 중요'],
        image_prompt: 'mRNA medical breakthrough visualization, scientific illustration green',
        imageUrl: 'https://images.unsplash.com/photo-1518546305927-5a555bb7020d?w=800&auto=format&fit=crop',
        related_materials: [],
        category: 'Science'
    },

    // --- ECONOMY 카테고리 ---
    {
        headline: '저출산 심화, 내수 시장 변화 불가피',
        teaser: '생산가능인구 감소... 경제 구조 재편 필요',
        body: '합계출산율 0.6명대 진입으로 생산가능인구 감소가 가속화되고 있습니다. 내수 시장 축소로 소비 산업 재편이 예상되며, 자동화와 효율성 개선이 필수적입니다. 투자자들은 인구 변화에 적응하는 기업들의 전략을 주시해야 하며, 연금 제도 지속 가능성 논의도 활발해질 전망입니다.',
        bullets: ['생산인구 지속 감소', '내수 시장 축소 전망', '자동화 투자 필수', '적응형 기업 주목'],
        image_prompt: 'Demographic change economic impact chart, neutral professional tones',
        imageUrl: 'https://images.unsplash.com/photo-1611974765270-ca12586343bb?w=800&auto=format&fit=crop',
        related_materials: [],
        category: 'Economy'
    },
    {
        headline: '환율 1300원대 안정화, 수출 전략 변화',
        teaser: '고환율 지속... 기업 대응 전략 주목',
        body: '원-달러 환율이 1300원대에서 안정화되며 고환율 기조가 지속될 전망입니다. 수출 기업들은 가격 경쟁력 향상 효과를 보지만, 원자재 비용 증가로 수익성 관리가 중요합니다. 투자자들은 환헤지 전략 점검이 필요하며, 수출 비중 높은 기업들의 실적 개선이 예상됩니다.',
        bullets: ['1300원대 환율 유지', '수출 경쟁력 향상', '원자재 비용 관리 필요', '환헤지 전략 점검'],
        image_prompt: 'Currency exchange global trade concept, green gradient financial',
        imageUrl: 'https://images.unsplash.com/photo-1579532537598-459ecdaf39cc?w=800&auto=format&fit=crop',
        related_materials: [],
        category: 'Economy'
    },
    {
        headline: '부동산 PF 구조조정, 4월 분기점',
        teaser: '브릿지론 만기... 사업장별 차별화 예상',
        body: '부동산 PF 브릿지론 만기가 4월에 집중되며 구조조정 압력이 커지고 있습니다. 사업성 낮은 지방 사업장은 정리가 불가피하나, 수도권 우량 사업장은 유동성 지원으로 안정화될 전망입니다. 투자자들은 시장 조정기를 선별적 매수 기회로 활용할 수 있으며, 안전 자산 선호 현상에 유의해야 합니다.',
        bullets: ['4월 만기 집중', '지방 사업장 정리 예상', '수도권은 안정적', '조정기 매수 기회'],
        image_prompt: 'Real estate market restructuring analysis, gray blue professional',
        imageUrl: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800&auto=format&fit=crop',
        related_materials: [],
        category: 'Economy'
    },
    {
        headline: '반도체 슈퍼사이클, 2026년 연장',
        teaser: 'AI 투자 확대... 메모리·시스템 동반 성장',
        body: 'AI 인프라 투자 확대로 반도체 슈퍼사이클이 2026년에도 이어질 전망입니다. 메모리는 HBM 중심으로 고성장이 예상되며, 시스템 반도체는 AI 가속기 수요가 증가하고 있습니다. 한국 기업들은 기술 우위로 시장 점유율을 확대 중이며, 장기 성장 전망이 긍정적입니다.',
        bullets: ['AI 투자로 사이클 연장', 'HBM 중심 성장', 'AI 가속기 수요 증가', '한국 기업 점유율 확대'],
        image_prompt: 'Semiconductor growth chart with AI theme, blue technology visual',
        imageUrl: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&auto=format&fit=crop',
        related_materials: [],
        category: 'Economy'
    }
];

async function seedData() {
    console.log('🌱 InsightFlow AI Feed Seeding...');
    console.log('슬로건: "검색을 넘어 실행으로, 정보를 넘어 자본으로."');

    // 테이블 존재 여부 확인
    const { error: checkError } = await supabase.from('cards').select('count').limit(1);

    if (checkError) {
        console.error('❌ Error connecting to "cards" table. Please ensure the table is created.');
        console.error(checkError);
        return;
    }

    const { data: existingData } = await supabase.from('cards').select('id');
    if (existingData && existingData.length > 0) {
        console.log('ℹ️  Database already has data. Appending new items...');
    }

    // 데이터 삽입
    for (const item of feedItems) {
        const contentPayload = JSON.stringify(item);

        const { error } = await supabase.from('cards').insert({
            content: contentPayload,
            created_at: new Date().toISOString()
        });

        if (error) {
            console.error(`❌ Failed to insert card: ${item.headline}`, error);
        } else {
            console.log(`✅ Inserted [${item.category}]: ${item.headline}`);
        }
    }

    console.log('✨ Seeding complete!');
    console.log(`📊 Total items inserted: ${feedItems.length}`);
    console.log(`   - Science: ${feedItems.filter(i => i.category === 'Science').length}`);
    console.log(`   - Economy: ${feedItems.filter(i => i.category === 'Economy').length}`);
}

seedData();
