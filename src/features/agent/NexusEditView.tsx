import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, TextInput, ActivityIndicator, Platform, Animated } from 'react-native';
import { FileText, ChevronRight, Save, FolderOpen, Sparkles, Send, Bot, ArrowLeft, Zap, X, PanelLeftClose, PanelLeftOpen, Upload } from 'lucide-react-native';
import { supabase } from '../../lib/supabase';
import { useSessionManager } from './hooks/useSessionManager';
import { useAuth } from '../../contexts/AuthContext';
import { useProjectStore } from '../../store/useProjectStore';
import { templateToEditorHtml, getDefaultPSSTTemplate, GrantTemplate } from '../../services/templateService';
import { AnnouncementAnalysis } from '../../store/useProjectStore';
import { NotionEditor } from './components/NotionEditor';

// ═══════════════════════════════════════════════════
// NEXUS-Edit: Document Editor Page
// Left: Brainstorm Viewer + AI Chat
// Right: Notion-like Editor
// ═══════════════════════════════════════════════════

export const NexusEditView = () => {
    // --- Auth + 회사 프로필 (AI 작성 재료) ---
    const [user, setUser] = useState<any>(null);
    useEffect(() => {
        supabase.auth.getUser().then(({ data }: any) => setUser(data.user));
    }, []);
    const { profile } = useAuth();

    const { sessions, saveEditorContent, loadSession, saveSession } = useSessionManager(user?.id);

    // --- State ---
    const [selectedSession, setSelectedSession] = useState<any>(null);
    const [editorContent, setEditorContent] = useState('');
    const [editorMarkdown, setEditorMarkdown] = useState('');
    const [chatInput, setChatInput] = useState('');
    const [chatMessages, setChatMessages] = useState<{ role: string; content: string; files?: {name: string; url: string}[] }[]>([]);
    const [chatLoading, setChatLoading] = useState(false);
    const [isLeftPanelOpen, setIsLeftPanelOpen] = useState(true);
    const [showSessionList, setShowSessionList] = useState(true);
    const [showResumePrompt, setShowResumePrompt] = useState(false);
    const [lastSessionId, setLastSessionId] = useState<string | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [lastSaved, setLastSaved] = useState<string | null>(null);
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
    const leftPanelWidth = useRef(new Animated.Value(420)).current;
    const chatScrollRef = useRef<ScrollView>(null);
    const autoSaveTimerRef = useRef<any>(null);
    const [, setActiveTemplate] = useState<GrantTemplate | null>(null);
    const [, setTemplateLoading] = useState(false);
    const [draftGenerating, setDraftGenerating] = useState(false);
    const [draftCompleted, setDraftCompleted] = useState(false);
    const [draftCurrentStep, setDraftCurrentStep] = useState<{ current: number; total: number; label: string } | null>(null);
    const [draftBranchLabels, setDraftBranchLabels] = useState<string[]>([]);
    const [draftCompletedSteps, setDraftCompletedSteps] = useState<Set<number>>(new Set());
    const [hwpxLoading, setHwpxLoading] = useState(false);
    // ── WinnerAI 피처: 타이머 + 스트리밍 아웃라인 ────────────────────────────
    const [elapsedSeconds, setElapsedSeconds] = useState(0);           // 경과 시간 (초)
    const [totalSeconds, setTotalSeconds] = useState<number | null>(null); // 완료 시 고정
    const [outlineItems, setOutlineItems] = useState<{ title: string; id: string; done: boolean }[]>([]); // 실시간 목차
    const [activeOutlineId, setActiveOutlineId] = useState<string | null>(null); // 현재 작성 중 섹션
    const timerRef = useRef<any>(null);
    const generationStartRef = useRef<number>(0);
    // RFP 맞춤 생성 모달 상태
    const [showRfpModal, setShowRfpModal] = useState(false);
    const [rfpTitle, setRfpTitle] = useState('');
    const [rfpText, setRfpText] = useState('');
    const [rfpAnalyzing, setRfpAnalyzing] = useState(false);
    // 공고 분석 결과 (평가기준/배점/작성힌트) — 초안 프롬프트에 주입
    const [announcementAnalysis, setAnnouncementAnalysis] = useState<AnnouncementAnalysis | null>(null);
    // 🔑 Key counter to force NotionEditor remount when content changes externally
    const [editorKey, setEditorKey] = useState(0);
    // 🔑 Ref that holds the definitive draft HTML — bypasses state batching issues
    const pendingDraftRef = useRef<string>('');

    // --- Load last session from localStorage on mount ---
    useEffect(() => {
        if (Platform.OS === 'web') {
            const lastId = localStorage.getItem('NEXUS_EDIT_LAST_SESSION');
            if (lastId) {
                setLastSessionId(lastId);
                setShowResumePrompt(true);
            }
        }
    }, []);

    // --- Auto-load brainstorm content from Flow (via useProjectStore) ---
    useEffect(() => {
        const session = useProjectStore.getState().agentSession;
        if (session) {
            console.log('📝 Edit: Loading data from Flow session:', session.title);

            // Set the active session so the Editor and Left Panel render correctly
            setSelectedSession(session);

            if (session.chat_history) {
                setChatMessages(session.chat_history.map((m: any) => ({ role: m.sender === 'me' ? 'user' : 'assistant', content: m.text })));
            }
            setShowSessionList(false);
            setShowResumePrompt(false);
            // Flow에서 공고 분석 결과가 전달된 경우 복원
            if (session.announcement_analysis) {
                setAnnouncementAnalysis(session.announcement_analysis);
            }

            // 🌟 Sync Logic: Prioritize editor_content if it exists (meaning AI draft was already created)
            if (session.editor_content && session.editor_content.length > 20) {
                console.log('📝 Edit: Using pre-generated editor_content, length=', session.editor_content.length);
                // Store in ref AND state, then trigger remount
                pendingDraftRef.current = session.editor_content;
                setEditorContent(session.editor_content);
                setEditorMarkdown(session.editor_markdown || session.editor_content);
                setDraftCompleted(true);
                loadTemplateForSession(session, true); // Load template meta only
                // Force remount so initialContent is definitely applied
                setTimeout(() => setEditorKey(prev => prev + 1), 50);
            } else if (session.brainstorm_content || (session.workspace_data && session.workspace_data.length > 0)) {
                // 🔥 Auto Draft Generation: Only if editor_content is missing
                console.log('📝 Edit: No editor_content found, triggering auto-draft...');
                generateAutoDraft(session);
            } else {
                // FORCE Load PSST Template as the default Bowl
                loadTemplateForSession(session, false);
            }

            // 🌟 FIX: Don't clear immediately, or clear only after successful mount
            // setTimeout(() => useProjectStore.getState().clearProject(), 1000);
        }
    }, []);

    // 🌟 Cleanup Store on Unmount to prevent phantom loading next time
    useEffect(() => {
        return () => {
            useProjectStore.getState().clearProject();
        };
    }, []);

    // --- RFP / Notice Custom Flow Generator ---
    const handleGenerateRfpFlow = async () => {
        if (!rfpTitle.trim() || !rfpText.trim()) return alert("사업명과 공고문 내용을 모두 입력해주세요.");
        setRfpAnalyzing(true);
        try {
            const geminiKey = process.env.EXPO_PUBLIC_GEMINI_API_KEY || process.env.GEMINI_API_KEY;

            // ── Step 1: 공고 평가기준 심층 분석 (백엔드 API 호출) ──────────────
            let analysisResult: AnnouncementAnalysis | null = null;
            try {
                const envBackendUrl = process.env.EXPO_PUBLIC_PYTHON_BACKEND_URL || '';
                const baseUrl = envBackendUrl || 'http://localhost:8001';
                const analysisResponse = await fetch(`${baseUrl}/api/analyze-announcement`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Bypass-Tunnel-Reminder': 'true' },
                    body: JSON.stringify({ announcement_text: rfpText, gemini_api_key: geminiKey })
                });
                if (analysisResponse.ok) {
                    analysisResult = await analysisResponse.json();
                    setAnnouncementAnalysis(analysisResult);
                    console.log('✅ 공고 분석 완료:', analysisResult?.form_info?.title);
                }
            } catch (analysisErr) {
                console.warn('⚠️ 공고 분석 API 실패 (계속 진행):', analysisErr);
            }

            // ── Step 2: 공고 맞춤 브레인스토밍 트리 생성 ────────────────────────
            // 평가기준이 있으면 배점 기반으로, 없으면 PSST 기본 구조로
            const criteriaContext = analysisResult
                ? `\n\n[이 공고의 평가기준 및 배점]\n${analysisResult.evaluation_criteria
                    .map(c => `- ${c.item} (${c.score}점): ${c.description} / 핵심키워드: ${c.keywords.join(', ')}`)
                    .join('\n')}\n\n[합격 전략]: ${analysisResult.pass_strategy}`
                : '';

            const prompt = `사용자가 아래의 지원사업 공고문을 텍스트로 붙여넣었습니다.
이 공고문의 핵심 [평가 기준]과 [필수 제출 항목]을 완벽히 심층 분석하세요.${criteriaContext}

사용자가 사업계획서 작성을 준비할 수 있도록, 이 공고의 평가기준에 맞춘 컬럼 구조에 들어갈 세부 '브레인스토밍 질문 카드(Branch)'들을 JSON 포맷으로 생성해주세요.
배점이 높은 평가항목일수록 더 많은 Branch 카드를 배정하세요.

각 브랜치의 label(제목)에는 해당 공고에서 주로 가점이나 핵심 키워드로 뽑고 있는 특징이 즉시 드러나도록 작성하고,
description(설명)에는 사용자가 이 브랜치 메모에 무엇을 써야 할지(어떻게 써야만 합격률이 올라갈지 평가기준과 연계하여) 2~3줄로 안내해주세요.

반드시 오직 아래 JSON 형태(배열)로만 응답하세요. 어떠한 앞뒤 텍스트나 마크다운 블록(\`\`\`)도 붙이지 마세요!
[
  {
    "id": "col-1",
    "title": "문제인식 (Problem)",
    "color": "#EF4444",
    "branches": [
      { "id": "b-1", "label": "과제의 시급성 및 공고 부합성", "description": "공고에서 요구하는 핵심 키워드에 귀하의 과제가 왜 부합하며 지금 시급한지 적어주세요." }
    ]
  },
  { "id": "col-2", "title": "실현가능성 (Solution)", "color": "#3B82F6", "branches": [] },
  { "id": "col-3", "title": "성장전략 (Scale-up)", "color": "#10B981", "branches": [] },
  { "id": "col-4", "title": "팀 구성 (Team)", "color": "#F59E0B", "branches": [] }
]

[공고문 텍스트]
${rfpText}`;

            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro:generateContent?key=${geminiKey}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ role: 'user', parts: [{ text: prompt }] }],
                    generationConfig: { temperature: 0.2 }
                })
            });

            const data = await response.json();
            const aiResponseText = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "";
            const jsonMatch = aiResponseText.match(/\[\s*\{[\s\S]*\}\s*\]/);
            if (!jsonMatch) throw new Error("JSON 파싱 에러");
            const generatedColumns = JSON.parse(jsonMatch[0]);

            const savedSession = await saveSession(
                rfpTitle + ' (맞춤형 작성 준비)',
                'edit',
                generatedColumns,
                [],
                undefined,           // pdfUrl
                undefined,           // brainstormContent
                undefined,           // editorContent
                undefined,           // editorMarkdown
                analysisResult || undefined,   // announcementAnalysis → announcement_analysis 컬럼
                rfpText,             // announcementText → announcement_text 컬럼
            );
            if (savedSession) {
                setShowRfpModal(false);
                setRfpTitle('');
                setRfpText('');
                
                // [One-Take] 자동 초안 작성 엔진 즉시 가동
                console.log("Starting One-Take Auto Draft with new session:", savedSession.id);
                setSelectedSession(savedSession);
                setCurrentSessionId(savedSession.id);
                generateAutoDraft(savedSession);
            } else {
                throw new Error("세션 저장 실패");
            }
        } catch (e: any) {
            console.error(e);
            alert("공고문 분석에 실패했습니다. 다시 시도해주세요. " + e?.message);
        } finally {
            setRfpAnalyzing(false);
        }
    };

    // ═══════════════════════════════════════════════════════════
    // AI 자동 초안 작성 — 2단계 스마트 파이프라인
    //
    // Phase 1: 전체 브레인스토밍 + 공고 분석 → 문서 설계도 생성 (1회 호출)
    // Phase 2: 설계도의 각 섹션을 병렬로 작성 (4~6회 동시 호출)
    //
    // 기존 방식 대비:
    //   Before: 브랜치 N개 × 순차 호출 = N분 대기 + 파편화 결과
    //   After:  1회 설계 + 4~6회 병렬 = ~30~60초 + 일관된 완성 문서
    // ═══════════════════════════════════════════════════════════
    const generateAutoDraft = async (session: any) => {
        if (!session) return;

        // ── 데이터 충분성 검사 ─────────────────────────────────────────────────
        const p = profile as any;
        const hasCompanyProfile = p && (p.item_one_liner || p.item_description || p.company_name);
        const hasBrainstorm = (session.workspace_data && Array.isArray(session.workspace_data) && session.workspace_data.length > 0)
            || (session.brainstorm_content && session.brainstorm_content.trim().length > 20);

        if (!hasCompanyProfile && !hasBrainstorm) {
            setChatMessages(prev => [...prev, {
                role: 'assistant',
                content: '⚠️ 자동 초안 작성을 위한 정보가 부족합니다.\n\n**Flow 탭**에서 먼저 브레인스토밍을 진행하거나, **프로필 설정**에서 사업 정보를 입력해주세요.\n\n정보가 충분할수록 공고에 딱 맞는 초안이 작성됩니다.'
            }]);
            return;
        }

        setDraftGenerating(true);
        setDraftCurrentStep(null);
        setDraftCompletedSteps(new Set());
        setOutlineItems([]);
        setActiveOutlineId(null);
        setTotalSeconds(null);

        // ── 타이머 시작 ───────────────────────────────────────────────────────
        generationStartRef.current = Date.now();
        setElapsedSeconds(0);
        timerRef.current = setInterval(() => {
            setElapsedSeconds(Math.floor((Date.now() - generationStartRef.current) / 1000));
        }, 1000);

        const geminiKey = process.env.EXPO_PUBLIC_GEMINI_API_KEY || process.env.GEMINI_API_KEY;
        if (!geminiKey) {
            setChatMessages(prev => [...prev, { role: 'assistant', content: '❌ GEMINI_API_KEY가 설정되지 않았습니다.' }]);
            setDraftGenerating(false);
            return;
        }

        const callGemini = async (prompt: string, temperature = 0.2): Promise<string> => {
            const res = await fetch(
                `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro:generateContent?key=${geminiKey}`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        contents: [{ role: 'user', parts: [{ text: prompt }] }],
                        generationConfig: { temperature }
                    })
                }
            );
            const data = await res.json();
            return data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '';
        };

        try {
            const docTitle = session.title || '사업계획서';
            const currentAnalysis: any = announcementAnalysis || session.announcement_analysis;

            // ─── 회사 프로필 블록 (Step 3에서 한 번 입력하면 모든 공고에 자동 반영) ───
            const companyProfileBlock = (() => {
                if (!profile) return '';
                const p = profile as any;
                const lines: string[] = ['\n[우리 회사/아이템 프로필]'];
                if (p.company_name) lines.push(`• 회사/아이템명: ${p.company_name}`);
                if (p.item_one_liner) lines.push(`• 한 줄 정의: ${p.item_one_liner}`);
                if (p.item_description) lines.push(`• 상세 설명: ${p.item_description}`);
                if (p.core_technology) lines.push(`• 핵심 기술/차별점: ${p.core_technology}`);
                if (p.current_achievements) lines.push(`• 현재 성과: ${p.current_achievements}`);
                if (p.team_background) lines.push(`• 팀 역량: ${p.team_background}`);
                if (p.target_market) lines.push(`• 목표 시장: ${p.target_market}`);
                if (p.industry) lines.push(`• 업종: ${p.industry}`);
                if (p.business_years) lines.push(`• 업력: ${p.business_years}`);
                return lines.length > 1 ? lines.join('\n') : '';
            })();

            // ─── 브레인스토밍 데이터 전체를 하나의 "프로젝트 브리핑"으로 압축 ───
            const projectBrief = (() => {
                const lines: string[] = [];
                // 회사 프로필이 있으면 먼저 포함
                if (companyProfileBlock) lines.push(companyProfileBlock);
                if (session.workspace_data && Array.isArray(session.workspace_data)) {
                    for (const col of session.workspace_data) {
                        if (col.title) lines.push(`\n[${col.title}]`);
                        for (const branch of (col.branches || [])) {
                            if (branch.label) {
                                lines.push(`• ${branch.label}`);
                                if (branch.description) lines.push(`  → ${branch.description}`);
                            }
                        }
                    }
                }
                if (session.brainstorm_content) lines.push('\n[추가 메모]\n' + session.brainstorm_content);
                return lines.join('\n');
            })();

            // 공고 평가기준 블록
            const evaluationBlock = currentAnalysis
                ? `\n[공고명]: ${currentAnalysis.form_info?.title || docTitle}
[주관기관]: ${currentAnalysis.form_info?.agency || ''}
[합격 전략]: ${currentAnalysis.pass_strategy || ''}
[평가기준 및 배점]:
${(currentAnalysis.evaluation_criteria || []).map((c: any) =>
    `  • ${c.item} (${c.score}점): ${c.description} / 키워드: ${c.keywords?.join(', ')}`
).join('\n')}
[필수 작성 섹션]: ${(currentAnalysis.required_sections || []).join(', ')}`
                : '';

            // ── Phase 1: 문서 설계도 생성 (1회 호출) ────────────────────────────
            setChatMessages(prev => [...prev, {
                role: 'assistant',
                content: '🧠 [1단계] 브레인스토밍 전체를 분석하고 사업계획서 구조를 설계하고 있습니다...'
            }]);
            setDraftCurrentStep({ current: 0, total: 1, label: '문서 구조 설계 중...' });

            const planPrompt = `당신은 대한민국 정부지원사업 사업계획서 전략 설계 전문가입니다.

아래의 브레인스토밍 데이터와 공고 정보를 종합 분석하여,
이 공고에 최적화된 사업계획서의 **완성된 문서 설계도**를 작성해주세요.

브레인스토밍의 모든 내용이 적절한 섹션에 배치되어야 하며,
공고의 평가기준에서 배점이 높은 항목일수록 더 많은 내용과 비중을 할당하세요.

[프로젝트 브레인스토밍 데이터]
${projectBrief || '(브레인스토밍 데이터 없음 — 공고 기반으로 최적 구조 생성)'}
${evaluationBlock}

반드시 아래 JSON 포맷으로만 응답하세요. 섹션은 최소 4개, 최대 7개로 구성하세요:
{
  "document_title": "문서 제목",
  "sections": [
    {
      "key": "고유키(영문소문자_언더스코어)",
      "title": "섹션 제목 (공고 양식 섹션명과 동일하게)",
      "evaluation_focus": "이 섹션에서 평가위원이 중점적으로 보는 내용",
      "key_points": ["핵심포인트1", "핵심포인트2", "핵심포인트3"],
      "brainstorm_refs": ["관련 브레인스토밍 항목 레이블들"],
      "score_weight": "high|medium|low",
      "char_guide": 800
    }
  ]
}`;

            const planRaw = await callGemini(planPrompt, 0.1);
            let documentPlan: { document_title: string; sections: any[] } | null = null;
            try {
                const jsonMatch = planRaw.match(/\{[\s\S]*\}/);
                if (jsonMatch) documentPlan = JSON.parse(jsonMatch[0]);
            } catch {
                console.warn('문서 설계도 파싱 실패, 기본 구조 사용');
            }

            // 설계도 파싱 실패 시 공고 분석 기반 기본 구조 사용
            if (!documentPlan?.sections?.length) {
                const defaultSections = currentAnalysis?.required_sections?.length
                    ? currentAnalysis.required_sections
                    : ['아이템 개요', '문제인식', '실현가능성', '성장전략', '팀구성'];
                documentPlan = {
                    document_title: docTitle,
                    sections: defaultSections.map((s: string, i: number) => ({
                        key: s.replace(/\s/g, '_').toLowerCase(),
                        title: s,
                        evaluation_focus: currentAnalysis?.writing_hints?.[s] || '',
                        key_points: [],
                        brainstorm_refs: [],
                        score_weight: i < 2 ? 'high' : 'medium',
                        char_guide: 800,
                    }))
                };
            }

            const sections = documentPlan.sections;
            console.log(`✅ 문서 설계도 완성: ${sections.length}개 섹션`, sections.map(s => s.title));

            // 오른쪽 진행 트래커 + 아웃라인 패널 초기화
            setDraftBranchLabels(sections.map(s => s.title));
            const initialOutline = sections.map((s: any, i: number) => ({
                id: `section-${i}`,
                title: `${i + 1}. ${s.title}`,
                done: false,
            }));
            setOutlineItems(initialOutline);
            setChatMessages(prev => [...prev, {
                role: 'assistant',
                content: `📋 [구조 설계 완료] ${sections.length}개 섹션으로 구성:\n${sections.map((s: any, i: number) => `  ${i + 1}. ${s.title} (${s.score_weight === 'high' ? '⭐ 핵심' : '일반'})`).join('\n')}`
            }]);

            // ── Phase 2: 섹션별 병렬 작성 ────────────────────────────────────────
            setChatMessages(prev => [...prev, {
                role: 'assistant',
                content: `✍️ [2단계] ${sections.length}개 섹션을 동시에 작성합니다. 잠시만 기다려주세요...`
            }]);

            // 각 섹션에 대한 Gemini 프롬프트 생성 함수
            const buildSectionPrompt = (section: any, idx: number) => {
                const criteria = (currentAnalysis?.evaluation_criteria || []).find((c: any) =>
                    section.title.includes(c.item) || c.item.includes(section.title) ||
                    section.evaluation_focus?.includes(c.item)
                );
                const hint = currentAnalysis?.writing_hints?.[section.title] || section.evaluation_focus || '';
                const charGuide = section.char_guide || currentAnalysis?.character_limits?.[section.title] || 800;

                return `당신은 대한민국 최고 수준의 정부지원사업 사업계획서 대필 전문가입니다.

[전체 문서 맥락]
- 사업계획서 제목: ${documentPlan!.document_title}
- 이 섹션의 위치: ${idx + 1}번째 / 전체 ${sections.length}개 섹션
- 전체 문서 섹션 구성: ${sections.map(s => s.title).join(' → ')}

[지금 작성할 섹션]
섹션명: ${section.title}
핵심포인트: ${section.key_points?.join(', ') || '해당 없음'}
${hint ? `작성 전략: ${hint}` : ''}
${criteria ? `평가기준: ${criteria.item} (${criteria.score}점) — 핵심키워드: ${criteria.keywords?.join(', ')}\n평가포인트: ${criteria.description}` : ''}
분량 기준: 약 ${charGuide}자 내외

[관련 브레인스토밍 원자료]
${projectBrief}

${evaluationBlock ? `[공고 합격 전략]\n${currentAnalysis?.pass_strategy || ''}` : ''}

[작성 지시사항]
1. 이 섹션만의 완성된 HTML 본문을 작성하세요. 인사말·설명 없이 본문만 출력.
2. 평가기준 키워드를 **자연스럽게** 포함해 평가위원 체크리스트를 채울 수 있게 하세요.
3. 섹션 제목: <h2>, 소제목: <h3>, 중요 키워드: <strong> 태그 사용.
4. 비교항목 3개 이상이면 반드시 <table> 태그로 표 작성.
5. 브레인스토밍의 내용을 구체적 수치·사례로 발전시켜 설득력 높게 작성.
6. 아래 JSON 포맷으로만 응답 (앞뒤 텍스트 없이):
{"section_html": "완성된 HTML 문자열"}`;
            };

            // 모든 섹션 병렬 실행 (Promise.allSettled)
            const sectionResults: string[] = new Array(sections.length).fill('');

            await Promise.allSettled(
                sections.map(async (section: any, idx: number) => {
                    setDraftCurrentStep({ current: idx + 1, total: sections.length, label: section.title });
                    try {
                        const prompt = buildSectionPrompt(section, idx);
                        const raw = await callGemini(prompt, 0.25);

                        let sectionHtml = '';
                        const jsonMatch = raw.match(/\{[\s\S]*\}/);
                        if (jsonMatch) {
                            try {
                                const parsed = JSON.parse(jsonMatch[0]);
                                sectionHtml = parsed.section_html || parsed.document_html || '';
                            } catch { /* fallback below */ }
                        }
                        if (!sectionHtml) {
                            const htmlMatch = raw.match(/<h[1-6][\s\S]*/i);
                            sectionHtml = htmlMatch ? htmlMatch[0] : `<h2>${section.title}</h2><p>${section.key_points?.join('<br>') || ''}</p>`;
                        }
                        sectionResults[idx] = sectionHtml;

                        // 완료 즉시 UI 반영 — 체크 + 아웃라인 업데이트
                        setDraftCompletedSteps(prev => new Set([...prev, idx]));
                        setActiveOutlineId(`section-${idx}`);
                        setOutlineItems(prev => prev.map(item =>
                            item.id === `section-${idx}` ? { ...item, done: true } : item
                        ));

                        // 부분 완료될 때마다 에디터 실시간 업데이트 (스트리밍 느낌)
                        const partialHtml = `<h1>${documentPlan!.document_title}</h1>` +
                            sectionResults.filter(Boolean).join('');
                        setEditorContent(partialHtml);
                        setEditorMarkdown(partialHtml);
                        pendingDraftRef.current = partialHtml;
                        if (Platform.OS === 'web') {
                            const el = document.getElementById('nexus-editor-content');
                            if (el) el.innerHTML = partialHtml;
                        }
                    } catch (err) {
                        console.error(`섹션 "${section.title}" 작성 오류:`, err);
                        sectionResults[idx] = `<h2>${section.title}</h2><p>${section.key_points?.join('<br>') || ''}</p>`;
                        setDraftCompletedSteps(prev => new Set([...prev, idx]));
                    }
                })
            );

            // ── 최종 조합 및 완료 처리 ────────────────────────────────────────
            const finalHtml = `<h1>${documentPlan.document_title}</h1>` + sectionResults.join('');

            // 타이머 중단 + 총 소요 시간 고정
            if (timerRef.current) clearInterval(timerRef.current);
            const elapsed = Math.floor((Date.now() - generationStartRef.current) / 1000);
            setTotalSeconds(elapsed);
            setActiveOutlineId(null);
            // 모든 아웃라인 완료 처리
            setOutlineItems(prev => prev.map(item => ({ ...item, done: true })));

            setEditorContent(finalHtml);
            setEditorMarkdown(finalHtml);
            pendingDraftRef.current = finalHtml;
            setDraftCompleted(true);
            setHasUnsavedChanges(true);
            setDraftCurrentStep(null);

            // 에디터 강제 리마운트 (최종본 확실히 반영)
            setTimeout(() => setEditorKey(prev => prev + 1), 80);

            setChatMessages(prev => [...prev, {
                role: 'assistant',
                content: `✅ 사업계획서 초안 작성 완료!\n\n` +
                    `📄 총 ${sections.length}개 섹션이 작성되었습니다.\n` +
                    (currentAnalysis ? `📊 "${currentAnalysis.form_info?.title || docTitle}" 공고 평가기준을 반영했습니다.\n` : '') +
                    `\n💡 오른쪽 에디터에서 내용을 검토하고, 수정이 필요한 부분을 여기 채팅으로 요청하세요.`
            }]);

        } catch (err) {
            console.error('초안 생성 실패:', err);
            if (timerRef.current) clearInterval(timerRef.current);
            setDraftCurrentStep(null);
            const defaultSections = getDefaultPSSTTemplate();
            const mockTemplate: GrantTemplate = {
                id: 'default', grant_id: 'default', sections: defaultSections, source_markdown: null, parsed_at: new Date().toISOString()
            };
            setActiveTemplate(mockTemplate);
            loadTemplateForSession(session, false);
            setChatMessages(prev => [...prev, {
                role: 'assistant',
                content: '⚠️ 초안 생성 중 오류가 발생했습니다. 네트워크를 확인하거나 다시 시도해주세요.'
            }]);
        } finally {
            setDraftGenerating(false);
        }
    };

    // --- Load template for a session ---
    const loadTemplateForSession = async (session: any, isBackgroundLoad: boolean = false) => {
        setTemplateLoading(true);
        try {
            const defaultSections = getDefaultPSSTTemplate();
            const mockTemplate: GrantTemplate = {
                id: 'default',
                grant_id: 'default',
                sections: defaultSections,
                source_markdown: null,
                parsed_at: new Date().toISOString(),
            };
            setActiveTemplate(mockTemplate);

            if (!isBackgroundLoad) {
                const html = templateToEditorHtml(mockTemplate, session.title || session.grant_title || "맞춤형 사업계획서");
                setEditorContent(html);
            }
        } catch (err) {
            console.error('Template load failed:', err);
        } finally {
            setTemplateLoading(false);
        }
    };

    // --- Toggle Left Panel ---
    const toggleLeftPanel = () => {
        Animated.spring(leftPanelWidth, {
            toValue: isLeftPanelOpen ? 0 : 420,
            useNativeDriver: false,
            friction: 12,
            tension: 65,
        }).start();
        setIsLeftPanelOpen(!isLeftPanelOpen);
    };

    const handleLoadSession = async (sessionId: string) => {
        const data = await loadSession(sessionId);
        if (data) {
            setSelectedSession(data);
            setChatMessages(data.chat_history || []);
            setShowSessionList(false);
            setShowResumePrompt(false);
            // 공고 분석 결과 복원
            if (data.announcement_analysis) {
                setAnnouncementAnalysis(data.announcement_analysis);
            }

            // Prioritize saved editor_content, fallback to brainstorm branches
            if (data.editor_content && data.editor_content.length > 50) {
                setEditorContent(data.editor_content);
                setDraftCompleted(true);
            } else {
                const branches = data.workspace_data || [];
                const content = buildEditorContentFromBranches(branches);
                setEditorContent(content);
                setDraftCompleted(false); // Show the "AI 초안 작성" button
            }

            setHasUnsavedChanges(false);
            setLastSaved(null);

            // Save last session ID
            if (Platform.OS === 'web') {
                localStorage.setItem('NEXUS_EDIT_LAST_SESSION', sessionId);
            }
        }
    };

    // --- Build Editor Content from Brainstorm Branches ---
    const buildEditorContentFromBranches = (columns: any[]): string => {
        let html = '';
        for (const col of columns) {
            if (!col.branches) continue;
            for (const node of col.branches) {
                if (node.type === 'root') {
                    html += `<h1>${node.label || 'Untitled'}</h1>`;
                    if (node.description) html += `<p>${node.description}</p>`;
                } else {
                    html += `<h2>${node.label || ''}</h2>`;
                    if (node.description) html += `<p>${node.description}</p>`;
                }
            }
        }
        return html || '<h1>새 문서</h1><p>브레인스톰 데이터를 불러오거나, 직접 작성을 시작하세요.</p>';
    };

    // --- AI Chat ---
    const handleChatSend = async () => {
        if (!chatInput.trim() || chatLoading) return;

        const userMsg = chatInput.trim();
        setChatMessages(prev => [...prev, { role: 'user', content: userMsg }]);
        setChatInput('');
        setChatLoading(true);

        // 🌟 Feature: Detect "Write" or "Draft" request to trigger auto-drafting
        // Allow re-drafting even if draftCompleted=true, as user may want to regenerate
        // Remove overly broad generic keywords to prevent accidental full-document resets
        const draftingKeywords = ['초안 작성 시작', '전체 문서 작성', '처음부터 다시 작성'];
        if (draftingKeywords.some(kw => userMsg.includes(kw)) && selectedSession) {
            setChatMessages(prev => [...prev, { role: 'assistant', content: '알겠습니다. 브레인스톰 데이터를 분석하여 전체 사업계획서 초안을 새로 작성하겠습니다...' }]);
            await generateAutoDraft(selectedSession);
            setChatLoading(false);
            return;
        }

        try {
            // Build Context
            const brainstormContext = (selectedSession?.workspace_data || []).flatMap((col: any) =>
                (col.branches || []).map((node: any) => `[${node.label}] ${node.description || ''}`)
            ).join('\n');
            const editorContext = editorMarkdown || editorContent;
            
            const geminiKey = process.env.EXPO_PUBLIC_GEMINI_API_KEY || process.env.GEMINI_API_KEY;
            
            const prompt = `당신은 대한민국 최고 수준의 공공/정부지원사업 사업계획서 대필 전문가이자 에디터 보조 AI입니다.
사용자가 기존 사업계획서를 부분 수정해 달라고 요청했습니다.

[가장 중요한 수정 원칙 - 엄격 준수]
1. 타겟 수정: 사용자가 요청한 **특정 구역이나 특정 문단만** 집중적으로 자세하게 살을 붙이거나 수정하세요.
2. 기존 내용 보존: 사용자가 언급하지 않은 **나머지 모든 기존 내용(섹션 제목, 기존 글, 구조 등)은 절대로 임의로 갈아엎거나 축약/삭제하지 마세요.** 원본을 100% 그대로 유지해야 합니다.
3. 전체 문서 반환: 부분 수정된 내용을 기존 내용과 다시 합쳐서 **하나의 완성된 전체 HTML 코드**로 반환하세요. 이 코드가 에디터 전체를 덮어씌울 것이므로 기존에 있던 다른 구역이 누락되면 절대 안 됩니다.
4. 순수 HTML: <h1>, <h2>, <p>, <table> 등 순수 HTML 태그만 사용하고, 마크다운 기호(#, **)는 쓰지 마세요.
5. 반드시 아래의 순수 JSON 포맷으로만 응답해야 합니다. 어떤 코멘트도 앞뒤에 붙이지 마세요.

응답 JSON 규격:
{
    "reply": "사용자에게 할 친절한 채팅 답변 (예: 네, 요청하신 부분만 더 구체적으로 확장하여 텍스트를 보강했습니다. 나머지 부분은 원본을 유지했습니다.)",
    "modified_html": "부분 수정이 반영된 전체 문서의 HTML 코드 문자열 (수정이 필요 없는 답변일 경우 null)"
}

[현재 에디터 내용 (HTML 본문 원본)]
${editorContext}

[관련 브레인스톰 데이터]
${brainstormContext}

[사용자의 구체적 수정 요청사항]
${userMsg}`;

            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro:generateContent?key=${geminiKey}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ role: 'user', parts: [{ text: prompt }] }],
                    generationConfig: { temperature: 0.2 } // Lower temp for strict JSON
                })
            });

            const data = await response.json();
            
            if (data.candidates && data.candidates[0].content.parts[0].text) {
                let aiResponseText = data.candidates[0].content.parts[0].text.trim();
                
                try {
                    // JSON 데이터만 추출 (AI가 인사말을 붙이더라도 무시)
                    const jsonMatch = aiResponseText.match(/\{[\s\S]*\}/);
                    if (!jsonMatch) throw new Error("No JSON object found in response");
                    
                    const parsed = JSON.parse(jsonMatch[0]);
                    setChatMessages(prev => [...prev, { role: 'assistant', content: parsed.reply || "요청하신 작업을 완료했습니다." }]);
                    
                    if (parsed.modified_html) {
                        setEditorContent(parsed.modified_html);
                        setEditorMarkdown(parsed.modified_html);
                        setHasUnsavedChanges(true);
                        
                        // Force a React re-mount of NotionEditor to apply the upstream update instantly
                        setTimeout(() => {
                            setEditorKey(prev => prev + 1);
                        }, 50);
                    }
                } catch (parseError) {
                    console.error("JSON Parse Error:", parseError, "Raw Response:", aiResponseText);
                    setChatMessages(prev => [...prev, { role: 'assistant', content: aiResponseText }]); // Fallback to raw text
                }
            } else {
                setChatMessages(prev => [...prev, { role: 'assistant', content: '응답을 생성할 수 없습니다.' }]);
            }
        } catch (err) {
            setChatMessages(prev => [...prev, { role: 'assistant', content: '⚠️ AI 응답 오류가 발생했습니다. "초안 작성해줘"로 다시 시도해 주세요.' }]);
        } finally {
            setChatLoading(false);
            setTimeout(() => chatScrollRef.current?.scrollToEnd({ animated: true }), 100);
        }
    };

    // --- Editor onChange ---
    const handleEditorChange = useCallback((html: string, markdown: string) => {
        setEditorContent(html);
        setEditorMarkdown(markdown);
        setHasUnsavedChanges(true);
    }, []);

    // --- Save Handler ---
    const handleSave = async () => {
        if (!selectedSession?.id || isSaving) return;
        setIsSaving(true);
        const success = await saveEditorContent(selectedSession.id, editorContent, editorMarkdown);
        setIsSaving(false);
        if (success) {
            setHasUnsavedChanges(false);
            const now = new Date();
            setLastSaved(`${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`);
        }
    };

    // --- Document Upload & Auto-Fill ---
    const handleDocumentAutoFill = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;
        
        const fileExt = file.name.toLowerCase();
        const isDocx = fileExt.endsWith('.docx');
        const isHwpx = fileExt.endsWith('.hwpx');
        
        if (!isDocx && !isHwpx) {
            alert("공고문 양식은 반드시 .docx 또는 .hwpx 형식이어야 합니다.");
            return;
        }

        setHwpxLoading(true);
        // Temporary UI update during processing
        setChatMessages(prev => [...prev, { role: 'assistant', content: `⏳ 업로드된 ${isDocx ? 'DOCX' : 'HWPX'} 원본 양식을 분석하고 AI 작성 데이터를 매핑하고 있습니다... (약 10초 소요)` }]);

        try {
            const geminiKey = process.env.EXPO_PUBLIC_GEMINI_API_KEY || process.env.GEMINI_API_KEY || '';
            const currentAnalysis = announcementAnalysis || selectedSession?.announcement_analysis;
            const announcementSections = currentAnalysis?.required_sections || [];

            const formData = new FormData();
            formData.append('file', file);
            formData.append('payload', JSON.stringify({
                document_html: editorContent,
                gemini_api_key: geminiKey,
                announcement_sections: announcementSections,
            }));
            // Use env variable if set (e.g. a live Cloudflare tunnel), otherwise always localhost:8001
            const envBackendUrl = process.env.EXPO_PUBLIC_PYTHON_BACKEND_URL || '';
            const baseUrl = envBackendUrl || "http://localhost:8001";
            const endpoint = isDocx ? `${baseUrl}/api/autofill-docx` : `${baseUrl}/api/upload-hwpx`;
            
            const response = await fetch(endpoint, {
                method: "POST",
                body: formData,
                headers: {
                    "Bypass-Tunnel-Reminder": "true"
                }
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || "문서 매핑 서버 통신 실패 (Python Backend 확인 필요)");
            }

            // Handle Blob response for BOTH DOCX and HWPX (file download)
            let blob = await response.blob();
            // Force explicit MIME type
            const mimeType = isDocx 
                ? "application/vnd.openxmlformats-officedocument.wordprocessingml.document" 
                : "application/haansofthwp";
            blob = new Blob([blob], { type: mimeType });
            
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            
            const ext = isDocx ? '.docx' : '.hwpx';
            let safeName = (file.name || `document${ext}`).replace(/[^a-zA-Z0-9.\-_가-힣() ]/g, '_');
            if (!safeName.toLowerCase().endsWith(ext)) safeName += ext;
            a.download = `Publica_Draft_${safeName}`;
            
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            setTimeout(() => {
                window.URL.revokeObjectURL(url);
            }, 15000); // 비동기 차단 및 파일 용량을 대비해 파기 시간 넉넉히 15초 부여
            
            alert(`🎉 ${isDocx ? 'DOCX' : 'HWPX'} 병합본 내보내기 성공!\n설명: AI 초안이 매핑된 파일이 다운로드 폴더에 자동 저장되었습니다.`);
            setChatMessages(prev => [...prev, { 
                role: 'assistant', 
                content: `✅ ${isDocx ? 'DOCX' : 'HWPX'} 문서 매핑이 완료되었습니다. 혹시 브라우저 팝업 차단으로 인해 자동 다운로드가 안 되었다면, 아래 버튼을 눌러 수동으로 받아주세요. (링크는 15초간 유효합니다)`,
                files: [{ name: safeName, url: url }]
            }]);
        } catch (error: any) {
            console.error("Document Processing error:", error);
            alert(`문서 변환 실패: ${error.message}\n(Python 백엔드 서버가 켜져 있는지 메인 터미널을 확인해주세요)`);
            setChatMessages(prev => [...prev, { role: 'assistant', content: `❌ 문서 분석 실패: ${error.message}` }]);
        } finally {
            setHwpxLoading(false);
            if (event.target) event.target.value = '';
        }
    };

    // --- Auto-save every 30 seconds ---
    useEffect(() => {
        if (autoSaveTimerRef.current) clearInterval(autoSaveTimerRef.current);
        if (selectedSession?.id) {
            autoSaveTimerRef.current = setInterval(() => {
                if (hasUnsavedChanges && editorContent) {
                    handleSave();
                }
            }, 30000);
        }
        return () => { if (autoSaveTimerRef.current) clearInterval(autoSaveTimerRef.current); };
    }, [selectedSession?.id, hasUnsavedChanges, editorContent]);

    // --- Render ---
    return (
        <View style={styles.container}>
            {/* ─── Header Bar ─── */}
            <View style={styles.header}>
                <View style={styles.headerLeft}>
                    <TouchableOpacity onPress={toggleLeftPanel} style={styles.headerBtn}>
                        {isLeftPanelOpen ? <PanelLeftClose size={18} color="#94A3B8" /> : <PanelLeftOpen size={18} color="#94A3B8" />}
                    </TouchableOpacity>
                    <View style={styles.headerBrand}>
                        <Zap size={16} color="#818CF8" />
                        <Text style={styles.headerTitle}>Publica NEXUS</Text>
                        <Text style={styles.headerSubtitle}>— Edit</Text>
                        {/* WinnerAI 스타일 타이머 */}
                        {draftGenerating && (
                            <View style={{ marginLeft: 16, flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(129,140,248,0.12)', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(129,140,248,0.3)' }}>
                                <ActivityIndicator size="small" color="#818CF8" />
                                <Text style={{ color: '#818CF8', fontSize: 13, fontWeight: '700' }}>{elapsedSeconds}초 작성 중...</Text>
                            </View>
                        )}
                        {!draftGenerating && totalSeconds !== null && draftCompleted && (
                            <View style={{ marginLeft: 16, flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(16,185,129,0.1)', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(16,185,129,0.3)' }}>
                                <Text style={{ color: '#10B981', fontSize: 13, fontWeight: '700' }}>✓ {totalSeconds}초 만에 완성</Text>
                            </View>
                        )}
                    </View>
                </View>
                <View style={styles.headerRight}>
                    {selectedSession && (
                        <>
                            {Platform.OS === 'web' && (
                                <div style={{ position: 'relative', display: 'inline-block' }}>
                                    <input
                                        type="file"
                                        accept=".hwpx,.docx"
                                        id="hwpx-upload"
                                        style={{ display: 'none' }}
                                        onChange={handleDocumentAutoFill}
                                        disabled={hwpxLoading}
                                    />
                                    <label htmlFor="hwpx-upload" style={{
                                        display: 'flex', alignItems: 'center', gap: 6,
                                        marginRight: 12, padding: '8px 16px',
                                        backgroundColor: 'rgba(129, 140, 248, 0.1)',
                                        border: '1px solid rgba(129, 140, 248, 0.3)',
                                        borderRadius: 8, cursor: hwpxLoading ? 'wait' : 'pointer',
                                        transition: 'all 0.2s'
                                    }}>
                                        {hwpxLoading ? <ActivityIndicator size="small" color="#818CF8" /> : <Upload size={16} color="#818CF8" />}
                                        <Text style={{ color: '#818CF8', fontWeight: '600', fontSize: 13 }}>원본 DOCX / HWPX 자동 완성</Text>
                                    </label>
                                </div>
                            )}
                            {lastSaved && <Text style={{ color: '#475569', fontSize: 10, fontWeight: '500' }}>저장됨 {lastSaved}</Text>}
                            {hasUnsavedChanges && !isSaving && <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: '#F59E0B' }} />}
                        </>
                    )}
                    <TouchableOpacity
                        style={[styles.saveBtn, isSaving && { opacity: 0.6 }]}
                        onPress={handleSave}
                        disabled={isSaving || !selectedSession}
                    >
                        <Save size={16} color="#10B981" />
                        <Text style={styles.saveBtnText}>{isSaving ? '저장 중...' : '저장'}</Text>
                    </TouchableOpacity>
                </View>
            </View>

            {/* ─── RFP 분기 모달 (Option B) ─── */}
            {showRfpModal && (
                <View style={styles.draftLoadingOverlay as any}>
                    <View style={styles.premiumRfpModal}>
                        <View style={styles.modalHeaderRow}>
                            <View style={styles.modalHeaderTitleBox}>
                                <View style={styles.modalIconBox}>
                                    <Sparkles size={20} color="#FFFFFF" />
                                </View>
                                <View>
                                    <Text style={styles.modalMainTitle}>AI 공고 맞춤형 분석 & 자동 완성</Text>
                                    <Text style={styles.modalSubTitle}>공고 맞춤 설계부터 초안 작성까지 한 번에 진행합니다</Text>
                                </View>
                            </View>
                            <TouchableOpacity 
                                style={styles.modalCloseBtn}
                                onPress={() => !rfpAnalyzing && setShowRfpModal(false)}
                            >
                                <X size={20} color="#64748B" />
                            </TouchableOpacity>
                        </View>

                        <View style={styles.modalBody}>
                            <View style={styles.premiumInputGroup}>
                                <Text style={styles.premiumLabel}>사업명 (프로젝트 이름)</Text>
                                <TextInput
                                    style={styles.premiumInput}
                                    placeholder="예: 2024 예비창업패키지 지원사업"
                                    placeholderTextColor="#94A3B8"
                                    value={rfpTitle}
                                    onChangeText={setRfpTitle}
                                    editable={!rfpAnalyzing}
                                />
                            </View>

                            <View style={styles.premiumInputGroup}>
                                <Text style={styles.premiumLabel}>공고문 내용 (합격 기준 및 모집요강)</Text>
                                <textarea
                                    style={styles.premiumTextArea as any}
                                    placeholder="공고의 평가 항목, 핵심 우대사항, 필수 요건 등의 텍스트를 붙여넣으세요. 많이 입력할수록 더 정확하게 분석됩니다."
                                    value={rfpText}
                                    onChange={(e: any) => setRfpText(e.target.value)}
                                    disabled={rfpAnalyzing}
                                />
                            </View>

                            <View style={styles.analysisFeatureBanner}>
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                                    <CheckCircle size={14} color="#10B981" />
                                    <Text style={styles.featureItemText}>배점 중심의 핵심 평가 지표 분석</Text>
                                </View>
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                                    <CheckCircle size={14} color="#10B981" />
                                    <Text style={styles.featureItemText}>합격 가능성을 높이는 전략 설계도 생성</Text>
                                </View>
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                                    <CheckCircle size={14} color="#10B981" />
                                    <Text style={styles.featureItemText}>설계 기반 10초 내 전체 초안 병렬 작성</Text>
                                </View>
                            </View>
                        </View>
                        
                        <TouchableOpacity
                            style={[styles.premiumActionBtn, rfpAnalyzing && styles.btnDisabled]}
                            onPress={handleGenerateRfpFlow}
                            disabled={rfpAnalyzing}
                        >
                            {rfpAnalyzing ? (
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                                    <ActivityIndicator size="small" color="#FFF" />
                                    <Text style={styles.premiumActionBtnText}>공고 심층 분석 중...</Text>
                                </View>
                            ) : (
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                                    <Zap size={20} color="#FFF" />
                                    <Text style={styles.premiumActionBtnText}>공고 분석 및 자동 초안 생성 시작</Text>
                                </View>
                            )}
                        </TouchableOpacity>
                    </View>
                </View>
            )}

            {/* ─── Main Content ─── */}
            <View style={styles.main}>
                {/* ─── Left Panel: Brainstorm + Chat ─── */}
                <Animated.View style={[styles.leftPanel, { width: leftPanelWidth }]}>
                    {isLeftPanelOpen && (
                        <View style={{ flex: 1 }}>
                            {/* Resume Prompt */}
                            {showResumePrompt && lastSessionId && (
                                <View style={styles.resumeBanner}>
                                    <Text style={styles.resumeText}>📝 이전 작업을 이어서 하시겠어요?</Text>
                                    <View style={styles.resumeActions}>
                                        <TouchableOpacity
                                            style={styles.resumeBtn}
                                            onPress={() => handleLoadSession(lastSessionId)}
                                        >
                                            <Text style={styles.resumeBtnText}>이어하기</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity
                                            style={[styles.resumeBtn, { backgroundColor: '#1E293B' }]}
                                            onPress={() => {
                                                setShowResumePrompt(false);
                                                if (Platform.OS === 'web') localStorage.removeItem('NEXUS_EDIT_LAST_SESSION');
                                            }}
                                        >
                                            <Text style={[styles.resumeBtnText, { color: '#94A3B8' }]}>새로 시작</Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            )}

                            {/* Session List or Brainstorm Viewer */}
                            {showSessionList ? (
                                <View style={styles.sessionListContainer}>
                                    <View style={[styles.sectionHeader, { justifyContent: 'space-between' }]}>
                                        <View style={{flexDirection: 'row', alignItems: 'center', gap: 6}}>
                                            <FolderOpen size={16} color="#818CF8" />
                                            <Text style={styles.sectionTitle}>브레인스톰 프로젝트</Text>
                                        </View>
                                    </View>
                                    
                                    <TouchableOpacity 
                                        style={{ marginHorizontal: 16, marginBottom: 16, backgroundColor: 'rgba(124, 58, 237, 0.1)', borderWidth: 1, borderColor: '#7C3AED', borderRadius: 8, padding: 12, flexDirection: 'row', alignItems: 'center', gap: 8 }}
                                        onPress={() => setShowRfpModal(true)}
                                    >
                                        <Upload size={16} color="#7C3AED" />
                                        <View>
                                            <Text style={{ color: '#7C3AED', fontSize: 13, fontWeight: '800' }}>📄 새 공고 맞춤형 초안 자동 세팅</Text>
                                            <Text style={{ color: '#64748B', fontSize: 11, marginTop: 2 }}>공고문을 붙여넣으면 합격 기준에 맞춘 가이드를 생성합니다</Text>
                                        </View>
                                    </TouchableOpacity>

                                    <ScrollView style={styles.sessionScroll}>
                                        {sessions.length === 0 ? (
                                            <View style={styles.emptyState}>
                                                <FileText size={32} color="#334155" />
                                                <Text style={styles.emptyText}>NEXUS-Flow에서 브레인스톰을 먼저 진행하세요</Text>
                                            </View>
                                        ) : (
                                            sessions.map((s: any) => (
                                                <TouchableOpacity
                                                    key={s.id}
                                                    style={styles.sessionItem}
                                                    onPress={() => handleLoadSession(s.id)}
                                                >
                                                    <FileText size={16} color="#60A5FA" />
                                                    <View style={{ flex: 1, marginLeft: 10 }}>
                                                        <Text style={styles.sessionItemTitle} numberOfLines={1}>{s.title}</Text>
                                                        <Text style={styles.sessionItemMeta}>
                                                            {s.workspace_data?.reduce((acc: number, col: any) => acc + (col.branches?.length || 0), 0) || 0} 브랜치 · {new Date(s.updated_at).toLocaleDateString('ko-KR')}
                                                        </Text>
                                                    </View>
                                                    <ChevronRight size={16} color="#475569" />
                                                </TouchableOpacity>
                                            ))
                                        )}
                                    </ScrollView>
                                </View>
                            ) : (
                                /* Brainstorm Viewer (selected session branches) */
                                <View style={styles.brainstormViewer}>
                                    <TouchableOpacity
                                        style={styles.backToList}
                                        onPress={() => { setShowSessionList(true); setSelectedSession(null); }}
                                    >
                                        <ArrowLeft size={16} color="#60A5FA" />
                                        <Text style={styles.backToListText}>프로젝트 목록</Text>
                                    </TouchableOpacity>

                                    <View style={styles.sectionHeader}>
                                        <Sparkles size={16} color="#F59E0B" />
                                        {/* 🌟 New: Action Bar for drafting */}
                                        {!draftCompleted && !draftGenerating && (
                                            <View style={styles.premiumDraftBanner}>
                                                <View style={styles.draftBannerIconBox}>
                                                    <Sparkles size={18} color="#7C3AED" />
                                                </View>
                                                <View style={{ flex: 1 }}>
                                                    <Text style={styles.draftBannerTitle}>AI가 최적화된 사업계획서 초안을 작성해 드릴까요?</Text>
                                                    <Text style={styles.draftBannerDesc}>
                                                        브레인스토밍 메모와 공고 평가기준을 분석하여 {'\n'}
                                                        <Text style={{ fontWeight: '800' }}>PSST 양식의 전문적인 초안</Text>을 자동으로 작성합니다.
                                                    </Text>
                                                    <TouchableOpacity
                                                        style={styles.draftBannerBtn}
                                                        onPress={() => generateAutoDraft(selectedSession)}
                                                    >
                                                        <Zap size={14} color="#FFF" />
                                                        <Text style={styles.draftBannerBtnText}>AI 초안 작성 시작 (1분 소요)</Text>
                                                    </TouchableOpacity>
                                                </View>
                                            </View>
                                        )}
                                        {draftGenerating && (
                                            <View style={styles.premiumDraftBannerSmall}>
                                                <ActivityIndicator size="small" color="#7C3AED" />
                                                <Text style={styles.draftBannerGeneratingText}>AI 인텔리전스가 문서를 심층 작성하고 있습니다...</Text>
                                            </View>
                                        )}

                            <Text style={styles.sectionTitle}>브레인스톰 데이터</Text>
                                    </View>

                                    <ScrollView style={styles.branchScroll}>
                                        {(selectedSession?.workspace_data || []).map((col: any, ci: number) => (
                                            <View key={ci}>
                                                {(col.branches || []).map((node: any, ni: number) => (
                                                    <TouchableOpacity
                                                        key={node.id || ni}
                                                        style={[styles.branchCard, node.type === 'root' && styles.branchCardRoot]}
                                                        onPress={() => {
                                                            // Insert this branch content into editor
                                                            const insertHtml = `<h2>${node.label || ''}</h2><p>${node.description || ''}</p>`;
                                                            setEditorContent(prev => prev + insertHtml);
                                                        }}
                                                    >
                                                        <Text style={styles.branchLabel}>{node.label || 'Untitled'}</Text>
                                                        <Text style={styles.branchDesc} numberOfLines={2}>{node.description || ''}</Text>
                                                        <Text style={styles.branchInsertHint}>탭하여 에디터에 삽입</Text>
                                                    </TouchableOpacity>
                                                ))}
                                            </View>
                                        ))}
                                    </ScrollView>
                                </View>
                            )}

                            {/* ─── Chat Section ─── */}
                            <View style={styles.chatSection}>
                                <View style={styles.chatHeader}>
                                    <Bot size={16} color="#818CF8" />
                                    <Text style={styles.chatHeaderText}>AI 작성 도우미</Text>
                                </View>

                                <ScrollView ref={chatScrollRef} style={styles.chatMessages}>
                                    {chatMessages.length === 0 && (
                                        <View style={styles.chatEmpty}>
                                            <Text style={styles.chatEmptyText}>💡 문서 작성 중 궁금한 점이나 도움이 필요하면 질문하세요</Text>
                                        </View>
                                    )}
                                    {chatMessages.map((msg, i) => (
                                        <View key={i} style={[styles.chatBubble, msg.role === 'user' ? styles.chatBubbleUser : styles.chatBubbleAI]}>
                                            {msg.role === 'assistant' && <Bot size={14} color="#818CF8" style={{ marginRight: 6, marginTop: 2 }} />}
                                            <View style={{ flex: 1 }}>
                                                <Text style={[
                                                    styles.chatBubbleText, 
                                                    msg.role === 'user' && { color: '#000000', fontWeight: '800' } // 사용자 폰트 블랙 및 볼드 처리
                                                ]}>
                                                    {msg.content}
                                                </Text>
                                                {/* Fallback 다운로드 링크 UI 제공 */}
                                                {msg.files && msg.files.map((f, fi) => (
                                                    <View key={fi} style={{ marginTop: 8, alignSelf: 'flex-start' }}>
                                                        {Platform.OS === 'web' ? (
                                                            <a href={f.url} download={f.name} style={{ display: 'flex', alignItems: 'center', gap: 4, textDecoration: 'none', backgroundColor: '#818CF8', padding: '6px 12px', borderRadius: 6, color: 'white', fontSize: 12, fontWeight: '700' }}>
                                                                <Upload size={14} color="white" style={{ transform: [{ rotate: '180deg' }] }} /> {f.name} 다운로드
                                                            </a>
                                                        ) : (
                                                            <View style={{ backgroundColor: '#818CF8', padding: 6, borderRadius: 6 }}>
                                                                <Text style={{ color: 'white', fontSize: 12 }}>다운로드: {f.name}</Text>
                                                            </View>
                                                        )}
                                                    </View>
                                                ))}
                                            </View>
                                        </View>
                                    ))}
                                    {chatLoading && (
                                        <View style={[styles.chatBubble, styles.chatBubbleAI]}>
                                            <ActivityIndicator size="small" color="#818CF8" />
                                            <Text style={[styles.chatBubbleText, { marginLeft: 8 }]}>작성 중...</Text>
                                        </View>
                                    )}
                                </ScrollView>

                                <View style={styles.chatInputRow}>
                                    <TextInput
                                        style={styles.chatInput}
                                        value={chatInput}
                                        onChangeText={setChatInput}
                                        placeholder="문서 작성 도움 요청..."
                                        placeholderTextColor="#475569"
                                        onSubmitEditing={handleChatSend}
                                        returnKeyType="send"
                                    />
                                    <TouchableOpacity
                                        style={[styles.chatSendBtn, chatInput.trim() && styles.chatSendBtnActive]}
                                        onPress={handleChatSend}
                                        disabled={!chatInput.trim() || chatLoading}
                                    >
                                        <Send size={16} color={chatInput.trim() ? '#818CF8' : '#475569'} />
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </View>
                    )}
                </Animated.View>

                {/* ─── Right Panel: Editor + Progress Tracker ─── */}
                <View style={styles.rightPanel}>
                    {selectedSession ? (
                        <View style={{ flex: 1, flexDirection: 'row' as any }}>
                            {/* Editor */}
                            <View style={{ flex: 1, position: 'relative' }}>
                                <NotionEditor
                                    key={editorKey}
                                    initialContent={pendingDraftRef.current || editorContent}
                                    onChange={handleEditorChange}
                                    placeholder="/ 를 입력하여 블록 타입을 선택하세요..."
                                />

                                {/* 병렬 작성 중 오버레이 — 진행상황 요약 */}
                                {draftGenerating && (
                                    <View style={styles.draftLoadingOverlay as any}>
                                        <View style={styles.premiumLoadingBox}>
                                            <ActivityIndicator size="large" color="#7C3AED" />
                                            {draftCurrentStep?.label === '문서 구조 설계 중...' ? (
                                                <View style={{ alignItems: 'center' }}>
                                                    <Text style={styles.draftLoadingText}>🎯 최적의 문서 전략 설계 중...</Text>
                                                    <Text style={styles.draftLoadingSubtext}>브레인스토밍 내용과 공고 평가기준을 융합하고 있습니다</Text>
                                                </View>
                                            ) : (
                                                <View style={{ alignItems: 'center' }}>
                                                    <Text style={styles.draftLoadingText}>
                                                        ✍️ {draftCompletedSteps.size}/{draftBranchLabels.length} 섹션 병렬 작성 중
                                                    </Text>
                                                    <View style={styles.writingStages}>
                                                        {draftBranchLabels.map((l, i) => (
                                                            <View key={i} style={[
                                                                styles.writingStageDot,
                                                                draftCompletedSteps.has(i) && styles.writingStageDotDone
                                                            ]} />
                                                        ))}
                                                    </View>
                                                    <Text style={styles.draftLoadingSubtext}>
                                                        모든 섹션을 동시에 작성하여 시간을 단축하고 있습니다
                                                    </Text>
                                                </View>
                                            )}
                                        </View>
                                    </View>
                                )}
                            </View>
                            {/* ── WinnerAI 스타일 아웃라인 패널 ── */}
                            <View style={styles.progressStrip}>
                                {/* 헤더 */}
                                <Text style={styles.progressStripTitle}>
                                    {draftGenerating ? '작성 중' : draftCompleted ? '완성' : '목차'}
                                </Text>

                                {/* 타이머 / 완성 시간 */}
                                {draftGenerating && (
                                    <View style={{ alignItems: 'center', marginBottom: 12, paddingHorizontal: 4 }}>
                                        <Text style={{ color: '#818CF8', fontSize: 18, fontWeight: '900' }}>{elapsedSeconds}s</Text>
                                        <Text style={{ color: '#94A3B8', fontSize: 9, marginTop: 2 }}>경과</Text>
                                    </View>
                                )}
                                {!draftGenerating && totalSeconds !== null && (
                                    <View style={{ alignItems: 'center', marginBottom: 12, paddingHorizontal: 4 }}>
                                        <Text style={{ color: '#10B981', fontSize: 14, fontWeight: '900' }}>{totalSeconds}s</Text>
                                        <Text style={{ color: '#94A3B8', fontSize: 9, marginTop: 2 }}>완성</Text>
                                    </View>
                                )}

                                {/* 아웃라인 목차 — 실시간 업데이트 */}
                                <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1 }}>
                                    {(outlineItems.length > 0
                                        ? outlineItems
                                        : (draftBranchLabels.length > 0 ? draftBranchLabels : ['문제인식', '실현가능성', '성장전략', '팀구성'])
                                            .map((l, i) => ({ id: `section-${i}`, title: `${i + 1}. ${l}`, done: draftCompletedSteps.has(i) }))
                                    ).map((item, idx) => {
                                        const isActive = activeOutlineId === item.id;
                                        return (
                                            <View key={item.id} style={styles.progressStep}>
                                                {idx > 0 && (
                                                    <View style={[styles.progressLine, item.done && styles.progressLineCompleted]} />
                                                )}
                                                <View style={[
                                                    styles.progressCircle,
                                                    item.done && styles.progressCircleCompleted,
                                                    isActive && styles.progressCircleActive,
                                                ]}>
                                                    {item.done ? (
                                                        <Text style={styles.progressCheckmark}>✓</Text>
                                                    ) : isActive ? (
                                                        <ActivityIndicator size="small" color="#818CF8" />
                                                    ) : (
                                                        <Text style={styles.progressNumber}>{idx + 1}</Text>
                                                    )}
                                                </View>
                                                <Text style={[
                                                    styles.progressLabel,
                                                    item.done && styles.progressLabelCompleted,
                                                    isActive && styles.progressLabelActive,
                                                ]} numberOfLines={3}>{item.title}</Text>
                                            </View>
                                        );
                                    })}
                                </ScrollView>
                            </View>
                        </View>
                    ) : (
                        <View style={styles.editorPlaceholder}>
                            <FileText size={48} color="#1E293B" />
                            <Text style={styles.placeholderTitle}>문서 작성 준비</Text>
                            <Text style={styles.placeholderDesc}>
                                왼쪽 패널에서 브레인스톰 프로젝트를 선택하거나{'\n'}
                                NEXUS-Flow에서 "서류 작성하러 가기"를 클릭하세요
                            </Text>
                        </View>
                    )}
                </View>
            </View>
        </View>
    );
};

