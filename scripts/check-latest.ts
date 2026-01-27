import { supabase } from './db-service';

async function checkLatestCards() {
    // 최근 5개 카드만
    const { data } = await supabase
        .from('cards')
        .select('content, created_at')
        .order('created_at', { ascending: false })
        .limit(5);

    if (!data || data.length === 0) {
        console.log('No cards found');
        return;
    }

    console.log('\n📊 Latest 5 Cards Analysis:');
    console.log('═'.repeat(80));

    data.forEach((card, i) => {
        try {
            const content = JSON.parse(card.content);
            const date = new Date(card.created_at).toLocaleString('ko-KR');

            console.log(`\n${i + 1}. ${content.headline}`);
            console.log(`   Created: ${date}`);
            console.log(`   Category: ${content.category}`);
            console.log(`\n   [AI 핵심 내용 - bullets]`);
            content.bullets?.forEach((b: string, idx: number) => {
                console.log(`   ${idx + 1}. ${b}`);
            });

            console.log(`\n   [본문 - body]`);
            const bodyLines = content.body?.split('\n').filter((l: string) => l.trim());
            bodyLines?.slice(0, 8).forEach((line: string) => {
                console.log(`   ${line}`);
            });

            console.log(`\n   [관련자료 - related_materials]`);
            if (content.related_materials && content.related_materials.length > 0) {
                content.related_materials.forEach((mat: any, idx: number) => {
                    console.log(`   ${idx + 1}. ${mat.title} - ${mat.url}`);
                });
            } else {
                console.log(`   # (none)`);
            }

            console.log('\n   ' + '─'.repeat(75));

        } catch (e) {
            console.log(`${i + 1}. ❌ Parse error`);
        }
    });

    console.log('\n' + '═'.repeat(80));
}

checkLatestCards().catch(console.error);
