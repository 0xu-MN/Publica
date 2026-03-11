// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts"

declare const Deno: any;

/**
 * crawl-grants: Automated Grant Crawler Edge Function
 * 
 * Sources:
 *   1. data.go.kr "창업진흥원_K-Startup_조회서비스" API (primary)
 *   2. Can be extended for: 복지로, 고용노동부, 중기부 정책자금
 * 
 * Usage:
 *   - Triggered manually via POST /crawl-grants
 *   - Or scheduled via Supabase pg_cron (recommended: daily at 06:00 KST)
 * 
 * Required env vars:
 *   - DATA_GO_KR_API_KEY: 공공데이터포털 인증키
 *   - SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY (auto-provided by Supabase)
 */

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// ─── Helper: Parse D-Day from deadline date ───
function calculateDDay(deadlineStr: string | null): string {
    if (!deadlineStr) return 'D-365';
    try {
        const deadline = new Date(deadlineStr);
        const now = new Date();
        const diffMs = deadline.getTime() - now.getTime();
        const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
        if (diffDays <= 0) return 'D-Day';
        return `D-${diffDays}`;
    } catch {
        return 'D-365';
    }
}

// ─── Helper: Map K-Startup category to our schema ───
function mapCategory(bizType: string): string {
    const lower = (bizType || '').toLowerCase();
    if (lower.includes('r&d') || lower.includes('연구') || lower.includes('기술개발')) return 'R&D';
    if (lower.includes('바우처') || lower.includes('voucher')) return 'Voucher';
    if (lower.includes('정책자금') || lower.includes('융자') || lower.includes('자금')) return 'Policy Fund';
    return 'Commercialization'; // Default
}

// ─── Helper: Extract region from text ───
function extractRegion(text: string): string {
    const regions = ['서울', '경기', '인천', '부산', '대구', '광주', '대전', '울산', '세종', '강원', '충북', '충남', '전북', '전남', '경북', '경남', '제주'];
    for (const r of regions) {
        if (text.includes(r)) return r;
    }
    return '전국';
}

// ─── Classification Helper: Project vs Subsidy ───
function classifyGrant(title: string, summary: string, category: string): 'project' | 'subsidy' {
    const textToSearch = `${title} ${summary}`.toLowerCase();

    // 1순위: 사업계획서/기술평가/발표/Pitch/R&D (Project 강제 배정)
    if (textToSearch.match(/(사업계획|기술평가|발표|pitch|r&d|창업|연구개발)/)) {
        return 'project';
    }

    // 2순위: 단순 혜택성 OR 순수 대출/보증 (Subsidy 배정)
    if (textToSearch.match(/(바우처|환급|수당|장려금|소상공인 방역|선착순 지원|경영안정자금)/) || category === '대출/보증') {
        return 'subsidy';
    }

    // 3순위: 기본값 (Project - 에디터 뷰로 넘어갈 기회 부여)
    return 'project';
}

