import React, { useEffect, useState } from 'react';
import {
    View, Text, TouchableOpacity, StyleSheet,
    ActivityIndicator, ScrollView, Platform
} from 'react-native';
import { X, BookOpen, Languages, ChevronRight, Bookmark } from 'lucide-react-native';

const GEMINI_KEY =
    (typeof process !== 'undefined' && process.env?.EXPO_PUBLIC_GEMINI_API_KEY) ||
    'YOUR_API_KEY_HERE';

const GEMINI_URL =
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_KEY}`;

// ✅ JSON을 강제 반환하도록 systemInstruction 사용
const EXPLAIN_SYSTEM = `You are a PhD-level expert. Respond ONLY with a valid JSON object. No markdown, no code blocks, no explanation outside the JSON.`;

const EXPLAIN_USER = (sectionContext: string, textToAnalyze: string) =>
    `Analyze the following academic or government document text deeply. Do NOT just paraphrase it.
Explain mechanisms, principles, and practical implications.
For Korean government documents, explain the policy background and what it means for applicants.

Section: "${sectionContext}"
Text:
"""
${textToAnalyze.substring(0, 4000)}
"""

Return this exact JSON structure (Korean responses for all fields):
{
  "outcome": "2-3 sentences explaining what this actually MEANS, not just what it says",
  "mechanism": "Why/how does this work? What is the underlying principle or policy rationale?",
  "key_terms": [{"term": "term", "definition": "its specific meaning in this context"}],
  "significance": "Practical importance: what does this mean for the reader/applicant?",
  "questions": ["One follow-up question to deepen understanding"]
}`;

const TRANSLATE_SYSTEM = `You are a precise academic and legal translator. Respond ONLY with a valid JSON object. No markdown, no code blocks.`;

const TRANSLATE_USER = (sectionContext: string, textToAnalyze: string) =>
    `Translate to natural, fluent Korean. Preserve technical and legal terms accurately.
Section: "${sectionContext}"
Text:
"""
${textToAnalyze.substring(0, 4000)}
"""

