import React, { useState, useEffect } from 'react';
import {
    View, Text, TextInput, TouchableOpacity, ScrollView,
    StyleSheet, ActivityIndicator, Alert, Platform
} from 'react-native';
import { supabase } from '../lib/supabase';
import { PlusCircle, Trash2, Eye, EyeOff, RefreshCw, Shield } from 'lucide-react-native';

// ─────────────────────────────────────────────────────────────────────────────
// 🔐 Admin check via Supabase admin_users table (with hardcoded email fallback)
// ─────────────────────────────────────────────────────────────────────────────
const FALLBACK_ADMIN_EMAILS = ['contact@publica.ai', 'hong56800@gmail.com'];

interface CardItem {
    id: string;
    content: {
        headline: string;
        body: string;
        bullets: string[];
        imageUrl: string;
        category: 'Economy' | 'Science';
        related_materials: { title: string; url: string }[];
    };
    created_at: string;
}

const defaultForm = {
    headline: '',
    body: '',
    bulletsRaw: '',         // newline-separated input
    imageUrl: '',
    category: 'Economy' as 'Economy' | 'Science',
    relatedTitle: '',
    relatedUrl: '',
};

export const AdminScreen = () => {
    const [userEmail, setUserEmail] = useState<string | null>(null);
    const [isAdmin, setIsAdmin] = useState(false);
    const [loading, setLoading] = useState(true);

    const [cards, setCards] = useState<CardItem[]>([]);
    const [fetchLoading, setFetchLoading] = useState(false);
    const [form, setForm] = useState(defaultForm);
    const [publishing, setPublishing] = useState(false);
    const [showPreview, setShowPreview] = useState(false);

    // ── Auth Check via Supabase admin_users table ──────────────────────────
    useEffect(() => {
        const checkAdmin = async () => {
            try {
                const { data: userData } = await supabase.auth.getUser();
                const email = userData?.user?.email || null;
                setUserEmail(email);
                console.log('🔒 AdminScreen: Checking admin for email:', email);
                
                if (!email) {
                    setIsAdmin(false);
                    setLoading(false);
                    return;
                }
                
                // Try Supabase admin_users table first
                const { data, error } = await supabase
                    .from('admin_users')
                    .select('id')
                    .eq('email', email)
                    .maybeSingle();
                
                if (error) {
                    console.log('🔒 admin_users table error (using fallback):', error.message);
                    setIsAdmin(FALLBACK_ADMIN_EMAILS.includes(email));
                } else {
                    setIsAdmin(!!data);
                }
            } catch (e) {
                console.log('🔒 Admin check error:', e);
                const email = userEmail || '';
                setIsAdmin(FALLBACK_ADMIN_EMAILS.includes(email));
            } finally {
                setLoading(false);
            }
        };
        checkAdmin();
    }, []);

    useEffect(() => {
        if (isAdmin) loadCards();
    }, [isAdmin]);

    // ── Load existing cards ─────────────────────────────────────────────────
    const loadCards = async () => {
        setFetchLoading(true);
        const { data, error } = await supabase
            .from('cards')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(30);

        if (!error && data) {
            setCards(data.map((item: any) => {
                try {
                    const content = typeof item.content === 'string' ? JSON.parse(item.content) : item.content;
                    return { id: item.id, content, created_at: item.created_at };
                } catch {
                    return null;
                }
            }).filter(Boolean) as CardItem[]);
        }
        setFetchLoading(false);
    };

    // ── Publish card ────────────────────────────────────────────────────────
    const handlePublish = async () => {
        if (!form.headline.trim() || !form.body.trim()) {
            safeAlert('입력 오류', '헤드라인과 본문을 입력해주세요.');
            return;
        }
        setPublishing(true);
        const bullets = form.bulletsRaw
            .split('\n')
            .map(b => b.trim())
            .filter(Boolean);

        const related_materials = form.relatedTitle && form.relatedUrl
            ? [{ title: form.relatedTitle, url: form.relatedUrl }]
            : [];

        const content = {
            headline: form.headline.trim(),
            body: form.body.trim(),
            bullets,
            imageUrl: form.imageUrl.trim() || getDefaultImage(form.category),
            category: form.category,
            related_materials,
        };

        const { error } = await supabase.from('cards').insert({ content: JSON.stringify(content) });

        if (error) {
            safeAlert('게시 실패', error.message);
        } else {
            safeAlert('게시 완료', 'Insight 페이지에 카드가 추가되었습니다!');
            setForm(defaultForm);
            setShowPreview(false);
            await loadCards();
        }
        setPublishing(false);
    };

    // ── Delete card ─────────────────────────────────────────────────────────
    const handleDelete = async (id: string) => {
        const confirmed = Platform.OS === 'web'
            ? window.confirm('이 카드를 삭제하시겠습니까?')
            : await new Promise(res => Alert.alert('삭제', '이 카드를 삭제하시겠습니까?', [
                { text: '취소', onPress: () => res(false) },
                { text: '삭제', onPress: () => res(true), style: 'destructive' }
            ]));
        if (!confirmed) return;

        const { error } = await supabase.from('cards').delete().eq('id', id);
        if (!error) setCards(prev => prev.filter(c => c.id !== id));
    };

    // ── Helpers ─────────────────────────────────────────────────────────────
    const safeAlert = (title: string, msg: string) => {
        if (Platform.OS === 'web') window.alert(`${title}\n\n${msg}`);
        else Alert.alert(title, msg);
    };

    const getDefaultImage = (cat: string) =>
        cat === 'Science'
            ? 'https://images.unsplash.com/photo-1507413245164-6160d8298b31?w=800&auto=format&fit=crop'
            : 'https://images.unsplash.com/photo-1611974765270-ca12586343bb?w=800&auto=format&fit=crop';

    // ── Loading / Access Denied ─────────────────────────────────────────────
    if (loading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator color="#818CF8" />
            </View>
        );
    }

    if (!isAdmin) {
        return (
            <View style={styles.center}>
                <Shield size={40} color="#334155" />
                <Text style={styles.accessDenied}>접근 권한이 없습니다</Text>
                <Text style={styles.accessSub}>{userEmail ? `(${userEmail})` : '로그인이 필요합니다'}</Text>
            </View>
        );
    }

    // ── Admin UI ────────────────────────────────────────────────────────────
    return (
        <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 60 }}>
            {/* Header */}
            <View style={styles.header}>
                <Shield size={20} color="#818CF8" />
                <Text style={styles.headerTitle}>Insight 카드뉴스 관리자</Text>
                <TouchableOpacity onPress={loadCards} style={styles.refreshBtn}>
                    <RefreshCw size={16} color="#64748B" />
                </TouchableOpacity>
            </View>
            <Text style={styles.headerSub}>관리자: {userEmail}</Text>

            {/* ─ Write Form ─ */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>✍️ 새 카드 작성</Text>

                <Text style={styles.label}>헤드라인 *</Text>
                <TextInput
                    style={styles.input}
                    placeholder="예: 2026 스타트업 정부지원 총정리"
                    placeholderTextColor="#475569"
                    value={form.headline}
                    onChangeText={v => setForm(f => ({ ...f, headline: v }))}
                />

                <Text style={styles.label}>본문 *</Text>
                <TextInput
                    style={[styles.input, styles.textarea]}
                    placeholder="카드의 메인 본문 내용을 입력하세요"
                    placeholderTextColor="#475569"
                    value={form.body}
                    onChangeText={v => setForm(f => ({ ...f, body: v }))}
                    multiline
                    numberOfLines={4}
                />

                <Text style={styles.label}>핵심 포인트 (한 줄에 하나씩)</Text>
                <TextInput
                    style={[styles.input, styles.textarea]}
                    placeholder={"포인트 1\n포인트 2\n포인트 3"}
                    placeholderTextColor="#475569"
                    value={form.bulletsRaw}
                    onChangeText={v => setForm(f => ({ ...f, bulletsRaw: v }))}
                    multiline
                    numberOfLines={3}
                />

                <Text style={styles.label}>카테고리</Text>
                <View style={styles.categoryRow}>
                    {(['Economy', 'Science'] as const).map(cat => (
                        <TouchableOpacity
                            key={cat}
                            style={[styles.catBtn, form.category === cat && styles.catBtnActive]}
                            onPress={() => setForm(f => ({ ...f, category: cat }))}
                        >
                            <Text style={[styles.catBtnText, form.category === cat && styles.catBtnActiveText]}>
                                {cat === 'Economy' ? '📊 경제' : '🔬 과학'}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>

                <Text style={styles.label}>이미지 URL (비워두면 자동)</Text>
                <TextInput
                    style={styles.input}
                    placeholder="https://images.unsplash.com/..."
                    placeholderTextColor="#475569"
                    value={form.imageUrl}
                    onChangeText={v => setForm(f => ({ ...f, imageUrl: v }))}
                />

                <Text style={styles.label}>참고 자료 제목</Text>
                <TextInput
                    style={styles.input}
                    placeholder="예: 중소벤처기업부 공고"
                    placeholderTextColor="#475569"
                    value={form.relatedTitle}
                    onChangeText={v => setForm(f => ({ ...f, relatedTitle: v }))}
                />

                <Text style={styles.label}>참고 자료 URL</Text>
                <TextInput
                    style={styles.input}
                    placeholder="https://..."
                    placeholderTextColor="#475569"
                    value={form.relatedUrl}
                    onChangeText={v => setForm(f => ({ ...f, relatedUrl: v }))}
                />

                {/* Preview Toggle */}
                {form.headline.trim() ? (
                    <TouchableOpacity
                        style={styles.previewBtn}
                        onPress={() => setShowPreview(v => !v)}
                    >
                        {showPreview ? <EyeOff size={16} color="#94A3B8" /> : <Eye size={16} color="#94A3B8" />}
                        <Text style={styles.previewBtnText}>{showPreview ? '미리보기 닫기' : '미리보기'}</Text>
                    </TouchableOpacity>
                ) : null}

                {/* Preview */}
                {showPreview && (
                    <View style={styles.preview}>
                        <Text style={styles.previewHeadline}>{form.headline}</Text>
                        <Text style={styles.previewTag}>{form.category === 'Economy' ? '📊 경제' : '🔬 과학'}</Text>
                        <Text style={styles.previewBody}>{form.body}</Text>
                        {form.bulletsRaw.trim() ? (
                            form.bulletsRaw.split('\n').filter(Boolean).map((b, i) => (
                                <Text key={i} style={styles.previewBullet}>• {b}</Text>
                            ))
                        ) : null}
                    </View>
                )}

                {/* Publish Button */}
                <TouchableOpacity
                    style={[styles.publishBtn, publishing && { opacity: 0.6 }]}
                    onPress={handlePublish}
                    disabled={publishing}
                >
                    {publishing
                        ? <ActivityIndicator size="small" color="#fff" />
                        : <PlusCircle size={18} color="#fff" />
                    }
                    <Text style={styles.publishBtnText}>{publishing ? '게시 중...' : 'Insight에 게시하기'}</Text>
                </TouchableOpacity>
            </View>

            {/* ─ Existing Cards ─ */}
            <View style={styles.section}>
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>📋 게시된 카드 ({cards.length}개)</Text>
                    {fetchLoading && <ActivityIndicator size="small" color="#818CF8" />}
                </View>

                {cards.length === 0 && !fetchLoading && (
                    <Text style={styles.emptyText}>아직 게시된 카드가 없습니다.</Text>
                )}

                {cards.map(card => (
                    <View key={card.id} style={styles.cardRow}>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.cardRowTitle} numberOfLines={1}>{card.content.headline}</Text>
                            <Text style={styles.cardRowMeta}>
                                {card.content.category} · {new Date(card.created_at).toLocaleDateString('ko-KR')}
                            </Text>
                        </View>
                        <TouchableOpacity onPress={() => handleDelete(card.id)} style={styles.deleteBtn}>
                            <Trash2 size={16} color="#EF4444" />
                        </TouchableOpacity>
                    </View>
                ))}
            </View>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#0A0F1E' },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0A0F1E', gap: 12 },
    accessDenied: { color: '#E2E8F0', fontSize: 18, fontWeight: '700', marginTop: 16 },
    accessSub: { color: '#64748B', fontSize: 13 },

    header: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 20, paddingBottom: 4 },
    headerTitle: { color: '#E2E8F0', fontSize: 18, fontWeight: '800', flex: 1 },
    headerSub: { color: '#475569', fontSize: 12, paddingHorizontal: 20, marginBottom: 16 },
    refreshBtn: { padding: 6 },

    section: {
        marginHorizontal: 16,
        marginBottom: 24,
        backgroundColor: '#0F172A',
        borderRadius: 16,
        padding: 20,
        borderWidth: 1,
        borderColor: '#1E293B',
    },
    sectionTitle: { color: '#818CF8', fontSize: 15, fontWeight: '800', marginBottom: 20 },
    sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },

    label: { color: '#94A3B8', fontSize: 12, fontWeight: '600', marginBottom: 6, marginTop: 14 },
    input: {
        backgroundColor: '#1E293B',
        borderRadius: 10,
        padding: 12,
        color: '#E2E8F0',
        fontSize: 14,
        borderWidth: 1,
        borderColor: '#334155',
    },
    textarea: { minHeight: 80, textAlignVertical: 'top' },

    categoryRow: { flexDirection: 'row', gap: 10, marginTop: 4 },
    catBtn: {
        flex: 1, paddingVertical: 10, borderRadius: 10,
        borderWidth: 1, borderColor: '#334155',
        backgroundColor: '#1E293B', alignItems: 'center',
    },
    catBtnActive: { backgroundColor: '#312E81', borderColor: '#818CF8' },
    catBtnText: { color: '#64748B', fontWeight: '600', fontSize: 13 },
    catBtnActiveText: { color: '#818CF8' },

    previewBtn: {
        flexDirection: 'row', alignItems: 'center', gap: 6,
        paddingVertical: 10, marginTop: 16,
    },
    previewBtnText: { color: '#94A3B8', fontSize: 13 },

    preview: {
        backgroundColor: '#1E293B', borderRadius: 12, padding: 16,
        borderWidth: 1, borderColor: '#334155', marginTop: 8,
    },
    previewHeadline: { color: '#E2E8F0', fontSize: 16, fontWeight: '800', marginBottom: 6 },
    previewTag: { color: '#60A5FA', fontSize: 11, fontWeight: '600', marginBottom: 10 },
    previewBody: { color: '#94A3B8', fontSize: 13, lineHeight: 20, marginBottom: 10 },
    previewBullet: { color: '#CBD5E1', fontSize: 13, marginBottom: 4, lineHeight: 20 },

    publishBtn: {
        backgroundColor: '#4F46E5', borderRadius: 12, paddingVertical: 14,
        flexDirection: 'row', justifyContent: 'center', alignItems: 'center',
        gap: 8, marginTop: 24,
    },
    publishBtnText: { color: '#fff', fontWeight: '800', fontSize: 14 },

    cardRow: {
        flexDirection: 'row', alignItems: 'center',
        paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#1E293B',
    },
    cardRowTitle: { color: '#E2E8F0', fontSize: 14, fontWeight: '600' },
    cardRowMeta: { color: '#475569', fontSize: 11, marginTop: 3 },
    deleteBtn: { padding: 8 },
    emptyText: { color: '#475569', fontSize: 13, textAlign: 'center', paddingVertical: 20 },
});