// ─── Main: Fetch from data.go.kr (K-Startup) API ───
async function fetchFromDataGoKr(apiKey: string): Promise<any[]> {
    const baseUrl = 'https://apis.data.go.kr/B552735/kisedKstartupService01/getAnnouncementInformation01';
    const grants: any[] = [];
    let page = 1;
    const perPage = 100;
    let totalCount = 999; // Will be updated after first call

    while ((page - 1) * perPage < totalCount) {
        const url = `${baseUrl}?serviceKey=${encodeURIComponent(apiKey)}&returnType=json&page=${page}&perPage=${perPage}`;

        console.log(`📡 Fetching page ${page}...`);

        try {
            const res = await fetch(url);
            if (!res.ok) {
                console.error(`❌ API Error: ${res.status} ${await res.text()}`);
                break;
            }

            const data = await res.json();

            const items = data?.data || [];
            if (!Array.isArray(items) || items.length === 0) {
                console.log(`📭 No more items on page ${page}`);
                break;
            }

            if (page === 1) {
                totalCount = data?.totalCount || 9999;
                // 🚀 LIMIT TO 1000 to prevent Edge Function timeout (10 pages)
                if (totalCount > 1000) totalCount = 1000;
            }

            for (const item of items) {
                // Map API fields from getAnnouncementInformation01
                const title = item.biz_pbanc_nm || item.intg_pbanc_biz_nm || '제목 없음';
                const agency = item.pbanc_ntrp_nm || 'K-Startup';
                const summary = item.pbanc_ctnt || item.aply_excl_trgt_ctnt || '';
                const targetAudience = (item.aply_trgt_ctnt || item.aply_trgt || '') + ' ' + (item.biz_enyy || '');
                const techField = '전분야';
                const category = mapCategory(item.supt_biz_clsfc || '');
                const originalUrl = item.detl_pg_url || '';

                // Formatted dates
                const pblancBgnDt = item.pbanc_rcpt_bgng_dt ? item.pbanc_rcpt_bgng_dt.replace(/(\d{4})(\d{2})(\d{2})/, '$1-$2-$3') : '';
                const pblancEndDt = item.pbanc_rcpt_end_dt ? item.pbanc_rcpt_end_dt.replace(/(\d{4})(\d{2})(\d{2})/, '$1-$2-$3') : '';
                const applicationPeriod = (pblancBgnDt && pblancEndDt) ? `${pblancBgnDt} ~ ${pblancEndDt}` : '';
                const deadlineStr = pblancEndDt;

                const fileUrl = '';
                const externalId = item.pbanc_sn ? item.pbanc_sn.toString() : `kstartup_${title.substring(0, 30)}`;
                const department = item.biz_prch_dprt_nm || agency;
                const region = extractRegion(title + ' ' + summary + ' ' + (item.supt_regin || ''));

                if (originalUrl.includes('2016') || title.includes('2016')) {
                    continue; // Skip legacy test data
                }

                grants.push({
                    title,
                    agency,
                    summary: summary.substring(0, 500),
                    description: summary.substring(0, 500),
                    target_audience: targetAudience.substring(0, 100),
                    tech_field: techField,
                    category,
                    d_day: calculateDDay(deadlineStr),
                    deadline_date: deadlineStr || null,
                    link: originalUrl,
                    original_url: originalUrl,
                    file_url: fileUrl,
                    external_id: externalId,
                    department,
                    region,
                    application_period: applicationPeriod,
                    source: 'k-startup',
                    grant_type: classifyGrant(title, summary, category),
                    is_active: item.rcrt_prgs_yn === 'Y' || !item.rcrt_prgs_yn,
                });
            }

            page++;
        } catch (e) {
            console.error(`❌ Fetch error on page ${page}:`, e);
            break;
        }
    }

    return grants;
}

// ─── Main: Fetch from Bizinfo API (기업마당 지원사업정보) ───
async function fetchFromBizinfo(crtfcKey: string): Promise<any[]> {
    // Correct endpoint: bizinfo.go.kr REST API (NOT the legacy UDDI odcloud format)
    const baseUrl = 'https://www.bizinfo.go.kr/uss/rss/bizinfoApi.do';
    const grants: any[] = [];
    let page = 1;
    const perPage = 100;
    const maxPages = 10; // Limit to prevent timeout

    while (page <= maxPages) {
        const url = `${baseUrl}?crtfcKey=${encodeURIComponent(crtfcKey)}&dataType=JSON&pageUnit=${perPage}&pageIndex=${page}`;

        console.log(`📡 [Bizinfo] Fetching page ${page}...`);

        try {
            const res = await fetch(url);
            if (!res.ok) {
                console.error(`❌ [Bizinfo] API Error: ${res.status} ${await res.text()}`);
                break;
            }

            const data = await res.json();
            const items = data?.jsonArray || data?.data || [];

            if (!Array.isArray(items) || items.length === 0) {
                console.log(`📭 [Bizinfo] No more items on page ${page}`);
                break;
            }

            for (const item of items) {
                const title = item.pblancNm || item['사업명'] || '';
                const agency = item.jrsdInsttNm || item['수행기관'] || '';
                const department = item.excInsttNm || item['소관기관'] || agency;
                const deadlineStr = item.reqstEndDe || item['종료일'] || null;
                const startDateStr = item.reqstBgnDe || item['시작일'] || '';
                const originalUrl = item.pblancUrl || item['주소(세부사항 확인가능)'] || item['주소(세부사항확인가능)'] || '';

                // Skip old grants (before 2024)
                if (deadlineStr) {
                    const year = parseInt(deadlineStr.substring(0, 4));
                    if (year < 2024) continue;
                }

                const category = mapCategory(item.bsnsSumryCn || item['분야'] || '');
                const externalId = `bizinfo_${item.pblancId || item['NO'] || item['연번'] || title.substring(0, 30)}`;
                const region = extractRegion(title + ' ' + department + ' ' + agency + ' ' + (item.jrsdInsttNm || ''));
                const applicationPeriod = startDateStr && deadlineStr ? `${startDateStr} ~ ${deadlineStr}` : '';

                grants.push({
                    title,
                    agency,
                    summary: item.bsnsSumryCn || `${department} - ${title}`,
                    description: item.bsnsSumryCn || `소관기관: ${department}\n수행기관: ${agency}`,
                    target_audience: item.trgetNm || '상세내용 참고',
                    tech_field: '전분야',
                    category,
                    d_day: calculateDDay(deadlineStr),
                    deadline_date: deadlineStr || null,
                    link: originalUrl,
                    original_url: originalUrl,
                    file_url: null,
                    external_id: externalId,
                    department,
                    region,
                    application_period: applicationPeriod,
                    source: 'bizinfo',
                    grant_type: classifyGrant(title, item.bsnsSumryCn || '', category),
                    is_active: true,
                });
            }

            page++;
        } catch (e) {
            console.error(`❌ [Bizinfo] Fetch error on page ${page}:`, e);
            break;
        }
    }

    return grants;
}

