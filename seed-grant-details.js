import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

// Realistic enrichment data keyed by grant title
const enrichmentData = {
    '2026 초격차 AI 스타트업 육성사업': {
        budget: '최대 2억원 (1차년도)',
        eligibility: '• 설립 7년 이내 중소·벤처기업 또는 예비창업자\n• AI·딥테크 분야 핵심 기술 보유\n• 대표자 또는 기술책임자가 관련 분야 석사 이상 학위 보유자 우대\n• 글로벌 시장 진출 의지 및 구체적 사업화 계획 보유',
        exclusions: '• 국세·지방세 체납 중인 기업\n• 중소벤처기업부 동일 사업 기수혜 기업\n• 휴·폐업 중인 기업\n• 금융기관 채무불이행자가 대표인 기업\n• 타 정부지원사업과 중복 수혜 기업',
        support_details: '• **사업화 자금**: 시제품 제작, 마케팅, 인건비 등 최대 2억원\n• **글로벌 액셀러레이팅**: 실리콘밸리·싱가포르 현지 데모데이 참가 지원\n• **전담 멘토링**: AI 분야 전문 멘토 1:1 매칭 (월 2회)\n• **공용 GPU 클러스터**: AI 학습용 컴퓨팅 자원 무상 제공 (6개월)',
        application_period: '2026.02.15 ~ 2026.03.15',
        application_method: '온라인 접수 (K-Startup 홈페이지)\n1. K-Startup 회원가입 및 로그인\n2. 사업공고 → 해당 공고 클릭\n3. 신청서 작성 및 첨부서류 업로드\n4. 최종 제출',
        region: '전국',
        department: '창업진흥과',
        contact_info: '중소벤처기업부 창업진흥과 044-204-7712\n창업진흥원 02-3440-7300',
        application_url: 'https://www.k-startup.go.kr/web/contents/bizpbanc-ongoing.do',
    },
    '글로벌 시장 진출 지원 바우처': {
        budget: '최대 1억원 (바우처)',
        eligibility: '• 수출 실적이 있거나 수출 의지가 있는 중소기업\n• 사업자등록 후 1년 이상 경과한 기업\n• 자체 브랜드(B2C) 또는 기술력(B2B) 보유 기업\n• 최근 3년간 KOTRA 바우처 미수혜 기업 우대',
        exclusions: '• 대기업 및 중견기업\n• 유흥·사행성 업종\n• 수출 제한 품목 취급 기업\n• 관세청 수출입 제재 대상 기업',
        support_details: '• **해외 마케팅**: 현지 온·오프라인 광고, SNS 마케팅 대행\n• **해외 전시회 참가**: 부스 임차료, 장치비, 통역비 지원\n• **바이어 발굴**: 1:1 비즈니스 매칭, 화상 상담회\n• **현지화 지원**: 카탈로그·홈페이지 번역, 현지 인증 취득 비용',
        application_period: '2026.02.20 ~ 2026.02.28',
        application_method: 'KOTRA 수출바우처 홈페이지(exportvoucher.com) 온라인 접수',
        region: '전국',
        department: '수출지원팀',
        contact_info: 'KOTRA 수출바우처 사업부 1600-7119',
        application_url: 'https://www.exportvoucher.com',
    },
    '민관협력형 R&D 전략기술 개발사업': {
        budget: '최대 5억원 (3년간)',
        eligibility: '• 설립 3년 이상 중소·중견기업\n• 연구개발 전담부서 보유 기업\n• SaaS, 클라우드, 보안 분야 핵심 기술 보유\n• 최근 3년간 매출액 대비 R&D 투자 비율 5% 이상 기업 우대',
        exclusions: '• 동일 과제로 타 부처 R&D 지원 수혜 중인 기업\n• 국가 R&D 사업 참여 제한 중인 기업\n• 기술료 미납 기업\n• 연구부정행위 이력 보유 기업',
        support_details: '• **연구개발비**: 인건비, 재료비, 장비 구입비 등 최대 5억원\n• **기술 컨설팅**: 분야별 전문가 자문단 운영\n• **성과 사업화**: 기술이전, 특허출원 비용 추가 지원\n• **인프라 제공**: 국가연구시설 장비 이용 우선권',
        application_period: '2026.02.10 ~ 2026.03.05',
        application_method: '범부처통합연구지원시스템(IRIS) 온라인 접수\nhttps://www.iris.go.kr',
        region: '전국',
        department: '연구개발정책과',
        contact_info: '과학기술정보통신부 연구개발정책과 044-202-4652\n한국연구재단 02-3460-5500',
        application_url: 'https://www.iris.go.kr/contents/main.do',
    },
    '경기 AI/BigData 우수기업 인증 지원': {
        budget: '인증 기업당 최대 3,000만원',
        eligibility: '• 경기도 내 본사 또는 주사업장 소재 기업\n• AI·빅데이터 관련 제품/서비스 보유\n• 최근 1년 이상 관련 매출 실적 보유\n• 상시근로자 5인 이상',
        exclusions: '• 타 시도 소재 기업 (경기도 외)\n• 설립 1년 미만 기업\n• 세금 체납 기업',
        support_details: '• **인증 브랜딩**: "경기 AI 우수기업" 인증 마크 부여 (2년간)\n• **마케팅 지원**: 경기도 공공조달 우선 참여, 전시회 부스 제공\n• **자금 지원**: 인증 기업 대상 최대 3천만원 사업화 보조금\n• **네트워킹**: 우수기업 간 교류회, 투자 IR 데모데이 참여',
        application_period: '2026.02.25 ~ 2026.03.02',
        application_method: '경기도경제과학진흥원 홈페이지 온라인 접수',
        region: '경기도',
        department: 'AI산업과',
        contact_info: '경기도경제과학진흥원 AI산업과 031-259-6200',
        application_url: 'https://www.egbiz.or.kr',
    },
    '여성 벤처기업 R&D 혁신 성장 지원': {
        budget: '최대 1억원 (1년)',
        eligibility: '• 여성 대표자 벤처기업 (벤처인증 필수)\n• 설립 3년 이상, 상시근로자 5인 이상\n• R&D 개발 과제 보유 기업\n• 최근 2년간 매출액 1억원 이상',
        exclusions: '• 벤처인증 미보유 기업\n• 남성 대표 기업\n• 타 R&D 정부지원사업 동시 수혜 기업\n• 세금 체납, 임금 체불 기업',
        support_details: '• **R&D 자금**: 시제품 개발, 연구인력 인건비 등 최대 1억원 (정부 75%, 기업 25%)\n• **멘토링**: 여성 CEO 선배 멘토 1:1 매칭\n• **판로 개척**: 여성기업 전용 온라인 쇼핑몰 입점 지원\n• **해외 진출**: 해외 여성기업 네트워크 연계',
        application_period: '2026.02.18 ~ 2026.03.01',
        application_method: '여성벤처협회 홈페이지 온라인 접수',
        region: '전국',
        department: '여성벤처지원팀',
        contact_info: '여성벤처협회 02-538-8832',
        application_url: 'https://www.wvc.or.kr',
    },
    '2026 데이터 바우처 지원사업': {
        budget: '최대 4,500만원 (바우처)',
        eligibility: '• 데이터 활용 수요가 있는 중소·중견기업 또는 스타트업\n• 사업자등록 후 6개월 이상 경과\n• AI/ML, 데이터 분석 관련 사업 계획 보유\n• 데이터 구매·가공 필요성이 입증 가능한 기업',
        exclusions: '• 개인사업자 중 프리랜서\n• 최근 2년 내 데이터 바우처 수혜 기업\n• 공공기관 및 대기업',
        support_details: '• **데이터 구매 바우처**: 최대 3,000만원 (데이터 구매·가공비)\n• **AI 가공 바우처**: 최대 4,500만원 (AI 학습데이터 구축)\n• **컨설팅**: 데이터 활용 전략 수립 전문가 자문\n• **교육**: 데이터 분석 역량 강화 교육 프로그램',
        application_period: '2026.02.01 ~ 2026.03.01',
        application_method: '데이터스토어(datastore.or.kr) 온라인 접수',
        region: '전국',
        department: '데이터진흥과',
        contact_info: '한국지능정보사회진흥원 데이터진흥과 053-230-1300',
        application_url: 'https://www.datastore.or.kr',
    },
    '클라우드 서비스 이용 지원 바우처': {
        budget: '최대 2,400만원 (바우처)',
        eligibility: '• 클라우드 서비스 도입 의사가 있는 중소기업\n• IT 인프라 전환 또는 신규 클라우드 도입 계획 보유\n• 사업자등록 후 1년 이상 경과\n• 상시근로자 3인 이상',
        exclusions: '• 대기업 및 공공기관\n• 이미 동일 클라우드 서비스를 이용 중인 기업\n• 클라우드 서비스 공급기업',
        support_details: '• **클라우드 이용료**: SaaS, IaaS, PaaS 이용료의 최대 80% 지원\n• **전환 컨설팅**: 온프레미스 → 클라우드 전환 컨설팅 제공\n• **보안 점검**: 클라우드 보안 취약점 진단 무상 제공\n• **기술 교육**: 클라우드 관리 인력 양성 교육',
        application_period: '2026.02.10 ~ 2026.03.01',
        application_method: '정보통신산업진흥원 클라우드 바우처 포털 온라인 접수',
        region: '전국',
        department: '클라우드산업과',
        contact_info: '정보통신산업진흥원 053-230-1552',
        application_url: 'https://www.nipa.kr/main/selectMainForm.do',
    },
    '청년 일자리 도약 장려금': {
        budget: '채용 1인당 월 최대 60만원 (1년)',
        eligibility: '• 만 15~34세 취업애로청년을 정규직으로 채용한 중소기업\n• 5인 이상 사업장\n• 최저임금의 120% 이상 급여 지급\n• 4대보험 가입 필수',
        exclusions: '• 대표자의 배우자, 직계존비속 고용\n• 국가·지자체, 공공기관\n• 임금 체불 사업주\n• 산업재해 발생률이 높은 사업장',
        support_details: '• **채용 장려금**: 정규직 채용 후 6개월 이상 유지 시 월 최대 60만원\n• **정착 지원금**: 12개월 유지 시 추가 480만원 일시금\n• **직무 교육비**: 채용 인력 직무교육 비용 최대 200만원\n• **인사 컨설팅**: 중소기업 인사노무 전문 상담 제공',
        application_period: '2026.01.01 ~ 2026.12.31 (연중 상시)',
        application_method: '고용노동부 고용24(work24.go.kr) 또는 관할 고용센터 방문접수',
        region: '전국',
        department: '청년고용기획과',
        contact_info: '고용노동부 고용정책실 044-202-7440\n고용24 상담센터 1350',
        application_url: 'https://www.work24.go.kr',
    },
    '기술금융 공급망 혁신 정책자금': {
        budget: '최대 100억원 (대출)',
        eligibility: '• 기술보증기금 "기술평가" T4등급 이상 보유 기업\n• 제조·ICT 분야 핵심 부품 국산화 기업\n• 최근 3년간 매출액 평균 10억원 이상\n• 기술 인력 비율 20% 이상',
        exclusions: '• 금융기관 연체 중인 기업\n• 기술보증기금 사고 이력 보유 기업\n• 유흥·사행성 업종\n• 부동산 임대업 및 건설업 일부',
        support_details: '• **운영 자금**: 연 2.0% 고정금리, 최대 5년 상환\n• **시설 자금**: 연 1.5% 고정금리, 최대 8년 상환\n• **특례 보증**: 보증비율 100%, 보증료 0.5%p 감면\n• **기술 컨설팅**: 기술 사업화 전략 수립 전문가 자문 제공',
        application_period: '2026.01.01 ~ 2026.12.31 (연중 상시)',
        application_method: '기술보증기금 영업점 방문 또는 온라인 신청\nhttps://www.kibo.or.kr',
        region: '전국',
        department: '기술금융부',
        contact_info: '기술보증기금 1544-1120',
        application_url: 'https://www.kibo.or.kr',
    },
    '디지털 격차 해소 범부처 지원사업': {
        budget: '최대 5,000만원',
        eligibility: '• 디지털 기술 활용 사회적 가치 창출 사업 보유\n• 개인 연구자, 소셜벤처, 사회적 기업\n• 취약계층 디지털 역량 강화 관련 사업 계획 보유\n• 비영리기관 참여 가능',
        exclusions: '• 대기업 및 대기업 계열사\n• 정부지원사업 부정수급 이력 보유\n• 유사 사업비 중복 수혜',
        support_details: '• **사업화 자금**: 디지털 교육 콘텐츠 개발, 플랫폼 구축비\n• **인력 지원**: 디지털 교육 강사 파견 (20회)\n• **장비 지원**: 태블릿, PC 등 교육용 디바이스 지원\n• **운영비**: 교육장 임차료, 강사 수당 등',
        application_period: '2026.02.15 ~ 2026.02.28',
        application_method: '과학기술정보통신부 R&D 혁신지원포털 온라인 접수',
        region: '전국',
        department: '디지털포용정책과',
        contact_info: '과학기술정보통신부 044-202-6150',
        application_url: 'https://www.msit.go.kr/bbs/list.do?sCode=user&mId=113&mPid=238',
    },
};

