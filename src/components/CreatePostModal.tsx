import React, { useState } from 'react';
import { View, Text, Modal, TouchableOpacity, TextInput, ScrollView, Switch, KeyboardAvoidingView, Platform } from 'react-native';
import { X, Image as ImageIcon, CheckCircle2, ChevronDown } from 'lucide-react-native';
import { COMMUNITY_CATEGORIES, CommunityCategory } from '../data/mockData';

interface CreatePostModalProps {
    visible: boolean;
    onClose: () => void;
    onSubmit: (postData: { title: string; content: string; category: CommunityCategory; isAnonymous: boolean }) => void;
    initialData?: { title: string; content: string; category: CommunityCategory; isAnonymous: boolean };
}

export const CreatePostModal: React.FC<CreatePostModalProps> = ({ visible, onClose, onSubmit, initialData }) => {
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [category, setCategory] = useState<CommunityCategory>('연구·학술'); // Default to first real category
    const [isAnonymous, setIsAnonymous] = useState(false);
    const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);

    // Load initial data when visible or initialData changes
    React.useEffect(() => {
        if (visible) {
            if (initialData) {
                setTitle(initialData.title);
                setContent(initialData.content);
                setCategory(initialData.category);
                setIsAnonymous(initialData.isAnonymous);
            } else {
                // Reset for new post
                setTitle('');
                setContent('');
                setCategory('연구·학술');
                setIsAnonymous(false);
            }
        }
    }, [visible, initialData]);

    // Filter out 'All' for selection if desired, but user might want 'General'
    // Usually 'All' is not a category for posting, so let's default to a real one for selection if logic dictates.
    // For now, user selects from full list.

    const handleSubmit = () => {
        if (!title.trim() || !content.trim()) return;
        onSubmit({ title, content, category, isAnonymous });
        onSubmit({ title, content, category, isAnonymous });
        // Close modal (state reset happens in useEffect)
        onClose();
    };

    return (
        <Modal
            animationType="slide"
            transparent={true}
            visible={visible}
            onRequestClose={onClose}
        >
            <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                className="flex-1 justify-end sm:justify-center"
            >
                <TouchableOpacity
                    className="absolute inset-0 bg-black/80"
                    activeOpacity={1}
                    onPress={onClose}
                />

                <View className="bg-[#0F172A] w-full sm:w-[600px] sm:self-center sm:rounded-2xl rounded-t-3xl h-[85%] sm:h-[80%] border border-white/10 overflow-hidden shadow-2xl">
                    {/* Header */}
                    <View className="flex-row items-center justify-between px-5 py-4 border-b border-white/5 bg-[#0F172A]">
                        <TouchableOpacity onPress={onClose} className="p-1">
                            <X size={24} color="#94A3B8" />
                        </TouchableOpacity>
                        <Text className="text-white text-lg font-bold">{initialData ? '게시글 수정' : '새 글 작성'}</Text>
                        <TouchableOpacity
                            onPress={handleSubmit}
                            disabled={!title.trim() || !content.trim()}
                            className={!title.trim() || !content.trim() ? "opacity-50" : "opacity-100"}
                        >
                            <Text className="text-blue-500 font-bold text-base">{initialData ? '수정' : '등록'}</Text>
                        </TouchableOpacity>
                    </View>

                    <ScrollView className="flex-1 p-5">
                        {/* Category Selector */}
                        <View className="mb-5 z-20">
                            <Text className="text-slate-400 text-xs font-bold mb-2 ml-1">카테고리</Text>
                            <TouchableOpacity
                                onPress={() => setIsCategoryDropdownOpen(!isCategoryDropdownOpen)}
                                className="flex-row items-center justify-between bg-slate-800/50 border border-white/10 rounded-xl px-4 py-3"
                            >
                                <Text className="text-white font-medium">{category}</Text>
                                <ChevronDown size={16} color="#94A3B8" />
                            </TouchableOpacity>

                            {isCategoryDropdownOpen && (
                                <View className="absolute top-[70px] left-0 right-0 bg-[#1E293B] border border-white/10 rounded-xl z-50 shadow-xl max-h-[250px]">
                                    <ScrollView nestedScrollEnabled className="max-h-[250px]">
                                        {COMMUNITY_CATEGORIES.filter(c => c !== '전체').map((cat) => (
                                            <TouchableOpacity
                                                key={cat}
                                                className="px-5 py-3 border-b border-white/5 active:bg-slate-700"
                                                onPress={() => {
                                                    setCategory(cat);
                                                    setIsCategoryDropdownOpen(false);
                                                }}
                                            >
                                                <Text className={`font-medium ${category === cat ? 'text-blue-400' : 'text-slate-300'}`}>{cat}</Text>
                                            </TouchableOpacity>
                                        ))}
                                    </ScrollView>
                                </View>
                            )}
                        </View>

                        {/* Title Input */}
                        <View className="mb-4">
                            <TextInput
                                placeholder="제목을 입력하세요"
                                placeholderTextColor="#64748B"
                                className="text-white text-xl font-bold p-0 leading-7"
                                value={title}
                                onChangeText={setTitle}
                                maxLength={100}
                            />
                        </View>

                        {/* Content Input */}
                        <View className="flex-1 min-h-[200px]">
                            <TextInput
                                placeholder="나누고 싶은 이야기를 자유롭게 적어보세요.&#13;&#10;전문적인 인사이트 공유는 언제나 환영입니다!"
                                placeholderTextColor="#475569"
                                className="text-slate-300 text-base leading-6 p-0"
                                multiline
                                textAlignVertical="top"
                                value={content}
                                onChangeText={setContent}
                            />
                        </View>

                        {/* Image Attachment Mock */}
                        <ScrollView horizontal className="mt-4 mb-4" showsHorizontalScrollIndicator={false}>
                            <TouchableOpacity className="w-20 h-20 bg-slate-800/50 rounded-xl border border-dashed border-slate-600 items-center justify-center mr-3">
                                <ImageIcon size={24} color="#64748B" />
                                <Text className="text-slate-500 text-[10px] mt-1">사진 추가</Text>
                            </TouchableOpacity>
                        </ScrollView>
                    </ScrollView>

                    {/* Bottom Toolbar */}
                    <View className="p-4 border-t border-white/5 bg-[#0F172A] pb-8 sm:pb-4">
                        <View className="flex-row items-center justify-between">
                            <View className="flex-row items-center">
                                <Switch
                                    trackColor={{ false: "#334155", true: "#3B82F6" }}
                                    thumbColor={isAnonymous ? "#ffffff" : "#f4f3f4"}
                                    onValueChange={setIsAnonymous}
                                    value={isAnonymous}
                                    style={{ transform: [{ scaleX: 0.8 }, { scaleY: 0.8 }] }}
                                />
                                <Text className={`ml-2 text-sm font-medium ${isAnonymous ? 'text-white' : 'text-slate-400'}`}>
                                    익명으로 작성
                                </Text>
                            </View>
                            {!isAnonymous && (
                                <View className="flex-row items-center bg-blue-500/10 px-3 py-1.5 rounded-full">
                                    <CheckCircle2 size={12} color="#60A5FA" />
                                    <Text className="text-blue-400 text-xs ml-1.5 font-bold">실명 작성 시 네트워킹 효과 UP!</Text>
                                </View>
                            )}
                        </View>
                    </View>
                </View>
            </KeyboardAvoidingView>
        </Modal>
    );
};
