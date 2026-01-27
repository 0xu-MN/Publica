import 'dotenv/config';
import { fetchAllGovernmentPrograms, GovernmentProgram } from '../utils/gov-api-client';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!
);

/**
 * 정부지원사업 수집 및 처리 메인 함수
 */
export async function fetchAndProcessGovPrograms() {
    console.log('🏛️  정부지원사업 수집 시작...');

    try {
        // 1. 모든 정부 API에서 데이터 수집
        const allPrograms = await fetchAllGovernmentPrograms();

        if (allPrograms.length === 0) {
            console.log('⚠️  수집된 데이터가 없습니다.');
            return { total: 0, active: 0 };
        }

        console.log(`✅ 총 ${allPrograms.length}개 프로그램 수집 완료`);

        // 2. 중복 제거 (같은 program_id가 있는 경우)
        const uniquePrograms = Array.from(
            new Map(allPrograms.map(p => [p.program_id, p])).values()
        );
        console.log(`🔄 중복 제거 후: ${uniquePrograms.length}개`);

        // 3. Supabase에 저장
        console.log('💾 데이터베이스 저장 중...');

        // Transform to match DB schema
        const dbPrograms = uniquePrograms.map(program => ({
            program_id: program.program_id,
            title: program.title,
            agency: program.agency,
            department: program.department,
            deadline: program.deadline?.toISOString(),
            start_date: program.start_date?.toISOString(),
            end_date: program.end_date?.toISOString(),
            status: program.status,
            d_day: program.d_day,
            category: program.category,
            tags: program.tags,
            budget: program.budget,
            description: program.description,
            link: program.link,
            requirements: program.requirements,
            api_source: program.api_source,
            updated_at: new Date().toISOString()
        }));

        const { data, error } = await supabase
            .from('government_programs')
            .upsert(dbPrograms, {
                onConflict: 'program_id',
                ignoreDuplicates: false
            });

        if (error) {
            console.error('❌ DB 저장 실패:', error);
            throw error;
        }

        const activePrograms = uniquePrograms.filter(p =>
            p.status === '접수중' || p.status === '마감임박'
        );

        console.log(`✅ ${uniquePrograms.length}개 프로그램 저장 완료!`);
        console.log(`📊 활성 프로그램: ${activePrograms.length}개`);

        return {
            total: uniquePrograms.length,
            active: activePrograms.length
        };

    } catch (error) {
        console.error('❌ 정부지원사업 수집 실패:', error);
        throw error;
    }
}

// 직접 실행 시
if (require.main === module) {
    fetchAndProcessGovPrograms()
        .then(result => {
            console.log('\n📊 수집 완료:', result);
            process.exit(0);
        })
        .catch(error => {
            console.error('\n💥 에러 발생:', error);
            process.exit(1);
        });
}
