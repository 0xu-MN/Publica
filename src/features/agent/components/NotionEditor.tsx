import React, { useState, useRef, useCallback, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Platform } from 'react-native';
import { Type, Heading1, Heading2, List, ListOrdered, Quote, Code, Minus, Bold, Italic, Underline, Strikethrough, Link, AlertCircle, ChevronDown, Highlighter, Sparkles } from 'lucide-react-native';

// ═══════════════════════════════════════════════════
// 🌟 NotionEditor v2 — Premium Block-based Editor
// ═══════════════════════════════════════════════════
// Enhanced features:
// - Expanded slash commands (code, callout, toggle, table)  
// - Rich toolbar (link, highlight, code inline)
// - Section-aware editing with block focus indicators  
// - Notion-like hover handles on blocks
// - Premium dark-mode typography
// ═══════════════════════════════════════════════════

interface NotionEditorProps {
    initialContent?: string;
    onChange?: (html: string, markdown: string) => void;
    placeholder?: string;
}

// ─── Slash Commands (expanded) ───
const SLASH_COMMANDS = [
    { id: 'h1', label: '제목 1', desc: '큰 섹션 제목', icon: '📌', tag: 'h1', category: '기본' },
    { id: 'h2', label: '제목 2', desc: '중간 제목', icon: '📎', tag: 'h2', category: '기본' },
    { id: 'h3', label: '제목 3', desc: '소제목', icon: '📍', tag: 'h3', category: '기본' },
    { id: 'p', label: '본문', desc: '일반 텍스트', icon: '📝', tag: 'p', category: '기본' },
    { id: 'ul', label: '글머리 기호 목록', desc: '순서 없는 목록', icon: '•', tag: 'ul', category: '목록' },
    { id: 'ol', label: '번호 목록', desc: '순서 있는 목록', icon: '1.', tag: 'ol', category: '목록' },
    { id: 'checklist', label: '체크리스트', desc: '할일 목록', icon: '☑️', tag: 'checklist', category: '목록' },
    { id: 'quote', label: '인용문', desc: '인용 블록', icon: '❝', tag: 'blockquote', category: '블록' },
    { id: 'callout', label: '콜아웃', desc: '강조 정보 박스', icon: '💡', tag: 'callout', category: '블록' },
    { id: 'code', label: '코드 블록', desc: '코드 영역', icon: '⟨⟩', tag: 'pre', category: '블록' },
    { id: 'divider', label: '구분선', desc: '수평선 삽입', icon: '—', tag: 'hr', category: '블록' },
    { id: 'table2', label: '2열 표', desc: '간단한 비교 표', icon: '▦', tag: 'table2', category: '고급' },
    { id: 'section', label: '섹션 구분', desc: '양식 섹션 구분', icon: '📂', tag: 'section', category: '고급' },
];

// ─── Application Template Sections ───
const TEMPLATE_SECTIONS = [
    { id: 'problem', label: '1. 문제인식(Problem)', desc: '해결하고자 하는 문제와 시장 기회를 서술' },
    { id: 'solution', label: '2. 실현가능성(Solution)', desc: '제품/서비스의 기술적 실현 가능성' },
    { id: 'scalability', label: '3. 성장전략(Scalability)', desc: '시장 진입 및 확장 계획' },
    { id: 'team', label: '4. 팀 구성(Team)', desc: '핵심 인력 및 역량' },
    { id: 'finance', label: '5. 사업비 계획(Finance)', desc: '자금 운용 및 재무 계획' },
];

