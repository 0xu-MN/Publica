import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { User, MessageCircle, Heart } from 'lucide-react-native';
import { CommunityPost } from '../data/mockData';
import { useAuth } from '../contexts/AuthContext';

// Interface update
interface TimelinePostProps {
    post: CommunityPost;
    isLast: boolean;
    onPress: () => void;
    onProfilePress: (userId: string) => void;
    onLike?: (postId: string) => void;
}

const getColor = (str: string) => {
    const colors = ['#EF4444', '#F59E0B', '#10B981', '#3B82F6', '#6366F1', '#8B5CF6', '#EC4899'];
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
};

export const TimelinePost = ({ post, isLast, onPress, onProfilePress, onLike }: TimelinePostProps) => {
    const { user } = useAuth();
    const isLiked = post.likedBy?.includes(user?.id || '');

    return (
        <View className="flex-row w-full min-h-[140px]"> {/* Min height for spacing */}

            {/* Left Timeline Column (Avatar + Line + Name Area) */}
            <View className="flex-row items-start mr-3 flex-1 relative">

                {/* 1. Vertical Line */}
                {!isLast && (
                    <View className="absolute left-[20px] top-[40px] bottom-[-20px] w-0.5 bg-[#E2E8F0] -z-10" />
                )}

                {/* 2. Avatar */}
                <TouchableOpacity
                    onPress={() => !post.isAnonymous && post.authorId && onProfilePress(post.authorId)}
                    activeOpacity={post.isAnonymous ? 1 : 0.7}
                    className={`w-10 h-10 rounded-full items-center justify-center border-2 border-white shadow-sm ${post.isAnonymous ? 'bg-[#F1F5F9]' : ''} mr-3`}
                    style={!post.isAnonymous ? { backgroundColor: getColor(post.author) } : {}}
                    disabled={post.isAnonymous}
                >
                    {post.isAnonymous ? (
                        <User size={16} color="#7C3AED" />
                    ) : (
                        <Text className="text-white font-bold text-sm">{post.author[0]?.toUpperCase()}</Text>
                    )}
                </TouchableOpacity>

                {/* 3. Right Content Column (Name + Title/Content) */}
                <View className="flex-1 pt-1">

                    {/* Header: Name, Category, Timestamp (Aligned with Avatar Top) */}
                    <View className="flex-row items-center mb-1 flex-wrap">
                        <TouchableOpacity
                            onPress={() => !post.isAnonymous && post.authorId && onProfilePress(post.authorId)}
                            disabled={post.isAnonymous}
                        >
                            <Text className="text-[#27272a] font-bold text-sm mr-2 hover:underline">
                                {post.isAnonymous ? '익명' : post.author}
                            </Text>
                        </TouchableOpacity>

                        {!post.isAnonymous && post.role && (
                            <Text className="text-[#64748B] text-xs mr-2">{post.role}</Text>
                        )}

                        <View className="bg-[#7C3AED]/10 px-2 py-0.5 rounded-lg mr-2 border border-[#7C3AED]/10">
                            <Text className="text-[#7C3AED] text-[10px] font-bold tracking-tight">{post.category}</Text>
                        </View>
                        <Text className="text-[#94A3B8] text-[11px] font-medium">{post.timestamp}</Text>
                    </View>

                    {/* Content Bubble (Clickable) */}
                    <TouchableOpacity
                        className="mt-1.5 mb-10"
                        onPress={onPress}
                        activeOpacity={0.9}
                    >
                        {/* Title */}
                        <Text className="text-[#27272a] font-bold text-base mb-2.5 leading-6">{post.title}</Text>

                        {/* Main Bubble Box */}
                        <View className="bg-white rounded-[24px] rounded-tl-none p-5 border border-[#E2E8F0] shadow-sm shadow-black/5 relative self-start w-full sm:w-auto sm:min-w-[350px] sm:max-w-[700px]">
                            <Text className="text-[#475569] text-sm leading-6 whitespace-pre-wrap font-medium" numberOfLines={3}>
                                {post.content}
                            </Text>

                            {/* Interactions inside bubble */}
                            <View className="flex-row items-center gap-5 mt-4 pt-4 border-t border-[#F1F5F9]">
                                <TouchableOpacity
                                    className="flex-row items-center gap-1.5"
                                    onPress={() => onLike && onLike(post.id)}
                                >
                                    <Heart
                                        size={14}
                                        color={isLiked ? "#F87171" : "#94A3B8"}
                                        fill={isLiked ? "#F87171" : "none"}
                                    />
                                    <Text className={`${isLiked ? 'text-red-500' : 'text-[#64748B]'} text-xs font-bold`}>{post.likes}</Text>
                                </TouchableOpacity>
                                <View className="flex-row items-center gap-1.5">
                                    <MessageCircle size={14} color={post.comments > 0 ? "#7C3AED" : "#94A3B8"} />
                                    <Text className={`${post.comments > 0 ? 'text-[#7C3AED]' : 'text-[#64748B]'} text-xs font-bold`}>{post.comments}</Text>
                                </View>
                            </View>
                        </View>
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );
};
