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

// --- Community Data & Types ---

export type CommunityCategory = '전체' | '연구·학술' | '투자·경제' | '정부지원·펀딩' | '커리어·네트워킹' | '고민·상담' | '대학·대학원생' | '오프토픽';

export const COMMUNITY_CATEGORIES: CommunityCategory[] = [
  '전체',
  '연구·학술',
  '투자·경제',
  '정부지원·펀딩',
  '커리어·네트워킹',
  '고민·상담',
  '대학·대학원생',
  '오프토픽',
];

export interface Comment {
  id: string;
  author: string;
  content: string;
  timestamp: string;
  isAnonymous: boolean;
}

export interface CommunityPost {
  id: string;
  author: string;
  authorId?: string; // Add optional authorId for permissions
  role: string; // e.g., '박사과정', '현직 투자자', '익명'
  isAnonymous: boolean;
  category: CommunityCategory;
  title: string;
  content: string;
  imageUrl?: string;
  likes: number;
  comments: number;
  commentsList?: Comment[]; // Added for detailed view
  timestamp: string;
  scrapped: boolean;
}

export const mockCommunityPosts: CommunityPost[] = [
  {
    id: 'c1',
    author: '김연구',
    role: '박사과정',
    isAnonymous: false,
    category: '연구·학술',
    title: 'Nature 게재 논문, 재현성 문제 관련 토론 요청합니다.',
    content: '최근 발표된 AlphaFold3 관련 논문에서 특정 단백질 구조 예측 부분의 재현이 잘 안되네요. 혹시 같은 실험 해보신 분 계신가요?',
    imageUrl: 'https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?q=80&w=2940&auto=format&fit=crop',
    likes: 42,
    comments: 15,
    timestamp: '방금 전',
    scrapped: true,
  },
  {
    id: 'c2',
    author: '익명',
    role: '익명',
    isAnonymous: true,
    category: '고민·상담',
    title: '박사 3년차인데 번아웃이 너무 심하게 왔습니다.',
    content: '연구 진도는 안 나가고 교수님 압박은 심해지고... 다들 어떻게 버티시나요? 휴학을 진지하게 고민 중입니다.',
    likes: 128,
    comments: 45,
    timestamp: '15분 전',
    scrapped: false,
  },
  {
    id: 'c3',
    author: '이투자',
    role: '퀀트 트레이더',
    isAnonymous: false,
    category: '투자·경제',
    title: '2026 하반기 반도체 섹터 전망 및 포트폴리오 공유',
    content: '현재 HBM 공급 과잉 우려가 있지만 AI 서버 수요는 여전히 견고합니다. 제 개인적인 롱/숏 전략 공유드립니다.',
    imageUrl: 'https://images.unsplash.com/photo-1642543477810-72f12f949c8c?q=80&w=2832&auto=format&fit=crop',
    likes: 89,
    comments: 32,
    timestamp: '1시간 전',
    scrapped: true,
  },
  {
    id: 'c4',
    author: '최창업',
    role: '스타트업 CEO',
    isAnonymous: false,
    category: '정부지원·펀딩',
    title: '예비창업패키지 최종 합격 꿀팁 (사업계획서 첨부)',
    content: '3수 끝에 드디어 합격했습니다! 심사위원이 중요하게 본 포인트 3가지를 정리해봤습니다. 도움 되시길 바랍니다.',
    imageUrl: 'https://images.unsplash.com/photo-1553729459-efe14ef6055d?q=80&w=2940&auto=format&fit=crop',
    likes: 245,
    comments: 67,
    timestamp: '3시간 전',
    scrapped: true,
  },
  {
    id: 'c5',
    author: '익명',
    role: '익명',
    isAnonymous: true,
    category: '커리어·네트워킹',
    title: '삼성전자 무선사업부 vs 네이버 클라우드 오퍼 비교',
    content: '연봉은 삼성이 조금 더 높은데 워라밸과 성장성은 네이버가 좋아보여서요. 현직자 분들 조언 부탁드립니다.',
    likes: 56,
    comments: 23,
    timestamp: '5시간 전',
    scrapped: false,
  },
  {
    id: 'c6',
    author: '한대학',
    role: '석사과정',
    isAnonymous: false,
    category: '대학·대학원생',
    title: '랩실 선정할 때 꼭 확인해야 할 체크리스트',
    content: '인건비, 교수님 인품, 출퇴근 시간... 겉으로만 봐선 모르는 꿀팁들 정리했습니다.',
    likes: 92,
    comments: 18,
    timestamp: '어제',
    scrapped: false,
  },
  {
    id: 'c7',
    author: '강코딩',
    role: '프리랜서',
    isAnonymous: false,
    category: '오프토픽',
    title: '개발자 노트북 추천해주세요 (맥북 vs 씽크패드)',
    content: '이번에 장비 업그레이드 하려고 하는데 고민이네요. 주로 AI 모델 돌릴 일이 많습니다.',
    likes: 12,
    comments: 48,
    timestamp: '2일 전',
    scrapped: false,
  }
];
