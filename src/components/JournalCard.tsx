import React from 'react';
import { View, Text, TouchableOpacity, Linking, Platform } from 'react-native';
import { ExternalLink, Sparkles, Newspaper, ChevronRight } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

export interface AICardNews {
    id: string;
    headline: string;
    body: string;
    bullets: string[];
    related_materials: { title: string; url: string }[];
    created_at: string;
}

interface JournalCardProps {
    item: AICardNews;
    index: number;
    progress: any; // From VerticalStackCarousel
    totalItems: number;
}

export const JournalCard: React.FC<JournalCardProps> = ({ item, index }) => {
    return (
        <View
            className="w-full h-full rounded-[35px] overflow-hidden border border-white/10 bg-[#1e293b]"
            style={{
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 10 },
                shadowOpacity: 0.3,
                shadowRadius: 15,
                elevation: 10,
            }}
        >
            <LinearGradient
                colors={['#1e293b', '#0f172a']}
                className="absolute inset-0"
            />

            <View className="p-7 flex-1 justify-between">
                {/* Header */}
                <View>
                    <View className="flex-row items-center justify-between mb-4">
                        <View className="flex-row items-center bg-blue-500/10 px-3 py-1.5 rounded-full border border-blue-500/20">
                            <Sparkles size={14} color="#3B82F6" />
                            <Text className="text-blue-400 text-[11px] font-bold ml-1.5 uppercase tracking-wider">AI Reconstructed</Text>
                        </View>
                        <View className="bg-white/5 p-2 rounded-full">
                            <Newspaper size={16} color="#94A3B8" />
                        </View>
                    </View>

                    <Text className="text-white text-[22px] font-black leading-8 mb-4">
                        {item.headline}
                    </Text>

                    <Text className="text-slate-300 text-[15px] leading-6 mb-6 font-medium">
                        {item.body}
                    </Text>

                    {/* Bullets */}
                    <View className="space-y-3">
                        {item.bullets.slice(0, 3).map((bullet, idx) => (
                            <View key={idx} className="flex-row items-start">
                                <View className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-2 mr-3" />
                                <Text className="flex-1 text-slate-400 text-[13px] leading-5">{bullet}</Text>
                            </View>
                        ))}
                    </View>
                </View>

                {/* Related Materials */}
                <View className="mt-6 border-t border-white/5 pt-6">
                    <Text className="text-slate-500 text-[11px] font-bold uppercase tracking-widest mb-4">Related Materials</Text>
                    <View className="flex-row flex-wrap gap-2">
                        {item.related_materials.slice(0, 2).map((material, idx) => (
                            <TouchableOpacity
                                key={idx}
                                className="bg-white/5 px-4 py-3 rounded-2xl border border-white/5 flex-row items-center"
                                style={{ width: '100%' }}
                                onPress={() => material.url && Linking.openURL(material.url)}
                            >
                                <View className="flex-1 mr-2">
                                    <Text className="text-slate-300 text-xs font-bold" numberOfLines={1}>{material.title}</Text>
                                </View>
                                <ExternalLink size={12} color="#64748B" />
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>
            </View>
        </View>
    );
};
