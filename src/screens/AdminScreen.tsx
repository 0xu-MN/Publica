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
                <ActivityIndicator color="#7C3AED" />
            </View>
        );
    }

    if (!isAdmin) {
        return (
            <View style={styles.center}>
                <Shield size={40} color="#64748B" />
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
                <View style={styles.headerIconContainer}>
                    <Shield size={20} color="#7C3AED" />
                </View>
                <Text style={styles.headerTitle}>인사이트 카드뉴스 관리자</Text>
                <TouchableOpacity onPress={loadCards} style={styles.refreshBtn}>
                    <RefreshCw size={16} color="#64748B" />
                </TouchableOpacity>
            </View>
            <Text style={styles.headerSub}>관리자: {userEmail}</Text>

            {/* ─ Write Form ─ */}
            <View style={styles.section}>
                <View style={styles.sectionTitleRow}>
                    <View style={styles.sectionIndicator} />
                    <Text style={styles.sectionTitle}>✍️ 새 카드 작성</Text>
                </View>

                <Text style={styles.label}>헤드라인 *</Text>
                <TextInput
                    style={styles.input}
                    placeholder="예: 2026 스타트업 정부지원 총정리"
                    placeholderTextColor="#94A3B8"
                    value={form.headline}
                    onChangeText={v => setForm(f => ({ ...f, headline: v }))}
                />

                <Text style={styles.label}>본문 *</Text>
                <TextInput
                    style={[styles.input, styles.textarea]}
                    placeholder="카드의 메인 본문 내용을 입력하세요"
                    placeholderTextColor="#94A3B8"
                    value={form.body}
                    onChangeText={v => setForm(f => ({ ...f, body: v }))}
                    multiline
                    numberOfLines={4}
                />

                <Text style={styles.label}>핵심 포인트 (한 줄에 하나씩)</Text>
                <TextInput
                    style={[styles.input, styles.textarea]}
                    placeholder={"포인트 1\n포인트 2\n포인트 3"}
                    placeholderTextColor="#94A3B8"
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
                                {cat === 'Economy' ? '📈 경제' : '🔬 과학'}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>

                <Text style={styles.label}>이미지 URL (비워두면 자동)</Text>
                <TextInput
                    style={styles.input}
                    placeholder="https://images.unsplash.com/..."
                    placeholderTextColor="#94A3B8"
                    value={form.imageUrl}
                    onChangeText={v => setForm(f => ({ ...f, imageUrl: v }))}
                />

                <Text style={styles.label}>참고 자료 제목</Text>
                <TextInput
                    style={styles.input}
                    placeholder="예: 중소벤처기업부 공고"
                    placeholderTextColor="#94A3B8"
                    value={form.relatedTitle}
                    onChangeText={v => setForm(f => ({ ...f, relatedTitle: v }))}
                />

                <Text style={styles.label}>참고 자료 URL</Text>
                <TextInput
                    style={styles.input}
                    placeholder="https://..."
                    placeholderTextColor="#94A3B8"
                    value={form.relatedUrl}
                    onChangeText={v => setForm(f => ({ ...f, relatedUrl: v }))}
                />

                {/* Preview Toggle */}
                {form.headline.trim() ? (
                    <TouchableOpacity
                        style={styles.previewBtn}
                        onPress={() => setShowPreview(v => !v)}
                    >
                        {showPreview ? <EyeOff size={16} color="#64748B" /> : <Eye size={16} color="#64748B" />}
                        <Text style={styles.previewBtnText}>{showPreview ? '미리보기 닫기' : '실시간 미리보기'}</Text>
                    </TouchableOpacity>
                ) : null}

                {/* Preview */}
                {showPreview && (
                    <View style={styles.preview}>
                        <Text style={styles.previewHeadline}>{form.headline}</Text>
                        <View style={styles.previewTagBadge}>
                            <Text style={styles.previewTagText}>{form.category === 'Economy' ? '경제' : '과학'}</Text>
                        </View>
                        <Text style={styles.previewBody}>{form.body}</Text>
                        {form.bulletsRaw.trim() ? (
                            form.bulletsRaw.split('\n').filter(Boolean).map((b, i) => (
                                <View key={i} style={styles.previewBulletRow}>
                                    <View style={styles.bulletDot} />
                                    <Text style={styles.previewBulletText}>{b}</Text>
                                </View>
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
                    <Text style={styles.publishBtnText}>{publishing ? '게시 중...' : '인사이트 발행하기'}</Text>
                </TouchableOpacity>
            </View>

            {/* ─ Existing Cards ─ */}
            <View style={styles.listSection}>
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>📋 게시된 카드 ({cards.length}개)</Text>
                    {fetchLoading && <ActivityIndicator size="small" color="#7C3AED" />}
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
    container: { flex: 1, backgroundColor: '#FDF8F3' },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FDF8F3', gap: 12 },
    accessDenied: { color: '#18181b', fontSize: 18, fontWeight: '700', marginTop: 16 },
    accessSub: { color: '#64748B', fontSize: 13 },

    header: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 24, paddingBottom: 4 },
    headerIconContainer: {
        width: 36, height: 36, borderRadius: 10, backgroundColor: '#F0E7FF',
        justifyContent: 'center', alignItems: 'center'
    },
    headerTitle: { color: '#18181b', fontSize: 20, fontWeight: '800', flex: 1, letterSpacing: -0.5 },
    headerSub: { color: '#64748B', fontSize: 14, paddingHorizontal: 24, marginBottom: 16 },
    refreshBtn: { padding: 8, backgroundColor: '#FFFFFF', borderRadius: 8, borderWidth: 1, borderColor: '#E2E8F0' },

    section: {
        marginHorizontal: 16,
        marginBottom: 20,
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        padding: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 2,
        borderWidth: 1,
        borderColor: '#F1F5F9',
    },
    sectionTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 20 },
    sectionIndicator: { width: 4, height: 16, backgroundColor: '#7C3AED', borderRadius: 2 },
    sectionTitle: { color: '#18181b', fontSize: 16, fontWeight: '800' },
    sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },

    label: { color: '#475569', fontSize: 13, fontWeight: '600', marginBottom: 6, marginTop: 16 },
    input: {
        backgroundColor: '#F8FAFC',
        borderRadius: 12,
        padding: 14,
        color: '#1E293B',
        fontSize: 14,
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    textarea: { minHeight: 100, textAlignVertical: 'top' },

    categoryRow: { flexDirection: 'row', gap: 10, marginTop: 4 },
    catBtn: {
        flex: 1, paddingVertical: 12, borderRadius: 12,
        borderWidth: 1, borderColor: '#E2E8F0',
        backgroundColor: '#F8FAFC', alignItems: 'center',
    },
    catBtnActive: { backgroundColor: '#F5F3FF', borderColor: '#7C3AED' },
    catBtnText: { color: '#64748B', fontWeight: '600', fontSize: 14 },
    catBtnActiveText: { color: '#7C3AED' },

    previewBtn: {
        flexDirection: 'row', alignItems: 'center', gap: 6,
        paddingVertical: 12, marginTop: 24, justifyContent: 'center',
        backgroundColor: '#F1F5F9', borderRadius: 10
    },
    previewBtnText: { color: '#475569', fontSize: 14, fontWeight: '600' },

    preview: {
        backgroundColor: '#F8FAFC', borderRadius: 16, padding: 20,
        borderWidth: 1, borderColor: '#E2E8F0', marginTop: 12,
        shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.03, shadowRadius: 4,
    },
    previewHeadline: { color: '#18181b', fontSize: 18, fontWeight: '800', marginBottom: 8 },
    previewTagBadge: {
        backgroundColor: '#F0E7FF', alignSelf: 'flex-start',
        paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4, marginBottom: 12
    },
    previewTagText: { color: '#7C3AED', fontSize: 11, fontWeight: '700' },
    previewBody: { color: '#475569', fontSize: 14, lineHeight: 22, marginBottom: 12 },
    previewBulletRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
    bulletDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: '#7C3AED' },
    previewBulletText: { color: '#334155', fontSize: 14, lineHeight: 22 },

    publishBtn: {
        backgroundColor: '#7C3AED', borderRadius: 14, paddingVertical: 16,
        flexDirection: 'row', justifyContent: 'center', alignItems: 'center',
        gap: 8, marginTop: 24,
        shadowColor: '#7C3AED', shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2, shadowRadius: 8,
    },
    publishBtnText: { color: '#FFFFFF', fontWeight: '800', fontSize: 16 },

    listSection: { marginHorizontal: 16, marginBottom: 24 },
    cardRow: {
        flexDirection: 'row', alignItems: 'center',
        paddingVertical: 16, paddingHorizontal: 4,
        borderBottomWidth: 1, borderBottomColor: '#F1F5F9',
    },
    cardRowTitle: { color: '#1E293B', fontSize: 15, fontWeight: '600' },
    cardRowMeta: { color: '#64748B', fontSize: 12, marginTop: 4 },
    deleteBtn: { padding: 10, backgroundColor: '#FFF1F2', borderRadius: 10 },
    emptyText: { color: '#94A3B8', fontSize: 14, textAlign: 'center', paddingVertical: 40 },
});
