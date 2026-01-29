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

type RelatedMaterial = { title: string; url: string };

export interface AICardNews {
    id: string;
    content: string; // JSON string 형식의 카드 데이터
    headline: string;
    body: string;
    category: string;
    created_at: string;
    imageUrl: string;
    bullets?: string[];
    related_materials?: RelatedMaterial[];
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
    related_materials?: { title: string; url: string }[]; // Added for scraps
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

        const { data, error } = await query;  // NO LIMIT!

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
export const fetchAICards = async (category: string = '전체'): Promise<AICardNews[]> => {
    try {
        let query = supabase
            .from('cards')
            .select('*')
            .order('created_at', { ascending: false });  // NO LIMIT!

        // 카테고리 필터 적용
        if (category !== '전체') {
            // JSON 컬럼에서 카테고리 필터링
            // content->>'category' 문법 사용
            const dbCategory = category === '과학' ? 'Science' : 'Economy';
            // Supabase에서 JSON 필드 검색은 textSearch나 다른 방법 필요
            // 모든 데이터를 가져온 후 클라이언트에서 필터링하는 것이 더 안전함
        }

        const { data, error } = await query;

        if (error) throw error;
        if (!data) return [];

        let cards = data.map((item: any) => {
            try {
                const content = typeof item.content === 'string' ? JSON.parse(item.content) : item.content;
                return {
                    id: item.id,
                    content: item.content, // 원본 content 필드 추가
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

        // 카테고리 필터 적용 (클라이언트에서 필터링)
        if (category !== '전체') {
            const dbCategory = category === '과학' ? 'Science' : 'Economy';
            cards = cards.filter(card => card.category === dbCategory);
        }

        return cards;
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

        return data.map((item: any) => {
            const formatDate = (dateStr: string) => {
                if (!dateStr) return '';
                const d = new Date(dateStr);
                return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
            };

            const start = formatDate(item.start_date);
            const end = formatDate(item.end_date || item.deadline);
            const period = start && end ? `${start} ~ ${end}` : (end ? `~ ${end}` : '상시모집');

            return {
                id: item.id,
                title: item.title,
                agency: `${item.agency} | ${item.api_source}`, // Combine for clearer attribution
                original_agency: item.agency, // Keep original for filtering if needed
                department: item.department,
                period: period,
                status: item.status,
                dDay: item.d_day,
                category: Array.isArray(item.category) ? item.category[0] : (item.category || '기타'),
                link: item.link,
                // Detailed fields
                description: item.description,
                requirements: item.requirements,
                budget: item.budget,
                target: item.tags ? item.tags.join(', ') : '',
                // New fields for detail view
                submitDocs: item.requirements && item.requirements.length > 0 ? item.requirements[0] : '공고문 참조', // aply_trgt_ctnt often contains doc info
                contact: item.department ? `${item.department} / ${item.agency}` : undefined,
                detailUrl: item.link, // For attachments
                views: Math.floor(Math.random() * 1000)
            };
        });
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
// Scraps (Bookmarks) Implementation - Local Mock (AsyncStorage) Fallback
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';

// Memory Cache as primary source of truth for the session
let _memoryScraps: any[] | null = null;

import { Platform } from 'react-native';

const SCRAP_STORAGE_KEY = 'user_scraps_v1';

// Cross-platform Alert
const safeAlert = (title: string, message: string) => {
    if (Platform.OS === 'web') {
        window.alert(`${title}\n\n${message}`);
    } else {
        Alert.alert(title, message);
    }
};

const syncToStorage = async (scraps: any[]) => {
    try {
        if (Platform.OS === 'web') {
            localStorage.setItem(SCRAP_STORAGE_KEY, JSON.stringify(scraps));
        } else {
            await AsyncStorage.setItem(SCRAP_STORAGE_KEY, JSON.stringify(scraps));
        }
        console.log('[DEBUG] Synced to storage. Count:', scraps.length);
    } catch (e) {
        console.error('[DEBUG] Storage sync failed:', e);
    }
};

const getFromStorage = async (): Promise<any[]> => {
    if (_memoryScraps !== null) return _memoryScraps;
    try {
        let stored: string | null = null;
        if (Platform.OS === 'web') {
            stored = localStorage.getItem(SCRAP_STORAGE_KEY);
        } else {
            stored = await AsyncStorage.getItem(SCRAP_STORAGE_KEY);
        }

        _memoryScraps = stored ? JSON.parse(stored) : [];
        return _memoryScraps || [];
    } catch (e) {
        console.error('[DEBUG] Storage read failed:', e);
        return [];
    }
};

export const toggleScrap = async (userId: string, item: AICardNews | any): Promise<boolean> => {
    console.log('[DEBUG] toggleScrap called', { userId, itemHeadline: item.headline || item.title });
    try {
        const currentScraps = await getFromStorage();
        const itemHeadline = item.headline || item.title;

        if (!itemHeadline) {
            safeAlert('오류', '제목이 없는 기사는 저장할 수 없습니다.');
            return false;
        }

        const existingIndex = currentScraps.findIndex((s: any) =>
            (s.headline === itemHeadline) // Relaxing user_id check for now to ensure visibility
        );

        if (existingIndex > -1) {
            // Unscrap
            currentScraps.splice(existingIndex, 1);
            _memoryScraps = [...currentScraps]; // Update memory
            await syncToStorage(_memoryScraps);

            // safeAlert('스크랩 취소', `보관함에서 삭제되었습니다. (남은 개수: ${_memoryScraps.length})`);
            return false;
        } else {
            // Scrap
            const payload = {
                id: Math.random().toString(36).substr(2, 9),
                user_id: userId,
                headline: itemHeadline,
                body: item.body || item.summary,
                ai_insight: item.aiInsight || (item.aiSummary ? `💡 결론\n${item.aiSummary}` : null),
                bullets: item.bullets || item.tags || [],
                related_materials: item.related_materials || item.relatedLinks || [], // Validated persistence
                image_url: item.imageUrl,
                category: item.category,
                created_at: new Date().toISOString()
            };
            currentScraps.unshift(payload);
            _memoryScraps = [...currentScraps]; // Update memory
            await syncToStorage(_memoryScraps);

            // safeAlert('스크랩 완료', `저장되었습니다. (총 ${_memoryScraps.length}개)`);
            return true;
        }
    } catch (error) {
        console.error('Error toggling scrap (local):', error);
        safeAlert('저장 실패', '기기 저장소 오류가 발생했습니다.');
        throw error;
    }
};

export const fetchScraps = async (userId: string): Promise<any[]> => {
    try {
        const currentScraps = await getFromStorage();
        console.log('[DEBUG] Returning scraps from memory/storage:', currentScraps.length);

        // Map back to NewsItem
        return currentScraps.map((item: any) => ({
            id: item.id,
            title: item.headline,
            summary: item.body,
            aiInsight: item.ai_insight,
            imageUrl: item.image_url,
            category: item.category,
            source: 'Saved Insight',
            timestamp: new Date(item.created_at).toLocaleDateString(),
            tags: item.bullets || [],
            related_materials: item.related_materials || [],
            readTime: '3 min',
            isScrapped: true
        }));
    } catch (error) {
        console.error('Error fetching scraps (local):', error);
        return [];
    }
};

export const getScrappedIds = async (userId: string): Promise<Set<string>> => {
    try {
        const currentScraps = await getFromStorage();
        return new Set(currentScraps.map((d: any) => d.headline));
    } catch (e) {
        return new Set();
    }
};
