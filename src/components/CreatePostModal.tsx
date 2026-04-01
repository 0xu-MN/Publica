import React, { useState } from 'react';
import { View, Text, Modal, TouchableOpacity, TextInput, ScrollView, Switch, KeyboardAvoidingView, Platform, Image, Alert } from 'react-native';
import { X, Image as ImageIcon, CheckCircle2, ChevronDown } from 'lucide-react-native';
import { COMMUNITY_CATEGORIES, CommunityCategory } from '../data/mockData';
// import * as ImagePicker from 'expo-image-picker'; // Removed to fix crash

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
    const [images, setImages] = useState<string[]>([]);

    const pickImage = async () => {
        Alert.alert('알림', '이미지 선택을 위해 expo-image-picker 패키지 설치가 필요합니다.\n지금은 더미 기능으로 동작합니다.');
        // Mock image for demo if needed, or just nothing.
        // setImages([...images, 'https://via.placeholder.com/150']);
    };

    // Load initial data when visible or initialData changes
    React.useEffect(() => {
        if (visible) {
            if (initialData) {
                setTitle(initialData.title);
                setContent(initialData.content);
                setCategory(initialData.category);
                setIsAnonymous(initialData.isAnonymous);
                setImages([]); // Reset images on edit for now (or load if supported)
            } else {
                // Reset for new post
                setTitle('');
                setContent('');
                setCategory('연구·학술');
                setIsAnonymous(false);
                setImages([]);
            }
        }
    }, [visible, initialData]);

    const handleSubmit = () => {
        if (!title.trim() || !content.trim()) return;
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
                    className="absolute inset-0 bg-black/40"
                    activeOpacity={1}
                    onPress={onClose}
                />

                <View className="bg-white w-full sm:w-[650px] sm:self-center sm:rounded-[32px] rounded-t-[32px] h-[90%] sm:h-[85%] border border-[#E2E8F0] overflow-hidden shadow-2xl">
                    {/* Header */}
                    <View className="flex-row items-center justify-between px-6 py-5 border-b border-[#F1F5F9] bg-white">
                        <TouchableOpacity onPress={onClose} className="p-2 -ml-2 rounded-full hover:bg-slate-50">
                            <X size={24} color="#64748B" />
                        </TouchableOpacity>
                        <Text className="text-[#27272a] text-xl font-bold">{initialData ? '게시글 수정' : '새로운 이야기 작성'}</Text>
                        <TouchableOpacity
                            onPress={handleSubmit}
                            disabled={!title.trim() || !content.trim()}
                            className={`px-4 py-2 rounded-xl transition-all ${!title.trim() || !content.trim() ? "opacity-30" : "bg-[#7C3AED] active:opacity-90"}`}
                        >
                            <Text className={`font-bold text-base ${!title.trim() || !content.trim() ? "text-[#64748B]" : "text-white"}`}>{initialData ? '수정' : '등록'}</Text>
                        </TouchableOpacity>
                    </View>

                    <ScrollView className="flex-1 px-8 py-6">
                        {/* Category Selector */}
                        <View className="mb-8 z-20">
                            <Text className="text-[#64748B] text-[13px] font-bold mb-3 ml-1 uppercase tracking-wider">카테고리</Text>
                            <TouchableOpacity
                                onPress={() => setIsCategoryDropdownOpen(!isCategoryDropdownOpen)}
                                className="flex-row items-center justify-between bg-[#F8FAFC] border border-[#E2E8F0] rounded-2xl px-5 py-4 transition-all active:border-[#7C3AED]/30"
                            >
                                <Text className="text-[#27272a] font-bold text-[15px]">{category}</Text>
                                <ChevronDown size={18} color={isCategoryDropdownOpen ? "#7C3AED" : "#94A3B8"} />
                            </TouchableOpacity>

                            {isCategoryDropdownOpen && (
                                <View className="absolute top-[85px] left-0 right-0 bg-white border border-[#E2E8F0] rounded-2xl z-50 shadow-2xl overflow-hidden max-h-[300px]">
                                    <ScrollView nestedScrollEnabled className="max-h-[300px]">
                                        {COMMUNITY_CATEGORIES.map((cat) => (
                                            <TouchableOpacity
                                                key={cat}
                                                className={`px-6 py-4 border-b border-[#F8FAFC] transition-all ${category === cat ? 'bg-[#7C3AED]/5' : 'active:bg-slate-50'}`}
                                                onPress={() => {
                                                    setCategory(cat);
                                                    setIsCategoryDropdownOpen(false);
                                                }}
                                            >
                                                <Text className={`font-bold text-[15px] ${category === cat ? 'text-[#7C3AED]' : 'text-[#475569]'}`}>{cat}</Text>
                                            </TouchableOpacity>
                                        ))}
                                    </ScrollView>
                                </View>
                            )}
                        </View>

                        {/* Title Input */}
                        <View className="mb-6">
                            <TextInput
                                placeholder="제목을 입력해 주세요"
                                placeholderTextColor="#94A3B8"
                                className="text-[#27272a] text-2xl font-bold p-0 leading-tight"
                                value={title}
                                onChangeText={setTitle}
                                maxLength={100}
                            />
                        </View>

                        {/* Content Input */}
                        <View className="flex-1 min-h-[300px]">
                            <TextInput
                                placeholder="나누고 싶은 이야기를 자유롭게 적어보세요.&#13;&#10;전문적인 인사이트 공유는 언제나 환영입니다!"
                                placeholderTextColor="#94A3B8"
                                className="text-[#475569] text-base leading-7 p-0 font-medium"
                                multiline
                                textAlignVertical="top"
                                value={content}
                                onChangeText={setContent}
                            />
                        </View>

                        {/* Image Attachment (Placeholder for now) */}
                        <ScrollView horizontal className="mt-8 mb-4" showsHorizontalScrollIndicator={false}>
                            {images.map((uri, index) => (
                                <View key={index} className="relative w-24 h-24 mr-4">
                                    <Image source={{ uri }} className="w-full h-full rounded-2xl" />
                                    <TouchableOpacity
                                        onPress={() => setImages(prev => prev.filter((_, i) => i !== index))}
                                        className="absolute -top-2 -right-2 bg-white rounded-full border border-[#E2E8F0] p-1.5 shadow-md"
                                    >
                                        <X size={14} color="#F87171" strokeWidth={3} />
                                    </TouchableOpacity>
                                </View>
                            ))}
                            <TouchableOpacity
                                onPress={pickImage}
                                className="w-24 h-24 bg-[#F8FAFC] rounded-2xl border-2 border-dashed border-[#E2E8F0] items-center justify-center mr-4 active:border-[#7C3AED]/30 active:bg-white"
                            >
                                <ImageIcon size={28} color="#94A3B8" />
                                <Text className="text-[#94A3B8] text-[11px] font-bold mt-2">사진 추가</Text>
                            </TouchableOpacity>
                        </ScrollView>
                    </ScrollView>

                    {/* Bottom Toolbar */}
                    <View className="px-8 py-6 border-t border-[#F1F5F9] bg-white pb-10 sm:pb-8">
                        <View className="flex-row items-center justify-between">
                            <View className="flex-row items-center">
                                <Switch
                                    trackColor={{ false: "#E2E8F0", true: "#7C3AED" }}
                                    thumbColor="white"
                                    onValueChange={setIsAnonymous}
                                    value={isAnonymous}
                                    style={{ transform: [{ scaleX: 1 }, { scaleY: 1 }] }}
                                />
                                <Text className={`ml-3 text-[15px] font-bold ${isAnonymous ? 'text-[#7C3AED]' : 'text-[#64748B]'}`}>
                                    익명으로 보물단지 속에 감추기
                                </Text>
                            </View>
                            {!isAnonymous && (
                                <View className="flex-row items-center bg-[#7C3AED]/10 px-4 py-2 rounded-full border border-[#7C3AED]/10">
                                    <CheckCircle2 size={14} color="#7C3AED" />
                                    <Text className="text-[#7C3AED] text-xs ml-2 font-bold">네트워킹 효과 UP!</Text>
                                </View>
                            )}
                        </View>
                    </View>
                </View>
            </KeyboardAvoidingView>
        </Modal>
    );
};
