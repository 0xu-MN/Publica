import React from 'react';
import { View, TouchableOpacity, Text } from 'react-native';
import { Home, Zap, Folder, Handshake } from 'lucide-react-native';

export type WorkspaceTab = 'home' | 'agent' | 'files' | 'support';

interface SidebarProps {
    activeTab: WorkspaceTab;
    onTabChange: (tab: WorkspaceTab) => void;
}

export const Sidebar = ({ activeTab, onTabChange }: SidebarProps) => {

    const menuItems: { id: WorkspaceTab; icon: React.ElementType; label: string }[] = [
        { id: 'home', icon: Home, label: '홈' },
        { id: 'agent', icon: Zap, label: '에이전트' },
        { id: 'files', icon: Folder, label: '파일' },
        { id: 'support', icon: Handshake, label: '서포트' },
    ];

    return (
        <View className="w-[80px] h-full bg-[#0A1628] border-r border-white/5 flex-col items-center py-6 z-50">
            {/* Logo Placeholder or Top Spacer */}
            <View className="mb-8 p-2 rounded-xl bg-blue-500/10">
                <View className="w-5 h-5 rounded bg-blue-500" />
            </View>

            {/* Navigation Items */}
            <View className="flex-1 gap-6 w-full items-center">
                {menuItems.map((item) => {
                    const isActive = activeTab === item.id;
                    const Icon = item.icon;

                    return (
                        <TouchableOpacity
                            key={item.id}
                            onPress={() => onTabChange(item.id)}
                            className={`items-center justify-center w-full py-3 border-l-2 ${isActive ? 'border-blue-500 bg-blue-500/5' : 'border-transparent'}`}
                        >
                            <View className={`p-2.5 rounded-xl transition-all ${isActive ? 'bg-blue-500 shadow-lg shadow-blue-500/30' : 'bg-transparent'}`}>
                                <Icon
                                    size={22}
                                    color={isActive ? '#FFFFFF' : '#64748B'}
                                    strokeWidth={isActive ? 2.5 : 2}
                                />
                            </View>
                            <Text className={`text-[10px] mt-1.5 font-medium ${isActive ? 'text-blue-400' : 'text-slate-500'}`}>
                                {item.label}
                            </Text>
                        </TouchableOpacity>
                    );
                })}
            </View>
        </View>
    );
};
