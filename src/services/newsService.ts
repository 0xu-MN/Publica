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

// Frontend compatible NewsItem interface
export interface NewsItem {
    id: string;
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
