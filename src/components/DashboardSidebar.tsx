import React from 'react';
import { View, TouchableOpacity } from 'react-native';
import { Icons } from '../utils/icons';

interface DashboardSidebarProps {
    activeTab: 'dashboard' | 'files' | 'posts' | 'messages' | 'scraps';
    setActiveTab: (tab: 'dashboard' | 'files' | 'posts' | 'messages' | 'scraps') => void;
    onSettingsPress: () => void;
}

export const DashboardSidebar: React.FC<DashboardSidebarProps> = ({
    activeTab,
    setActiveTab,
    onSettingsPress
}) => {
    return (
        <View className="w-20 bg-[#0A1628] border-r border-white/5 items-center py-8 gap-8">
            <TouchableOpacity
                className={`w-10 h-10 rounded-xl items-center justify-center shadow-lg ${activeTab === 'dashboard' ? 'bg-blue-600 shadow-blue-500/30' : 'hover:bg-white/5'}`}
                onPress={() => setActiveTab('dashboard')}
            >
                <Icons.LayoutDashboard size={20} color={activeTab === 'dashboard' ? '#fff' : '#94A3B8'} />
            </TouchableOpacity>
            <TouchableOpacity
                className={`w-10 h-10 rounded-xl items-center justify-center ${activeTab === 'files' ? 'bg-blue-600 shadow-lg shadow-blue-500/30' : 'hover:bg-white/5'}`}
                onPress={() => setActiveTab('files')}
            >
                <Icons.Folder size={20} color={activeTab === 'files' ? '#fff' : '#94A3B8'} />
            </TouchableOpacity>
            <TouchableOpacity
                className={`w-10 h-10 rounded-xl items-center justify-center ${activeTab === 'posts' ? 'bg-blue-600 shadow-lg shadow-blue-500/30' : 'hover:bg-white/5'}`}
                onPress={() => setActiveTab('posts')}
            >
                <Icons.Database size={20} color={activeTab === 'posts' ? '#fff' : '#94A3B8'} />
            </TouchableOpacity>
            <View className="flex-1" />
            <TouchableOpacity
                className={`w-10 h-10 rounded-xl items-center justify-center ${activeTab === 'messages' ? 'bg-blue-600 shadow-lg shadow-blue-500/30' : 'hover:bg-white/5'}`}
                onPress={() => setActiveTab('messages')}
            >
                <Icons.MessageCircle size={20} color={activeTab === 'messages' ? '#fff' : '#94A3B8'} />
            </TouchableOpacity>

            <TouchableOpacity
                className={`w-10 h-10 rounded-xl items-center justify-center ${activeTab === 'scraps' ? 'bg-blue-600 shadow-lg shadow-blue-500/30' : 'hover:bg-white/5'}`}
                onPress={() => setActiveTab('scraps')}
            >
                <Icons.Bookmark size={20} color={activeTab === 'scraps' ? '#fff' : '#94A3B8'} />
            </TouchableOpacity>

            <TouchableOpacity
                className="w-10 h-10 hover:bg-white/5 rounded-xl items-center justify-center"
                onPress={onSettingsPress}
            >
                <Icons.Settings size={20} color="#94A3B8" />
            </TouchableOpacity>
        </View>
    );
};
