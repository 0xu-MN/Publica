import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, TextInput, KeyboardAvoidingView, Platform, Image } from 'react-native';
import { X, Send, User, MoreHorizontal, Heart, MessageCircle, ChevronLeft, ChevronRight, Check } from 'lucide-react-native';
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
}

export const PostDetailPanel = ({ post, visible, onClose, onProfilePress, onPrev, onNext, hasPrev, hasNext, onAddComment }: PostDetailPanelProps) => {
    const { user } = useAuth();
    // Removed internal usePosts hook to prevent state desync
    // const { addComment } = usePosts(); 
    const [comment, setComment] = useState('');
    const [isAnonymous, setIsAnonymous] = useState(false);

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

    // Adjusted to fit "perfectly" in screen, avoiding full-height stretch.
    const [isHovered, setIsHovered] = useState(false);

    return (
        <View
            className="absolute top-4 right-16 bottom-4 w-full sm:w-[520px] z-50 justify-center"
            // @ts-ignore - React Native Web supports these props
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            <View className="flex-1 relative">
                {/* --- MAIN CARD CONTENT --- */}
                <View className="flex-1 bg-[#1E293B] rounded-[32px] shadow-2xl flex-col border border-white/10 overflow-hidden">
                    {/* Header */}
                    <View className="flex-row items-center justify-between px-6 py-5 border-b border-white/5 bg-[#1E293B]">
                        <TouchableOpacity onPress={onClose} className="p-2 -ml-2 rounded-full hover:bg-slate-800">
                            <X size={24} color="#CBD5E1" />
                        </TouchableOpacity>
                        <Text className="text-white font-bold text-base">게시글 상세</Text>
                        <TouchableOpacity>
                            <MoreHorizontal size={24} color="#94A3B8" />
                        </TouchableOpacity>
                    </View>

                    <KeyboardAvoidingView
                        behavior={Platform.OS === "ios" ? "padding" : "height"}
                        className="flex-1"
                        keyboardVerticalOffset={0}
                    >
                        <ScrollView className="flex-1 p-5">
                            {/* Post Content */}
                            <View className="mb-8">
                                <TouchableOpacity
                                    className="flex-row items-center mb-4"
                                    onPress={() => !post.isAnonymous && post.authorId && onProfilePress && onProfilePress(post.authorId)}
                                    disabled={post.isAnonymous}
                                >
                                    <View className={`w-10 h-10 rounded-full items-center justify-center mr-3 ${post.isAnonymous ? 'bg-slate-700' : 'bg-indigo-500'}`}>
                                        {post.isAnonymous ? <User size={18} color="#94A3B8" /> : <Text className="text-white font-bold">{post.author[0]}</Text>}
                                    </View>
                                    <View>
                                        <Text className="text-white font-bold text-base">{post.isAnonymous ? 'Anonymous' : post.author}</Text>
                                        <Text className="text-slate-500 text-xs">{post.timestamp} · {post.category}</Text>
                                    </View>
                                </TouchableOpacity>

                                <Text className="text-white text-xl font-bold mb-3 leading-8">{post.title}</Text>
                                <Text className="text-slate-300 text-base leading-7 mb-4 whitespace-pre-wrap">{post.content}</Text>

                                {post.imageUrl && (
                                    <Image
                                        source={{ uri: post.imageUrl }}
                                        className="w-full h-60 rounded-xl bg-slate-800 mb-4"
                                        resizeMode="cover"
                                    />
                                )}

                                <View className="flex-row gap-4 py-3 border-t border-white/5 border-b border-white/5">
                                    <View className="flex-row items-center gap-2">
                                        <Heart size={18} color={post.likes > 0 ? "#F87171" : "#94A3B8"} />
                                        <Text className="text-slate-400 text-sm">{post.likes}</Text>
                                    </View>
                                    <View className="flex-row items-center gap-2">
                                        <MessageCircle size={18} color="#60A5FA" />
                                        <Text className="text-slate-400 text-sm">{post.comments}</Text>
                                    </View>
                                </View>
                            </View>

                            {/* Comments Section */}
                            <View className="mb-20">
                                <Text className="text-white font-bold mb-4">댓글 {post.commentsList?.length || 0}개</Text>

                                {(post.commentsList || []).map((comment, index) => (
                                    <View key={comment.id || index} className="flex-row mb-5 border-b border-white/5 pb-4 last:border-0">
                                        <View className={`w-8 h-8 rounded-full items-center justify-center mr-3 mt-1 ${comment.isAnonymous ? 'bg-slate-700' : 'bg-green-600'}`}>
                                            {comment.isAnonymous ? <User size={14} color="#94A3B8" /> : <Text className="text-white text-xs font-bold">{comment.author[0]}</Text>}
                                        </View>
                                        <View className="flex-1">
                                            <View className="flex-row items-center mb-1">
                                                <Text className="text-slate-300 font-bold text-sm mr-2">{comment.author}</Text>
                                                <Text className="text-slate-600 text-xs">{comment.timestamp}</Text>
                                            </View>
                                            <Text className="text-slate-400 text-sm leading-5">{comment.content}</Text>
                                        </View>
                                    </View>
                                ))}
                            </View>
                        </ScrollView>

                        {/* Comment Input Only (Nav Removed) */}
                        <View className="bg-[#1E293B] border-t border-white/10 p-4">
                            {/* Anonymous Toggle */}
                            <View className="flex-row items-center mb-3">
                                <TouchableOpacity
                                    onPress={() => setIsAnonymous(!isAnonymous)}
                                    className="flex-row items-center"
                                >
                                    <View className={`w-4 h-4 rounded border mr-2 items-center justify-center ${isAnonymous ? 'bg-blue-600 border-blue-600' : 'border-slate-600'}`}>
                                        {isAnonymous && <Check size={10} color="white" />}
                                    </View>
                                    <Text className="text-slate-400 text-xs">익명으로 댓글 달기</Text>
                                </TouchableOpacity>
                            </View>

                            <View className="flex-row gap-2">
                                <TextInput
                                    className="flex-1 bg-slate-900/50 text-white rounded-xl px-4 py-3 border border-white/5 text-sm"
                                    placeholder="댓글을 남겨보세요..."
                                    placeholderTextColor="#64748B"
                                    value={comment}
                                    onChangeText={setComment}
                                    multiline
                                />
                                <TouchableOpacity
                                    className={`w-12 items-center justify-center rounded-xl ${comment.trim() ? 'bg-blue-600' : 'bg-slate-800'}`}
                                    onPress={handleSubmitComment}
                                    disabled={!comment.trim()}
                                >
                                    <Send size={18} color={comment.trim() ? 'white' : '#64748B'} />
                                </TouchableOpacity>
                            </View>
                        </View>
                    </KeyboardAvoidingView>
                </View>

                {/* --- FLOATING NAVIGATION BUTTONS (Outside Card) --- */}
                {/* PREV BUTTON (Left) */}
                {hasPrev && (
                    <TouchableOpacity
                        onPress={onPrev}
                        className={`absolute -left-16 w-12 h-12 rounded-full bg-slate-800/90 border border-white/20 items-center justify-center hover:bg-slate-700 hover:scale-105 transition-all duration-200 z-50 shadow-xl ${isHovered ? 'opacity-100' : 'opacity-0'}`}
                        style={{ top: '50%', marginTop: -24 }}
                    >
                        <ChevronLeft size={24} color="#E2E8F0" />
                    </TouchableOpacity>
                )}

                {/* NEXT BUTTON (Right) */}
                {hasNext && (
                    <TouchableOpacity
                        onPress={onNext}
                        className={`absolute -right-14 w-12 h-12 rounded-full bg-slate-800/90 border border-white/20 items-center justify-center hover:bg-slate-700 hover:scale-105 transition-all duration-200 z-50 shadow-xl ${isHovered ? 'opacity-100' : 'opacity-0'}`}
                        style={{ top: '50%', marginTop: -24 }}
                    >
                        <ChevronRight size={24} color="#E2E8F0" />
                    </TouchableOpacity>
                )}
            </View>
        </View>
    );
};