// ─── Upsert grants into Supabase ───
async function upsertGrants(grants: any[]): Promise<{ inserted: number; updated: number; deactivated: number }> {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseKey) {
        throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
    }

    let inserted = 0;
    let updated = 0;

    // Upsert each grant
    for (const grant of grants) {
        const res = await fetch(`${supabaseUrl}/rest/v1/grants`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'apikey': supabaseKey,
                'Authorization': `Bearer ${supabaseKey}`,
                'Prefer': 'resolution=merge-duplicates',
            },
            body: JSON.stringify({
                ...grant,
                updated_at: new Date().toISOString(),
            }),
        });

        if (res.ok) {
            inserted++;
        } else {
            // If insert fails due to duplicate, try update
            const errorText = await res.text();
            if (errorText.includes('duplicate') || errorText.includes('conflict')) {
                const updateRes = await fetch(
                    `${supabaseUrl}/rest/v1/grants?external_id=eq.${encodeURIComponent(grant.external_id)}`,
                    {
                        method: 'PATCH',
                        headers: {
                            'Content-Type': 'application/json',
                            'apikey': supabaseKey,
                            'Authorization': `Bearer ${supabaseKey}`,
                        },
                        body: JSON.stringify({
                            ...grant,
                            updated_at: new Date().toISOString(),
                        }),
                    }
                );
                if (updateRes.ok) updated++;
            } else {
                console.error(`❌ Upsert failed for "${grant.title}":`, errorText);
            }
        }
    }

    // Deactivate grants that have passed their deadline
    const deactivateRes = await fetch(
        `${supabaseUrl}/rest/v1/grants?deadline_date=lt.${new Date().toISOString().split('T')[0]}&is_active=eq.true`,
        {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'apikey': supabaseKey,
                'Authorization': `Bearer ${supabaseKey}`,
                'Prefer': 'return=representation',
            },
            body: JSON.stringify({ is_active: false }),
        }
    );

    const deactivatedData = deactivateRes.ok ? await deactivateRes.json() : [];
    const deactivated = Array.isArray(deactivatedData) ? deactivatedData.length : 0;

    return { inserted, updated, deactivated };
}

Deno.serve(async (req: any) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        const apiKey = Deno.env.get('DATA_GO_KR_API_KEY');

        if (!apiKey) {
            return new Response(JSON.stringify({
                error: 'DATA_GO_KR_API_KEY not configured',
                message: '공공데이터포털 API 키가 필요합니다. data.go.kr에서 "창업진흥원_K-Startup_조회서비스"를 신청하세요.',
                setup_url: 'https://www.data.go.kr/data/15081808/openapi.do'
            }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 400,
            });
        }

        console.log('🚀 Starting grant crawl for K-Startup and Bizinfo...');

        // 1. Fetch from K-Startup
        const kStartupGrants = await fetchFromDataGoKr(apiKey);
        console.log(`📊 Fetched ${kStartupGrants.length} grants from K-Startup`);

        // 2. Fetch from Bizinfo (uses separate key, or fallback to same key)
        const bizinfoKey = Deno.env.get('BIZINFO_API_KEY') || apiKey;
        let bizinfoGrants: any[] = [];
        try {
            bizinfoGrants = await fetchFromBizinfo(bizinfoKey);
            console.log(`📊 Fetched ${bizinfoGrants.length} grants from Bizinfo`);
        } catch (e) {
            console.warn('⚠️ Bizinfo fetch failed, continuing with K-Startup only:', e);
        }

        const allGrants = [...kStartupGrants, ...bizinfoGrants];

        if (allGrants.length === 0) {
            return new Response(JSON.stringify({
                status: 'warning',
                message: 'API returned 0 grants from both sources. API key may be invalid or service may be down.',
                grants_fetched: 0,
            }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
        }

        // 3. Upsert into Supabase
        const result = await upsertGrants(allGrants);
        console.log(`✅ Crawl complete: ${result.inserted} inserted, ${result.updated} updated, ${result.deactivated} deactivated`);

        return new Response(JSON.stringify({
            status: 'success',
            grants_fetched: allGrants.length,
            k_startup_count: kStartupGrants.length,
            bizinfo_count: bizinfoGrants.length,
            inserted: result.inserted,
            updated: result.updated,
            deactivated: result.deactivated,
            timestamp: new Date().toISOString(),
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });

    } catch (error: any) {
        console.error('❌ Crawl Error:', error);
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 500,
        });
    }
});
