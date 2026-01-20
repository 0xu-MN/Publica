import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import {
    Send,
    Sparkles,
    FileText,
    Lightbulb,
    BookOpen,
    Target,
    Database,
    Save,
    X,
    ChevronLeft,
    Settings,
    Upload,
    Search,
    Plus,
    MessageSquare,
    Zap,
    Check,
    Copy
} from 'lucide-react-native';

interface WorkspaceProps {
    initialFile?: string;
    projectName?: string;
    fileName?: string;
    onClose?: () => void;
}

const QUICK_ACTIONS = [
    { id: 'hypothesis', name: '가설 생성', icon: Lightbulb, color: '#F59E0B' },
    { id: 'summarize', name: '요약', icon: FileText, color: '#3B82F6' },
    { id: 'literature', name: '문헌 검색', icon: BookOpen, color: '#10B981' },
    { id: 'methodology', name: '방법론', icon: Target, color: '#8B5CF6' },
    { id: 'data', name: '데이터 분석', icon: Database, color: '#EC4899' },
];

const SAMPLE_SOURCES = [
    { id: 1, name: 'GSDME Hearing Loss Study.pdf', type: 'pdf' },
    { id: 2, name: 'NLRP3-GSDMD Pyroptosis Review', type: 'search' },
];

const AI_CARDS = [
    {
        id: 1,
        type: 'summary',
        title: 'PDF 분석 완료: GSDME Hearing Loss Study',
        content: '이 논문은 GSDME가 카스피제-3에 의해 활성화되어 pyroptosis를 유도하며, 이것이 DFNA5 관련 난청의 주요 메커니즘임을 밝힙니다.',
        source: 'GSDME Hearing Loss Study.pdf'
    }
];

