import React, { useState, useMemo } from 'react';
import { View, Text, ScrollView, TouchableOpacity, FlatList, useWindowDimensions } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../contexts/AuthContext';
import { Plus, Search, SlidersHorizontal, Sparkles, Users, Filter, X } from 'lucide-react-native';
import { COMMUNITY_CATEGORIES, CommunityCategory, CommunityPost } from '../data/mockData';
import { CreatePostModal } from '../components/CreatePostModal';
import { TimelinePost } from '../components/TimelinePost';
import { PostDetailPanel } from '../components/PostDetailPanel';
import { usePosts } from '../hooks/usePosts'; // Import hook for actions
import Footer from '../components/Footer';

interface ConnectScreenProps {
    onLoginRequired?: () => void;
    onNavigateToProfile?: (userId: string) => void;
}

export const ConnectScreen: React.FC<ConnectScreenProps> = ({ onLoginRequired, onNavigateToProfile }) => {
    const { user } = useAuth();
    const { posts, addPost, deletePost, updatePost, addComment } = usePosts(); // Use persistence hook
    const [activeCategory, setActiveCategory] = useState<CommunityCategory>('전체');
    const [isCreateModalVisible, setIsCreateModalVisible] = useState(false);
    const [editingPostId, setEditingPostId] = useState<string | null>(null);
    const [sortBy, setSortBy] = useState<'latest' | 'popular' | 'scraps'>('latest');
    const { width } = useWindowDimensions();

    // State for controlling which card is flipped - REMOVED as FlippablePostCard is removed

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

    const handleCreatePost = async (newPostData: { title: string; content: string; category: CommunityCategory; isAnonymous: boolean }) => {
        // If editing
        if (editingPostId) {
            await updatePost(editingPostId, {
                title: newPostData.title,
                content: newPostData.content,
                category: newPostData.category,
                // Update author if needed or keep original? Usually keep original unless anonymous status changes.
                // For simplicity, let's keep author static but update anonymity.
                isAnonymous: newPostData.isAnonymous,
                author: newPostData.isAnonymous ? '익명' : (user?.email?.split('@')[0] || '나(Me)'), // Re-eval author name just in case
            });
            setEditingPostId(null);
            setIsCreateModalVisible(false);
            return;
        }

        // New Post Logic
        let authorName = user?.email?.split('@')[0] || '나(Me)';
        try {
            const storedProfile = await AsyncStorage.getItem('user_profile');
            if (storedProfile) {
                const profile = JSON.parse(storedProfile);
                if (profile.nickname) authorName = profile.nickname;
            }
        } catch (e) {
            console.log('Failed to load profile for post creation', e);
        }

        const newPost: CommunityPost = {
            id: `new_${Date.now()}`,
            author: newPostData.isAnonymous ? '익명' : authorName, // Use loaded nickname
            authorId: user?.id, // Add authorId for ownership check
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

        await addPost(newPost); // Save to storage
        setIsCreateModalVisible(false);
    };

    // Removed handleNext, handlePrev, handleToggleFlip as FlippablePostCard is removed

    const handleDeletePost = async (id: string) => {
        await deletePost(id); // Delete from storage
    };

    const handleEditPost = (id: string) => {
        const postToEdit = posts.find(p => p.id === id);
        if (postToEdit) {
            setEditingPostId(id);
            setIsCreateModalVisible(true);
            // Modal takes initialData prop
        }
    };

    // Navigation to Profile (mock for now, or redirect to a profile screen)
    const handleProfilePress = (userId: string) => {
        if (onNavigateToProfile) {
            onNavigateToProfile(userId);
        } else {
            console.log('Navigate to profile of', userId);
        }
    };

    // --- RENDER HELPERS ---
    const [selectedPostId, setSelectedPostId] = useState<string | null>(null);

    return (
        <View className="flex-1 bg-[#020617]">
            <ScrollView
                className="flex-1"
                showsVerticalScrollIndicator={false}
                stickyHeaderIndices={[0]} // Content View (Header) is index 0
            >
                {/* --- TOP HEADER AREA (Child 0: Sticky) --- */}
                <View className="bg-[#020617] w-full z-50 pt-2 pb-4">
                    <View className="px-6 max-w-[1400px] w-full mx-auto">
                        <View className="flex-row items-center mb-1">
                            <Users size={28} color="#3B82F6" />
                            <Text className="text-white text-3xl font-bold ml-3">커뮤니티 라운지</Text>
                        </View>
                        <Text className="text-slate-400 text-base">전문가들과 인사이트를 나누고 안전하게 소통하세요</Text>
                    </View>
                </View>

                {/* --- MAIN CONTENT AREA (Child 1: Scrolls under header) --- */}
                <View className="flex-1 min-h-screen">
                    {/* --- 2-COLUMN LAYOUT --- */}
                    <View className="flex-1 flex-row max-w-[1400px] w-full mx-auto relative px-6">
                        {/* --- LEFT COLUMN: Categories & Filters (Fixed 240px) --- */}
                        {/* Sticky Sidebar */}
                        <View className="w-[240px] border-r border-white/5 pr-8 hidden sm:flex sticky top-0 self-start h-auto">
                            <TouchableOpacity
                                onPress={() => {
                                    if (!user) { if (onLoginRequired) onLoginRequired(); }
                                    else {
                                        setEditingPostId(null);
                                        setIsCreateModalVisible(true);
                                    }
                                }}
                                className="flex-row items-center justify-center bg-blue-600 p-4 rounded-xl mb-8 hover:bg-blue-500 shadow-lg shadow-blue-500/20"
                            >
                                <Plus size={20} color="white" className="mr-2" />
                                <Text className="text-white font-bold">새 글 작성</Text>
                            </TouchableOpacity>

                            <Text className="text-slate-500 font-bold text-xs uppercase mb-4 ml-2">Categories</Text>

                            {COMMUNITY_CATEGORIES.map((cat) => (
                                <TouchableOpacity
                                    key={cat}
                                    onPress={() => setActiveCategory(cat)}
                                    className={`p-3 rounded-lg flex-row items-center mb-1 ${activeCategory === cat ? 'bg-slate-800 border border-white/10' : 'hover:bg-slate-800/50'}`}
                                >
                                    <View className={`w-1.5 h-1.5 rounded-full mr-3 ${activeCategory === cat ? 'bg-blue-400' : 'bg-slate-600'}`} />
                                    <Text className={`${activeCategory === cat ? 'text-white font-bold' : 'text-slate-400'} text-sm`}>
                                        {cat}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        {/* --- RIGHT COLUMN: Timeline Feed (Flex 1) --- */}
                        <View className="flex-1 relative pl-0 sm:pl-8">
                            {/* Mobile Header (Visible only on small screens) */}
                            <View className="sm:hidden mb-6">
                                <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-4">
                                    {COMMUNITY_CATEGORIES.map((cat) => (
                                        <TouchableOpacity
                                            key={cat}
                                            onPress={() => setActiveCategory(cat)}
                                            className={`mr-2 px-3 py-1.5 rounded-full border ${activeCategory === cat ? 'bg-blue-600 border-blue-600' : 'border-white/10 bg-slate-900'}`}
                                        >
                                            <Text className={`text-xs ${activeCategory === cat ? 'text-white font-bold' : 'text-slate-400'}`}>{cat}</Text>
                                        </TouchableOpacity>
                                    ))}
                                </ScrollView>
                                <TouchableOpacity
                                    onPress={() => {
                                        if (!user) { if (onLoginRequired) onLoginRequired(); }
                                        else setIsCreateModalVisible(true);
                                    }}
                                    className="bg-blue-600 p-3 rounded-xl flex-row items-center justify-center mb-2"
                                >
                                    <Plus size={16} color="white" className="mr-1" />
                                    <Text className="text-white font-bold text-sm">글쓰기</Text>
                                </TouchableOpacity>
                            </View>

                            {/* Feed Items (Mapped) */}
                            <View className="pb-20">
                                {filteredPosts.map((item, index) => (
                                    <TimestampWrapper key={item.id} post={item} prevPost={filteredPosts[index - 1]}>
                                        <TimelinePost
                                            post={item}
                                            isLast={index === filteredPosts.length - 1}
                                            onPress={() => setSelectedPostId(item.id)}
                                            onProfilePress={handleProfilePress}
                                        />
                                    </TimestampWrapper>
                                ))}
                            </View>
                        </View>
                    </View>

                    {/* --- FOOTER (Full Width) --- */}
                    <Footer />
                </View>

            </ScrollView>

            {/* --- DETAIL PANEL (Right Overlay) --- */}
            {selectedPostId && (
                <PostDetailPanel
                    post={posts.find(p => p.id === selectedPostId)!}
                    visible={!!selectedPostId}
                    onClose={() => setSelectedPostId(null)}
                    onProfilePress={handleProfilePress}
                    hasPrev={filteredPosts.findIndex(p => p.id === selectedPostId) > 0}
                    hasNext={filteredPosts.findIndex(p => p.id === selectedPostId) < filteredPosts.length - 1}
                    onPrev={() => {
                        const idx = filteredPosts.findIndex(p => p.id === selectedPostId);
                        if (idx > 0) setSelectedPostId(filteredPosts[idx - 1].id);
                    }}
                    onNext={() => {
                        const idx = filteredPosts.findIndex(p => p.id === selectedPostId);
                        if (idx < filteredPosts.length - 1) setSelectedPostId(filteredPosts[idx + 1].id);
                    }}
                    onAddComment={addComment}
                />
            )}

            {/* --- CREATE POST MODAL --- */}
            <CreatePostModal
                visible={isCreateModalVisible}
                onClose={() => {
                    setIsCreateModalVisible(false);
                    setEditingPostId(null);
                }}
                onSubmit={handleCreatePost}
                initialData={editingPostId ? posts.find(p => p.id === editingPostId) : undefined}
            />
        </View>
    );
};

// Helper to render date headers if needed (Optional for now, straightforward list is fine)
const TimestampWrapper = ({ children }: any) => <>{children}</>;
