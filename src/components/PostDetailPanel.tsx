import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, TextInput, KeyboardAvoidingView, Platform, Image, Alert } from 'react-native';
import { X, Send, User, MoreHorizontal, Heart, MessageCircle, ChevronLeft, ChevronRight, Check, Trash2 } from 'lucide-react-native';
import { CommunityPost } from '../data/mockData';
import { usePosts } from '../hooks/usePosts';
import { useAuth } from '../contexts/AuthContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface PostDetailPanelProps {
    post: CommunityPost;
    visible: boolean;
    onClose: () => void;
    onProfilePress?: (userId: string) => void;
    onPrev?: () => void;
    onNext?: () => void;
    hasPrev?: boolean;
    hasNext?: boolean;
    onAddComment: (postId: string, comment: { author: string; content: string; isAnonymous: boolean }) => Promise<void>;
    onDeleteComment?: (postId: string, commentId: string) => Promise<void>;
    onLike?: (postId: string) => void;
}

export const PostDetailPanel = ({ post, visible, onClose, onProfilePress, onPrev, onNext, hasPrev, hasNext, onAddComment, onDeleteComment, onLike }: PostDetailPanelProps) => {
    const { user } = useAuth();
    // Removed internal usePosts hook to prevent state desync
    // const { addComment } = usePosts(); 
    const [comment, setComment] = useState('');
    const [isAnonymous, setIsAnonymous] = useState(false);

    // Determine current user's display name to allow deletion of own comments
    const [myProfileName, setMyProfileName] = useState<string | null>(null);

    useEffect(() => {
        const loadProfile = async () => {
            if (user) {
                const storedProfile = await AsyncStorage.getItem('user_profile');
                if (storedProfile) {
                    const profile = JSON.parse(storedProfile);
                    setMyProfileName(profile.nickname);
                } else {
                    setMyProfileName(user.email?.split('@')[0] || 'Guest');
                }
            }
        };
        loadProfile();
    }, [user]);

    if (!visible) return null;

    const handleSubmitComment = async () => {
        if (!comment.trim()) return;

        let authorName = user?.email?.split('@')[0] || 'Guest';
        if (!isAnonymous) {
            try {
                const storedProfile = await AsyncStorage.getItem('user_profile');
                if (storedProfile) {
                    const profile = JSON.parse(storedProfile);
                    if (profile.nickname) authorName = profile.nickname;
                }
            } catch (e) { console.log(e); }
        }

        await onAddComment(post.id, {
            author: isAnonymous ? '익명' : authorName,
            content: comment,
            isAnonymous
        });
        setComment('');
    };

    const handleDelete = async (commentId: string) => {
        if (!onDeleteComment) return;

        if (Platform.OS === 'web') {
            const ok = window.confirm("댓글을 삭제하시겠습니까?");
            if (ok) {
                await onDeleteComment(post.id, commentId);
            }
        } else {
            Alert.alert(
                "댓글 삭제",
                "이 댓글을 삭제하시겠습니까?",
                [
                    { text: "취소", style: "cancel" },
                    { text: "삭제", style: "destructive", onPress: () => onDeleteComment(post.id, commentId) }
                ]
            );
        }
    };

    // Adjusted to fit "perfectly" in screen, avoiding full-height stretch.
    const [isHovered, setIsHovered] = useState(false);

    return (
        <View
            className="absolute top-0 right-0 bottom-0 w-full sm:w-[600px] z-[100] justify-center"
            // @ts-ignore - React Native Web supports these props
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            <View className="flex-1 relative">
                {/* Backdrop for mobile or side area */}
                <TouchableOpacity 
                    className="absolute inset-0 bg-black/20" 
                    activeOpacity={1} 
                    onPress={onClose} 
                />

                {/* --- MAIN CARD CONTENT --- */}
                <View className="flex-1 bg-white shadow-2xl flex-col border-l border-[#E2E8F0] overflow-hidden">
                    {/* Header */}
                    <View className="flex-row items-center justify-between px-6 py-5 border-b border-[#F1F5F9] bg-white">
                        <TouchableOpacity onPress={onClose} className="p-2 -ml-2 rounded-full hover:bg-slate-50">
                            <X size={24} color="#64748B" />
                        </TouchableOpacity>
                        <Text className="text-[#27272a] font-bold text-lg">게시글 상세</Text>
                        <TouchableOpacity className="p-2 rounded-full hover:bg-slate-50">
                            <MoreHorizontal size={24} color="#94A3B8" />
                        </TouchableOpacity>
                    </View>

                    <KeyboardAvoidingView
                        behavior={Platform.OS === "ios" ? "padding" : "height"}
                        className="flex-1"
                        keyboardVerticalOffset={0}
                    >
                        <ScrollView className="flex-1 px-8 pt-8">
                            {/* Post Content */}
                            <View className="mb-10">
                                <TouchableOpacity
                                    className="flex-row items-center mb-6"
                                    onPress={() => !post.isAnonymous && post.authorId && onProfilePress && onProfilePress(post.authorId)}
                                    disabled={post.isAnonymous}
                                >
                                    <View className={`w-12 h-12 rounded-full items-center justify-center mr-4 shadow-sm ${post.isAnonymous ? 'bg-[#F1F5F9]' : 'bg-[#7C3AED]'}`}>
                                        {post.isAnonymous ? <User size={20} color="#7C3AED" /> : <Text className="text-white font-bold text-lg">{post.author[0]}</Text>}
                                    </View>
                                    <View>
                                        <Text className="text-[#27272a] font-bold text-base">{post.isAnonymous ? '익명 사용자' : post.author}</Text>
                                        <Text className="text-[#94A3B8] text-xs font-medium">{post.timestamp} · {post.category}</Text>
                                    </View>
                                </TouchableOpacity>

                                <Text className="text-[#27272a] text-2xl font-bold mb-4 leading-tight">{post.title}</Text>
                                <Text className="text-[#475569] text-[15px] leading-7 mb-6 whitespace-pre-wrap font-medium">{post.content}</Text>

                                {post.imageUrl && (
                                    <Image
                                        source={{ uri: post.imageUrl }}
                                        className="w-full h-72 rounded-2xl bg-slate-100 mb-6"
                                        resizeMode="cover"
                                    />
                                )}

                                <View className="flex-row gap-6 py-4 border-t border-[#F1F5F9] border-b border-[#F1F5F9]">
                                    <TouchableOpacity
                                        className="flex-row items-center gap-2"
                                        onPress={() => onLike && onLike(post.id)}
                                    >
                                        <Heart
                                            size={20}
                                            color={post.likedBy?.includes(user?.id || '') ? "#F87171" : "#94A3B8"}
                                            fill={post.likedBy?.includes(user?.id || '') ? "#F87171" : "none"}
                                        />
                                        <Text className={`font-bold ${post.likedBy?.includes(user?.id || '') ? 'text-red-500' : 'text-[#64748B]'}`}>{post.likes}</Text>
                                    </TouchableOpacity>
                                    <View className="flex-row items-center gap-2">
                                        <MessageCircle size={20} color="#7C3AED" />
                                        <Text className="text-[#7C3AED] font-bold">{post.comments}</Text>
                                    </View>
                                </View>
                            </View>

                            {/* Comments Section */}
                            <View className="mb-24">
                                <Text className="text-[#27272a] font-bold text-lg mb-6">댓글 {post.commentsList?.length || 0}개</Text>

                                {(post.commentsList || []).map((comment, index) => (
                                    <View key={comment.id || index} className="flex-row mb-6 border-b border-[#F8FAFC] pb-6 last:border-0 relative">
                                        <View className={`w-10 h-10 rounded-full items-center justify-center mr-4 mt-1 shadow-sm ${comment.isAnonymous ? 'bg-[#F1F5F9]' : 'bg-[#10B981]'}`}>
                                            {comment.isAnonymous ? <User size={16} color="#7C3AED" /> : <Text className="text-white text-sm font-bold">{comment.author[0]}</Text>}
                                        </View>
                                        <View className="flex-1 pr-8">
                                            <View className="flex-row items-center mb-1.5">
                                                <Text className="text-[#27272a] font-bold text-sm mr-2">{comment.author}</Text>
                                                <Text className="text-[#94A3B8] text-[11px] font-medium">{comment.timestamp}</Text>
                                            </View>
                                            <Text className="text-[#475569] text-sm leading-6 font-medium">{comment.content}</Text>
                                        </View>
                                        {(user && (comment.author === myProfileName || comment.author === (user.email?.split('@')[0]) || comment.author === '나(Me)')) && (
                                            <TouchableOpacity
                                                className="absolute right-0 top-1 p-2 rounded-full hover:bg-red-50/50"
                                                onPress={() => handleDelete(comment.id)}
                                            >
                                                <Trash2 size={16} color="#F87171" />
                                            </TouchableOpacity>
                                        )}
                                    </View>
                                ))}
                            </View>
                        </ScrollView>

                        {/* Comment Input */}
                        <View className="bg-white border-t border-[#E2E8F0] p-5 pb-8">
                            <View className="flex-row items-center mb-4 ml-1">
                                <TouchableOpacity
                                    onPress={() => setIsAnonymous(!isAnonymous)}
                                    className="flex-row items-center"
                                >
                                    <View className={`w-5 h-5 rounded-md border-2 mr-2.5 items-center justify-center transition-all ${isAnonymous ? 'bg-[#7C3AED] border-[#7C3AED]' : 'border-[#CBD5E1]'}`}>
                                        {isAnonymous && <Check size={12} color="white" strokeWidth={3} />}
                                    </View>
                                    <Text className={`text-sm font-medium ${isAnonymous ? 'text-[#7C3AED]' : 'text-[#64748B]'}`}>익명으로 댓글 달기</Text>
                                </TouchableOpacity>
                            </View>

                            <View className="flex-row gap-3">
                                <TextInput
                                    className="flex-1 bg-[#F8FAFC] text-[#27272a] rounded-2xl px-5 py-4 border border-[#E2E8F0] text-sm font-medium"
                                    placeholder="따뜻한 댓글을 남겨보세요..."
                                    placeholderTextColor="#94A3B8"
                                    value={comment}
                                    onChangeText={setComment}
                                    multiline
                                />
                                <TouchableOpacity
                                    className={`w-14 h-14 items-center justify-center rounded-2xl shadow-lg transition-all ${comment.trim() ? 'bg-[#7C3AED] shadow-[#7C3AED]/20' : 'bg-[#E2E8F0]'}`}
                                    onPress={handleSubmitComment}
                                    disabled={!comment.trim()}
                                >
                                    <Send size={22} color={comment.trim() ? 'white' : '#94A3B8'} />
                                </TouchableOpacity>
                            </View>
                        </View>
                    </KeyboardAvoidingView>
                </View>

                {/* --- FLOATING NAVIGATION BUTTONS --- */}
                {hasPrev && (
                    <TouchableOpacity
                        onPress={onPrev}
                        className={`absolute -left-20 w-14 h-14 rounded-full bg-white/95 border border-[#E2E8F0] items-center justify-center shadow-xl transition-all duration-300 z-[110] ${isHovered ? 'scale-100 opacity-100' : 'scale-75 opacity-0'}`}
                        style={{ top: '50%', marginTop: -28 }}
                    >
                        <ChevronLeft size={28} color="#7C3AED" />
                    </TouchableOpacity>
                )}

                {hasNext && (
                    <TouchableOpacity
                        onPress={onNext}
                        className={`absolute -right-20 w-14 h-14 rounded-full bg-white/95 border border-[#E2E8F0] items-center justify-center shadow-xl transition-all duration-300 z-[110] ${isHovered ? 'scale-100 opacity-100' : 'scale-75 opacity-0'}`}
                        style={{ top: '50%', marginTop: -28 }}
                    >
                        <ChevronRight size={28} color="#7C3AED" />
                    </TouchableOpacity>
                )}
            </View>
        </View>
    );
};
