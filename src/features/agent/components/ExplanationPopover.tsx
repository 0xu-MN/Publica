import React, { useEffect, useState } from 'react';
import {
    View, Text, TouchableOpacity, StyleSheet,
    ActivityIndicator, ScrollView, Platform
} from 'react-native';
import { X, BookOpen, Languages, ChevronRight, Bookmark } from 'lucide-react-native';

// ── Gemini direct call ────────────────────────────────────────────────────────
const GEMINI_KEY = (typeof process !== 'undefined' && process.env?.EXPO_PUBLIC_GEMINI_API_KEY) || '';

// ✅ 2025년 이후 발급 신규 키는 gemini-2.0-flash 만 지원
const GEMINI_URL =
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_KEY}`;

const SYSTEM_PROMPT = `You are an expert academic research colleague (PhD level).
Analyze the provided text from a research paper and give a structured response.
ALWAYS respond in Korean unless text is Korean.
Return ONLY valid JSON with this structure:
{
  "outcome": "1-2 sentence summary of what this text is saying",
  "key_terms": [{"term":"...", "definition":"..."}],
  "context_significance": "How this fits in the broader paper section",
  "questions": ["A thought-provoking follow-up question"]
}`;

const TRANSLATE_PROMPT = `You are a precise academic translator.
Translate the following English academic text into natural Korean.
Return ONLY valid JSON:
{
  "outcome": "Full Korean translation of the text",
  "key_terms": [{"term": "English term", "definition": "Korean 번역"}],
  "context_significance": "번역 시 주의한 표현 및 뉘앙스",
  "questions": []
}`;

async function callGemini(text: string, mode: string, context?: any): Promise<any> {
    const systemPrompt = mode === 'translate' ? TRANSLATE_PROMPT : SYSTEM_PROMPT;
    const userContent = `Mode: ${mode}