// Bio grants (from add_bio_grants migration)
const bioEnrichmentData = {
    '2026 바이오·의료기술개발사업 신규지원 대상과제': {
        budget: '최대 3억원 (3년간)',
        eligibility: '• 의과대학·자연과학대학 소속 연구자\n• 대학원(석·박사) 재학 중 연구자\n• 바이오·헬스케어 분야 연구 실적 보유\n• 의사면허 보유 연구자 우대',
        exclusions: '• 타 부처 동일 주제 연구과제 수행 중인 자\n• 연구윤리 위반 이력 보유자\n• 연구비 부정 사용 이력 보유자',
        support_details: '• **연구비**: 인건비(학생연구원), 재료비, 장비 사용료 등 최대 3억원\n• **펠로우십**: 의사과학자 양성 펠로우십 월 300만원\n• **해외 연수**: 해외 공동연구기관 파견 지원 (6개월)\n• **논문 출판비**: SCI급 논문 출판 비용 지원',
        application_period: '2026.02.01 ~ 2026.03.20',
        application_method: '보건복지부 R&D 관리시스템(htdream.kr) 온라인 접수',
        region: '전국',
        department: '생명과학정책과',
        contact_info: '보건복지부 생명과학정책과 044-202-2753\n한국보건산업진흥원 043-713-8400',
        application_url: 'https://www.htdream.kr/biz/guide/list.do',
    },
    '청년 바이오 스타트업 랩(Lab) 구축 지원': {
        budget: '최대 5,000만원 (1년)',
        eligibility: '• 만 39세 이하 예비창업자 또는 창업 3년 이내 기업\n• 대학·연구기관의 바이오 기술 기반 사업 아이템 보유\n• 시제품 제작 또는 기술 검증 단계의 과제\n• 대학원 졸업(예정)자 또는 연구원 경력 보유자 우대',
        exclusions: '• 기 사업화 완료된 제품\n• 타 창업지원사업 동시 수혜 불가\n• 비생명공학 분야 아이템',
        support_details: '• **랩 구축비**: 실험실 장비, 시약, 소모품 구매비\n• **시제품 제작**: 3D프린팅, CNC가공 등 시제품 제작 지원\n• **공용 장비**: 한국생명공학연구원 내 공용 장비 무상 이용\n• **멘토링**: 바이오 분야 VC 및 CTO 멘토 매칭',
        application_period: '2026.02.15 ~ 2026.03.20',
        application_method: '한국생명공학연구원 홈페이지 공고란 접수',
        region: '대전 (대전연구단지 內)',
        department: '바이오벤처지원센터',
        contact_info: '한국생명공학연구원 바이오벤처지원센터 042-860-4114',
        application_url: 'https://www.kribb.re.kr/kor/sub04_01_01.do',
    },
    '대학원생 논문 기반 딥테크 창업 챌린지': {
        budget: '최대 3,000만원 (6개월)',
        eligibility: '• 이공계 석·박사 과정 재학생 (팀 구성 필수, 2~5인)\n• 연구 논문 기반 기술 사업화 아이템 보유\n• 지도교수 또는 소속기관장 추천서 필요\n• 딥테크(AI, 바이오, 소재, 양자 등) 분야 한정',
        exclusions: '• 인문·사회·예체능 분야 과제\n• 이미 법인 설립 완료된 팀\n• 기졸업생 단독 참여 불가',
        support_details: '• **창업 탐색비**: 시장조사, 고객 인터뷰, 시제품 테스트 비용 최대 3천만원\n• **창업 교육**: 린스타트업 방법론 집중 교육 (4주)\n• **데모데이**: 투자자 초청 데모데이 발표 기회\n• **후속 지원**: 우수팀 예비창업패키지 연계 추천',
        application_period: '2026.02.20 ~ 2026.03.05',
        application_method: 'K-Startup 홈페이지 온라인 접수',
        region: '전국',
        department: '창업성장기반과',
        contact_info: '과학기술정보통신부 044-202-4663\n창업진흥원 042-480-4300',
        application_url: 'https://www.k-startup.go.kr/web/contents/bizpbanc-ongoing.do',
    },
};

async function seedGrantDetails() {
    console.log('Fetching grants...');
    const { data: grants, error } = await supabase.from('grants').select('*');

    if (error) {
        console.error('Error:', error);
        return;
    }

    console.log(`Found ${grants.length} grants. Enriching with detailed data...`);

    const allData = { ...enrichmentData, ...bioEnrichmentData };
    let updatedCount = 0;

    for (const grant of grants) {
        const details = allData[grant.title];
        if (!details) {
            console.warn(`No enrichment data for: ${grant.title}`);
            continue;
        }

        const { error: updateError } = await supabase
            .from('grants')
            .update({
                budget: details.budget,
                eligibility: details.eligibility,
                exclusions: details.exclusions,
                support_details: details.support_details,
                application_period: details.application_period,
                application_method: details.application_method,
                region: details.region,
                department: details.department,
                contact_info: details.contact_info,
                application_url: details.application_url,
            })
            .eq('id', grant.id);

        if (updateError) {
            console.error(`Error updating ${grant.title}:`, updateError);
        } else {
            console.log(`✅ ${grant.title}`);
            updatedCount++;
        }
    }

    console.log(`\nDone! Enriched ${updatedCount}/${grants.length} grants.`);
}

seedGrantDetails();
