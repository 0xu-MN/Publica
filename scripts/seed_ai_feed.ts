
import { createClient } from '@supabase/supabase-js';

// Configuration
// NOTE: These should ideally be in .env, but for this script usage we'll use the client defaults or placeholders.
// You need to fill these in to run the script if they aren't available in process.env
const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || 'YOUR_SUPABASE_URL';
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'YOUR_SUPABASE_ANON_KEY';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const feedItems = [
    {
        headline: 'AI 반도체의 미래: HBM4가 가져올 패러다임 변화',
        body: `AI 학습 데이터의 폭발적 증가로 메모리 대역폭이 연산 속도의 병목이 되고 있습니다. HBM4는 이를 해결할 '게임 체인저'로 평가받습니다.

✅ 핵심 이슈
삼성전자와 SK하이닉스, 그리고 TSMC의 3각 협력이 본격화되고 있습니다.
- 16단 적층 기술의 수율 안정화가 최대 관건입니다.
- 하이브리드 본딩 기술 도입으로 패키징 두께를 획기적으로 줄였습니다.
- 엔비디아 루빈(Rubin) 칩셋에 전량 탑재될 예정으로, 초기 물량 확보 전쟁이 치열합니다.`,
        aiInsight: '💡 결론\nHBM4는 단순한 메모리를 넘어 로직 다이와 결합된 "시스템 메모리"로 진화하고 있습니다. 2026년 하반기, 이 기술을 선점하는 기업이 향후 AI 인프라 시장의 70%를 독식할 것으로 전망됩니다.',
        bullets: ['#HBM4', '#반도체', '#AI인프라'], // mapped to tags
        related_materials: [
            { title: 'SK하이닉스 HBM4 로드맵 공식 발표', url: 'https://news.skhynix.co.kr' },
            { title: 'TrendForce: 2026 메모리 시장 전망', url: 'https://www.trendforce.com' },
            { title: 'TSMC CoWoS 기술 백서', url: 'https://www.tsmc.com' }
        ]
    },
    {
        headline: '미국 연준(Fed), 2026년 금리 정책 대전환 예고',
        body: `미국 노동시장이 완전 고용 상태에 근접하면서, 연준이 마침내 비둘기파적 기조로 돌아섰습니다. 이는 글로벌 자산 배분의 거대한 이동을 예고합니다.

✅ 핵심 이슈
제롬 파월 의장은 "인플레이션과의 전쟁은 끝났다"고 선언했습니다.
1. "실질 금리 중립화": 현재 3.5% 수준인 기준 금리를 2.5%까지 단계적으로 인하할 로드맵을 제시했습니다.
2. "유동성 공급 확대": 양적 긴축(QT)을 종료하고 시장에 다시 유동성을 공급하기 시작했습니다.
3. "이머징 마켓의 반격": 달러 약세 기조 속에서 한국을 포함한 신흥국 증시로의 자금 유입이 가속화될 것입니다.`,
        aiInsight: '💡 결론\n"공포를 사고 환희에 팔아라"는 격언이 다시 유효해지는 시점입니다. 고금리 시대에 소외되었던 바이오, 신재생에너지, 그리고 AI 소프트웨어 섹터가 금리 인하의 최대 수혜를 입을 ‘주도주’로 부상할 것입니다.',
        bullets: ['#금리인하', '#거시경제', '#투자전략'],
        related_materials: [
            { title: 'FOMC 의사록 전문 (2026.01)', url: 'https://www.federalreserve.gov' },
            { title: 'WSJ: 월가의 금리 인하 기대감 분석', url: 'https://www.wsj.com' },
            { title: 'IMF 세계 경제 전망 보고서', url: 'https://www.imf.org' }
        ]
    },
    {
        headline: '양자 컴퓨터 상용화: 보안의 새로운 시대',
        body: `구글과 IBM이 100만 큐비트급 양자 프로세서 안정화에 성공했습니다. 이는 기존 RSA 암호 체계의 종말을 의미합니다.

✅ 핵심 이슈
양자 내성 암호(PQC)로의 전환은 선택이 아닌 생존의 문제입니다.
- "Show's Algorithm"의 현실화: 기존 슈퍼컴퓨터로 1만 년 걸릴 암호 해독이 단 몇 시간 만에 가능해졌습니다.
- 금융권의 비상: 전 세계 은행들이 레거시 시스템을 PQC 기반으로 전면 교체하는 '보안 대이동'을 시작했습니다.
- 국가 안보 위협: 군사 기밀 및 정부 통신망의 보안 체계가 근본적인 도전에 직면했습니다.`,
        aiInsight: '💡 결론\n양자 보안은 단순한 기술 트렌드가 아닙니다. 다가오는 "Y2Q(Year to Quantum)" 위기에 대비하지 못한 기업과 국가는 디지털 주권을 잃게 될 것입니다. 보안 솔루션 기업들의 주가 재평가가 시급합니다.',
        bullets: ['#양자컴퓨팅', '#PQC', '#사이버보안'],
        related_materials: [
            { title: 'NIST PQC 표준 가이드라인', url: 'https://www.nist.gov' },
            { title: 'Nature: 양자 오류 수정 기술의 진보', url: 'https://www.nature.com' },
            { title: 'IBM Quantum Roadmap 2026', url: 'https://www.ibm.com/quantum' }
        ]
    },
    {
        headline: '2026년 글로벌 에너지 시장: 수소 경제의 부상',
        body: `탄소 중립 실현을 위한 마지막 퍼즐 조각, '그린 수소'의 생산 단가가 티핑 포인트(kg당 2달러) 이하로 하락했습니다.

✅ 핵심 이슈
중동의 오일머니가 수소 인프라로 대거 이동하고 있습니다.
1. "네옴시티 프로젝트": 사우디아가 세계 최대 규모의 그린 수소 플랜트 가동을 시작했습니다.
2. "수소 운송 혁명": 액화 수소 운반선 발주량이 LNG 선박을 추월했습니다. 한국 조선업계의 새로운 먹거리입니다.
3. 에너지 안보: 화석 연료 의존도를 낮추려는 유럽의 공격적인 보조금 정책이 시장 확대를 견인하고 있습니다.`,
        aiInsight: '💡 결론\n수소는 더 이상 미래의 에너지가 아닙니다. 생산-운송-활용 전 밸류체인에서 실제 수익이 창출되는 구간에 진입했습니다. 인프라 구축 관련 기업들이 초기 시장을 장악하며 제2의 테슬라가 될 가능성이 큽니다.',
        bullets: ['#수소경제', '#친환경', '#조선업'],
        related_materials: [
            { title: 'IEA 2026 Energy Outlook', url: 'https://www.iea.org' },
            { title: 'BloombergNEF: Hydrogen Market Report', url: 'https://about.bnef.com' },
            { title: 'EU 수소 전략 백서', url: 'https://ec.europa.eu' }
        ]
    }
];

async function seedData() {
    console.log('🌱 Seeding AI Feed Data...');

    // Check if table exists (simple check)
    const { error: checkError } = await supabase.from('cards').select('count').limit(1);

    if (checkError) {
        console.error('❌ Error connecting to "cards" table. Please run the SQL setup manually from the walkthrough or dashboard.');
        console.error(checkError);
        return;
    }

    const { data: existingData } = await supabase.from('cards').select('id');
    if (existingData && existingData.length > 0) {
        console.log('ℹ️ Database already has data. Skipping seed to prevent duplicates (or run with --force to overwrite).');
        // For this demo, we can just insert anyway or delete. Let's just append.
    }

    // Insert loop
    for (const item of feedItems) {
        // We store the structured content as a JSON string in the 'content' column to be flexible
        const contentPayload = JSON.stringify(item);

        const { error } = await supabase.from('cards').insert({
            content: contentPayload,
            created_at: new Date().toISOString()
        });

        if (error) {
            console.error(`❌ Failed to insert card: ${item.headline}`, error);
        } else {
            console.log(`✅ Inserted: ${item.headline}`);
        }
    }

    console.log('✨ Seeding complete!');
}

seedData();
