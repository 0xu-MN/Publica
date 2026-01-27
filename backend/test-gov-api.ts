import 'dotenv/config';
import { testAPIConnection } from './utils/gov-api-client';

console.log('🔍 정부 API 연결 테스트 시작...\n');
console.log('API 서비스 키:', process.env.GOV_API_SERVICE_KEY?.slice(0, 20) + '...\n');

testAPIConnection()
    .then(success => {
        if (success) {
            console.log('\n✅ 모든 API 연결 테스트 성공!');
            process.exit(0);
        } else {
            console.log('\n❌ API 연결 테스트 실패');
            process.exit(1);
        }
    })
    .catch(error => {
        console.error('\n💥 테스트 실행 중 오류:', error);
        process.exit(1);
    });
