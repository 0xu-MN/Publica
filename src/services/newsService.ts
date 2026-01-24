import { supabase } from '../lib/supabase';

// Diverse fallback images based on category
const getFallbackImage = (category: string, id: string): string => {
    const scienceImages = [
        'https://images.unsplash.com/photo-1507413245164-6160d8298b31?w=800&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=800&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=800&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1541185933-710f5092f470?w=800&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1518546305927-5a555bb7020d?w=800&auto=format&fit=crop',
    ];

    const economyImages = [
        'https://images.unsplash.com/photo-1611974765270-ca12586343bb?w=800&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1579532537598-459ecdaf39cc?w=800&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1560221328-12fe60f83ab8?w=800&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?w=800&auto=format&fit=crop',
    ];

    const images = category === 'Science' ? scienceImages : economyImages;
    const index = parseInt(id.slice(-1), 16) % images.length; // Use last char of ID as seed
    return images[index];
};

export interface AICardNews {
    id: string;
    headline: string;
    body: string;
    bullets: string[];
    related_materials: { title: string; url: string }[];
    created_at: string;
    imageUrl?: string;
    category?: string;
}

// Frontend compatible NewsItem interface
export interface NewsItem {
    id: string;
    // ... (existing NewsItem fields)
    title: string;
    summary: string;
    aiSummary: string; // db: ai_summary
    aiInsight: string; // db: ai_insight
    imageUrl: string; // db: image_url
    category: 'Science' | 'Economy';
    source: string;
    sourceUrl?: string; // db: source_url
    timestamp: string; // db: published_at
    tags: string[];
    readTime: string; // db: read_time
    color: string; // Derived from category
}


export const fetchNews = async (category: string = '전체'): Promise<NewsItem[]> => {
    try {
        let query = supabase
            .from('news_items')
            .select('*')
            .order('priority_score', { ascending: false })
            .order('published_at', { ascending: false });

        if (category !== '전체') {
            // Map Korean category labels to database category values
            const dbCategory = category === '과학' ? 'Science' : 'Economy';
            query = query.eq('category', dbCategory);
        }

        const { data, error } = await query.limit(50);

        if (error) {
            console.error('Error fetching news:', error);
            throw error;
        }

        if (!data) return [];

        // Map DB fields to Frontend fields
        return data.map((item: any) => ({
            id: item.id,
            title: item.title,
            summary: item.summary,
            aiSummary: item.ai_summary,
            aiInsight: item.ai_insight,
            imageUrl: item.image_url || getFallbackImage(item.category, item.id), // Diverse fallback images
            category: item.category,
            source: item.source,
            sourceUrl: item.source_url, // Map source_url
            timestamp: new Date(item.published_at).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' }),
            tags: item.tags || [],
            readTime: item.read_time,
            color: item.category === 'Science' ? '#0EA5E9' : '#10B981'
        }));
    } catch (error) {
        console.error('Unexpected error fetching news:', error);
        return [];
    }
};

// 실시간 구독 (선택사항)
export const subscribeToNews = (callback: (payload: any) => void) => {
    return supabase
        .channel('news_updates')
        .on(
            'postgres_changes',
            { event: 'INSERT', schema: 'public', table: 'news_items' },
            callback
        )
        .subscribe();
};
// AI 뉴스 카드 가져오기
export const fetchAICards = async (): Promise<AICardNews[]> => {
    try {
        const { data, error } = await supabase
            .from('cards')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(10);

        if (error) throw error;
        if (!data) return [];

        return data.map((item: any) => {
            try {
                const content = typeof item.content === 'string' ? JSON.parse(item.content) : item.content;
                return {
                    id: item.id,
                    headline: content.headline || "제목 없음",
                    body: content.body || "",
                    bullets: content.bullets || [],
                    related_materials: content.related_materials || [],
                    created_at: item.created_at,
                    imageUrl: content.imageUrl,
                    category: content.category
                };
            } catch (e) {
                console.error("JSON parsing error for card:", item.id, e);
                return null;
            }
        }).filter((i: any): i is AICardNews => i !== null);
    } catch (error) {
        console.error('Error fetching AI cards:', error);
        return [];
    }
};

// 정부지원사업 가져오기
export const fetchGovernmentPrograms = async (): Promise<any[]> => {
    try {
        const { data, error } = await supabase
            .from('government_programs')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(10);

        if (error) throw error;
        if (!data || data.length === 0) {
            // Fallback to local mock if no data in DB
            return [
                { title: '데이터바우처 지원사업', agency: '한국데이터산업진흥원', period: '2026.03.15', status: '접수중', dDay: 'D-30', category: '데이터/AI' },
                { title: '글로벌 강소기업 1000+', agency: '중소벤처기업부', period: '2026.02.20', status: '마감임박', dDay: 'D-15', category: '수출/마케팅' },
                { title: '스마트상점 기술보급', agency: '소상공인시장진흥공단', period: '2026.04.01', status: '접수예정', dDay: 'D-45', category: '소상공인' },
            ];
        }

        return data.map((item: any) => ({
            id: item.id,
            title: item.title,
            agency: item.agency,
            period: item.period,
            status: item.status,
            dDay: item.d_day,
            category: item.category,
            link: item.link
        }));
    } catch (error) {
        console.error('Error fetching gov programs (using fallback):', error);
        // Fallback to local mock on error (e.g. table missing)
        return [
            { title: '데이터바우처 지원사업', agency: '한국데이터산업진흥원', period: '2026.03.15', status: '접수중', dDay: 'D-30', category: '데이터/AI' },
            { title: '글로벌 강소기업 1000+', agency: '중소벤처기업부', period: '2026.02.20', status: '마감임박', dDay: 'D-15', category: '수출/마케팅' },
            { title: '스마트상점 기술보급', agency: '소상공인시장진흥공단', period: '2026.04.01', status: '접수예정', dDay: 'D-45', category: '소상공인' },
            { title: '2026년도 AI 바우처 지원', agency: '과학기술정보통신부', period: '2026.02.28', status: '접수중', dDay: 'D-22', category: '기술개발' },
            { title: '청년창업사관학교 16기', agency: '중소벤처기업진흥공단', period: '2026.02.05', status: '마감임박', dDay: 'D-3', category: '창업지원' },
        ];
    }
};