export const NotionEditor: React.FC<NotionEditorProps> = ({
    initialContent = '',
    onChange,
    placeholder = '/ 를 입력하여 블록 타입을 선택하세요...',
}) => {
    const editorRef = useRef<HTMLDivElement | null>(null);
    const [showSlashMenu, setShowSlashMenu] = useState(false);
    const [slashFilter, setSlashFilter] = useState('');
    const [slashPosition, setSlashPosition] = useState({ top: 0, left: 0 });
    const [showToolbar, setShowToolbar] = useState(false);
    const [toolbarPosition, setToolbarPosition] = useState({ top: 0, left: 0 });
    const [showTemplateMenu, setShowTemplateMenu] = useState(false);
    const [isEmpty, setIsEmpty] = useState(true);
    const [wordCount, setWordCount] = useState(0);
    const [charCount, setCharCount] = useState(0);
    const [activeSlashIdx, setActiveSlashIdx] = useState(0);

    // Initialize with content
    useEffect(() => {
        if (editorRef.current && initialContent) {
            editorRef.current.innerHTML = initialContent;
            setIsEmpty(false);
            handleContentChange();
        }
    }, []);

    const handleContentChange = useCallback(() => {
        if (!editorRef.current) return;
        const html = editorRef.current.innerHTML;
        const text = editorRef.current.innerText || '';
        setIsEmpty(!text.trim());
        setCharCount(text.trim().length);
        setWordCount(text.trim().split(/\s+/).filter(Boolean).length);

        const md = htmlToMarkdown(html);
        onChange?.(html, md);
    }, [onChange]);

    // ─── HTML → Markdown converter ───
    const htmlToMarkdown = (html: string): string => {
        let md = html;
        md = md.replace(/<h1[^>]*>(.*?)<\/h1>/gi, '# $1\n');
        md = md.replace(/<h2[^>]*>(.*?)<\/h2>/gi, '## $1\n');
        md = md.replace(/<h3[^>]*>(.*?)<\/h3>/gi, '### $1\n');
        md = md.replace(/<blockquote[^>]*>(.*?)<\/blockquote>/gi, '> $1\n');
        md = md.replace(/<pre[^>]*>(.*?)<\/pre>/gi, '```\n$1\n```\n');
        md = md.replace(/<code[^>]*>(.*?)<\/code>/gi, '`$1`');
        md = md.replace(/<strong>(.*?)<\/strong>/gi, '**$1**');
        md = md.replace(/<b>(.*?)<\/b>/gi, '**$1**');
        md = md.replace(/<em>(.*?)<\/em>/gi, '*$1*');
        md = md.replace(/<i>(.*?)<\/i>/gi, '*$1*');
        md = md.replace(/<u>(.*?)<\/u>/gi, '$1');
        md = md.replace(/<li>(.*?)<\/li>/gi, '- $1\n');
        md = md.replace(/<hr[^>]*>/gi, '---\n');
        md = md.replace(/<[^>]*>/g, '');
        md = md.replace(/&nbsp;/g, ' ');
        md = md.replace(/&amp;/g, '&');
        md = md.replace(/&lt;/g, '<');
        md = md.replace(/&gt;/g, '>');
        return md.trim();
    };

    const execFormat = (command: string, value?: string) => {
        document.execCommand(command, false, value);
        editorRef.current?.focus();
        handleContentChange();
    };

    const insertBlock = (tag: string) => {
        if (!editorRef.current) return;
        setShowSlashMenu(false);
        setSlashFilter('');
        setActiveSlashIdx(0);

        // Remove the slash character
        const sel = window.getSelection();
        if (sel && sel.rangeCount > 0) {
            const range = sel.getRangeAt(0);
            const textNode = range.startContainer;
            if (textNode.nodeType === Node.TEXT_NODE) {
                const text = textNode.textContent || '';
                const slashIdx = text.lastIndexOf('/');
                if (slashIdx >= 0) {
                    textNode.textContent = text.substring(0, slashIdx);
                }
            }
        }

        if (tag === 'hr') {
            document.execCommand('insertHTML', false, '<hr class="ne-divider" />');
        } else if (tag === 'ul') {
            document.execCommand('insertUnorderedList');
        } else if (tag === 'ol') {
            document.execCommand('insertOrderedList');
        } else if (tag === 'blockquote') {
            document.execCommand('formatBlock', false, 'blockquote');
        } else if (tag === 'checklist') {
            document.execCommand('insertHTML', false,
                '<div class="ne-checklist"><label><input type="checkbox" style="margin-right:8px;accent-color:#818CF8;" /><span>할일 항목</span></label></div>'
            );
        } else if (tag === 'callout') {
            document.execCommand('insertHTML', false,
                '<div class="ne-callout">💡 <span>콜아웃: 중요한 정보를 강조하세요</span></div>'
            );
        } else if (tag === 'pre') {
            document.execCommand('insertHTML', false,
                '<pre class="ne-code"><code>// 코드를 여기에 작성하세요</code></pre>'
            );
        } else if (tag === 'table2') {
            document.execCommand('insertHTML', false,
                '<table class="ne-table"><thead><tr><th>항목</th><th>내용</th></tr></thead><tbody><tr><td>&nbsp;</td><td>&nbsp;</td></tr><tr><td>&nbsp;</td><td>&nbsp;</td></tr></tbody></table>'
            );
        } else if (tag === 'section') {
            document.execCommand('insertHTML', false,
                '<div class="ne-section"><h2>📂 섹션 제목</h2><p>섹션 내용을 작성하세요...</p></div>'
            );
        } else {
            document.execCommand('formatBlock', false, tag);
        }

        editorRef.current.focus();
        handleContentChange();
    };

    const insertTemplate = (template: typeof TEMPLATE_SECTIONS[0]) => {
        if (!editorRef.current) return;
        setShowTemplateMenu(false);

        const html = `
            <div class="ne-section">
                <h2>${template.label}</h2>
                <p class="ne-section-hint">${template.desc}</p>
                <p><br/></p>
            </div>
        `;
        editorRef.current.focus();
        document.execCommand('insertHTML', false, html);
        handleContentChange();
    };

    const insertLink = () => {
        const url = prompt('링크 URL을 입력하세요:');
        if (url) {
            execFormat('createLink', url);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (showSlashMenu) {
            const filtered = SLASH_COMMANDS.filter(c =>
                c.label.includes(slashFilter) || c.id.includes(slashFilter.toLowerCase()) || c.desc.includes(slashFilter)
            );

            if (e.key === 'ArrowDown') {
                e.preventDefault();
                setActiveSlashIdx(prev => Math.min(prev + 1, filtered.length - 1));
            }
            if (e.key === 'ArrowUp') {
                e.preventDefault();
                setActiveSlashIdx(prev => Math.max(prev - 1, 0));
            }
            if (e.key === 'Escape') {
                setShowSlashMenu(false);
                setSlashFilter('');
                setActiveSlashIdx(0);
            }
            if (e.key === 'Enter') {
                e.preventDefault();
                if (filtered.length > 0) {
                    insertBlock(filtered[activeSlashIdx]?.tag || filtered[0].tag);
                }
            }
        }

        // Tab for indentation
        if (e.key === 'Tab') {
            e.preventDefault();
            document.execCommand('insertHTML', false, '&nbsp;&nbsp;&nbsp;&nbsp;');
        }

        // Keyboard shortcuts
        if (e.metaKey || e.ctrlKey) {
            if (e.key === 'b') { e.preventDefault(); execFormat('bold'); }
            if (e.key === 'i') { e.preventDefault(); execFormat('italic'); }
            if (e.key === 'u') { e.preventDefault(); execFormat('underline'); }
            if (e.key === 'k') { e.preventDefault(); insertLink(); }
        }
    };

    const handleInput = () => {
        handleContentChange();

        if (!editorRef.current) return;
        const sel = window.getSelection();
        if (!sel || sel.rangeCount === 0) return;

        const range = sel.getRangeAt(0);
        const textNode = range.startContainer;
        const text = textNode.textContent || '';
        const cursorPos = range.startOffset;

        // Detect slash command
        const beforeCursor = text.substring(0, cursorPos);
        const slashIdx = beforeCursor.lastIndexOf('/');

        if (slashIdx >= 0 && (slashIdx === 0 || beforeCursor[slashIdx - 1] === ' ' || beforeCursor[slashIdx - 1] === '\n')) {
            const filter = beforeCursor.substring(slashIdx + 1);
            setSlashFilter(filter);
            setActiveSlashIdx(0);

            const rect = range.getBoundingClientRect();
            const editorRect = editorRef.current.getBoundingClientRect();
            setSlashPosition({
                top: rect.bottom - editorRect.top + 4,
                left: rect.left - editorRect.left,
            });
            setShowSlashMenu(true);
        } else {
            setShowSlashMenu(false);
            setSlashFilter('');
        }
    };

    // Floating toolbar on text selection
    const handleMouseUp = () => {
        const sel = window.getSelection();
        if (sel && !sel.isCollapsed && sel.toString().trim()) {
            const range = sel.getRangeAt(0);
            const rect = range.getBoundingClientRect();
            const editorRect = editorRef.current?.getBoundingClientRect();
            if (editorRect) {
                setToolbarPosition({
                    top: rect.top - editorRect.top - 48,
                    left: rect.left - editorRect.left + (rect.width / 2) - 140,
                });
                setShowToolbar(true);
            }
        } else {
            setShowToolbar(false);
        }
    };

    if (Platform.OS !== 'web') {
        return (
            <View style={styles.container}>
                <Text style={{ color: '#94A3B8', padding: 16 }}>에디터는 웹에서만 사용 가능합니다.</Text>
            </View>
        );
    }

    const filteredCommands = SLASH_COMMANDS.filter(c =>
        c.label.includes(slashFilter) || c.id.includes(slashFilter.toLowerCase()) || c.desc.includes(slashFilter)
    );

    // Group by category
    const commandCategories = filteredCommands.reduce((acc, cmd) => {
        if (!acc[cmd.category]) acc[cmd.category] = [];
        acc[cmd.category].push(cmd);
        return acc;
    }, {} as Record<string, typeof SLASH_COMMANDS>);

    return (
        <View style={styles.container}>
            {/* ─── Top Toolbar ─── */}
            <View style={styles.topToolbar}>
                <View style={styles.topToolbarLeft}>
                    {[
                        { cmd: 'bold', icon: <Bold size={15} color="#94A3B8" />, tip: '굵게 (⌘B)' },
                        { cmd: 'italic', icon: <Italic size={15} color="#94A3B8" />, tip: '기울임 (⌘I)' },
                        { cmd: 'underline', icon: <Underline size={15} color="#94A3B8" />, tip: '밑줄 (⌘U)' },
                        { cmd: 'strikeThrough', icon: <Strikethrough size={15} color="#94A3B8" />, tip: '취소선' },
                    ].map(item => (
                        <button
                            key={item.cmd}
                            onClick={() => execFormat(item.cmd)}
                            style={{
                                width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center',
                                backgroundColor: 'transparent', border: 'none', cursor: 'pointer', borderRadius: 6,
                            }}
                            title={item.tip}
                            className="ne-toolbar-btn"
                        >
                            {item.icon}
                        </button>
                    ))}

                    <div style={{ width: 1, height: 20, backgroundColor: '#1E293B', margin: '0 4px' }} />

                    <button onClick={() => execFormat('formatBlock', 'h1')} className="ne-toolbar-btn"
                        style={{ height: 32, padding: '0 8px', display: 'flex', alignItems: 'center', backgroundColor: 'transparent', border: 'none', cursor: 'pointer', borderRadius: 6, color: '#64748B', fontSize: 12, fontWeight: 700 }}
                        title="제목 1"
                    >H1</button>
                    <button onClick={() => execFormat('formatBlock', 'h2')} className="ne-toolbar-btn"
                        style={{ height: 32, padding: '0 8px', display: 'flex', alignItems: 'center', backgroundColor: 'transparent', border: 'none', cursor: 'pointer', borderRadius: 6, color: '#64748B', fontSize: 12, fontWeight: 700 }}
                        title="제목 2"
                    >H2</button>
                    <button onClick={() => execFormat('formatBlock', 'h3')} className="ne-toolbar-btn"
                        style={{ height: 32, padding: '0 8px', display: 'flex', alignItems: 'center', backgroundColor: 'transparent', border: 'none', cursor: 'pointer', borderRadius: 6, color: '#64748B', fontSize: 12, fontWeight: 700 }}
                        title="제목 3"
                    >H3</button>

                    <div style={{ width: 1, height: 20, backgroundColor: '#1E293B', margin: '0 4px' }} />

                    <button onClick={insertLink} className="ne-toolbar-btn"
                        style={{ width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'transparent', border: 'none', cursor: 'pointer', borderRadius: 6 }}
                        title="링크 삽입 (⌘K)"
                    ><Link size={15} color="#94A3B8" /></button>
                    <button onClick={() => document.execCommand('insertHTML', false, '<code class="ne-inline-code">code</code>')} className="ne-toolbar-btn"
                        style={{ width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'transparent', border: 'none', cursor: 'pointer', borderRadius: 6 }}
                        title="인라인 코드"
                    ><Code size={15} color="#94A3B8" /></button>
                </View>

                <View style={styles.topToolbarRight}>
                    <TouchableOpacity
                        style={styles.templateBtn}
                        onPress={() => setShowTemplateMenu(!showTemplateMenu)}
                    >
                        <Sparkles size={14} color="#818CF8" />
                        <Text style={styles.templateBtnText}>양식 삽입</Text>
                        <ChevronDown size={12} color="#818CF8" />
                    </TouchableOpacity>
                </View>
            </View>

            {/* ─── Template Dropdown ─── */}
            {showTemplateMenu && (
                <div style={{
                    position: 'absolute', top: 44, right: 12, zIndex: 200,
                    width: 320, backgroundColor: '#0F172A', borderRadius: 12,
                    border: '1px solid #1E293B', boxShadow: '0 8px 30px rgba(0,0,0,0.6)',
                    padding: 8,
                }}>
                    <div style={{ padding: '6px 10px', fontSize: 10, color: '#818CF8', fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: 1 }}>
                        사업계획서 양식
                    </div>
                    {TEMPLATE_SECTIONS.map(tmpl => (
                        <button
                            key={tmpl.id}
                            onMouseDown={(e) => { e.preventDefault(); insertTemplate(tmpl); }}
                            className="ne-template-item"
                            style={{
                                display: 'flex', flexDirection: 'column' as const,
                                width: '100%', padding: '10px 12px', backgroundColor: 'transparent',
                                border: 'none', borderRadius: 8, cursor: 'pointer', textAlign: 'left' as const, gap: 2,
                            }}
                        >
                            <span style={{ color: '#E2E8F0', fontSize: 13, fontWeight: 700 }}>{tmpl.label}</span>
                            <span style={{ color: '#64748B', fontSize: 11 }}>{tmpl.desc}</span>
                        </button>
                    ))}
                    <div style={{ borderTop: '1px solid #1E293B', marginTop: 4, paddingTop: 8 }}>
                        <button
                            onMouseDown={(e) => {
                                e.preventDefault();
                                setShowTemplateMenu(false);
                                TEMPLATE_SECTIONS.forEach(t => insertTemplate(t));
                            }}
                            className="ne-template-item"
                            style={{
                                width: '100%', padding: '10px 12px', backgroundColor: 'rgba(129,140,248,0.08)',
                                border: '1px solid rgba(129,140,248,0.15)', borderRadius: 8, cursor: 'pointer', textAlign: 'center' as const,
                                color: '#818CF8', fontSize: 13, fontWeight: 700,
                            }}
                        >
                            📋 전체 양식 한번에 삽입
                        </button>
                    </div>
                </div>
            )}

            {/* ─── Floating Inline Toolbar (on text selection) ─── */}
            {showToolbar && (
                <div style={{
                    position: 'absolute',
                    top: toolbarPosition.top + 44,
                    left: Math.max(0, toolbarPosition.left),
                    zIndex: 100,
                    display: 'flex', flexDirection: 'row' as const, gap: 2,
                    backgroundColor: '#1E293B', borderRadius: 10,
                    padding: '4px 6px',
                    boxShadow: '0 4px 24px rgba(0,0,0,0.6)',
                    border: '1px solid #334155',
                }}>
                    {[
                        { cmd: 'bold', icon: <Bold size={14} color="#E2E8F0" /> },
                        { cmd: 'italic', icon: <Italic size={14} color="#E2E8F0" /> },
                        { cmd: 'underline', icon: <Underline size={14} color="#E2E8F0" /> },
                        { cmd: 'strikeThrough', icon: <Strikethrough size={14} color="#E2E8F0" /> },
                    ].map(item => (
                        <button
                            key={item.cmd}
                            onMouseDown={(e) => { e.preventDefault(); execFormat(item.cmd); }}
                            style={{
                                width: 32, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center',
                                backgroundColor: 'transparent', border: 'none', cursor: 'pointer', borderRadius: 4,
                            }}
                        >
                            {item.icon}
                        </button>
                    ))}
                    <div style={{ width: 1, height: 20, backgroundColor: '#334155', margin: '0 4px', alignSelf: 'center' as const }} />
                    <button onMouseDown={(e) => { e.preventDefault(); insertLink(); }}
                        style={{ width: 32, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'transparent', border: 'none', cursor: 'pointer', borderRadius: 4 }}>
                        <Link size={14} color="#E2E8F0" />
                    </button>
                    <button onMouseDown={(e) => { e.preventDefault(); document.execCommand('insertHTML', false, '<code class="ne-inline-code">' + (window.getSelection()?.toString() || 'code') + '</code>'); }}
                        style={{ width: 32, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'transparent', border: 'none', cursor: 'pointer', borderRadius: 4 }}>
                        <Code size={14} color="#E2E8F0" />
                    </button>
                </div>
            )}

            {/* ─── Slash Command Menu ─── */}
            {showSlashMenu && (
                <div style={{
                    position: 'absolute',
                    top: slashPosition.top + 44,
                    left: slashPosition.left,
                    zIndex: 100, width: 280, maxHeight: 340,
                    overflowY: 'auto' as const,
                    backgroundColor: '#0F172A', borderRadius: 12,
                    border: '1px solid #1E293B',
                    boxShadow: '0 8px 30px rgba(0,0,0,0.6)',
                    padding: 6,
                }}>
                    {Object.entries(commandCategories).map(([category, cmds]) => (
                        <div key={category}>
                            <div style={{ padding: '8px 10px 4px', fontSize: 10, color: '#64748B', fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: 0.5 }}>
                                {category}
                            </div>
                            {cmds.map((cmd, idx) => {
                                const globalIdx = filteredCommands.indexOf(cmd);
                                return (
                                    <button
                                        key={cmd.id}
                                        onMouseDown={(e) => { e.preventDefault(); insertBlock(cmd.tag); }}
                                        style={{
                                            display: 'flex', flexDirection: 'row' as const, alignItems: 'center', gap: 10,
                                            width: '100%', padding: '8px 10px',
                                            backgroundColor: globalIdx === activeSlashIdx ? '#1E293B' : 'transparent',
                                            border: 'none', borderRadius: 8, cursor: 'pointer', textAlign: 'left' as const,
                                        }}
                                        onMouseOver={(e) => { (e.currentTarget.style.backgroundColor = '#1E293B'); setActiveSlashIdx(globalIdx); }}
                                        onMouseOut={(e) => { if (globalIdx !== activeSlashIdx) e.currentTarget.style.backgroundColor = 'transparent'; }}
                                    >
                                        <span style={{
                                            width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            backgroundColor: '#111827', borderRadius: 8, fontSize: 16,
                                            border: '1px solid #1E293B',
                                        }}>
                                            {cmd.icon}
                                        </span>
                                        <div>
                                            <div style={{ color: '#E2E8F0', fontSize: 13, fontWeight: 600 }}>{cmd.label}</div>
                                            <div style={{ color: '#64748B', fontSize: 11 }}>{cmd.desc}</div>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    ))}
                    {filteredCommands.length === 0 && (
                        <div style={{ padding: '12px 10px', color: '#475569', fontSize: 12, textAlign: 'center' as const }}>
                            일치하는 블록이 없습니다
                        </div>
                    )}
                </div>
            )}

            {/* ─── Editor Area ─── */}
            <ScrollView style={styles.scrollArea} contentContainerStyle={{ flexGrow: 1 }}>
                <div
                    ref={editorRef}
                    contentEditable
                    suppressContentEditableWarning
                    onInput={handleInput}
                    onKeyDown={handleKeyDown as any}
                    onMouseUp={handleMouseUp}
                    onBlur={() => setTimeout(() => setShowToolbar(false), 200)}
                    data-placeholder={placeholder}
                    style={{
                        minHeight: 500,
                        outline: 'none',
                        color: '#E2E8F0',
                        fontSize: 15,
                        lineHeight: '28px',
                        fontFamily: "'Pretendard', 'Apple SD Gothic Neo', -apple-system, BlinkMacSystemFont, sans-serif",
                        padding: '0 40px',
                        maxWidth: '100%', // 🌟 FIX: widened editor width
                        margin: '0 auto',
                        caretColor: '#818CF8',
                        position: 'relative' as const,
                    }}
                    className="notion-editor"
                />
                {isEmpty && (
                    <div style={{
                        position: 'absolute' as const,
                        top: 0, left: 40,
                        color: '#334155',
                        fontSize: 15,
                        lineHeight: '28px',
                        pointerEvents: 'none' as const,
                        fontFamily: "'Pretendard', 'Apple SD Gothic Neo', sans-serif",
                        maxWidth: '100%',
                    }}>
                        {placeholder}
                    </div>
                )}
            </ScrollView>

            {/* ─── Footer ─── */}
            <View style={styles.footer}>
                <View style={styles.footerLeft}>
                    <Text style={styles.footerText}>{charCount}자</Text>
                    <Text style={styles.footerDivider}>·</Text>
                    <Text style={styles.footerText}>{wordCount}단어</Text>
                </View>
                <Text style={styles.footerHint}>/ 블록 추가 · ⌘B 굵게 · ⌘I 기울임 · ⌘K 링크</Text>
            </View>

            {/* ─── Enhanced Editor Styles ─── */}
            <style dangerouslySetInnerHTML={{
                __html: `
                @import url('https://fonts.googleapis.com/css2?family=Pretendard:wght@400;500;600;700;800&display=swap');

                .notion-editor {
                    font-family: 'Pretendard', 'Apple SD Gothic Neo', -apple-system, BlinkMacSystemFont, sans-serif;
                }

                /* ─── Headings ─── */
                .notion-editor h1 {
                    font-size: 32px; font-weight: 800; color: #F1F5F9;
                    margin: 28px 0 12px; line-height: 1.25; letter-spacing: -0.5px;
                    padding-bottom: 8px; border-bottom: 1px solid #1E293B;
                }
                .notion-editor h2 {
                    font-size: 24px; font-weight: 700; color: #E2E8F0;
                    margin: 22px 0 8px; line-height: 1.3; letter-spacing: -0.3px;
                }
                .notion-editor h3 {
                    font-size: 18px; font-weight: 700; color: #CBD5E1;
                    margin: 16px 0 6px; line-height: 1.3;
                }

                /* ─── Body ─── */
                .notion-editor p { margin: 6px 0; line-height: 1.8; }

                /* ─── Blockquote ─── */
                .notion-editor blockquote {
                    border-left: 3px solid #818CF8;
                    padding: 8px 16px; margin: 12px 0;
                    background: rgba(129, 140, 248, 0.04);
                    border-radius: 0 8px 8px 0;
                    color: #94A3B8; font-style: italic;
                }

                /* ─── Lists ─── */
                .notion-editor ul, .notion-editor ol { padding-left: 24px; margin: 6px 0; }
                .notion-editor li { margin: 4px 0; line-height: 1.7; }
                .notion-editor li::marker { color: #818CF8; }

                /* ─── Divider ─── */
                .notion-editor hr, .notion-editor .ne-divider {
                    border: 0; border-top: 1px solid #1E293B;
                    margin: 24px 0;
                }

                /* ─── Bold/Strong ─── */
                .notion-editor b, .notion-editor strong { color: #F8FAFC; font-weight: 700; }

                /* ─── Links ─── */
                .notion-editor a {
                    color: #818CF8; text-decoration: underline;
                    text-decoration-color: rgba(129,140,248,0.4);
                    text-underline-offset: 3px;
                    transition: color 0.15s;
                }
                .notion-editor a:hover { color: #A5B4FC; }

                /* ─── Inline Code ─── */
                .ne-inline-code, .notion-editor code:not(pre code) {
                    background: rgba(129,140,248,0.1);
                    color: #A5B4FC; padding: 2px 6px;
                    border-radius: 4px; font-size: 0.9em;
                    font-family: 'SF Mono', 'Fira Code', monospace;
                    border: 1px solid rgba(129,140,248,0.15);
                }

                /* ─── Code Block ─── */
                .ne-code, .notion-editor pre {
                    background: #0B1120; border: 1px solid #1E293B;
                    border-radius: 10px; padding: 16px 20px;
                    margin: 12px 0; overflow-x: auto;
                    font-family: 'SF Mono', 'Fira Code', monospace;
                    font-size: 13px; line-height: 1.6; color: #94A3B8;
                }
                .ne-code code, .notion-editor pre code {
                    background: none; border: none; padding: 0;
                    color: inherit; font-size: inherit;
                }

                /* ─── Callout ─── */
                .ne-callout {
                    background: rgba(245,158,11,0.06);
                    border: 1px solid rgba(245,158,11,0.15);
                    border-radius: 10px; padding: 14px 18px;
                    margin: 12px 0; font-size: 14px;
                    color: #E2E8F0; display: flex; align-items: flex-start; gap: 8px;
                }

                /* ─── Checklist ─── */
                .ne-checklist {
                    display: flex; align-items: center;
                    padding: 4px 0; margin: 2px 0;
                }
                .ne-checklist label { display: flex; align-items: center; color: #E2E8F0; cursor: pointer; }

                /* ─── Table ─── */
                .ne-table {
                    width: 100%; border-collapse: collapse;
                    margin: 12px 0; border-radius: 8px; overflow: hidden;
                    border: 1px solid #1E293B;
                }
                .ne-table th {
                    background: #111827; color: #94A3B8; font-weight: 700;
                    padding: 10px 14px; text-align: left;
                    border-bottom: 1px solid #1E293B; font-size: 12px;
                    text-transform: uppercase; letter-spacing: 0.5px;
                }
                .ne-table td {
                    padding: 10px 14px; border-bottom: 1px solid #0F172A;
                    color: #E2E8F0; font-size: 14px;
                }
                .ne-table tr:hover td { background: rgba(129,140,248,0.04); }

                /* ─── Section ─── */
                .ne-section {
                    border: 1px solid #1E293B; border-radius: 12px;
                    padding: 20px 24px; margin: 16px 0;
                    background: rgba(15,23,42,0.6);
                }
                .ne-section h2 { margin-top: 0 !important; border-bottom: none !important; }
                .ne-section-hint {
                    color: #475569 !important; font-size: 13px !important;
                    font-style: italic; margin-bottom: 8px !important;
                }

                /* ─── Selection ─── */
                .notion-editor::selection { background: rgba(129, 140, 248, 0.3); }
                .notion-editor *::selection { background: rgba(129, 140, 248, 0.3); }

                /* ─── Block hover effect ─── */
                .notion-editor > * {
                    transition: background-color 0.15s;
                    border-radius: 4px;
                    padding-left: 4px; padding-right: 4px;
                    margin-left: -4px; margin-right: -4px;
                }
                .notion-editor > *:hover {
                    background: rgba(129,140,248,0.03);
                }

                /* ─── Toolbar button hover ─── */
                .ne-toolbar-btn:hover { background: #1E293B !important; }
                .ne-template-item:hover { background: #1E293B !important; }

                /* ─── Placeholder styling ─── */
                .notion-editor:empty::before {
                    content: attr(data-placeholder);
                    color: #334155; pointer-events: none;
                }

                /* ─── Scrollbar ─── */
                .notion-editor::-webkit-scrollbar { width: 4px; }
                .notion-editor::-webkit-scrollbar-track { background: transparent; }
                .notion-editor::-webkit-scrollbar-thumb { background: #1E293B; border-radius: 4px; }
            ` }} />
        </View>
    );
};

// Helper to get the editor content as markdown (exposed for parent)
export const getEditorMarkdown = (editorEl: HTMLDivElement | null): string => {
    if (!editorEl) return '';
    const html = editorEl.innerHTML;
    let md = html;
    md = md.replace(/<h1[^>]*>(.*?)<\/h1>/gi, '# $1\n');
    md = md.replace(/<h2[^>]*>(.*?)<\/h2>/gi, '## $1\n');
    md = md.replace(/<h3[^>]*>(.*?)<\/h3>/gi, '### $1\n');
    md = md.replace(/<blockquote[^>]*>(.*?)<\/blockquote>/gi, '> $1\n');
    md = md.replace(/<pre[^>]*>(.*?)<\/pre>/gi, '```\n$1\n```\n');
    md = md.replace(/<code[^>]*>(.*?)<\/code>/gi, '`$1`');
    md = md.replace(/<strong>(.*?)<\/strong>/gi, '**$1**');
    md = md.replace(/<b>(.*?)<\/b>/gi, '**$1**');
    md = md.replace(/<em>(.*?)<\/em>/gi, '*$1*');
    md = md.replace(/<i>(.*?)<\/i>/gi, '*$1*');
    md = md.replace(/<li>(.*?)<\/li>/gi, '- $1\n');
    md = md.replace(/<hr[^>]*>/gi, '---\n');
    md = md.replace(/<[^>]*>/g, '');
    md = md.replace(/&nbsp;/g, ' ');
    return md.trim();
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        position: 'relative',
        backgroundColor: '#020617',
    },
    topToolbar: {
        height: 44,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 12,
        borderBottomWidth: 1,
        borderColor: '#1E293B',
        backgroundColor: '#0F172A',
    },
    topToolbarLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 2,
    },
    topToolbarRight: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    templateBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
        backgroundColor: 'rgba(129,140,248,0.08)',
        borderWidth: 1,
        borderColor: 'rgba(129,140,248,0.15)',
    },
    templateBtnText: {
        color: '#818CF8',
        fontSize: 12,
        fontWeight: '700',
    },
    scrollArea: {
        flex: 1,
        padding: 24,
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderTopWidth: 1,
        borderColor: '#1E293B',
        backgroundColor: '#0F172A',
    },
    footerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    footerText: { color: '#475569', fontSize: 11, fontWeight: '600' },
    footerDivider: { color: '#334155', fontSize: 11 },
    footerHint: { color: '#334155', fontSize: 10 },
});
