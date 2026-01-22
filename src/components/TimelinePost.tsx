import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { User, MessageCircle, Heart } from 'lucide-react-native';
import { CommunityPost } from '../data/mockData';

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
    return (
        <View className="flex-row w-full min-h-[140px]"> {/* Min height for spacing */}

            {/* Left Timeline Column (Avatar + Line + Name Area) */}
            <View className="flex-row items-start mr-3 flex-1 relative">

                {/* 1. Vertical Line (Absolute positioned to align with Avatar center) */}
                {!isLast && (
                    <View className="absolute left-[20px] top-[40px] bottom-[-20px] w-0.5 bg-slate-800 -z-10" />
                )}

                {/* 2. Avatar */}
                <TouchableOpacity
                    onPress={() => !post.isAnonymous && post.authorId && onProfilePress(post.authorId)}
                    activeOpacity={post.isAnonymous ? 1 : 0.7}
                    className={`w-10 h-10 rounded-full items-center justify-center border-4 border-[#020617] ${post.isAnonymous ? 'bg-slate-700' : ''} mr-3`}
                    style={!post.isAnonymous ? { backgroundColor: getColor(post.author) } : {}}
                    disabled={post.isAnonymous}
                >
                    {post.isAnonymous ? (
                        <User size={16} color="#94A3B8" />
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
                            <Text className="text-white font-bold text-sm mr-2 hover:underline">
                                {post.isAnonymous ? '익명' : post.author}
                            </Text>
                        </TouchableOpacity>

                        {!post.isAnonymous && post.role && (
                            <Text className="text-slate-500 text-xs mr-2">{post.role}</Text>
                        )}

                        <View className="bg-slate-800/50 px-2 py-0.5 rounded mr-2 border border-white/5">
                            <Text className="text-blue-400 text-[10px] font-bold">{post.category}</Text>
                        </View>
                        <Text className="text-slate-600 text-xs">{post.timestamp}</Text>
                    </View>

                    {/* Content Bubble (Clickable) */}
                    <TouchableOpacity
                        className="mt-1 mb-8"
                        onPress={onPress}
                        activeOpacity={0.9}
                    >
                        {/* Title */}
                        <Text className="text-white/90 font-bold text-base mb-2 leading-6">{post.title}</Text>

                        {/* Main Bubble Box */}
                        <View className="bg-[#1E293B] rounded-2xl p-4 border border-white/5 shadow-sm relative self-start w-full sm:w-auto sm:min-w-[300px] sm:max-w-[600px]">
                            <Text className="text-slate-300 text-sm leading-6 whitespace-pre-wrap" numberOfLines={3}>
                                {post.content}
                            </Text>

                            {/* Interactions inside bubble or below? Design usually has them inside or just below. Let's put inside based on "comment too" request */}
                            <View className="flex-row items-center gap-4 mt-3 pt-3 border-t border-white/5">
                                <TouchableOpacity
                                    className="flex-row items-center gap-1.5 opacity-80"
                                    onPress={() => onLike && onLike(post.id)}
                                >
                                    <Heart size={14} color={post.likes > 0 ? "#F87171" : "#94A3B8"} fill={post.likes > 0 ? "#F87171" : "none"} />
                                    <Text className={`${post.likes > 0 ? 'text-red-400' : 'text-slate-500'} text-xs`}>{post.likes}</Text>
                                </TouchableOpacity>
                                <View className="flex-row items-center gap-1.5 opacity-80">
                                    <MessageCircle size={14} color={post.comments > 0 ? "#60A5FA" : "#94A3B8"} />
                                    <Text className={`${post.comments > 0 ? 'text-blue-400' : 'text-slate-500'} text-xs`}>{post.comments}</Text>
                                </View>
                            </View>
                        </View>
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );
};