Return this exact JSON structure:
{
  "outcome": "Complete Korean translation",
  "key_terms": [{"term": "original term", "definition": "Korean translation and explanation"}],
  "context_significance": "Notes on difficult terms or nuanced expressions in translation",
  "questions": []
}`;

// ✅ 핵심 수정: JSON을 더 강력하게 파싱하는 함수
function robustParseJSON(raw: string): any {
    // 1차: 직접 파싱
    try { return JSON.parse(raw); } catch { }

    // 2차: 마크다운 코드블록 제거 후 파싱
    const noCode = raw.replace(/```json\s*/gi, '').replace(/```\s*/gi, '').trim();
    try { return JSON.parse(noCode); } catch { }

    // 3차: JSON 객체 패턴 추출
    const jsonMatch = noCode.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
        try { return JSON.parse(jsonMatch[0]); } catch { }

        // 4차: 불완전한 JSON 수리 시도
        let repaired = jsonMatch[0];
        // 마지막에 닫히지 않은 따옴표/괄호 처리
        const openBraces = (repaired.match(/\{/g) || []).length;
        const closeBraces = (repaired.match(/\}/g) || []).length;
        if (openBraces > closeBraces) {
            repaired += '}'.repeat(openBraces - closeBraces);
        }
        try { return JSON.parse(repaired); } catch { }
    }

    // 5차: 수동 필드 추출 (파싱이 완전히 실패한 경우)
    console.warn('🟡 JSON 파싱 실패, 수동 추출 시도:', raw.substring(0, 100));
    const extractField = (field: string): string => {
        const match = raw.match(new RegExp(`"${field}"\\s*:\\s*"([^"]*(?:[^"\\\\]|\\\\.)*?)"`));
        return match ? match[1].replace(/\\n/g, '\n').replace(/\\"/g, '"') : '';
    };
    return {
        outcome: extractField('outcome') || raw.substring(0, 300),
        mechanism: extractField('mechanism'),
        key_terms: [],
        significance: extractField('significance'),
        context_significance: extractField('context_significance'),
        questions: []
    };
}

async function callGemini(text: string, mode: string, context?: any): Promise<any> {
    const isTranslate = mode === 'translate';
    const textToAnalyze = context?.sectionText || text;
    const sectionContext = context?.sectionTitle || context?.heading || '';

    const prompt = isTranslate
        ? TRANSLATE_USER(sectionContext, textToAnalyze)
        : EXPLAIN_USER(sectionContext, textToAnalyze);

    const systemInst = isTranslate ? TRANSLATE_SYSTEM : EXPLAIN_SYSTEM;

    console.log('🔵 Gemini 2.5-flash 호출, 텍스트 길이:', textToAnalyze.length);

    const res = await fetch(GEMINI_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            system_instruction: { parts: [{ text: systemInst }] },
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
                temperature: isTranslate ? 0.1 : 0.4,
                maxOutputTokens: 1500,
                responseMimeType: 'application/json' // ✅ JSON 모드 강제 (지원 모델에서)
            }
        })
    });

    if (!res.ok) {
        const err = await res.text();
        console.error('🔴 Gemini 실패:', res.status, err.substring(0, 200));
        throw new Error(`Gemini ${res.status}: ${err.substring(0, 200)}`);
    }

    const data = await res.json();
    console.log('🟢 Gemini 성공');
    const raw = data.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
    return robustParseJSON(raw);
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
        setResult(null); setError(null); setLoading(true);
        callGemini(text, mode, context)
            .then(data => { setResult(data); setLoading(false); })
            .catch(err => { setError(err.message); setLoading(false); });
    }, [visible, text, mode]);

    if (!visible) return null;

    const safeWindowWidth = Platform.OS === 'web' ? (window?.innerWidth ?? 800) : 400;
    const popoverX = Math.min(Math.max(x - 170, 10), safeWindowWidth - 400);
    const popoverY = y > 500 ? y - 460 : y + 20;
    const modeColor = mode === 'translate' ? '#10B981' : '#8B5CF6';
    const modeLabel = mode === 'translate' ? '번역' : 'AI 심층 분석';

    // ✅ 결과값이 문자열(raw JSON)이면 다시 파싱 시도
    const safeResult = result && typeof result.outcome === 'string'
        && result.outcome.trim().startsWith('{')
        ? robustParseJSON(result.outcome)
        : result;

    return (
        <View style={[styles.container, { left: popoverX, top: popoverY }]}>
            <View style={[styles.header, { backgroundColor: modeColor }]}>
                <View style={styles.headerLeft}>
                    {mode === 'translate'
                        ? <Languages size={14} color="white" />
                        : <BookOpen size={14} color="white" />}
                    <Text style={styles.headerTitle}>{modeLabel}</Text>
                    {context?.heading && (
                        <Text style={styles.sectionTag} numberOfLines={1}>
                            · {context.heading.substring(0, 28)}
                        </Text>
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
                        <Text style={styles.loadingText}>
                            {mode === 'translate' ? '번역 중...' : '심층 분석 중...'}
                        </Text>
                    </View>
                )}
                {error && (
                    <View style={styles.errorBox}>
                        <Text style={styles.errorTitle}>⚠️ 오류</Text>
                        <Text style={styles.errorText}>{error}</Text>
                    </View>
                )}
                {safeResult && !loading && (
                    <>
                        {safeResult.outcome && (
                            <View style={styles.section}>
                                <Text style={styles.sectionLabel}>
                                    {mode === 'translate' ? '📝 번역' : '💡 핵심 내용'}
                                </Text>
                                <Text style={styles.outcomeText}>{safeResult.outcome}</Text>
                            </View>
                        )}
                        {mode !== 'translate' && safeResult.mechanism && (
                            <View style={styles.section}>
                                <Text style={styles.sectionLabel}>⚙️ 배경 및 원리</Text>
                                <Text style={styles.bodyText}>{safeResult.mechanism}</Text>
                            </View>
                        )}
                        {safeResult.key_terms?.length > 0 && (
                            <View style={styles.section}>
                                <Text style={styles.sectionLabel}>🔑 핵심 용어</Text>
                                {safeResult.key_terms.map((t: any, i: number) => (
                                    <View key={i} style={styles.termRow}>
                                        <Text style={[styles.termName, { color: modeColor }]}>{t.term}</Text>
                                        <Text style={styles.termDef}>{t.definition}</Text>
                                    </View>
                                ))}
                            </View>
                        )}
                        {mode === 'translate' && safeResult.context_significance && (
                            <View style={styles.section}>
                                <Text style={styles.sectionLabel}>📌 번역 노트</Text>
                                <Text style={styles.bodyText}>{safeResult.context_significance}</Text>
                            </View>
                        )}
                        {mode !== 'translate' && safeResult.significance && (
                            <View style={styles.section}>
                                <Text style={styles.sectionLabel}>🎯 실질적 의미</Text>
                                <Text style={styles.bodyText}>{safeResult.significance}</Text>
                            </View>
                        )}
                        {safeResult.questions?.[0] && (
                            <TouchableOpacity
                                style={[styles.questionBtn, { borderColor: modeColor + '40' }]}
                                onPress={() => onAskFurther?.(safeResult.questions[0])}
                            >
                                <Text style={[styles.questionText, { color: modeColor }]}>
                                    💬 {safeResult.questions[0]}
                                </Text>
                                <ChevronRight size={12} color={modeColor} />
                            </TouchableOpacity>
                        )}
                    </>
                )}
            </ScrollView>

            {safeResult && !loading && (
                <View style={styles.footer}>
                    <TouchableOpacity
                        style={[styles.footerBtn, { borderColor: modeColor + '30' }]}
                        onPress={() => onSaveToNote?.(
                            `[${context?.heading || ''}]\n${safeResult.outcome || ''}\n\n${safeResult.mechanism || ''}`
                        )}
                    >
                        <Bookmark size={12} color={modeColor} />
                        <Text style={[styles.footerBtnText, { color: modeColor }]}>메모 저장</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.footerBtn, { borderColor: modeColor + '30' }]}
                        onPress={() => onAskFurther?.(
                            `"${context?.heading || text.substring(0, 60)}" 에 대해 더 깊이 설명해줘`
                        )}
                    >
                        <ChevronRight size={12} color={modeColor} />
                        <Text style={[styles.footerBtnText, { color: modeColor }]}>더 깊이 묻기</Text>
                    </TouchableOpacity>
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        position: 'absolute', width: 380, maxHeight: 520, backgroundColor: 'white',
        borderRadius: 12, zIndex: 9999, overflow: 'hidden',
        // @ts-ignore
        boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
    },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 14, paddingVertical: 10 },
    headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 },
    headerTitle: { color: 'white', fontWeight: '700', fontSize: 13 },
    sectionTag: { color: 'rgba(255,255,255,0.75)', fontSize: 11, flex: 1 },
    closeBtn: { padding: 2 },
    body: { maxHeight: 400, paddingHorizontal: 14 },
    loadingRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 20 },
    loadingText: { color: '#64748B', fontSize: 13 },
    errorBox: { backgroundColor: '#FEF2F2', borderRadius: 8, padding: 12, margin: 10 },
    errorTitle: { color: '#DC2626', fontWeight: '700', fontSize: 13, marginBottom: 4 },
    errorText: { color: '#EF4444', fontSize: 12, lineHeight: 18 },
    section: { paddingVertical: 10, borderBottomWidth: 1, borderColor: '#F1F5F9' },
    sectionLabel: { fontSize: 10, fontWeight: '700', color: '#64748B', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 },
    outcomeText: { fontSize: 14, color: '#1E293B', lineHeight: 22, fontWeight: '500' },
    bodyText: { fontSize: 13, color: '#334155', lineHeight: 20 },
    termRow: { marginBottom: 8 },
    termName: { fontSize: 12, fontWeight: '700', marginBottom: 2 },
    termDef: { fontSize: 12, color: '#475569', lineHeight: 18 },
    questionBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderWidth: 1, borderRadius: 8, padding: 10, marginVertical: 8, gap: 6 },
    questionText: { fontSize: 12, flex: 1, lineHeight: 18 },
    footer: { flexDirection: 'row', borderTopWidth: 1, borderColor: '#F1F5F9', paddingHorizontal: 10, paddingVertical: 8, gap: 8 },
    footerBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderRadius: 6, paddingVertical: 6, gap: 4 },
    footerBtnText: { fontSize: 11, fontWeight: '600' },
});