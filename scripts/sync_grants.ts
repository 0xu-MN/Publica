import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

// 1. Load Environment Variables
dotenv.config({ path: resolve(__dirname, '../.env') });

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Error: SUPABASE_URL or SUPABASE_ANON_KEY is missing in .env');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * 2. Mock External API Fetcher
 * Simulates fetching data from K-Startup or Public Data Portal
 */
async function fetchExternalGrants() {
    console.log('Fetching data from External API (Mock)...');

    // Simulating external data format (often nested or using different keys)
    const externalResponse = [
        {
            p_id: 'EXT-001',
            prog_nm: '[K-Startup] 2026 글로벌 창업사관학교 입교팀 모집',
            org: '창업진흥원',
            deadline: '2026-03-31',
            target: '7년 이내 창업기업',
            field: 'AI, Big Data, Cloud',
            desc: '글로벌 진출을 희망하는 AI 특화 창업팀을 선발하여 교육 및 사업화 자금을 지원합니다.',
            type: '사업화'
        },
        {
            p_id: 'EXT-002',
            prog_nm: 'AI 바우처 지원사업 (수요기업 추가모집)',
            org: '정보통신산업진흥원',
            deadline: '2026-04-15',
            target: '중소/벤처기업',
            field: 'AI',
            desc: 'AI 솔루션 도입이 필요한 수요기업에게 바우처를 지원합니다.',
            type: 'Voucher'
        },
        {
            p_id: 'EXT-003',
            prog_nm: '산학연 Collabo R&D (예비연구)',
            org: '중소기업기술정보진흥원',
            deadline: '2026-05-10',
            target: '대학/연구소 및 기업 컨소시엄',
            field: '전기술분야',
            desc: '기업과 연구기관의 공동 기술개발을 지원하는 R&D 사업입니다.',
            type: 'R&D'
        },
        {
            p_id: 'EXT-004',
            prog_nm: '청년 고용 플러스 정책자금',
            org: '중소벤처기업진흥공단',
            deadline: '2026-12-31',
            target: '청년 채용 비중이 높은 기업',
            field: '전분야',
            desc: '청년 일자리 창출을 위한 초저금리 융자 지원입니다.',
            type: 'Policy Fund'
        },
        {
            p_id: 'EXT-005',
            prog_nm: '핀테크 혁신 펀드 투자 유치 프로그램',
            org: '한국핀테크지원센터',
            deadline: '2026-06-20',
            target: '핀테크 스타트업',
            field: 'Fintech',
            desc: '국내외 투자 유치를 위한 IR 컨설팅 및 매칭 프로그램입니다.',
            type: 'Commercialization'
        }
        // ... (Adding more items to reach 10-20 as requested)
    ];

    // Duplicate samples to fill up to 15 items for diversity
    const additionalItems = Array.from({ length: 10 }).map((_, i) => ({
        p_id: `EXT-EXTRA-${i}`,
        prog_nm: `[공고] 2026 테크 스타트업 육성 ${i + 1}호`,
        org: i % 2 === 0 ? '서울산업진흥원' : '경기창조경제혁신센터',
        deadline: `2026-07-${10 + i}`,
        target: '예비창업자 및 3년 이내 스타트업',
        field: i % 3 === 0 ? 'SaaS' : i % 3 === 1 ? 'HealthTech' : 'DeepTech',
        desc: '유망 기술 스타트업의 성장을 돕는 맞춤형 액셀러레이팅 프로그램입니다.',
        type: i % 4 === 0 ? 'R&D' : i % 4 === 1 ? 'Voucher' : i % 4 === 2 ? 'Policy Fund' : 'Commercialization'
    }));

    return [...externalResponse, ...additionalItems];
}

/**
 * 3. Mapping Function
 * Converts external API format to internal Supabase 'grants' schema
 */
function mapToInternalSchema(ext: any) {
    return {
        title: ext.prog_nm,
        agency: ext.org,
        d_day: `D-${Math.floor(Math.random() * 60) + 5}`, // Mock D-Day calculation
        target_audience: ext.target,
        tech_field: ext.field,
        summary: ext.desc.substring(0, 100) + '...',
        description: ext.desc,
        category: ext.type,
        link: 'https://www.k-startup.go.kr', // Default mock link
        updated_at: new Date().toISOString()
    };
}

/**
 * 4. Main Sync Logic
 */
async function sync() {
    console.log('Starting Grant Synchronization...');

    try {
        const rawData = await fetchExternalGrants();
        const mappedData = rawData.map(mapToInternalSchema);

        console.log(`Upserting ${mappedData.length} items to Supabase...`);

        // Use 'title' as the deduplication key for this MVP
        const { data, error } = await supabase
            .from('grants')
            .upsert(mappedData, { onConflict: 'title' });

        if (error) throw error;

        console.log('✅ Synchronization Complete!');
    } catch (err: any) {
        console.error('❌ Sync Failed:', err.message || err);
    }
}

// Execute
sync();

/**
 * 💡 AUTOMATION NOTE:
 * To run this script automatically:
 * 1. GitHub Actions: Create .github/workflows/sync-grants.yml with a 'cron' schedule.
 *    - Steps: npm install, npx ts-node scripts/sync_grants.ts
 * 2. Linux Cron: 0 0 * * * cd /path/to/project && npx ts-node scripts/sync_grants.ts
 */
