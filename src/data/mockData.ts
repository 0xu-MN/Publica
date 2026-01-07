export interface NewsItem {
  id: string;
  title: string;
  summary: string;
  aiSummary: string;
  aiInsight?: string; // Optional for mock data, required from backend
  imageUrl: string;
  category: 'Science' | 'Economy';
  source: string;
  sourceUrl?: string;
  timestamp: string;
  color: string;
  readTime: string;
  tags: string[];
}

export const mockData: NewsItem[] = [
  {
    id: '1',
    title: '차세대 AI 반도체: 에너지 효율 10배 향상',
    summary: '연구진이 기존 GPU보다 전력 소모를 100배 줄인 뉴로모픽 칩 개발에 성공했습니다. 이는 엣지 AI 기기와 자율주행 드론 분야에 혁명을 가져올 것입니다.',
    aiSummary: '연구진이 기존 GPU보다 전력 소모를 100배 줄인 뉴로모픽 칩 개발에 성공했습니다. 이는 엣지 AI 기기와 자율주행 드론 분야에 혁명을 가져올 것입니다.',
    imageUrl: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?q=80&w=2832&auto=format&fit=crop',
    category: 'Science',
    source: 'TechCrunch',
    sourceUrl: 'https://techcrunch.com',
    timestamp: '2시간 전',
    color: '#0A192F',
    readTime: '3분',
    tags: ['#AI', '#반도체']
  },
  {
    id: '2',
    title: '양자 컴퓨터, 신약 개발 시간 90% 단축',
    summary: '새로운 양자 알고리즘이 알츠하이머 치료제 후보 물질을 기록적인 시간 안에 찾아냈습니다. 수년이 걸리던 임상 시험 준비 기간을 획기적으로 줄일 수 있습니다.',
    aiSummary: '새로운 양자 알고리즘이 알츠하이머 치료제 후보 물질을 기록적인 시간 안에 찾아냈습니다. 수년이 걸리던 임상 시험 준비 기간을 획기적으로 줄일 수 있습니다.',
    imageUrl: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?q=80&w=2832&auto=format&fit=crop',
    category: 'Science',
    source: 'Nature',
    sourceUrl: 'https://www.nature.com',
    timestamp: '8시간 전',
    color: '#0F172A',
    readTime: '6분',
    tags: ['#양자컴퓨팅', '#바이오']
  },
  {
    id: '3',
    title: '스페이스X 스타쉽, 첫 유인 착륙 성공',
    summary: '최신 스타쉽 프로토타입이 달 표면 착륙에 성공했습니다. 아르테미스 프로그램의 핵심 이정표이자 화성 식민지화의 첫걸음입니다.',
    aiSummary: '최신 스타쉽 프로토타입이 달 표면 착륙에 성공했습니다. 아르테미스 프로그램의 핵심 이정표이자 화성 식민지화의 첫걸음입니다.',
    imageUrl: 'https://images.unsplash.com/photo-1541185933-710f5092f470?q=80&w=2832&auto=format&fit=crop',
    category: 'Science',
    source: 'NASA',
    sourceUrl: 'https://www.nasa.gov',
    timestamp: '5시간 전',
    color: '#1e1e2e',
    readTime: '5분',
    tags: ['#우주', '#화성']
  },
  {
    id: '4',
    title: '글로벌 인플레이션, 수십 년 만에 최저치',
    summary: '물가 상승세가 꺾이면서 전 세계 중앙은행들이 금리 인상을 멈추고 있습니다. 시장은 기술주 반등으로 긍정적인 반응을 보이고 있습니다.',
    aiSummary: '물가 상승세가 꺾이면서 전 세계 중앙은행들이 금리 인상을 멈추고 있습니다. 시장은 기술주 반등으로 긍정적인 반응을 보이고 있습니다.',
    imageUrl: 'https://images.unsplash.com/photo-1611974765270-ca12586343bb?q=80&w=2832&auto=format&fit=crop',
    category: 'Economy',
    source: 'Financial Times',
    sourceUrl: 'https://www.ft.com',
    timestamp: '4시간 전',
    color: '#16213e',
    readTime: '4분',
    tags: ['#인플레이션', '#증시']
  },
  {
    id: '5',
    title: '핵융합 발전 상용화, 예상보다 5년 앞당겨져',
    summary: '자기장 가둠 방식의 핵융합 기술 돌파구가 마련되면서 상용 원자로 건설 시기가 앞당겨졌습니다. 에너지 기업들의 투자가 쇄도하고 있습니다.',
    aiSummary: '자기장 가둠 방식의 핵융합 기술 돌파구가 마련되면서 상용 원자로 건설 시기가 앞당겨졌습니다. 에너지 기업들의 투자가 쇄도하고 있습니다.',
    imageUrl: 'https://images.unsplash.com/photo-1521579772986-463283623c21?q=80&w=2832&auto=format&fit=crop',
    category: 'Science',
    source: 'Science Daily',
    sourceUrl: 'https://www.sciencedaily.com',
    timestamp: '12시간 전',
    color: '#0f3460',
    readTime: '5분',
    tags: ['#핵융합', '#청정에너지']
  },
  {
    id: '6',
    title: '2026 암호화폐 시장: 투기에서 실용성으로',
    summary: '비트코인이 8만 5천 달러 선에서 안정화되며 기관 도입이 늘고 있습니다. 분석가들은 이제 유틸리티 토큰 중심으로 시장이 재편될 것이라 예측합니다.',
    aiSummary: '비트코인이 8만 5천 달러 선에서 안정화되며 기관 도입이 늘고 있습니다. 분석가들은 이제 유틸리티 토큰 중심으로 시장이 재편될 것이라 예측합니다.',
    imageUrl: 'https://images.unsplash.com/photo-1518546305927-5a555bb7020d?q=80&w=2832&auto=format&fit=crop',
    category: 'Economy',
    source: 'Bloomberg',
    sourceUrl: 'https://www.bloomberg.com',
    timestamp: '1일 전',
    color: '#2D3748',
    readTime: '7분',
    tags: ['#크립토', '#금융']
  },
];
