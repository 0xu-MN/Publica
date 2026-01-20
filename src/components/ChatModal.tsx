import React from 'react';
import { View, Text, TouchableOpacity, TextInput, Modal, KeyboardAvoidingView, Platform } from 'react-native';
import { X, Send, Paperclip, MoreVertical } from 'lucide-react-native';

interface ChatModalProps {
    visible: boolean;
    onClose: () => void;
}

export const ChatModal = ({ visible, onClose }: ChatModalProps) => {
    return (
        <Modal
            animationType="slide"
            transparent={true}
            visible={visible}
            onRequestClose={onClose}
        >
            <View className="flex-1 justify-end sm:justify-center sm:items-center bg-black/60">
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    className="w-full sm:w-[400px] sm:h-[600px] h-[85%] bg-[#1E293B] sm:rounded-3xl rounded-t-3xl border border-white/10 overflow-hidden shadow-2xl"
                >
                    {/* Header */}
                    <View className="px-5 py-4 bg-[#0F172A] border-b border-white/5 flex-row items-center justify-between">
                        <View className="flex-row items-center">
                            <View className="w-10 h-10 rounded-full bg-blue-500 items-center justify-center mr-3 relative">
                                <Text className="text-white font-bold">H</Text>
                                <View className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-[#0F172A]" />
                            </View>
                            <View>
                                <Text className="text-white font-bold text-base">Hong56800</Text>
                                <Text className="text-slate-400 text-xs">Online</Text>
                            </View>
                        </View>
                        <View className="flex-row items-center gap-2">
                            <TouchableOpacity className="p-2">
                                <MoreVertical size={20} color="#94A3B8" />
                            </TouchableOpacity>
                            <TouchableOpacity onPress={onClose} className="p-2 bg-white/5 rounded-full hover:bg-white/10">
                                <X size={20} color="#fff" />
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Chat Area */}
                    <View className="flex-1 bg-[#050B14] p-4">
                        {/* Automated Welcome Message (Toss Style) */}
                        <View className="items-start mb-6">
                            <View className="flex-row items-end">
                                <View className="w-8 h-8 rounded-full bg-blue-500 items-center justify-center mr-2 mb-4">
                                    <Text className="text-white text-xs font-bold">H</Text>
                                </View>
                                <View>
                                    <View className="bg-[#1E293B] p-4 rounded-2xl rounded-tl-none border border-white/5 mb-2 max-w-[280px]">
                                        <Text className="text-slate-200 text-sm leading-5">
                                            안녕하세요, Hong56800입니다. 👋{'\n'}
                                            협업 제안이나 문의사항이 있으시면 언제든 메시지 남겨주세요.
                                        </Text>
                                    </View>
                                    <Text className="text-slate-500 text-[10px] ml-1">오후 3:19</Text>
                                </View>
                            </View>
                        </View>
                    </View>

                    {/* Input Area */}
                    <View className="p-4 bg-[#0F172A] border-t border-white/5">
                        <View className="flex-row items-center bg-[#1E293B] rounded-full px-4 py-2 border border-white/5">
                            <TouchableOpacity className="mr-3">
                                <Paperclip size={20} color="#94A3B8" />
                            </TouchableOpacity>
                            <TextInput
                                className="flex-1 text-white py-2 text-sm max-h-24"
                                placeholder="메시지 보내기..."
                                placeholderTextColor="#64748B"
                                multiline
                            />
                            <TouchableOpacity className="ml-3 bg-blue-600 p-2 rounded-full">
                                <Send size={16} color="#fff" />
                            </TouchableOpacity>
                        </View>
                        <Text className="text-center text-slate-600 text-[10px] mt-3">
                            개인정보 보호를 위해 민감한 정보는 주의해주세요.
                        </Text>
                    </View>
                </KeyboardAvoidingView>
            </View>
        </Modal>
    );
};
