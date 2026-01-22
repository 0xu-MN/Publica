import React, { useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, Image, ScrollView, Pressable } from 'react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withTiming,
    interpolate,
    Extrapolation
} from 'react-native-reanimated';
import { MessageCircle, Heart, User, ChevronLeft, ChevronRight, Share2, MoreHorizontal, Bookmark, RotateCcw, Trash2, Edit2 } from 'lucide-react-native';
import { CommunityPost } from '../data/mockData';
import { usePosts } from '../hooks/usePosts';

interface FlippablePostCardProps {
    post: CommunityPost;
    isOpen: boolean;
    onToggle: () => void;
    onNext: () => void;
    onPrev: () => void;
    hasNext: boolean;
    hasPrev: boolean;
    currentUserId?: string;
    onDelete?: (id: string) => void;
    onEdit?: (id: string) => void;
}

export const FlippablePostCard = ({ post, isOpen, onToggle, onNext, onPrev, hasNext, hasPrev, currentUserId, onDelete, onEdit }: FlippablePostCardProps) => {
    const { toggleLike, toggleScrap } = usePosts();
    const flipAnim = useSharedValue(0);

    // Sync shared value with prop
    useEffect(() => {
        flipAnim.value = withTiming(isOpen ? 1 : 0, { duration: 500 });
    }, [isOpen]);

    const handleLike = (e: any) => {
        e.stopPropagation();
        toggleLike(post.id);
    };

    const handleScrap = (e: any) => {
        e.stopPropagation();
        toggleScrap(post.id);
    };

    const frontAnimatedStyle = useAnimatedStyle(() => {
        const rotateValue = interpolate(flipAnim.value, [0, 1], [0, 180]);
        return {
            transform: [
                { rotateY: `${rotateValue} deg` }
            ],
            opacity: interpolate(flipAnim.value, [0, 0.5, 1], [1, 0, 0], Extrapolation.CLAMP),
            zIndex: flipAnim.value < 0.5 ? 1 : 0,
            display: flipAnim.value > 0.5 ? 'none' : 'flex' // Performance opt
        };
    });

    const backAnimatedStyle = useAnimatedStyle(() => {
        const rotateValue = interpolate(flipAnim.value, [0, 1], [180, 360]);
        return {
            transform: [
                { rotateY: `${rotateValue} deg` }
            ],
            opacity: interpolate(flipAnim.value, [0, 0.5, 1], [0, 0, 1], Extrapolation.CLAMP),
            zIndex: flipAnim.value > 0.5 ? 1 : 0,
            display: flipAnim.value < 0.5 ? 'none' : 'flex'
        };
    });

    return (
        <View className="w-full h-[320px] mb-6 relative">
            <TouchableOpacity
                activeOpacity={1}
                onPress={onToggle}
                className="w-full h-full relative"
            >
                {/* FRONT FACE */}
                <Animated.View
                    style={[frontAnimatedStyle, { backfaceVisibility: 'hidden', position: 'absolute', width: '100%', height: '100%' }]}
                    className="bg-[#1E293B] rounded-2xl border border-white/5 p-5 justify-between shadow-xl"
                >
                    <View>
                        <View className="flex-row items-center mb-3">
                            <View className="bg-blue-500/10 px-2.5 py-1 rounded-lg border border-blue-500/20">
                                <Text className="text-blue-400 text-[10px] font-bold">{post.category}</Text>
                            </View>
                            <Text className="text-slate-500 text-[10px] ml-auto">{post.timestamp}</Text>
                        </View>

                        <Text className="text-white text-base font-bold mb-2 leading-6" numberOfLines={2}>
                            {post.title}
                        </Text>

                        <Text className="text-slate-400 text-xs leading-4 mb-3" numberOfLines={3}>
                            {post.content}
                        </Text>
                    </View>

                    {/* Image at Bottom Logic */}
                    <View>
                        {post.imageUrl && (
                            <Image
                                source={{ uri: post.imageUrl }}
                                className="w-full h-24 rounded-xl mb-3 bg-slate-800"
                                resizeMode="cover"
                            />
                        )}

                        <View className="flex-row items-center justify-between pt-3 border-t border-white/5">
                            <View className="flex-row items-center">
                                <View className={`w-5 h-5 rounded-full items-center justify-center mr-2 ${post.isAnonymous ? 'bg-slate-600' : 'bg-indigo-500'}`}>
                                    {post.isAnonymous ? (
                                        <User size={12} color="#94A3B8" />
                                    ) : (
                                        <Text className="text-white text-[10px] font-bold">{post.author[0]}</Text>
                                    )}
                                </View>
                                <Text className="text-slate-400 text-xs font-medium" numberOfLines={1}>
                                    {post.isAnonymous ? '익명' : post.author}
                                </Text>
                            </View>

                            <View className="flex-row gap-3">
                                <View className="flex-row items-center">
                                    <Heart size={14} color="#F87171" className="opacity-80" />
                                    <Text className="text-slate-500 text-[10px] ml-1">{post.likes}</Text>
                                </View>
                                <View className="flex-row items-center">
                                    <MessageCircle size={14} color="#60A5FA" className="opacity-80" />
                                    <Text className="text-slate-500 text-[10px] ml-1">{post.comments}</Text>
                                </View>
                            </View>
                        </View>
                    </View>
                </Animated.View>

                {/* BACK FACE (Details + Nav) */}
                <Animated.View
                    style={[backAnimatedStyle, { backfaceVisibility: 'hidden', position: 'absolute', width: '100%', height: '100%' }]}
                    className="bg-[#0F172A] rounded-2xl border border-blue-500/30 p-5 shadow-2xl shadow-blue-500/10 justify-between"
                >
                    <View className="flex-1">
                        <View className="flex-row items-center justify-between mb-2 pb-2 border-b border-white/5">
                            <Text className="text-blue-400 text-xs font-bold">상세 내용</Text>
                            {/* Edit/Delete Buttons for Author */}
                            {currentUserId && post.authorId === currentUserId && (
                                <View className="flex-row gap-3">
                                    <TouchableOpacity onPress={() => onEdit?.(post.id)}>
                                        <Text className="text-slate-400 text-[10px] hover:text-white">수정</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity onPress={() => onDelete?.(post.id)}>
                                        <Text className="text-red-400 text-[10px] hover:text-red-300">삭제</Text>
                                    </TouchableOpacity>
                                </View>
                            )}
                        </View>

                        <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
                            <Text className="text-white text-base font-bold mb-3 leading-6">
                                {post.title}
                            </Text>
                            <Text className="text-slate-300 text-xs leading-5 mb-4">
                                {post.content}
                            </Text>
                            {/* Comments Section Mock */}
                            <View className="bg-slate-800/50 p-3 rounded-xl mb-4">
                                <Text className="text-slate-400 text-[10px] mb-2">댓글 {post.comments}개</Text>
                                <View className="flex-row items-start mb-2">
                                    <View className="w-5 h-5 rounded-full bg-indigo-500 mr-2 items-center justify-center"><Text className="text-[10px] text-white">L</Text></View>
                                    <Text className="text-slate-300 text-[11px] flex-1">좋은 정보 감사합니다!</Text>
                                </View>
                            </View>
                        </ScrollView>
                    </View>

                    {/* Navigation Controls */}
                    <View className="flex-row justify-between items-center pt-3 border-t border-white/10">
                        <TouchableOpacity
                            onPress={(e) => { e.stopPropagation(); onPrev(); }}
                            disabled={!hasPrev}
                            className={`p-2 rounded-full border border-white/10 ${!hasPrev ? 'opacity-30' : 'active:bg-slate-800'}`}
                        >
                            <ChevronLeft size={18} color="#fff" />
                        </TouchableOpacity>

                        <TouchableOpacity onPress={onToggle}>
                            <Text className="text-slate-500 text-[10px]">닫기</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            onPress={(e) => { e.stopPropagation(); onNext(); }}
                            disabled={!hasNext}
                            className={`p-2 rounded-full border border-white/10 ${!hasNext ? 'opacity-30' : 'active:bg-slate-800'}`}
                        >
                            <ChevronRight size={18} color="#fff" />
                        </TouchableOpacity>
                    </View>
                </Animated.View>
            </TouchableOpacity>
        </View>
    );
};
