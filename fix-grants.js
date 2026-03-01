import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

async function fixGrants() {
    console.log('Fetching all grants...');
    const { data: grants, error: fetchError } = await supabase.from('grants').select('*');

    if (fetchError) {
        console.error('Error fetching grants:', fetchError);
        return;
    }

    console.log(`Found ${grants.length} grants. Deduplicating by title...`);

    // 1. Deduplicate
    const titleMap = new Map();
    const toDelete = [];

    for (const grant of grants) {
        if (!titleMap.has(grant.title)) {
            titleMap.set(grant.title, grant);
        } else {
            toDelete.push(grant.id);
            console.log(`Marking duplicate for deletion: [${grant.title}] - ID: ${grant.id}`);
        }
    }

    if (toDelete.length > 0) {
        console.log(`Deleting ${toDelete.length} duplicates...`);
        // Delete in batches or one query
        const { error: deleteError } = await supabase
            .from('grants')
            .delete()
            .in('id', toDelete);

        if (deleteError) {
            console.error('Error deleting duplicates:', deleteError);
        } else {
            console.log('Successfully deleted duplicates.');
        }
    } else {
        console.log('No duplicates found.');
    }

    // 2. Update URLs to strictly valid list pages (no mock IDs to prevent 404s on real sites)
    console.log('Updating URLs to prevent 404 Not Found errors...');
    const uniqueGrants = Array.from(titleMap.values());
    let updatedCount = 0;

    for (const grant of uniqueGrants) {
        let newUrl = grant.original_url;

        if (grant.agency.includes('중소벤처기업부') || grant.agency.includes('창업진흥원')) {
            newUrl = 'https://www.k-startup.go.kr/web/contents/bizpbanc-ongoing.do';
        } else if (grant.agency.includes('과기부') || grant.agency.includes('과학기술정보통신부') || grant.agency.includes('한국연구재단')) {
            newUrl = 'https://www.nrf.re.kr/biz/info/notice/list?menu_no=378';
        } else if (grant.agency.includes('보건복지부') || grant.agency.includes('한국보건산업진흥원')) {
            newUrl = 'https://www.htdream.kr/biz/guide/list.do';
        } else if (grant.agency.includes('산업통상자원부') || grant.agency.includes('한국산업기술진흥원')) {
            newUrl = 'https://www.kiat.or.kr/front/board/boardContentsListPage.do?board_id=90';
        } else {
            newUrl = 'https://www.gov.kr/portal/ntc/notice/list';
        }

        const { error: updateError } = await supabase
            .from('grants')
            .update({ original_url: newUrl, file_url: newUrl })
            .eq('id', grant.id);

        if (updateError) {
            console.error(`Error updating grant ${grant.id}:`, updateError);
        } else {
            updatedCount++;
        }
    }

    console.log(`Finished updating ${updatedCount} URLs.`);
}

fixGrants();
