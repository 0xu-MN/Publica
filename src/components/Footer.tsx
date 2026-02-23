import React from 'react';
import { View, Text, TouchableOpacity, Linking } from 'react-native';
import { Icons } from '../utils/icons';

const Footer = () => {
    return (
        <View className="border-t border-white/10 mt-12 bg-[#050B14]">
            <View className="max-w-[1400px] w-full mx-auto px-6 py-12">
                <View className="flex-row flex-wrap justify-between gap-8">
                    {/* Left: Brand & Business Info */}
                    <View className="gap-4">
                        <View>
                            <Text className="text-white font-bold text-xl mb-1">Publica</Text>
                            <Text className="text-slate-500 text-sm">Empowering Researchers & Founders</Text>
                        </View>

                        <View className="gap-1">
                            <Text className="text-slate-600 text-xs">상호명: HALOFORGE | 대표자: 홍수민</Text>
                            <Text className="text-slate-600 text-xs">사업자등록번호: 846-04-03662 | 통신판매업신고: 2026-서울강남-00000</Text>
                            <Text className="text-slate-600 text-xs">주소: 경기도 안산시 단원구 고잔로 57-11</Text>
                            <Text className="text-slate-600 text-xs">문의: contact@publica.ai | 02-1234-5678</Text>
                        </View>

                        <Text className="text-slate-700 text-[10px] mt-2">
                            Copyright © 2026 Publica Inc. All rights reserved.
                        </Text>
                    </View>

                    {/* Right: SNS & Links */}
                    <View className="gap-6">
                        <View className="flex-row items-center gap-4">
                            <TouchableOpacity className="bg-slate-800/50 p-3 rounded-full hover:bg-slate-700 transition-all border border-white/5">
                                <Icons.Youtube size={20} color="#94A3B8" />
                            </TouchableOpacity>
                            <TouchableOpacity className="bg-slate-800/50 p-3 rounded-full hover:bg-slate-700 transition-all border border-white/5">
                                <Icons.Twitter size={20} color="#94A3B8" />
                            </TouchableOpacity>
                            <TouchableOpacity className="bg-slate-800/50 p-3 rounded-full hover:bg-slate-700 transition-all border border-white/5">
                                <Icons.Instagram size={20} color="#94A3B8" />
                            </TouchableOpacity>
                            <TouchableOpacity className="bg-slate-800/50 p-3 rounded-full hover:bg-slate-700 transition-all border border-white/5">
                                <Icons.Send size={20} color="#94A3B8" />
                            </TouchableOpacity>
                        </View>

                        <View className="flex-row gap-6">
                            <TouchableOpacity><Text className="text-slate-500 text-xs hover:text-slate-300">이용약관</Text></TouchableOpacity>
                            <TouchableOpacity><Text className="text-slate-500 text-xs hover:text-slate-300">개인정보처리방침</Text></TouchableOpacity>
                            <TouchableOpacity><Text className="text-slate-500 text-xs hover:text-slate-300">운영정책</Text></TouchableOpacity>
                        </View>
                    </View>
                </View>
            </View>
        </View>
    );
};

export default Footer;
