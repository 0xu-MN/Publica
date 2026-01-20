import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { MessageCircle, Heart, User } from 'lucide-react-native';
import { CommunityPost } from '../data/mockData';

interface CommunityPostCardProps {
    post: CommunityPost;
    onPress: () => void;
}

export const CommunityPostCard: React.FC<CommunityPostCardProps> = ({ post, onPress }) => {
    return (
        <TouchableOpacity
            onPress={onPress}
            className="bg-[#1E293B] rounded-2xl p-5 mb-4 border border-white/5 hover:border-blue-500/30 active:bg-slate-800 transition-all"
        >
            <View className="flex-row items-center justify-between mb-3">
                <View className="flex-row items-center">
                    {/* Category Badge */}
                    <View className="bg-blue-500/10 px-2.5 py-1 rounded-lg mr-2.5 border border-blue-500/20">
                        <Text className="text-blue-400 text-[11px] font-bold">{post.category}</Text>
                    </View>

                    {/* Author Info */}
                    <View className="flex-row items-center">
                        <View className={`w-5 h-5 rounded-full items-center justify-center mr-1.5 ${post.isAnonymous ? 'bg-slate-600' : 'bg-indigo-500'}`}>
                            {post.isAnonymous ? (
                                <User size={12} color="#94A3B8" />
                            ) : (
                                <Text className="text-white text-[10px] font-bold">{post.author[0]}</Text>
                            )}
                        </View>
                        <Text className="text-slate-400 text-xs font-medium">
                            {post.isAnonymous ? '익명' : post.author}
                        </Text>
                        {!post.isAnonymous && post.role && (
                            <Text className="text-slate-500 text-[11px] ml-1.5">• {post.role}</Text>
                        )}
                    </View>
                </View>
                <Text className="text-slate-500 text-[11px]">{post.timestamp}</Text>
            </View>

            <Text className="text-white text-[17px] font-bold mb-2 leading-6" numberOfLines={1}>
                {post.title}
            </Text>
            <Text className="text-slate-400 text-[14px] leading-5 mb-4" numberOfLines={2}>
                {post.content}
            </Text>

            <View className="flex-row items-center justify-between border-t border-white/5 pt-3">
                <View className="flex-row gap-4">
                    <View className="flex-row items-center">
                        <Heart size={16} color="#F87171" className="opacity-90" />
                        <Text className="text-slate-400 text-xs ml-1.5 font-medium">{post.likes}</Text>
                    </View>
                    <View className="flex-row items-center">
                        <MessageCircle size={16} color="#60A5FA" className="opacity-90" />
                        <Text className="text-slate-400 text-xs ml-1.5 font-medium">{post.comments}</Text>
                    </View>
                </View>
                {/* Visual indicator for 'Read More' or just emptiness for cleaner look */}
            </View>
        </TouchableOpacity>
    );
};
