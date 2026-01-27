import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Animated, LayoutAnimation, Platform, UIManager } from 'react-native';
import { Icons } from '../utils/icons';
import { LinearGradient } from 'expo-linear-gradient';

// Enable LayoutAnimation on Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface AdvancedSearchFilterProps {
    onSearch?: (criteria: any) => void;
}

export const AdvancedSearchFilter: React.FC<AdvancedSearchFilterProps> = ({ onSearch }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const [keyword, setKeyword] = useState('');
    const [activeTags, setActiveTags] = useState<{ type: 'AND' | 'OR' | 'NOT', text: string }[]>([]);

    // Filter States
    const [selectedYear, setSelectedYear] = useState<string | null>(null);
    const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
    const [selectedRegion, setSelectedRegion] = useState<string>('전국');

    const years = ['예비창업', '1-3년', '3-7년', '7년+'];
    const categories = ['금융/자금', '기술/R&D', '인력/교육', '수출/판로', '경영/컨설팅'];
    const regions = ['전국', '서울', '경기/인천', '대전/세종', '지방'];

    const toggleExpand = () => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setIsExpanded(!isExpanded);
    };

    const addTag = (type: 'AND' | 'OR' | 'NOT') => {
        if (!keyword.trim()) return;
        setActiveTags([...activeTags, { type, text: keyword.trim() }]);
        setKeyword('');
    };

    const removeTag = (index: number) => {
        const newTags = [...activeTags];
        newTags.splice(index, 1);
        setActiveTags(newTags);
    };

    const toggleSelection = (list: string[], setList: (l: string[]) => void, item: string) => {
        if (list.includes(item)) {
            setList(list.filter(i => i !== item));
        } else {
            setList([...list, item]);
        }
    };

    const getTagColor = (type: 'AND' | 'OR' | 'NOT') => {
        switch (type) {
            case 'AND': return { bg: 'bg-blue-500/20', border: 'border-blue-500/50', text: 'text-blue-400' };
            case 'OR': return { bg: 'bg-emerald-500/20', border: 'border-emerald-500/50', text: 'text-emerald-400' };
            case 'NOT': return { bg: 'bg-red-500/20', border: 'border-red-500/50', text: 'text-red-400' };
        }
    };

    return (
        <View className="mb-8">
            <View className="bg-slate-900/80 backdrop-blur-md rounded-2xl border border-slate-700/50 overflow-hidden shadow-lg shadow-black/20">
                {/* Header & Smart Input */}
                <View className="p-5">
                    <View className="flex-row items-center justify-between mb-4">
                        <View className="flex-row items-center">
                            <Icons.Search size={18} color="#10B981" />
                            <Text className="text-white text-base font-bold ml-2">상세 조건 검색</Text>
                        </View>
                        <TouchableOpacity onPress={toggleExpand} className="flex-row items-center">
                            <Text className="text-slate-400 text-xs mr-1">{isExpanded ? '접기' : '더보기'}</Text>
                            {isExpanded ? <Icons.ChevronUp size={16} color="#94A3B8" /> : <Icons.ChevronDown size={16} color="#94A3B8" />}
                        </TouchableOpacity>
                    </View>

                    {/* Tag Display Area */}
                    {activeTags.length > 0 && (
                        <View className="flex-row flex-wrap gap-2 mb-3">
                            {activeTags.map((tag, idx) => {
                                const style = getTagColor(tag.type);
                                return (
                                    <View key={idx} className={`flex-row items-center ${style.bg} px-2.5 py-1 rounded-md border ${style.border}`}>
                                        <Text className={`${style.text} text-xs font-bold mr-1`}>{tag.type}</Text>
                                        <Text className="text-slate-200 text-xs mr-2">{tag.text}</Text>
                                        <TouchableOpacity onPress={() => removeTag(idx)}>
                                            <Icons.X size={12} color="#94A3B8" />
                                        </TouchableOpacity>
                                    </View>
                                );
                            })}
                        </View>
                    )}

                    {/* Smart Input Field */}
                    <View className="flex-row items-center bg-slate-950/50 border border-slate-700 rounded-xl px-4 py-3">
                        <TextInput
                            className="flex-1 text-white text-sm"
                            placeholder="검색어 입력 (예: 청년, 반도체)"
                            placeholderTextColor="#64748B"
                            value={keyword}
                            onChangeText={setKeyword}
                            onSubmitEditing={() => addTag('AND')}
                        />
                        {keyword.length > 0 && (
                            <View className="flex-row items-center gap-2">
                                <TouchableOpacity onPress={() => addTag('AND')} className="bg-blue-500/20 px-2 py-1 rounded border border-blue-500/30">
                                    <Text className="text-blue-400 text-xs font-bold">+ AND</Text>
                                </TouchableOpacity>
                                <TouchableOpacity onPress={() => addTag('OR')} className="bg-emerald-500/20 px-2 py-1 rounded border border-emerald-500/30">
                                    <Text className="text-emerald-400 text-xs font-bold">| OR</Text>
                                </TouchableOpacity>
                                <TouchableOpacity onPress={() => addTag('NOT')} className="bg-red-500/20 px-2 py-1 rounded border border-red-500/30">
                                    <Text className="text-red-400 text-xs font-bold">- NOT</Text>
                                </TouchableOpacity>
                            </View>
                        )}
                    </View>
                </View>

                {/* Expanded Filters */}
                {isExpanded && (
                    <View className="px-5 pb-5 border-t border-slate-800/50 pt-4">
                        {/* 1. Established Year */}
                        <View className="mb-5">
                            <Text className="text-slate-400 text-xs font-semibold mb-3">업력 (선택 1)</Text>
                            <View className="flex-row flex-wrap gap-2">
                                {years.map((y) => (
                                    <TouchableOpacity
                                        key={y}
                                        onPress={() => setSelectedYear(selectedYear === y ? null : y)}
                                        className={`px-3 py-1.5 rounded-full border ${selectedYear === y ? 'bg-emerald-500/20 border-emerald-500' : 'bg-slate-800 border-slate-700'}`}
                                    >
                                        <Text className={`text-xs ${selectedYear === y ? 'text-emerald-400 font-bold' : 'text-slate-400'}`}>{y}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>

                        {/* 2. Category */}
                        <View className="mb-5">
                            <Text className="text-slate-400 text-xs font-semibold mb-3">지원 분야 (중복 가능)</Text>
                            <View className="flex-row flex-wrap gap-2">
                                {categories.map((c) => (
                                    <TouchableOpacity
                                        key={c}
                                        onPress={() => toggleSelection(selectedCategories, setSelectedCategories, c)}
                                        className={`px-3 py-1.5 rounded-full border ${selectedCategories.includes(c) ? 'bg-blue-500/20 border-blue-500' : 'bg-slate-800 border-slate-700'}`}
                                    >
                                        <Text className={`text-xs ${selectedCategories.includes(c) ? 'text-blue-400 font-bold' : 'text-slate-400'}`}>{c}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>

                        {/* 3. Region */}
                        <View>
                            <Text className="text-slate-400 text-xs font-semibold mb-3">지역</Text>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row">
                                {regions.map((r) => (
                                    <TouchableOpacity
                                        key={r}
                                        onPress={() => setSelectedRegion(r)}
                                        className={`mr-2 px-3 py-1.5 rounded-full border ${selectedRegion === r ? 'bg-purple-500/20 border-purple-500' : 'bg-slate-800 border-slate-700'}`}
                                    >
                                        <Text className={`text-xs ${selectedRegion === r ? 'text-purple-400 font-bold' : 'text-slate-400'}`}>{r}</Text>
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>
                        </View>

                        {/* Search Button */}
                        <TouchableOpacity className="mt-6 w-full bg-emerald-600 py-3 rounded-xl items-center shadow-lg shadow-emerald-900/50 active:bg-emerald-700">
                            <Text className="text-white font-bold text-sm">필터 적용하여 검색</Text>
                        </TouchableOpacity>
                    </View>
                )}
            </View>
        </View>
    );
};
