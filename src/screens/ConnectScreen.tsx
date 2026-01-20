import React, { useState, useMemo } from 'react';
import { View, Text, ScrollView, TouchableOpacity, FlatList, useWindowDimensions } from 'react-native';
import { Plus, Search, SlidersHorizontal, Sparkles } from 'lucide-react-native';
import { COMMUNITY_CATEGORIES, mockCommunityPosts, CommunityCategory, CommunityPost } from '../data/mockData';
import { FlippablePostCard } from '../components/FlippablePostCard';
import { CreatePostModal } from '../components/CreatePostModal';

export const ConnectScreen = () => {
    const [activeCategory, setActiveCategory] = useState<CommunityCategory>('전체');
    const [posts, setPosts] = useState<CommunityPost[]>(mockCommunityPosts);
    const [isCreateModalVisible, setIsCreateModalVisible] = useState(false);
    const [sortBy, setSortBy] = useState<'latest' | 'popular' | 'scraps'>('latest');
    const { width } = useWindowDimensions();

    // State for controlling which card is flipped
    const [activeFlippedId, setActiveFlippedId] = useState<string | null>(null);

    // Filter posts based on category and sorting
    const filteredPosts = useMemo(() => {
        let result = posts;
        if (activeCategory !== '전체') {
            result = result.filter(p => p.category === activeCategory);
        }

        // Simple sort logic
        if (sortBy === 'latest') {
            return result;
        } else if (sortBy === 'popular') {
            return [...result].sort((a, b) => b.likes - a.likes);
        } else if (sortBy === 'scraps') {
            return result.filter(p => p.scrapped);
        }

        return result;
    }, [posts, activeCategory, sortBy]);

    const handleCreatePost = (newPostData: { title: string; content: string; category: CommunityCategory; isAnonymous: boolean }) => {
        const newPost: CommunityPost = {
            id: `new_${Date.now()}`,
            author: newPostData.isAnonymous ? '익명' : '나(Me)',
            role: newPostData.isAnonymous ? '익명' : '창업가',
            isAnonymous: newPostData.isAnonymous,
            category: newPostData.category,
            title: newPostData.title,
            content: newPostData.content,
            likes: 0,
            comments: 0,
            timestamp: '방금 전',
            scrapped: false,
        };

        setPosts([newPost, ...posts]);
    };

    const handleNext = (currentId: string) => {
        const currentIndex = filteredPosts.findIndex(p => p.id === currentId);
        if (currentIndex < filteredPosts.length - 1) {
            setActiveFlippedId(filteredPosts[currentIndex + 1].id);
        }
    };

    const handlePrev = (currentId: string) => {
        const currentIndex = filteredPosts.findIndex(p => p.id === currentId);
        if (currentIndex > 0) {
            setActiveFlippedId(filteredPosts[currentIndex - 1].id);
        }
    };

    const handleToggleFlip = (id: string) => {
        setActiveFlippedId(prev => (prev === id ? null : id));
    };

    return (
        <View className="flex-1 min-h-screen pb-20">
            {/* Header / Title Area */}
            <View className="flex-1 px-6 py-8 max-w-[1400px] w-full mx-auto self-center">
                {/* Header Actions */}
                <View className="flex-row items-start justify-between mb-8">
                    <View>
                        <View className="flex-row items-center mb-2">
                            <Sparkles size={24} color="#3B82F6" />
                            <Text className="text-white text-3xl font-bold ml-3">커뮤니티 라운지</Text>
                        </View>
                        <Text className="text-slate-400 text-base">전문가들과 인사이트를 나누고 안전하게 소통하세요</Text>
                    </View>
                    <View className="flex-row gap-3">
                        <TouchableOpacity className="bg-[#1E293B] p-3 rounded-xl border border-white/10 input-hover">
                            <Search size={20} color="#94A3B8" />
                        </TouchableOpacity>
                        <TouchableOpacity className="bg-[#1E293B] p-3 rounded-xl border border-white/10 input-hover">
                            <SlidersHorizontal size={20} color="#94A3B8" />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Category Tabs */}
                <View className="flex-row items-center mb-8">
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        className="flex-1"
                        contentContainerStyle={{ paddingRight: 20 }}
                    >
                        {COMMUNITY_CATEGORIES.map((cat) => (
                            <TouchableOpacity
                                key={cat}
                                onPress={() => {
                                    setActiveCategory(cat);
                                    setActiveFlippedId(null); // Reset flip on category change
                                }}
                                className={`mr-2.5 px-5 py-2.5 rounded-full border ${activeCategory === cat ? 'bg-white text-black border-white' : 'bg-[#1E293B] border-white/10'}`}
                            >
                                <Text className={`font-bold text-[13px] ${activeCategory === cat ? 'text-black' : 'text-slate-400'}`}>
                                    {cat}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                    <View className="pl-4 ml-2 border-l border-white/10">
                        <TouchableOpacity
                            className="bg-blue-600 px-5 py-2.5 rounded-full flex-row items-center hover:bg-blue-700 transition-colors shadow-lg shadow-blue-500/20"
                            onPress={() => setIsCreateModalVisible(true)}
                        >
                            <Plus size={16} color="#fff" />
                            <Text className="text-white font-bold text-sm ml-2">글작성하기</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Content Area */}
                <View className="flex-1 w-full">
                    {/* Scrollable Content */}
                    <FlatList
                        data={filteredPosts}
                        keyExtractor={(item) => item.id}
                        numColumns={2}
                        columnWrapperStyle={{ gap: 16 }}
                        contentContainerStyle={{ paddingBottom: 100, paddingHorizontal: 24, paddingTop: 24 }}
                        showsVerticalScrollIndicator={false}
                        renderItem={({ item }) => (
                            <View style={{ flex: 1, maxWidth: '50%' }}>
                                <FlippablePostCard
                                    post={item}
                                    isOpen={activeFlippedId === item.id}
                                    onToggle={() => handleToggleFlip(item.id)}
                                    onNext={() => handleNext(item.id)}
                                    onPrev={() => handlePrev(item.id)}
                                    hasNext={filteredPosts.findIndex(p => p.id === item.id) < filteredPosts.length - 1}
                                    hasPrev={filteredPosts.findIndex(p => p.id === item.id) > 0}
                                />
                            </View>
                        )}
                    />
                </View>

                <CreatePostModal
                    visible={isCreateModalVisible}
                    onClose={() => setIsCreateModalVisible(false)}
                    onSubmit={handleCreatePost}
                />
            </View>
        </View>
    );
};