// ═══════════════════════════════════════════════════
// Styles
// ═══════════════════════════════════════════════════
const styles = StyleSheet.create({
    // Writing Phases Loading
    premiumLoadingBox: {
        backgroundColor: 'rgba(255, 255, 255, 0.98)',
        padding: 32,
        borderRadius: 24,
        alignItems: 'center',
        shadowColor: '#7C3AED',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.1,
        shadowRadius: 30,
        elevation: 10,
        borderWidth: 1,
        borderColor: 'rgba(124, 58, 237, 0.1)',
    },
    writingStages: {
        flexDirection: 'row',
        gap: 6,
        marginVertical: 16,
    },
    writingStageDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#E2E8F0',
    },
    writingStageDotDone: {
        backgroundColor: '#7C3AED',
        width: 12,
        borderRadius: 6,
    },
    draftLoadingOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(253, 248, 243, 0.8)',
        zIndex: 100,
        alignItems: 'center',
        justifyContent: 'center',
    },
    draftLoadingText: {
        color: '#1E1B4B',
        fontSize: 18,
        fontWeight: '900',
        marginTop: 16,
    },
    draftLoadingSubtext: {
        color: '#64748B',
        fontSize: 13,
        fontWeight: '600',
        marginTop: 8,
        textAlign: 'center',
    },
    container: {
        flex: 1,
        backgroundColor: '#FDF8F3',
    },

    // Header
    header: {
        height: 52,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        borderBottomWidth: 1,
        borderColor: '#E2E8F0',
        backgroundColor: '#FFFFFF',
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    headerBtn: {
        width: 32,
        height: 32,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#F1F5F9',
    },
    headerBrand: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    headerTitle: {
        color: '#27272a',
        fontSize: 14,
        fontWeight: '900',
        letterSpacing: -0.3,
    },
    headerSubtitle: {
        color: '#7C3AED',
        fontSize: 13,
        fontWeight: '700',
    },
    headerRight: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    sessionTitle: {
        color: '#64748B',
        fontSize: 12,
        fontWeight: '600',
        maxWidth: 200,
    },
    saveBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
        backgroundColor: 'rgba(16,185,129,0.08)',
        borderWidth: 1,
        borderColor: 'rgba(16,185,129,0.15)',
    },
    saveBtnText: {
        color: '#10B981',
        fontSize: 12,
        fontWeight: '800',
    },

    // Main
    main: {
        flex: 1,
        flexDirection: 'row',
    },

    // Left Panel
    leftPanel: {
        borderRightWidth: 1,
        borderColor: '#E2E8F0',
        backgroundColor: '#FDF8F3',
        overflow: 'hidden',
    },

    // Resume Banner
    resumeBanner: {
        padding: 16,
        backgroundColor: 'rgba(124, 58, 237, 0.05)',
        borderBottomWidth: 1,
        borderColor: 'rgba(124, 58, 237, 0.1)',
    },
    resumeText: {
        color: '#27272a',
        fontSize: 13,
        fontWeight: '800',
        marginBottom: 10,
    },
    resumeActions: {
        flexDirection: 'row',
        gap: 8,
    },
    resumeBtn: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 8,
        backgroundColor: '#7C3AED',
    },
    resumeBtnText: {
        color: '#FFF',
        fontSize: 12,
        fontWeight: '700',
    },

    // Session List
    sessionListContainer: {
        flex: 1,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingHorizontal: 16,
        paddingTop: 16,
        paddingBottom: 10,
    },
    sectionTitle: {
        color: '#27272a',
        fontSize: 13,
        fontWeight: '900',
    },
    sessionScroll: {
        flex: 1,
        paddingHorizontal: 12,
    },
    emptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 60,
        gap: 12,
    },
    emptyText: {
        color: '#94A3B8',
        fontSize: 13,
        textAlign: 'center',
        lineHeight: 20,
    },
    sessionItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 14,
        borderRadius: 12,
        backgroundColor: '#FFFFFF',
        marginBottom: 8,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.03,
        shadowRadius: 4,
    },
    sessionItemTitle: {
        color: '#27272a',
        fontSize: 13,
        fontWeight: '800',
    },
    sessionItemMeta: {
        color: '#94A3B8',
        fontSize: 11,
        fontWeight: '500',
        marginTop: 2,
    },

    // Brainstorm Viewer
    brainstormViewer: {
        flex: 1,
    },
    backToList: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 16,
        paddingTop: 12,
    },
    backToListText: {
        color: '#7C3AED',
        fontSize: 12,
        fontWeight: '700',
    },
    branchScroll: {
        flex: 1,
        padding: 12,
    },
    branchCard: {
        padding: 14,
        borderRadius: 12,
        backgroundColor: '#FFFFFF',
        marginBottom: 8,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.03,
        shadowRadius: 4,
    },
    branchCardRoot: {
        borderColor: '#7C3AED',
        backgroundColor: 'rgba(124, 58, 237, 0.03)',
    },
    branchLabel: {
        color: '#27272a',
        fontSize: 13,
        fontWeight: '800',
        marginBottom: 4,
    },
    branchDesc: {
        color: '#64748B',
        fontSize: 12,
        lineHeight: 18,
    },
    branchInsertHint: {
        color: '#7C3AED',
        fontSize: 10,
        fontWeight: '700',
        marginTop: 6,
    },

    // Chat Section
    chatSection: {
        height: 280,
        borderTopWidth: 1,
        borderColor: '#E2E8F0',
        backgroundColor: '#FFFFFF',
    },
    chatHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderColor: '#F1F5F9',
    },
    chatHeaderText: {
        color: '#27272a',
        fontSize: 12,
        fontWeight: '800',
    },
    chatMessages: {
        flex: 1,
        padding: 12,
    },
    chatEmpty: {
        padding: 16,
        alignItems: 'center',
    },
    chatEmptyText: {
        color: '#94A3B8',
        fontSize: 12,
        textAlign: 'center',
        lineHeight: 18,
    },
    chatBubble: {
        flexDirection: 'row',
        padding: 10,
        borderRadius: 12,
        marginBottom: 8,
        maxWidth: '90%',
    },
    chatBubbleUser: {
        backgroundColor: 'rgba(124, 58, 237, 0.15)', // 가독성을 위해 연한 보라색 배경으로 조정
        borderWidth: 1,
        borderColor: 'rgba(124, 58, 237, 0.3)',
        alignSelf: 'flex-end',
    },
    chatBubbleAI: {
        backgroundColor: '#F8FAFC',
        borderWidth: 1,
        borderColor: '#E2E8F0',
        alignSelf: 'flex-start',
    },
    chatBubbleText: {
        color: '#475569',
        fontSize: 12,
        lineHeight: 18,
        flex: 1,
    },
    chatInputRow: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 10,
        gap: 8,
        borderTopWidth: 1,
        borderColor: '#F1F5F9',
    },
    chatInput: {
        flex: 1,
        height: 36,
        backgroundColor: '#F8FAFC',
        borderRadius: 10,
        paddingHorizontal: 12,
        color: '#27272a',
        fontSize: 13,
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    chatSendBtn: {
        width: 36,
        height: 36,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#F1F5F9',
    },
    chatSendBtnActive: {
        backgroundColor: 'rgba(124, 58, 237, 0.1)',
        borderWidth: 1,
        borderColor: 'rgba(124, 58, 237, 0.2)',
    },

    // Right Panel
    rightPanel: {
        flex: 1,
        backgroundColor: '#FDF8F3',
    },
    draftLoadingOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(253, 248, 243, 0.85)',
        zIndex: 100,
        alignItems: 'center',
        justifyContent: 'center',
    },
    premiumLoadingBox: {
        backgroundColor: '#FFFFFF',
        paddingHorizontal: 40,
        paddingVertical: 48,
        borderRadius: 32,
        alignItems: 'center',
        shadowColor: '#7C3AED',
        shadowOffset: { width: 0, height: 20 },
        shadowOpacity: 0.1,
        shadowRadius: 40,
        elevation: 15,
        borderWidth: 1,
        borderColor: 'rgba(124, 58, 237, 0.1)',
        width: '85%',
        maxWidth: 400,
    },
    writingStages: {
        flexDirection: 'row',
        gap: 8,
        marginVertical: 20,
        alignItems: 'center',
    },
    writingStageDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: '#E2E8F0',
    },
    writingStageDotDone: {
        backgroundColor: '#7C3AED',
        width: 24,
        borderRadius: 12,
    },
    draftLoadingText: {
        color: '#1E1B4B',
        fontSize: 18,
        fontWeight: '900',
        marginTop: 20,
        textAlign: 'center',
    },
    draftLoadingSubtext: {
        color: '#64748B',
        fontSize: 14,
        fontWeight: '600',
        marginTop: 10,
        textAlign: 'center',
        lineHeight: 22,
    },

    // Editor Placeholder
    editorPlaceholder: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
    },
    placeholderTitle: {
        color: '#27272a',
        fontSize: 18,
        fontWeight: '800',
    },
    placeholderDesc: {
        color: '#94A3B8',
        fontSize: 13,
        textAlign: 'center',
        lineHeight: 20,
    },

    // ─── Progress Tracker Strip ───
    progressStrip: {
        width: 80,
        paddingVertical: 24,
        paddingHorizontal: 8,
        alignItems: 'center',
        borderLeftWidth: 1,
        borderColor: '#E2E8F0',
        backgroundColor: '#FDF8F3',
    },
    progressStripTitle: {
        color: '#94A3B8',
        fontSize: 9,
        fontWeight: '900',
        letterSpacing: 0.5,
        textTransform: 'uppercase',
        marginBottom: 20,
    },
    progressStep: {
        alignItems: 'center',
    },
    progressLine: {
        width: 2,
        height: 20,
        backgroundColor: '#E2E8F0',
    },
    progressLineBelow: {
        width: 2,
        height: 20,
        backgroundColor: '#E2E8F0',
    },
    progressLineCompleted: {
        backgroundColor: '#7C3AED',
    },
    progressCircle: {
        width: 32,
        height: 32,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#FFFFFF',
        borderWidth: 2,
        borderColor: '#E2E8F0',
    },
    progressCircleCompleted: {
        backgroundColor: 'rgba(124, 58, 237, 0.1)',
        borderColor: '#7C3AED',
    },
    progressCircleActive: {
        borderColor: '#7C3AED',
        backgroundColor: 'rgba(124, 58, 237, 0.05)',
    },
    progressCheckmark: {
        color: '#7C3AED',
        fontSize: 14,
        fontWeight: '900',
    },
    progressNumber: {
        color: '#94A3B8',
        fontSize: 12,
        fontWeight: '700',
    },
    // ─── Premium RFP Modal Styles ───
    premiumRfpModal: {
        backgroundColor: '#FFFFFF',
        width: '95%',
        maxWidth: 720,
        borderRadius: 32,
        padding: 32,
        shadowColor: '#1E1B4B',
        shadowOffset: { width: 0, height: 20 },
        shadowOpacity: 0.2,
        shadowRadius: 40,
        elevation: 20,
        borderWidth: 1,
        borderColor: 'rgba(124, 58, 237, 0.1)',
    },
    modalHeaderRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 32,
    },
    modalHeaderTitleBox: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
    },
    modalIconBox: {
        width: 48,
        height: 48,
        borderRadius: 16,
        backgroundColor: '#7C3AED',
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#7C3AED',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
    },
    modalMainTitle: {
        fontSize: 22,
        fontWeight: '900',
        color: '#1E1B4B',
        letterSpacing: -0.5,
    },
    modalSubTitle: {
        fontSize: 14,
        color: '#64748B',
        fontWeight: '600',
        marginTop: 4,
    },
    modalCloseBtn: {
        width: 36,
        height: 36,
        borderRadius: 12,
        backgroundColor: '#F8FAFC',
        alignItems: 'center',
        justifyContent: 'center',
    },
    modalBody: {
        marginBottom: 32,
    },
    premiumInputGroup: {
        marginBottom: 24,
    },
    premiumLabel: {
        fontSize: 14,
        fontWeight: '800',
        color: '#1E1B4B',
        marginBottom: 10,
        paddingLeft: 4,
    },
    premiumInput: {
        borderWidth: 1.5,
        borderColor: '#F1F5F9',
        borderRadius: 16,
        padding: 16,
        backgroundColor: '#F8FAFC',
        fontSize: 15,
        color: '#1E1B4B',
        fontWeight: '600',
    },
    premiumTextArea: {
        borderWidth: 1.5,
        borderColor: '#F1F5F9',
        borderRadius: 16,
        padding: 16,
        backgroundColor: '#F8FAFC',
        fontSize: 14,
        color: '#1E1B4B',
        minHeight: 220,
        lineHeight: 22,
        resize: 'none',
        outline: 'none',
    },
    analysisFeatureBanner: {
        backgroundColor: '#F0FDF4',
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: '#DCFCE7',
    },
    featureItemText: {
        fontSize: 12,
        fontWeight: '700',
        color: '#166534',
    },
    premiumActionBtn: {
        backgroundColor: '#0F172A',
        height: 64,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.2,
        shadowRadius: 20,
    },
    premiumActionBtnText: {
        color: '#FFFFFF',
        fontSize: 17,
        fontWeight: '900',
        letterSpacing: -0.3,
    },
    btnDisabled: {
        opacity: 0.6,
    },
    premiumDraftBanner: {
        padding: 20,
        backgroundColor: 'rgba(124, 58, 237, 0.04)',
        borderRadius: 20,
        borderWidth: 1,
        borderColor: 'rgba(124, 58, 237, 0.15)',
        marginBottom: 20,
        flexDirection: 'row',
        gap: 16,
    },
    draftBannerIconBox: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: '#FFFFFF',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: 'rgba(124, 58, 237, 0.1)',
    },
    draftBannerTitle: {
        color: '#1E1B4B',
        fontSize: 15,
        fontWeight: '900',
        marginBottom: 6,
        letterSpacing: -0.3,
    },
    draftBannerDesc: {
        color: '#64748B',
        fontSize: 12,
        lineHeight: 18,
        marginBottom: 16,
    },
    draftBannerBtn: {
        backgroundColor: '#7C3AED',
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderRadius: 10,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        alignSelf: 'flex-start',
    },
    draftBannerBtnText: {
        color: '#FFFFFF',
        fontWeight: '800',
        fontSize: 13,
    },
    premiumDraftBannerSmall: {
        padding: 16,
        backgroundColor: 'rgba(124, 58, 237, 0.04)',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: 'rgba(124, 58, 237, 0.1)',
        marginBottom: 20,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
    },
    draftBannerGeneratingText: {
        color: '#7C3AED',
        fontSize: 13,
        fontWeight: '700',
    },
    progressLabel: {
        color: '#94A3B8',
        fontSize: 9,
        fontWeight: '800',
        marginTop: 6,
        textAlign: 'center',
        width: 64,
        lineHeight: 12,
    },
    progressLabelCompleted: {
        color: '#7C3AED',
    },
    progressLabelActive: {
        color: '#1E1B4B',
    },
});
