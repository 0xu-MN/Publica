/**
 * 부적절한 카드 삭제 스크립트
 * 정치/사건/연예 카드 완전 제거
 */

import { supabase } from './db-service';

async function deleteInappropriateCards() {
    console.log('🗑️  부적절한 카드 삭제 시작...\n');

    // 삭제할 키워드
    const badKeywords = [
        '유튜버', '사기', '혐의',
        '이주비', '주택공급', '주택', '아파트',
        '금감원', '인지수사',
        '박세리', '결혼설',
        '의원', '제명', '시의회',
        '박지윤', '최동석', '상간',
        'GM', '신차', // 자동차는 경제지만 투자 인사이트 낮음
    ];

    // 모든 카드 가져오기
    const { data: allCards, error } = await supabase
        .from('cards')
        .select('id, content, created_at')
        .order('created_at', { ascending: false });

    if (error) {
        console.error('❌ Error fetching cards:', error);
        return;
    }

    console.log(`📊 Total cards: ${allCards?.length}`);

    // 부적절한 카드 필터링
    const cardsToDelete = (allCards || []).filter(card => {
        try {
            const parsed = JSON.parse(card.content);
            const headline = parsed.headline || '';

            // 키워드 매칭
            return badKeywords.some(keyword => headline.includes(keyword));
        } catch {
            return false;
        }
    });

    console.log(`❌ 삭제할 카드: ${cardsToDelete.length}개\n`);

    // 삭제 실행
    let deleted = 0;
    for (const card of cardsToDelete) {
        try {
            const parsed = JSON.parse(card.content);

            const { error: deleteError } = await supabase
                .from('cards')
                .delete()
                .eq('id', card.id);

            if (deleteError) {
                console.error(`  ❌ Failed to delete: ${parsed.headline}`, deleteError);
            } else {
                console.log(`  ✅ Deleted: ${parsed.headline}`);
                deleted++;
            }
        } catch (e) {
            console.error('  ❌ Parse error:', e);
        }
    }

    console.log(`\n✅ 삭제 완료: ${deleted}/${cardsToDelete.length}`);

    // 최종 확인
    const { data: remaining } = await supabase
        .from('cards')
        .select('content')
        .order('created_at', { ascending: false })
        .limit(15);

    console.log('\n📊 정리 후 최근 15개 카드:');
    remaining?.forEach((c, i) => {
        try {
            const p = JSON.parse(c.content);
            console.log(`${i + 1}. [${p.category}] ${p.headline}`);
        } catch { }
    });
}

deleteInappropriateCards().catch(console.error);
