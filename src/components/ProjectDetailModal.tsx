import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, ScrollView } from 'react-native';
import { X, Folder, FileText, ChevronRight, File, Plus, Upload, MoreVertical, FolderOpen } from 'lucide-react-native';

interface ProjectDetailModalProps {
    visible: boolean;
    onClose: () => void;
    projectName: string;
}

const PROJECT_FILES = [
    { id: 1, name: 'README.md', type: 'file', size: '2.4 KB', modified: '2시간 전' },
    { id: 2, name: 'src', type: 'folder', count: 12, modified: '1시간 전' },
    { id: 3, name: 'package.json', type: 'file', size: '1.2 KB', modified: '어제' },
    { id: 4, name: 'docs', type: 'folder', count: 5, modified: '3일 전' },
    { id: 5, name: 'tsconfig.json', type: 'file', size: '0.8 KB', modified: '1주일 전' },
    { id: 6, name: 'assets', type: 'folder', count: 24, modified: '2일 전' },
];

export const ProjectDetailModal = ({ visible, onClose, projectName }: ProjectDetailModalProps) => {
    const [currentPath, setCurrentPath] = useState(['Root']);

    return (
        <Modal
            animationType="fade"
            transparent={true}
            visible={visible}
            onRequestClose={onClose}
        >
            <View className="flex-1 bg-black/60 justify-center items-center p-6">
                <View className="w-full max-w-5xl h-[600px] bg-[#0F172A] rounded-3xl border border-white/10 overflow-hidden">

                    {/* Header */}
                    <View className="px-6 py-4 bg-[#1E293B] border-b border-white/5 flex-row items-center justify-between">
                        <View className="flex-1">
                            <Text className="text-white font-bold text-xl mb-1">{projectName}</Text>
                            <View className="flex-row items-center gap-2">
                                <FolderOpen size={14} color="#94A3B8" />
                                <Text className="text-slate-400 text-xs">{currentPath.join(' / ')}</Text>
                            </View>
                        </View>
                        <View className="flex-row items-center gap-2">
                            <TouchableOpacity className="bg-blue-600 px-4 py-2 rounded-lg flex-row items-center gap-2">
                                <Plus size={16} color="#fff" />
                                <Text className="text-white font-bold text-sm">새 파일</Text>
                            </TouchableOpacity>
                            <TouchableOpacity className="bg-white/5 px-4 py-2 rounded-lg flex-row items-center gap-2">
                                <Upload size={16} color="#94A3B8" />
                                <Text className="text-slate-300 font-bold text-sm">업로드</Text>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={onClose} className="p-2 bg-white/5 rounded-full hover:bg-white/10">
                                <X size={20} color="#fff" />
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* File List */}
                    <ScrollView className="flex-1">
                        <View className="p-6">
                            {/* Table Header */}
                            <View className="flex-row items-center px-4 py-2 mb-2">
                                <View className="flex-1">
                                    <Text className="text-slate-500 text-xs font-bold uppercase">이름</Text>
                                </View>
                                <View className="w-32">
                                    <Text className="text-slate-500 text-xs font-bold uppercase">크기</Text>
                                </View>
                                <View className="w-32">
                                    <Text className="text-slate-500 text-xs font-bold uppercase">수정일</Text>
                                </View>
                                <View className="w-10" />
                            </View>

                            {/* File Items */}
                            <View className="gap-1">
                                {PROJECT_FILES.map((item) => (
                                    <TouchableOpacity
                                        key={item.id}
                                        className="flex-row items-center px-4 py-3 rounded-xl hover:bg-white/5 border border-transparent hover:border-white/10"
                                    >
                                        <View className="flex-row items-center flex-1 gap-3">
                                            {item.type === 'folder' ? (
                                                <Folder size={20} color="#3B82F6" />
                                            ) : (
                                                <FileText size={20} color="#94A3B8" />
                                            )}
                                            <Text className="text-white font-medium text-sm">{item.name}</Text>
                                        </View>
                                        <View className="w-32">
                                            <Text className="text-slate-400 text-xs">
                                                {item.type === 'folder' ? `${item.count}개 항목` : item.size}
                                            </Text>
                                        </View>
                                        <View className="w-32">
                                            <Text className="text-slate-400 text-xs">{item.modified}</Text>
                                        </View>
                                        <TouchableOpacity className="w-10 items-center">
                                            <MoreVertical size={16} color="#64748B" />
                                        </TouchableOpacity>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>
                    </ScrollView>

                    {/* Footer Stats */}
                    <View className="px-6 py-3 bg-[#050B14] border-t border-white/5 flex-row items-center justify-between">
                        <Text className="text-slate-500 text-xs">{PROJECT_FILES.length}개 항목</Text>
                        <Text className="text-slate-500 text-xs">총 용량: 24.8 MB</Text>
                    </View>
                </View>
            </View>
        </Modal>
    );
};
