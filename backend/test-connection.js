// Supabase 연결 테스트 스크립트
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
);

async function testConnection() {
    console.log('🔍 Supabase 연결 테스트 중...\n');

    try {
        // 테이블 조회
        const { data, error } = await supabase
            .from('news_items')
            .select('count')
            .limit(1);

        if (error) {
            console.error('❌ 연결 실패:', error.message);
            console.error('\n확인사항:');
            console.error('1. .env 파일의 SUPABASE_URL 확인');
            console.error('2. .env 파일의 SUPABASE_SERVICE_KEY 확인');
            console.error('3. Supabase 프로젝트가 활성화 상태인지 확인');
            return;
        }

        console.log('✅ Supabase 연결 성공!');
        console.log(`📊 news_items 테이블 확인 완료`);
        console.log(`\n=================================`);
        console.log(`다음 단계: Gemini API 키 설정`);
        console.log(`=================================\n`);

    } catch (err) {
        console.error('💥 오류 발생:', err.message);
    }
}

testConnection();
