/**
 * 강제 카드 삭제 (RLS 우회)
 */

import { supabase } from './db-service';

async function forceDelete() {
    console.log('🔥 강제 삭제 시작...\n');

    const badHeadlines = [
        'GM, 韓 시장 공략 강화',
        '금감원 인지수사권 논란',
        '유튜버 A씨 사기 혐의 조사',
        '이주비 규제에 주택공급 차질',
        '한강벨트 소형 아파트 인기',
        '박세리, 가짜 결혼설 일축',
        '박지윤-최동석 상간 소송',
        '서울시의회, 김경 의원 제명',
        '금감원 인지수사 확대 논의',
        '임대 아파트, 펠리세이드 출고 취소',
        '금감원 특사경 TF 구성 지연',
        '주택 매도 타이밍, 언제?',
        'GM 노사 갈등, 투자 기회?',
        '의대 증원 규모 논의',  // 이것도 정치성
    ];

    // 현재 카드 확인
    const { data: before } = await supabase
        .from('cards')
        .select('id, content');

    console.log(`📊 삭제 전 총 카드: ${before?.length}`);

    const toDelete = (before || []).filter(c => {
        try {
            const p = JSON.parse(c.content);
            return badHeadlines.includes(p.headline);
        } catch {
            return false;
        }
    });

    console.log(`❌ 삭제 대상: ${toDelete.length}개\n`);

    // 하나씩 삭제 및 확인
    for (const card of toDelete) {
        try {
            const p = JSON.parse(card.content);

            // 삭제 실행
            const { data, error, status, statusText } = await supabase
                .from('cards')
                .delete()
                .eq('id', card.id)
                .select();

            console.log(`  ID: ${card.id}`);
            console.log(`  Title: ${p.headline}`);
            console.log(`  Status: ${status} ${statusText}`);
            console.log(`  Error: ${error ? JSON.stringify(error) : 'none'}`);
            console.log(`  Data: ${JSON.stringify(data)}`);
            console.log('');

        } catch (e) {
            console.error('  ❌ Exception:', e);
        }
    }

    // 삭제 후 확인
    const { data: after } = await supabase
        .from('cards')
        .select('id, content');

    console.log(`\n📊 삭제 후 총 카드: ${after?.length}`);
    console.log(`✅ 실제 삭제: ${(before?.length || 0) - (after?.length || 0)}개`);
}

forceDelete().catch(console.error);
