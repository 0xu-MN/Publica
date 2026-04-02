require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.EXPO_PUBLIC_SUPABASE_URL, process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY);

const cards = [
  {
    content: JSON.stringify({
      headline: "AI 사업계획서 작성 시스템, 수일 걸리던 작업을 단 3분만에",
      body: "정부지원사업 합격의 당락을 좌우하는 사업계획서 작성, 이제 Publica의 AI 전략 솔루션으로 완벽하게 완성하세요! PSST 프레임워크를 기반으로 하여 각 정부 공고의 요구사항에 맞춰 섹션별 초안을 스마트하게 도출합니다. 단순한 양식 채우기가 아닌 심사위원의 기준을 관통하는 탁월한 전략 비서를 경험해보세요.",
      bullets: [
        "분석부터 작성까지 단 3분 컷",
        "PSST 프레임워크 완벽 적용",
        "지원 공고 맞춤형 초안 생성"
      ],
      imageUrl: "https://images.unsplash.com/photo-1542744173-8e7e53415bb0?w=800&auto=format&fit=crop",
      category: "Economy",
      related_materials: [
        { title: "Publica 정부지원사업 둘러보기", url: "#" }
      ]
    })
  },
  {
    content: JSON.stringify({
      headline: "2026 스타트업 위기 돌파, 생성형 AI 생태계가 답이다",
      body: "벤처 투자 업계 조사에 따르면, 생성형 AI를 실무 프로세스 전반에 통합해 압도적인 생산성을 입증한 스타트업의 후속 투자 유치 확률이 비도입 기업 대비 무려 2.5배 높은 것으로 나타났습니다. 이제 AI는 단순한 유행을 넘어 생존과 투자를 결정짓는 필수 인프라가 되었습니다.",
      bullets: [
        "생성형 AI 도입 기업 투자 유치율 급증",
        "생산성 극대화가 핵심 투자 지표",
        "빠른 AI 도구 내재화 필수"
      ],
      imageUrl: "https://images.unsplash.com/photo-1677442136019-21780ecad995?w=800&auto=format&fit=crop",
      category: "Science",
      related_materials: []
    })
  }
];

async function seedCards() {
    console.log('Inserting sample cards...');
    for (const card of cards) {
        const { error } = await supabase.from('cards').insert({
            content: card.content,
            created_at: new Date().toISOString()
        });
        if (error) {
            console.error('Error inserting card:', error);
        } else {
            console.log('Inserted card successfully.');
        }
    }
}

seedCards();
