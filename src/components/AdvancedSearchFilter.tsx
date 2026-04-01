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
            case 'AND': return { bg: 'bg-[#7C3AED]/10', border: 'border-[#7C3AED]/20', text: 'text-[#7C3AED]' };
            case 'OR': return { bg: 'bg-emerald-50', border: 'border-emerald-100', text: 'text-emerald-600' };
            case 'NOT': return { bg: 'bg-red-50', border: 'border-red-100', text: 'text-red-500' };
        }
    };

    return (
        <View className="mb-8">
            <View className="bg-white rounded-3xl border border-[#E2E8F0] overflow-hidden shadow-xl shadow-black/5">
                {/* Header & Smart Input */}
                <View className="p-6">
                    <View className="flex-row items-center justify-between mb-5">
                        <View className="flex-row items-center">
                            <Icons.Search size={20} color="#7C3AED" strokeWidth={2.5} />
                            <Text className="text-[#27272a] text-lg font-bold ml-3">상세 조건 검색</Text>
                        </View>
                        <TouchableOpacity onPress={toggleExpand} className="flex-row items-center bg-[#F8FAFC] px-3 py-1.5 rounded-full border border-[#E2E8F0]">
                            <Text className="text-[#64748B] text-[11px] font-bold mr-1.5 uppercase tracking-wider">{isExpanded ? '접기' : '더보기'}</Text>
                            {isExpanded ? <Icons.ChevronUp size={14} color="#64748B" /> : <Icons.ChevronDown size={14} color="#64748B" />}
                        </TouchableOpacity>
                    </View>

                    {/* Tag Display Area */}
                    {activeTags.length > 0 && (
                        <View className="flex-row flex-wrap gap-2.5 mb-4">
                            {activeTags.map((tag, idx) => {
                                const style = getTagColor(tag.type);
                                return (
                                    <View key={idx} className={`flex-row items-center ${style.bg} px-3 py-1.5 rounded-xl border ${style.border} shadow-sm`}>
                                        <Text className={`${style.text} text-[10px] font-black mr-2 uppercase tracking-tight`}>{tag.type}</Text>
                                        <Text className="text-[#475569] text-xs font-bold mr-2">{tag.text}</Text>
                                        <TouchableOpacity onPress={() => removeTag(idx)} className="p-0.5 rounded-full hover:bg-black/5">
                                            <Icons.X size={12} color="#94A3B8" />
                                        </TouchableOpacity>
                                    </View>
                                );
                            })}
                        </View>
                    )}

                    {/* Smart Input Field */}
                    <View className="flex-row items-center bg-[#F8FAFC] border border-[#E2E8F0] rounded-2xl px-5 py-4 shadow-inner">
                        <TextInput
                            className="flex-1 text-[#27272a] text-[15px] font-medium"
                            placeholder="검색어를 입력하세요 (예: 청년, 반도체)"
                            placeholderTextColor="#94A3B8"
                            value={keyword}
                            onChangeText={setKeyword}
                            onSubmitEditing={() => addTag('AND')}
                        />
                        {keyword.length > 0 && (
                            <View className="flex-row items-center gap-2 ml-3">
                                <TouchableOpacity onPress={() => addTag('AND')} className="bg-[#7C3AED] px-3 py-1.5 rounded-lg shadow-sm active:opacity-90">
                                    <Text className="text-white text-[11px] font-bold">AND</Text>
                                </TouchableOpacity>
                                <TouchableOpacity onPress={() => addTag('OR')} className="bg-emerald-500 px-3 py-1.5 rounded-lg shadow-sm active:opacity-90">
                                    <Text className="text-white text-[11px] font-bold">OR</Text>
                                </TouchableOpacity>
                                <TouchableOpacity onPress={() => addTag('NOT')} className="bg-red-500 px-3 py-1.5 rounded-lg shadow-sm active:opacity-90">
                                    <Text className="text-white text-[11px] font-bold">NOT</Text>
                                </TouchableOpacity>
                            </View>
                        )}
                    </View>
                </View>

                {/* Expanded Filters */}
                {isExpanded && (
                    <View className="px-6 pb-6 border-t border-[#F1F5F9] pt-6 bg-[#FDF8F3]/30">
                        {/* 1. Established Year */}
                        <View className="mb-6">
                            <Text className="text-[#64748B] text-[13px] font-bold mb-4 ml-1 uppercase tracking-wider">업력 비즈니스 스테이지</Text>
                            <View className="flex-row flex-wrap gap-2.5">
                                {years.map((y) => (
                                    <TouchableOpacity
                                        key={y}
                                        onPress={() => setSelectedYear(selectedYear === y ? null : y)}
                                        className={`px-4 py-2 rounded-xl border transition-all ${selectedYear === y ? 'bg-[#7C3AED] border-[#7C3AED] shadow-md shadow-[#7C3AED]/20' : 'bg-white border-[#E2E8F0]'}`}
                                    >
                                        <Text className={`text-[13px] font-bold ${selectedYear === y ? 'text-white' : 'text-[#64748B]'}`}>{y}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>

                        {/* 2. Category */}
                        <View className="mb-6">
                            <Text className="text-[#64748B] text-[13px] font-bold mb-4 ml-1 uppercase tracking-wider">지원 분야 (중복 가능)</Text>
                            <View className="flex-row flex-wrap gap-2.5">
                                {categories.map((c) => (
                                    <TouchableOpacity
                                        key={c}
                                        onPress={() => toggleSelection(selectedCategories, setSelectedCategories, c)}
                                        className={`px-4 py-2 rounded-xl border transition-all ${selectedCategories.includes(c) ? 'bg-[#7C3AED]/10 border-[#7C3AED]/50 shadow-sm' : 'bg-white border-[#E2E8F0]'}`}
                                    >
                                        <Text className={`text-[13px] font-bold ${selectedCategories.includes(c) ? 'text-[#7C3AED]' : 'text-[#64748B]'}`}>{c}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>

                        {/* 3. Region */}
                        <View className="mb-4">
                            <Text className="text-[#64748B] text-[13px] font-bold mb-4 ml-1 uppercase tracking-wider">비즈니스 거점 지역</Text>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row">
                                {regions.map((r) => (
                                    <TouchableOpacity
                                        key={r}
                                        onPress={() => setSelectedRegion(r)}
                                        className={`mr-3 px-4 py-2 rounded-xl border transition-all ${selectedRegion === r ? 'bg-[#7C3AED] border-[#7C3AED] shadow-md shadow-[#7C3AED]/20' : 'bg-white border-[#E2E8F0]'}`}
                                    >
                                        <Text className={`text-[13px] font-bold ${selectedRegion === r ? 'text-white' : 'text-[#64748B]'}`}>{r}</Text>
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>
                        </View>

                        {/* Search Button */}
                        <TouchableOpacity className="mt-8 w-full bg-[#7C3AED] py-4 rounded-2xl items-center shadow-xl shadow-[#7C3AED]/30 active:opacity-90 active:scale-[0.99] transition-all">
                            <Text className="text-white font-black text-base tracking-widest">필터 적용하여 분석 시작</Text>
                        </TouchableOpacity>
                    </View>
                )}
            </View>
        </View>
    );
};
