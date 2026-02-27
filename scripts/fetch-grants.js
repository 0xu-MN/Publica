/**
 * 정부 지원사업 공고 자동 수집 스크립트
 * K-Startup 창업지원포털에서 실시간 모집중 공고를 수집하여 Supabase에 저장
 * 
 * 사용법: node scripts/fetch-grants.js
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { execSync } from 'child_process';

dotenv.config();

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

function fetchPage(url) {
    // Use curl for reliable HTTPS fetching (handles redirects, SSL, etc.)
    const result = execSync(`curl -s "${url}"`, { encoding: 'utf-8', maxBuffer: 10 * 1024 * 1024 });
    return result;
}

function parseKStartupGrants(html) {
    const grants = [];

    // Split by go_view calls to isolate each grant block
    // HTML structure:
    // <a href='javascript:go_view(176358);'>
    //   <div class="tit_wrap">
    //     <p class="tit">공고제목</p>
    //   </div>
    // </a>
    // ... nearby: 마감일자, D-Day, 기관명, 카테고리, 조회수

    // Extract grant blocks using regex
    const grantRegex = /go_view\((\d+)\).*?class="tit">(.*?)<\/p>/gs;
    let match;
    const seen = new Set();

    while ((match = grantRegex.exec(html)) !== null) {
        const pbancSn = match[1];
        const title = match[2].replace(/<[^>]*>/g, '').trim();

        // Skip duplicates (same ID appears twice in the HTML)
        if (seen.has(pbancSn) || !title || title.length < 5) continue;
        seen.add(pbancSn);

        // Find the surrounding context for this grant (search near the go_view call)
        const pos = match.index;
        const context = html.substring(Math.max(0, pos - 500), Math.min(html.length, pos + 1500));

        // Extract D-Day
        const dDayMatch = context.match(/D-(\d+)/);
        const dDay = dDayMatch ? `D-${dDayMatch[1]}` : null;

        // Extract deadline
        const deadlineMatch = context.match(/마감일자\s*(\d{4}-\d{2}-\d{2})/);
        const deadline = deadlineMatch ? deadlineMatch[1] : null;

        // Extract start date
        const startDateMatch = context.match(/시작일자\s*(\d{4}-\d{2}-\d{2})/);
        const startDate = startDateMatch ? startDateMatch[1] : null;

        // Build application period
        let applicationPeriod = null;
        if (startDate && deadline) {
            applicationPeriod = `${startDate} ~ ${deadline}`;
        } else if (deadline) {
            applicationPeriod = `~ ${deadline}`;
        }

        // Extract agency
        const agencyMatch = context.match(/<p class="organ">(.*?)<\/p>/s) ||
            context.match(/(창업진흥원|중소벤처기업부|과학기술정보통신부|[가-힣]+진흥원|[가-힣]+센터|[가-힣]+혁신센터|[가-힣]+경제혁신센터)/);
        const agency = agencyMatch ? agencyMatch[1].replace(/<[^>]*>/g, '').trim() : '창업진흥원';

        // Extract category
        const catMatch = context.match(/<span class="cate">(.*?)<\/span>/s) ||
            context.match(/(사업화|R&D|멘토링|시설|인력|행사|글로벌|기술개발|멘토링ㆍ컨설팅ㆍ교육|시설ㆍ공간ㆍ보육|행사ㆍ네트워크)/);
        let category = 'Commercialization';
        if (catMatch) {
            const catText = catMatch[1].replace(/<[^>]*>/g, '').trim();
            if (catText.includes('R&D') || catText.includes('기술개발')) category = 'R&D';
            else if (catText.includes('멘토링') || catText.includes('시설') || catText.includes('바우처')) category = 'Voucher';
            else if (catText.includes('자금') || catText.includes('금융')) category = 'Policy Fund';
        }

        // Extract views count
        const viewsMatch = context.match(/조회\s*([\d,]+)/);
        const views = viewsMatch ? parseInt(viewsMatch[1].replace(/,/g, '')) : 0;

        const detailUrl = `https://www.k-startup.go.kr/web/contents/bizpbanc-ongoing.do?schM=view&pbancSn=${pbancSn}`;

        grants.push({
            title,
            agency,
            category,
            d_day: dDay,
            application_period: applicationPeriod,
            application_url: detailUrl,
            original_url: detailUrl,
            region: '전국',
            tech_field: '전분야',
            target_audience: '중소기업·스타트업',
            summary: title,
            description: title,
        });
    }

    return grants;
}

async function syncGrants() {
    console.log('🔄 정부 지원사업 공고 자동 수집 시작...\n');

    try {
        console.log('📡 K-Startup 창업지원포털에서 공고 수집 중...');
        const html = fetchPage('https://www.k-startup.go.kr/web/contents/bizpbanc-ongoing.do');
        const grants = parseKStartupGrants(html);
        console.log(`   → ${grants.length}건 파싱 완료\n`);

        let newCount = 0;
        let updateCount = 0;
        let skipCount = 0;

        for (const grant of grants) {
            // Check for existing grant by title
            const { data: existing } = await supabase
                .from('grants')
                .select('id, application_url')
                .eq('title', grant.title)
                .maybeSingle();

            if (existing) {
                // Update D-Day and URL for existing grants
                const { error } = await supabase
                    .from('grants')
                    .update({
                        application_url: grant.application_url,
                        original_url: grant.original_url,
                        d_day: grant.d_day,
                        application_period: grant.application_period,
                    })
                    .eq('id', existing.id);

                if (!error) updateCount++;
                else skipCount++;
            } else {
                // Insert new grant
                const { error } = await supabase
                    .from('grants')
                    .insert(grant);

                if (!error) {
                    newCount++;
                    console.log(`   ✅ 새 공고: ${grant.title.substring(0, 50)}...`);
                } else {
                    console.error(`   ❌ 실패: ${grant.title.substring(0, 40)} - ${error.message}`);
                    skipCount++;
                }
            }
        }

        console.log(`\n📊 수집 결과:`);
        console.log(`   새 공고 추가: ${newCount}건`);
        console.log(`   기존 공고 업데이트: ${updateCount}건`);
        console.log(`   스킵/실패: ${skipCount}건`);

    } catch (err) {
        console.error('❌ 수집 실패:', err.message);
    }

    const { data: allGrants } = await supabase.from('grants').select('id');
    console.log(`\n📋 현재 DB 공고 총 ${allGrants?.length || 0}건`);
    console.log('✅ 완료!\n');
}

syncGrants();
