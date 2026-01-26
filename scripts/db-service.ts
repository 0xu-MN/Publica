/**
 * Database Service - Supabase 연동
 * 중복 방지, 카드 저장 등 DB 관련 유틸리티
 */

import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import { NewsArticle } from './news-collector';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    throw new Error('Missing Supabase credentials');
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

/**
 * 기사가 이미 사용되었는지 확인
 */
export async function isArticleUsed(articleId: string): Promise<boolean> {
    const { data, error } = await supabase
        .from('used_articles')
        .select('id')
        .eq('article_id', articleId)
        .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = not found
        console.error('Error checking article:', error);
        return true; // 에러시 사용된 것으로 간주 (안전)
    }

    return !!data;
}

/**
 * 기사를 사용 완료로 마킹
 */
export async function markArticleAsUsed(article: NewsArticle): Promise<void> {
    const { error } = await supabase
        .from('used_articles')
        .insert({
            article_id: article.id,
            article_url: article.link,
            article_title: article.title,
            category: article.category
        });

    if (error) {
        console.error('Error marking article as used:', error);
        throw error;
    }

    console.log(`✅ Marked as used: ${article.title}`);
}

/**
 * 미사용 기사 필터링
 */
export async function filterUnusedArticles(
    articles: NewsArticle[]
): Promise<NewsArticle[]> {
    const unused: NewsArticle[] = [];

    for (const article of articles) {
        const used = await isArticleUsed(article.id);
        if (!used) {
            unused.push(article);
        }
    }

    console.log(`📊 Total: ${articles.length} | Unused: ${unused.length}`);
    return unused;
}

/**
 * 카드 발행
 */
export async function publishCard(cardData: any): Promise<void> {
    const { error } = await supabase
        .from('cards')
        .insert({
            content: JSON.stringify(cardData),
            created_at: cardData.created_at || new Date().toISOString() // 명시적 시간 사용
        });

    if (error) {
        console.error('Error publishing card:', error);
        throw error;
    }

    console.log(`✅ Published card: ${cardData.headline}`);
}

/**
 * 사용된 기사 개수 조회
 */
export async function getUsedArticlesCount(): Promise<number> {
    const { count, error } = await supabase
        .from('used_articles')
        .select('*', { count: 'exact', head: true });

    if (error) {
        console.error('Error counting articles:', error);
        return 0;
    }

    return count || 0;
}
