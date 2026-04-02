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
import { PublicProfileView } from '../components/PublicProfileView';
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
            authorId: user?.id || 'guest_user',
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

    // --- RENDER HELPERS ---
    const [selectedPostId, setSelectedPostId] = useState<string | null>(null);

    // Profile viewing state
    const [selectedProfileUserId, setSelectedProfileUserId] = useState<string | null>(null);
    const profilePanelTranslateX = useRef(new Animated.Value(-900)).current;
    const backdropOpacity = useRef(new Animated.Value(0)).current;

    const handleProfilePress = (userId: string) => {
        setSelectedProfileUserId(userId);
    };

    // Animate profile panel
    useEffect(() => {
        if (selectedProfileUserId) {
            // Shooong! bouncy entry
            Animated.parallel([
                Animated.spring(profilePanelTranslateX, {
                    toValue: 0,
                    useNativeDriver: true,
                    friction: 5,    // More bounce (lower friction)
                    tension: 50,    // More snap
                }),
                Animated.timing(backdropOpacity, {
                    toValue: 1,
                    duration: 300,
                    useNativeDriver: true,
                })
            ]).start();
        } else {
            // Smooth exit
            Animated.parallel([
                Animated.timing(profilePanelTranslateX, {
                    toValue: -900,
                    duration: 350,
                    useNativeDriver: true,
                }),
                Animated.timing(backdropOpacity, {
                    toValue: 0,
                    duration: 250,
                    useNativeDriver: true,
                })
            ]).start();
        }
    }, [selectedProfileUserId]);

    // --- END RESTORED LOGIC ---

    return (
        <View className="flex-1 bg-[#FDF8F3]">
            {/* --- MAIN PAGE SCROLL (Controls whole screen) --- */}
            <ScrollView
                className="flex-1"
                showsVerticalScrollIndicator={false}
            >
                {/* --- TITLE AREA (Scrolls with content) --- */}
                <View className="px-6 max-w-[1400px] w-full mx-auto pt-10 pb-6">
                    <View className="flex-row items-center justify-between mb-3">
                        <View className="flex-row items-center">
                            <View className="w-10 h-10 bg-[#7C3AED]/10 rounded-xl items-center justify-center">
                                <Users size={24} color="#7C3AED" />
                            </View>
                            <Text className="text-[#27272a] text-3xl font-bold ml-4">커뮤니티 라운지</Text>
                        </View>
                        <TouchableOpacity
                            onPress={() => setIsNotiModalVisible(true)}
                            className="relative p-2.5 rounded-full bg-white border border-[#E2E8F0] shadow-sm shadow-black/5"
                        >
                            <Bell size={20} color={unreadCount > 0 ? "#7C3AED" : "#64748B"} />
                            {unreadCount > 0 && (
                                <View className="absolute top-2 right-2 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white" />
                            )}
                        </TouchableOpacity>
                    </View>
                    <Text className="text-[#64748B] text-base ml-1">전문가들과 인사이트를 나누고 안전하게 소통하세요</Text>
                </View>

                {/* --- MAIN CONTENT CONTAINER --- */}
                <View className="flex-1 flex-row max-w-[1400px] w-full mx-auto relative px-6 pt-4 min-h-screen">

                    {/* --- LEFT COLUMN: Categories --- */}
                    <View className="w-[260px] border-r border-[#E2E8F0] pr-8 hidden md:flex">
                        <TouchableOpacity
                            onPress={() => {
                                if (!user) { if (onLoginRequired) onLoginRequired(); }
                                else {
                                    setEditingPostId(null);
                                    setIsCreateModalVisible(true);
                                }
                            }}
                            className="flex-row items-center justify-center bg-[#7C3AED] p-4 rounded-xl mb-10 shadow-lg shadow-[#7C3AED]/20 active:opacity-90"
                        >
                            <Plus size={20} color="white" className="mr-2" />
                            <Text className="text-white font-bold text-base">새 글 작성</Text>
                        </TouchableOpacity>

                        <Text className="text-[#94A3B8] font-bold text-xs uppercase mb-5 ml-2 tracking-widest">Categories</Text>

                        {COMMUNITY_CATEGORIES.map((cat) => (
                            <TouchableOpacity
                                key={cat}
                                onPress={() => setActiveCategory(cat)}
                                className={`p-3.5 rounded-xl flex-row items-center mb-1.5 transition-all ${activeCategory === cat ? 'bg-[#7C3AED]/5 border border-[#7C3AED]/20' : 'hover:bg-slate-50'}`}
                            >
                                <View className={`w-2 h-2 rounded-full mr-4 ${activeCategory === cat ? 'bg-[#7C3AED]' : 'bg-[#CBD5E1]'}`} />
                                <Text className={`${activeCategory === cat ? 'text-[#7C3AED] font-bold' : 'text-[#64748B] font-medium'} text-[15px]`}>
                                    {cat}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    {/* --- RIGHT COLUMN: Feed --- */}
                    <View className="flex-1 pl-0 md:pl-10">

                        {/* Mobile Header */}
                        <View className="md:hidden mb-8">
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-5">
                                {COMMUNITY_CATEGORIES.map((cat) => (
                                    <TouchableOpacity
                                        key={cat}
                                        onPress={() => setActiveCategory(cat)}
                                        className={`mr-3 px-4 py-2 rounded-full border ${activeCategory === cat ? 'bg-[#7C3AED] border-[#7C3AED]' : 'border-[#E2E8F0] bg-white shadow-sm shadow-black/5'}`}
                                    >
                                        <Text className={`text-sm ${activeCategory === cat ? 'text-white font-bold' : 'text-[#64748B] font-medium'}`}>{cat}</Text>
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>
                            <TouchableOpacity
                                onPress={() => {
                                    if (!user) { if (onLoginRequired) onLoginRequired(); }
                                    else setIsCreateModalVisible(true);
                                }}
                                className="bg-[#7C3AED] p-4 rounded-xl flex-row items-center justify-center shadow-md shadow-[#7C3AED]/20"
                            >
                                <Plus size={18} color="white" className="mr-2" />
                                <Text className="text-white font-bold text-base">글쓰기</Text>
                            </TouchableOpacity>
                        </View>

                        {/* NESTED SCROLLVIEW for Feed Items */}
                        <ScrollView
                            style={{ height: width >= 768 ? height * 0.85 : height * 0.75 }}
                            className="w-full"
                            nestedScrollEnabled={true}
                            showsVerticalScrollIndicator={false}
                        >
                            <View className="pb-10 w-full max-w-[850px]">
                                {filteredPosts.map((item, index) => (
                                    <TimestampWrapper key={item.id} post={item} prevPost={filteredPosts[index - 1]}>
                                        <TimelinePost
                                            post={item}
                                            isLast={index === filteredPosts.length - 1}
                                            onPress={() => setSelectedPostId(item.id)}
                                            onProfilePress={handleProfilePress}
                                            onLike={(id) => toggleLike(id, user?.id)}
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

            {/* --- PUBLIC PROFILE VIEW BACKDROP --- */}
            {selectedProfileUserId && (
                <Animated.View
                    style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        backgroundColor: 'rgba(0,0,0,0.6)',
                        opacity: backdropOpacity,
                        zIndex: 55,
                    }}
                >
                    <TouchableOpacity
                        style={{ flex: 1 }}
                        activeOpacity={1}
                        onPress={() => setSelectedProfileUserId(null)}
                    />
                </Animated.View>
            )}

            {/* --- PUBLIC PROFILE VIEW PANEL (Slides from left) --- */}
            <Animated.View
                style={{
                    position: 'absolute',
                    left: 20,
                    top: 20,
                    bottom: 20,
                    width: 800,
                    transform: [{ translateX: profilePanelTranslateX }],
                    zIndex: 60,
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 10 },
                    shadowOpacity: 0.5,
                    shadowRadius: 20,
                }}
                pointerEvents={selectedProfileUserId ? 'auto' : 'none'}
            >
                {selectedProfileUserId && (
                    <View className="flex-1 bg-transparent rounded-[32px] overflow-hidden border border-slate-200 dark:border-white/10 shadow-2xl">
                        <PublicProfileView
                            userId={selectedProfileUserId}
                            onClose={() => setSelectedProfileUserId(null)}
                        />
                    </View>
                )}
            </Animated.View>

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
                    onLike={(id) => toggleLike(id, user?.id)}
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