export const Workspace = ({ initialFile, projectName = '새 프로젝트', fileName = '새 문서.md', onClose }: WorkspaceProps) => {
    const [documentContent, setDocumentContent] = useState(initialFile || '# 연구 논문\n\n## 초록\n\n여기에 내용을 작성하세요...');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedSource, setSelectedSource] = useState<number | null>(null);
    const [documentViewerVisible, setDocumentViewerVisible] = useState(false);
    const [selectedText, setSelectedText] = useState('');

    const openDocumentViewer = (sourceId: number) => {
        setSelectedSource(sourceId);
        setDocumentViewerVisible(true);
    };

    return (
        <View className="flex-1 bg-[#050B14] items-center">
            <View className="flex-1 flex-row w-full max-w-[1400px]">

                {/* LEFT PANEL - Sources & Search (28%) */}
                <View className="w-[320px] bg-[#0A1628] border-r border-white/10 flex-col">

                    {/* Search & Upload Header */}
                    <View className="px-4 py-4 border-b border-white/5">
                        <Text className="text-white font-bold text-sm mb-3">리소스</Text>

                        {/* Search Bar */}
                        <View className="bg-slate-800/50 rounded-xl px-3 py-2 flex-row items-center border border-white/10 mb-3">
                            <Search size={16} color="#64748B" />
                            <TextInput
                                className="flex-1 text-white text-sm ml-2"
                                placeholder="논문 검색 (arXiv, PubMed...)"
                                placeholderTextColor="#64748B"
                                value={searchQuery}
                                onChangeText={setSearchQuery}
                            />
                        </View>

                        {/* Upload Area */}
                        <TouchableOpacity className="bg-slate-800/50 border-2 border-dashed border-slate-700 rounded-xl p-3 flex-row items-center justify-center gap-2">
                            <Upload size={16} color="#64748B" />
                            <Text className="text-slate-400 text-xs">PDF 업로드</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Source List */}
                    <ScrollView className="flex-1 p-3">
                        <Text className="text-slate-500 text-xs font-bold uppercase mb-2 px-1">추가된 소스 ({SAMPLE_SOURCES.length})</Text>
                        {SAMPLE_SOURCES.map((source) => (
                            <TouchableOpacity
                                key={source.id}
                                className="mb-2 p-3 rounded-xl bg-slate-800/30 border border-white/5 hover:bg-slate-800/50"
                                onPress={() => openDocumentViewer(source.id)}
                            >
                                <View className="flex-row items-center gap-2">
                                    <FileText size={14} color="#3B82F6" />
                                    <Text className="flex-1 text-slate-200 text-xs font-semibold" numberOfLines={2}>
                                        {source.name}
                                    </Text>
                                </View>
                                {source.type === 'search' && (
                                    <View className="mt-2 bg-blue-500/10 px-2 py-1 rounded self-start">
                                        <Text className="text-blue-400 text-[10px] font-semibold">검색 결과</Text>
                                    </View>
                                )}
                            </TouchableOpacity>
                        ))}
                    </ScrollView>

                    {/* Quick Actions */}
                    <View className="px-3 py-3 border-t border-white/5">
                        <Text className="text-slate-500 text-xs font-bold uppercase mb-2">빠른 작업</Text>
                        <View className="flex-row flex-wrap gap-2">
                            {QUICK_ACTIONS.map((action) => {
                                const Icon = action.icon;
                                return (
                                    <TouchableOpacity
                                        key={action.id}
                                        className="bg-slate-800/50 px-3 py-2 rounded-lg border border-white/10 flex-row items-center gap-1"
                                    >
                                        <Icon size={12} color={action.color} />
                                        <Text className="text-slate-300 text-[10px] font-semibold">{action.name}</Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                    </View>
                </View>

                {/* CENTER PANEL - AI Workspace (40%) */}
                <View className="flex-1 bg-[#0F172A] border-r border-white/10 flex-col">

                    {/* Header */}
                    <View className="px-6 py-4 border-b border-white/5 flex-row items-center justify-between">
                        <View>
                            <Text className="text-white font-bold text-lg">AI Workspace</Text>
                            <Text className="text-slate-400 text-xs mt-0.5">AI와 협업하며 연구를 진행하세요</Text>
                        </View>
                        <View className="bg-green-500/10 px-3 py-1.5 rounded-full">
                            <Text className="text-green-400 text-xs font-semibold">● 활성화</Text>
                        </View>
                    </View>

                    {/* AI Cards Stream */}
                    <ScrollView className="flex-1 p-6">
                        {AI_CARDS.map((card) => (
                            <View key={card.id} className="mb-4 bg-gradient-to-br from-slate-800/50 to-slate-900/50 rounded-2xl border border-white/10 p-5">
                                <View className="flex-row items-center justify-between mb-3">
                                    <View className="flex-row items-center gap-2">
                                        <Sparkles size={16} color="#3B82F6" />
                                        <Text className="text-white font-bold text-sm">{card.title}</Text>
                                    </View>
                                    <TouchableOpacity className="p-1">
                                        <X size={14} color="#64748B" />
                                    </TouchableOpacity>
                                </View>

                                <Text className="text-slate-300 text-sm leading-6 mb-3">
                                    {card.content}
                                </Text>

                                <View className="flex-row items-center justify-between pt-3 border-t border-white/5">
                                    <Text className="text-slate-500 text-xs">출처: {card.source}</Text>
                                    <View className="flex-row gap-2">
                                        <TouchableOpacity className="bg-blue-600 px-3 py-1.5 rounded-lg">
                                            <Text className="text-white text-xs font-semibold">문서에 추가</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity className="bg-white/5 px-3 py-1.5 rounded-lg border border-white/10">
                                            <Copy size={12} color="#94A3B8" />
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            </View>
                        ))}

                        {/* Chat Input */}
                        <View className="bg-slate-800/30 rounded-2xl border border-white/10 p-4">
                            <View className="flex-row items-center gap-3">
                                <MessageSquare size={18} color="#3B82F6" />
                                <TextInput
                                    className="flex-1 text-white text-sm"
                                    placeholder="AI에게 무엇이든 물어보세요..."
                                    placeholderTextColor="#64748B"
                                    multiline
                                />
                                <TouchableOpacity className="bg-blue-600 p-2 rounded-lg">
                                    <Send size={14} color="#fff" />
                                </TouchableOpacity>
                            </View>
                        </View>
                    </ScrollView>
                </View>

                {/* RIGHT PANEL - Document Editor (32%) */}
                <View className="flex-1 flex-col">

                    {/* File Header */}
                    <View className="px-6 py-4 bg-[#0F172A] border-b border-white/5 flex-row items-center justify-between">
                        <View className="flex-1">
                            <View className="flex-row items-center gap-2 mb-1">
                                {onClose && (
                                    <TouchableOpacity onPress={onClose} className="mr-2">
                                        <ChevronLeft size={18} color="#94A3B8" />
                                    </TouchableOpacity>
                                )}
                                <FileText size={16} color="#3B82F6" />
                                <Text className="text-white font-bold text-base">{fileName}</Text>
                            </View>
                            <Text className="text-slate-400 text-xs ml-7">{projectName}</Text>
                        </View>

                        <TouchableOpacity className="bg-blue-600 px-4 py-2 rounded-lg flex-row items-center gap-2">
                            <Save size={14} color="#fff" />
                            <Text className="text-white font-semibold text-sm">저장</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Editor */}
                    <ScrollView className="flex-1 bg-[#050B14]">
                        <View className="p-8">
                            <View className="bg-[#0F172A] rounded-2xl border border-white/5 p-8">
                                <TextInput
                                    className="text-slate-200 text-base leading-7"
                                    multiline
                                    value={documentContent}
                                    onChangeText={setDocumentContent}
                                    style={{ minHeight: 700 }}
                                    placeholder="AI 분석 결과를 여기로 가져오거나 직접 작성하세요..."
                                    placeholderTextColor="#475569"
                                />
                            </View>
                        </View>
                    </ScrollView>
                </View>

                {/* Document Viewer Modal (Supademo-style) */}
                {documentViewerVisible && (
                    <View className="absolute inset-0 bg-black/80 flex-row justify-center items-center p-8 z-50">
                        <View className="w-full max-w-6xl h-full bg-[#0F172A] rounded-3xl border border-white/10 overflow-hidden flex-row">

                            {/* PDF Viewer */}
                            <View className="flex-1 bg-white p-8">
                                <Text className="text-gray-800 text-base leading-7">
                                    [PDF 내용 미리보기]

                                    GSDME (Gasdermin E)는 카스피제-3에 의해 절단되어 pyroptosis를 유도합니다.
                                    이 메커니즘은 DFNA5 관련 난청에서 중요한 역할을 합니다...

                                    (텍스트를 선택하면 AI가 분석합니다)
                                </Text>
                            </View>

                            {/* AI Analysis Sidebar */}
                            <View className="w-80 bg-[#0A1628] border-l border-white/10 p-6">
                                <View className="flex-row items-center justify-between mb-4">
                                    <Text className="text-white font-bold text-lg">AI 분석</Text>
                                    <TouchableOpacity onPress={() => setDocumentViewerVisible(false)}>
                                        <X size={20} color="#fff" />
                                    </TouchableOpacity>
                                </View>

                                <Text className="text-slate-400 text-sm mb-4">
                                    텍스트를 선택하면 AI가 즉시 설명합니다
                                </Text>

                                {selectedText && (
                                    <View className="bg-slate-800/50 rounded-xl p-4 border border-white/10">
                                        <Text className="text-blue-400 text-xs font-semibold mb-2">선택한 텍스트</Text>
                                        <Text className="text-slate-300 text-sm mb-3">{selectedText}</Text>

                                        <View className="bg-slate-900/50 rounded-lg p-3 border border-white/5">
                                            <Text className="text-white text-sm leading-6">
                                                [AI 설명] 이 부분은 GSDME 단백질의 활성화 메커니즘을 설명합니다...
                                            </Text>
                                        </View>

                                        <View className="flex-row gap-2 mt-3">
                                            <TouchableOpacity className="flex-1 bg-blue-600 py-2 rounded-lg items-center">
                                                <Text className="text-white text-xs font-semibold">문서에 추가</Text>
                                            </TouchableOpacity>
                                            <TouchableOpacity className="flex-1 bg-white/5 py-2 rounded-lg items-center border border-white/10">
                                                <Text className="text-slate-300 text-xs font-semibold">더 자세히</Text>
                                            </TouchableOpacity>
                                        </View>
                                    </View>
                                )}
                            </View>
                        </View>
                    </View>
                )}
            </View>
        </View>
    );
};
