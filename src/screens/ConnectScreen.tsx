import React, { useState, useMemo, useRef, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, FlatList, useWindowDimensions, Animated, Easing } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../contexts/AuthContext';
import { Plus, Search, SlidersHorizontal, Sparkles, Users, Filter, X, LogOut, Bell, Heart, MessageCircle, MessageSquare } from 'lucide-react-native';
import { COMMUNITY_CATEGORIES, CommunityCategory, CommunityPost } from '../data/mockData';
import { CreatePostModal } from '../components/CreatePostModal';
import { TimelinePost } from '../components/TimelinePost';
import { PostDetailPanel } from '../components/PostDetailPanel';
import { usePosts } from '../hooks/usePosts';
import { useNotifications } from '../hooks/useNotifications';
import { NotificationModal } from '../components/NotificationModal';
import Footer from '../components/Footer';

interface ConnectScreenProps {
    onLoginRequired?: () => void;
    onNavigateToProfile?: (userId: string) => void;
}

export const ConnectScreen: React.FC<ConnectScreenProps> = ({ onLoginRequired, onNavigateToProfile }) => {
    const { user, signOut } = useAuth(); // Destructure signOut
    // --- RESTORED LOGIC ---
    const { posts, addPost, deletePost, updatePost, addComment, toggleLike, deleteComment } = usePosts();
    const { notifications, addNotification, markAsRead, unreadCount } = useNotifications(user?.id);
    const [isNotiModalVisible, setIsNotiModalVisible] = useState(false);

    const [activeCategory, setActiveCategory] = useState<CommunityCategory>('전체');
    const [isCreateModalVisible, setIsCreateModalVisible] = useState(false);
    const [editingPostId, setEditingPostId] = useState<string | null>(null);
    const [sortBy, setSortBy] = useState<'latest' | 'popular' | 'scraps'>('latest');
    const { width, height } = useWindowDimensions();

    const filteredPosts = useMemo(() => {
        let result = posts;
        if (activeCategory !== '전체') {
            result = result.filter(p => p.category === activeCategory);
        }
        if (sortBy === 'latest') return result;
        if (sortBy === 'popular') return [...result].sort((a, b) => b.likes - a.likes);
        if (sortBy === 'scraps') return result.filter(p => p.scrapped);
        return result;
    }, [posts, activeCategory, sortBy]);

    const handleCreatePost = async (newPostData: { title: string; content: string; category: CommunityCategory; isAnonymous: boolean }) => {
        if (editingPostId) {
            await updatePost(editingPostId, {
                title: newPostData.title,
                content: newPostData.content,
                category: newPostData.category,
                isAnonymous: newPostData.isAnonymous,
                author: newPostData.isAnonymous ? '익명' : (user?.email?.split('@')[0] || '나(Me)'),
            });
            setEditingPostId(null);
            setIsCreateModalVisible(false);
            return;
        }
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
            author: newPostData.isAnonymous ? '익명' : authorName,
            authorId: user?.id,
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
        await addPost(newPost);
        setIsCreateModalVisible(false);
    };

    const handleCommentWithNotification = async (postId: string, comment: { author: string; content: string; isAnonymous: boolean }) => {
        await addComment(postId, comment);

        // Find post to get author
        const post = posts.find(p => p.id === postId);
        if (post && post.authorId && post.authorId !== user?.id) {
            const notiMsg = comment.isAnonymous
                ? `누군가 회원님의 게시글에 댓글을 남겼습니다: "${comment.content.slice(0, 15)}..."`
                : `${comment.author}님이 댓글을 남겼습니다: "${comment.content.slice(0, 15)}..."`;

            await addNotification(post.authorId, notiMsg, 'comment', postId);
        }
    };

    const handleEditPost = (id: string) => {
        const postToEdit = posts.find(p => p.id === id);
        if (postToEdit) {
            setEditingPostId(id);
            setIsCreateModalVisible(true);
        }
    };

    const handleDeletePost = async (id: string) => {
        await deletePost(id);
    };

    const handleProfilePress = (userId: string) => {
        if (onNavigateToProfile) onNavigateToProfile(userId);
    };

    // --- RENDER HELPERS ---
    const [selectedPostId, setSelectedPostId] = useState<string | null>(null);

    // --- END RESTORED LOGIC ---

    return (
        <View className="flex-1 bg-[#020617]">
            {/* --- MAIN PAGE SCROLL (Controls whole screen) --- */}
            <ScrollView
                className="flex-1"
                showsVerticalScrollIndicator={false}
            >
                {/* --- TITLE AREA (Scrolls with content) --- */}
                <View className="px-6 max-w-[1400px] w-full mx-auto pt-8 pb-4">
                    <View className="flex-row items-center justify-between mb-2">
                        <View className="flex-row items-center">
                            <Users size={28} color="#3B82F6" />
                            <Text className="text-white text-3xl font-bold ml-3">커뮤니티 라운지</Text>
                        </View>
                        <TouchableOpacity
                            onPress={() => setIsNotiModalVisible(true)}
                            className="relative p-2 rounded-full hover:bg-white/5 bg-white/5 border border-white/10"
                        >
                            <Bell size={20} color={unreadCount > 0 ? "white" : "#94A3B8"} />
                            {unreadCount > 0 && (
                                <View className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border border-[#020617]" />
                            )}
                        </TouchableOpacity>
                    </View>
                    <Text className="text-slate-400 text-base">전문가들과 인사이트를 나누고 안전하게 소통하세요</Text>
                </View>

                {/* --- MAIN CONTENT CONTAINER --- */}
                <View className="flex-1 flex-row max-w-[1400px] w-full mx-auto relative px-6 pt-6 min-h-screen">

                    {/* --- LEFT COLUMN: Categories (Standard View) --- */}
                    <View className="w-[240px] border-r border-white/5 pr-8 hidden md:flex">
                        {/* This sidebar is part of main scroll, so it scrolls UP when page scrolls */}
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

                    {/* --- RIGHT COLUMN: Feed (NESTED SCROLL) --- */}
                    <View className="flex-1 pl-0 md:pl-8">

                        {/* Mobile Header */}
                        <View className="md:hidden mb-6">
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

                        {/* NESTED SCROLLVIEW for Feed Items */}
                        <ScrollView
                            style={{ height: width >= 768 ? height * 0.85 : height * 0.75 }}
                            className="w-full"
                            nestedScrollEnabled={true}
                            showsVerticalScrollIndicator={false}
                        >
                            <View className="pb-10">
                                {filteredPosts.map((item, index) => (
                                    <TimestampWrapper key={item.id} post={item} prevPost={filteredPosts[index - 1]}>
                                        <TimelinePost
                                            post={item}
                                            isLast={index === filteredPosts.length - 1}
                                            onPress={() => setSelectedPostId(item.id)}
                                            onProfilePress={handleProfilePress}
                                            onLike={toggleLike}
                                        />
                                    </TimestampWrapper>
                                ))}
                            </View>
                            {/* Note: Footer could be inside here OR outside. Request says "Footer in previous position" implies outside, at bottom of page? 
                                If outside: User scrolls PAGE to see footer.
                                If inside: User scrolls FEED to see footer.
                                Im placing it OUTSIDE to match "Two Scroll" concept (Page Scroll -> Footer)
                            */}
                        </ScrollView>
                    </View>
                </View>

                {/* --- FOOTER (Main Page Scroll) --- */}
                <Footer />
            </ScrollView>

            {/* --- DETAIL PANEL (Same as before) --- */}
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
                    onAddComment={handleCommentWithNotification}
                    onDeleteComment={deleteComment}
                    onLike={toggleLike}
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

            <NotificationModal
                visible={isNotiModalVisible}
                onClose={() => setIsNotiModalVisible(false)}
                notifications={notifications}
                onMarkAsRead={markAsRead}
            />
        </View>
    );
};

// Helper to render date headers if needed (Optional for now, straightforward list is fine)
const TimestampWrapper = ({ children }: any) => <>{children}</>;