Text to analyze: "${text.substring(0, 3000)}"
Section context: "${context?.sectionTitle || context?.heading || ''}"`;

    console.log('🔵 Gemini 호출:', GEMINI_URL);

    const res = await fetch(GEMINI_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            contents: [{ parts: [{ text: systemPrompt + '\n\n' + userContent }] }],
            generationConfig: { temperature: 0.3 }
        })
    });

    if (!res.ok) {
        const err = await res.text();
        console.error('🔴 Gemini 실패:', res.status, err);
        throw new Error(`Gemini error ${res.status}: ${err.substring(0, 300)}`);
    }

    const data = await res.json();
    console.log('🟢 Gemini 성공');
    const raw = data.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
    const cleaned = raw.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
    try { return JSON.parse(cleaned); }
    catch { return { outcome: raw, key_terms: [], context_significance: '', questions: [] }; }
}

interface ExplanationPopoverProps {
    visible: boolean;
    x: number;
    y: number;
    text: string;
    mode: 'explain' | 'translate';
    context?: any;
    onClose: () => void;
    onAskFurther?: (context: string) => void;
    onSaveToNote?: (content: string) => void;
}

export const ExplanationPopover: React.FC<ExplanationPopoverProps> = ({
    visible, x, y, text, mode, context, onClose, onAskFurther, onSaveToNote
}) => {
    const [result, setResult] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!visible || !text) return;
        setResult(null);
        setError(null);
        setLoading(true);

        callGemini(text, mode, context)
            .then(data => { setResult(data); setLoading(false); })
            .catch(err => { setError(err.message); setLoading(false); });
    }, [visible, text, mode]);

    if (!visible) return null;

    const popoverX = Math.min(Math.max(x - 170, 10), (Platform.OS === 'web' ? window.innerWidth - 380 : 20));
    const popoverY = y > 500 ? y - 420 : y + 20;
    const modeColor = mode === 'translate' ? '#10B981' : '#8B5CF6';
    const modeIcon = mode === 'translate'
        ? <Languages size={14} color="white" />
        : <BookOpen size={14} color="white" />;
    const modeLabel = mode === 'translate' ? '번역' : 'AI 설명';

    return (
        <View style={[styles.container, { left: popoverX, top: popoverY }]}>
            <View style={[styles.header, { backgroundColor: modeColor }]}>
                <View style={styles.headerLeft}>
                    {modeIcon}
                    <Text style={styles.headerTitle}>{modeLabel}</Text>
                    {context?.heading && (
                        <Text style={styles.sectionTag} numberOfLines={1}>· {context.heading.substring(0, 30)}</Text>
                    )}
                </View>
                <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                    <X size={14} color="rgba(255,255,255,0.8)" />
                </TouchableOpacity>
            </View>

            <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
                {loading && (
                    <View style={styles.loadingRow}>
                        <ActivityIndicator size="small" color={modeColor} />
                        <Text style={styles.loadingText}>분석 중...</Text>
                    </View>
                )}
                {error && (
                    <View style={styles.errorBox}>
                        <Text style={styles.errorTitle}>⚠️ 오류 발생</Text>
                        <Text style={styles.errorText}>{error}</Text>
                    </View>
                )}
                {result && !loading && (
                    <>
                        {result.outcome && (
                            <View style={styles.section}>
                                <Text style={styles.outcomeText}>{result.outcome}</Text>
                            </View>
                        )}
                        {result.key_terms?.length > 0 && (
                            <View style={styles.section}>
                                <Text style={styles.sectionLabel}>핵심 개념</Text>
                                {result.key_terms.map((t: any, i: number) => (
                                    <View key={i} style={styles.termRow}>
                                        <Text style={[styles.termName, { color: modeColor }]}>{t.term}</Text>
                                        <Text style={styles.termDef}>{t.definition}</Text>
                                    </View>
                                ))}
                            </View>
                        )}
                        {result.context_significance && (
                            <View style={styles.section}>
                                <Text style={styles.sectionLabel}>맥락 속 의미</Text>
                                <Text style={styles.contextText}>{result.context_significance}</Text>
                            </View>
                        )}
                        {result.questions?.[0] && (
                            <TouchableOpacity
                                style={[styles.questionBtn, { borderColor: modeColor + '40' }]}
                                onPress={() => onAskFurther?.(result.questions[0])}
                            >
                                <Text style={[styles.questionText, { color: modeColor }]}>💬 {result.questions[0]}</Text>
                                <ChevronRight size={12} color={modeColor} />
                            </TouchableOpacity>
                        )}
                    </>
                )}
            </ScrollView>

            {result && !loading && (
                <View style={styles.footer}>
                    <TouchableOpacity
                        style={[styles.footerBtn, { borderColor: modeColor + '30' }]}
                        onPress={() => onSaveToNote?.(result.outcome || text)}
                    >
                        <Bookmark size={12} color={modeColor} />
                        <Text style={[styles.footerBtnText, { color: modeColor }]}>메모 저장</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.footerBtn, { borderColor: modeColor + '30' }]}
                        onPress={() => onAskFurther?.(`"${text.substring(0, 100)}..." 에 대해 더 설명해줘`)}
                    >
                        <ChevronRight size={12} color={modeColor} />
                        <Text style={[styles.footerBtnText, { color: modeColor }]}>AI에게 더 묻기</Text>
                    </TouchableOpacity>
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        position: 'absolute', width: 360, maxHeight: 480, backgroundColor: 'white', borderRadius: 12, zIndex: 9999, //@ts-ignore
        boxShadow: '0 8px 32px rgba(0,0,0,0.18)', overflow: 'hidden'
    },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 14, paddingVertical: 10 },
    headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 },
    headerTitle: { color: 'white', fontWeight: '700', fontSize: 13 },
    sectionTag: { color: 'rgba(255,255,255,0.75)', fontSize: 11, flex: 1 },
    closeBtn: { padding: 2 },
    body: { maxHeight: 360, paddingHorizontal: 14 },
    loadingRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 20 },
    loadingText: { color: '#64748B', fontSize: 13 },
    errorBox: { backgroundColor: '#FEF2F2', borderRadius: 8, padding: 12, margin: 10 },
    errorTitle: { color: '#DC2626', fontWeight: '700', fontSize: 13, marginBottom: 4 },
    errorText: { color: '#EF4444', fontSize: 12, lineHeight: 18 },
    section: { paddingVertical: 10, borderBottomWidth: 1, borderColor: '#F1F5F9' },
    sectionLabel: { fontSize: 10, fontWeight: '700', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 },
    outcomeText: { fontSize: 14, color: '#1E293B', lineHeight: 22, fontWeight: '500' },
    termRow: { marginBottom: 6 },
    termName: { fontSize: 12, fontWeight: '700', marginBottom: 2 },
    termDef: { fontSize: 12, color: '#475569', lineHeight: 18 },
    contextText: { fontSize: 13, color: '#475569', lineHeight: 20 },
    questionBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderWidth: 1, borderRadius: 8, padding: 10, marginVertical: 8, gap: 6 },
    questionText: { fontSize: 12, flex: 1, lineHeight: 18 },
    footer: { flexDirection: 'row', borderTopWidth: 1, borderColor: '#F1F5F9', paddingHorizontal: 10, paddingVertical: 8, gap: 8 },
    footerBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderRadius: 6, paddingVertical: 6, gap: 4 },
    footerBtnText: { fontSize: 11, fontWeight: '600' },
});