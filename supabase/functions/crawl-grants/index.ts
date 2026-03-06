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

// ─── Main: Fetch from data.go.kr (K-Startup) API ───
async function fetchFromDataGoKr(apiKey: string): Promise<any[]> {
    const baseUrl = 'https://apis.data.go.kr/B552735/k-startup/bizAnnouncementList';
    const grants: any[] = [];
    let page = 1;
    const perPage = 100;
    let totalCount = 999; // Will be updated after first call

    while ((page - 1) * perPage < totalCount) {
        const url = `${baseUrl}?serviceKey=${encodeURIComponent(apiKey)}&pageNo=${page}&numOfRows=${perPage}&type=json`;

        console.log(`📡 Fetching page ${page}...`);

        try {
            const res = await fetch(url);
            if (!res.ok) {
                console.error(`❌ API Error: ${res.status} ${await res.text()}`);
                break;
            }

            const data = await res.json();

            // data.go.kr response structure varies per API
            const items = data?.response?.body?.items?.item
                || data?.response?.body?.items
                || data?.items
                || data?.body?.items?.item
                || [];

            totalCount = data?.response?.body?.totalCount
                || data?.totalCount
                || items.length;

            if (!Array.isArray(items) || items.length === 0) {
                console.log(`📭 No more items on page ${page}`);
                break;
            }

            for (const item of items) {
                // Map API fields to our schema
                const title = item.pblancNm || item.bizNm || item.title || '';
                const agency = item.jrsdInsttNm || item.excInsttNm || item.agency || '';
                const summary = item.bizOverview || item.pblancCn || item.summary || '';
                const targetAudience = item.trgtSbcNm || item.appTrgt || '';
                const techField = item.indTyCdNm || item.relTechField || '전분야';
                const category = mapCategory(item.bizTyCdNm || item.category || '');
                const deadlineStr = item.reqstEndDe || item.pblancEndDt || null;
                const originalUrl = item.detailPageUrl || item.pblancUrl || item.link || '';
                const fileUrl = item.atchFileUrl || '';
                const externalId = item.pblancId || item.bizAnnoId || item.id || `kstartup_${title.substring(0, 30)}`;
                const department = item.jrsdInsttNm || agency;
                const region = extractRegion(title + ' ' + summary + ' ' + (item.aplyRgnNm || ''));
                const applicationPeriod = item.reqstBgnDe && item.reqstEndDe
                    ? `${item.reqstBgnDe} ~ ${item.reqstEndDe}`
                    : (item.pblancBgnDt && item.pblancEndDt ? `${item.pblancBgnDt} ~ ${item.pblancEndDt}` : '');

                grants.push({
                    title,
                    agency,
                    summary,
                    description: summary,
                    target_audience: targetAudience,
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
                    source: 'data.go.kr',
                    is_active: true,
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
async function fetchFromBizinfo(apiKey: string): Promise<any[]> {
    const baseUrl = 'https://api.odcloud.kr/api/3034791/v1/uddi:f76639a7-27ea-48da-a4f4-c7dca8032a49_201710261128';
    const grants: any[] = [];
    let page = 1;
    const perPage = 100;
    let totalCount = 999;

    while ((page - 1) * perPage < totalCount) {
        const url = `${baseUrl}?page=${page}&perPage=${perPage}&serviceKey=${encodeURIComponent(apiKey)}`;

        console.log(`📡 [Bizinfo] Fetching page ${page}...`);

        try {
            const res = await fetch(url);
            if (!res.ok) {
                console.error(`❌ [Bizinfo] API Error: ${res.status} ${await res.text()}`);
                break;
            }

            const data = await res.json();
            const items = data?.data || [];

            totalCount = data?.totalCount || items.length;

            if (!Array.isArray(items) || items.length === 0) {
                console.log(`📭 [Bizinfo] No more items on page ${page}`);
                break;
            }

            for (const item of items) {
                const title = item['사업명'] || '';
                const category = mapCategory(item['분야'] || '');
                const deadlineStr = item['종료일'] || null;
                const originalUrl = item['주소(세부사항 확인가능)'] || item['주소(세부사항확인가능)'] || '';
                const externalId = `bizinfo_${item['NO'] || item['연번'] || item['번호'] || title.substring(0, 30)}`;
                const agency = item['수행기관'] || '';
                const department = item['소관기관'] || '';
                const region = extractRegion(title + ' ' + department + ' ' + agency);
                const applicationPeriod = (item['시작일'] || item['신청시작일자'] || '') + ' ~ ' + (deadlineStr || item['신청종료일자'] || '');

                grants.push({
                    title,
                    agency,
                    summary: `${department} - ${title}`,
                    description: `분야: ${item['분야'] || ''}\n소관기관: ${department}\n수행기관: ${agency}`,
                    target_audience: '상세내용 참고',
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

        // 2. Fetch from Bizinfo
        const bizinfoGrants = await fetchFromBizinfo(apiKey);
        console.log(`📊 Fetched ${bizinfoGrants.length} grants from Bizinfo`);

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
