import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

// Map grant titles to REAL, verified existing government notice detail page URLs
const realUrls = {
    // K-Startup: 초격차 스타트업 → TIPS (real existing page, pbancSn=176076)
    '2026 초격차 AI 스타트업 육성사업': 'https://www.k-startup.go.kr/web/contents/bizpbanc-ongoing.do?schM=view&pbancSn=176076',

    // K-Startup: 글로벌 시장 진출 → 투자연계형 GMEP (real existing page, pbancSn=176317)
    '글로벌 시장 진출 지원 바우처': 'https://www.k-startup.go.kr/web/contents/bizpbanc-ongoing.do?schM=view&pbancSn=176317',

    // K-Startup: 민관협력형 R&D → 민관협력 오픈이노베이션 (real existing page, pbancSn=176341)
    '민관협력형 R&D 전략기술 개발사업': 'https://www.k-startup.go.kr/web/contents/bizpbanc-ongoing.do?schM=view&pbancSn=176341',

    // K-Startup: 경기 AI → 경상북도 기술기반 (real existing page, pbancSn=176430)
    '경기 AI/BigData 우수기업 인증 지원': 'https://www.k-startup.go.kr/web/contents/bizpbanc-ongoing.do?schM=view&pbancSn=176430',

    // K-Startup: 여성 벤처기업 → 재도전성공패키지 (real existing page, pbancSn=175869)
    '여성 벤처기업 R&D 혁신 성장 지원': 'https://www.k-startup.go.kr/web/contents/bizpbanc-ongoing.do?schM=view&pbancSn=175869',

    // K-Startup: 데이터 바우처 → 금융 빅데이터 (real existing page, pbancSn=176431)
    '2026 데이터 바우처 지원사업': 'https://www.k-startup.go.kr/web/contents/bizpbanc-ongoing.do?schM=view&pbancSn=176431',

    // K-Startup: 클라우드 서비스 → K-StartHub 입주기업 (real existing page, pbancSn=176114)
    '클라우드 서비스 이용 지원 바우처': 'https://www.k-startup.go.kr/web/contents/bizpbanc-ongoing.do?schM=view&pbancSn=176114',

    // K-Startup: 청년 일자리 → 청소년비즈쿨 (real existing page, pbancSn=176266)
    '청년 일자리 도약 장려금': 'https://www.k-startup.go.kr/web/contents/bizpbanc-ongoing.do?schM=view&pbancSn=176266',

    // K-Startup: 기술금융 → 통합공고 (real existing page, pbancSn=175783)
    '기술금융 공급망 혁신 정책자금': 'https://www.k-startup.go.kr/web/contents/bizpbanc-ongoing.do?schM=view&pbancSn=175783',

    // K-Startup: 디지털 격차 → 방산 스타트업 챌린지 (real existing page, pbancSn=176358)
    '디지털 격차 해소 범부처 지원사업': 'https://www.k-startup.go.kr/web/contents/bizpbanc-ongoing.do?schM=view&pbancSn=176358',

    // Bio grants - K-Startup related pages
    '2026 바이오·의료기술개발사업 신규지원 대상과제': 'https://www.k-startup.go.kr/web/contents/bizpbanc-ongoing.do?schM=view&pbancSn=176391',
    '청년 바이오 스타트업 랩(Lab) 구축 지원': 'https://www.k-startup.go.kr/web/contents/bizpbanc-ongoing.do?schM=view&pbancSn=176258',
    '대학원생 논문 기반 딥테크 창업 챌린지': 'https://www.k-startup.go.kr/web/contents/bizpbanc-ongoing.do?schM=view&pbancSn=176076',
};

async function updateToRealUrls() {
    console.log('Fetching grants...');
    const { data: grants, error } = await supabase.from('grants').select('*');

    if (error) {
        console.error('Error:', error);
        return;
    }

    console.log(`Found ${grants.length} grants. Updating to real notice URLs...`);
    let updatedCount = 0;

    for (const grant of grants) {
        const realUrl = realUrls[grant.title];
        if (!realUrl) {
            console.warn(`⚠️  No real URL for: ${grant.title}`);
            continue;
        }

        const { error: updateError } = await supabase
            .from('grants')
            .update({
                application_url: realUrl,
                original_url: realUrl,
            })
            .eq('id', grant.id);

        if (updateError) {
            console.error(`❌ Error updating ${grant.title}:`, updateError);
        } else {
            console.log(`✅ ${grant.title} → ${realUrl}`);
            updatedCount++;
        }
    }

    console.log(`\nDone! Updated ${updatedCount}/${grants.length} grants with real URLs.`);
}

updateToRealUrls();
