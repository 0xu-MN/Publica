import React from 'react';
import { View, TouchableOpacity, Text, ScrollView } from 'react-native';
import { Home, Zap, MessageSquare, Bookmark, Settings, User, ClipboardList, FileEdit, FolderKanban, Crown } from 'lucide-react-native';
import { supabase } from '../../lib/supabase';

export type WorkspaceTab = 'home' | 'agent' | 'nexus-edit' | 'projects' | 'chat' | 'scraps' | 'settings' | 'profile' | 'files' | 'mainhub' | 'connect' | 'support' | 'insight_all' | 'insight_science' | 'insight_economy' | 'lounge' | 'grants' | 'pricing' | 'admin';

interface SidebarProps {
    activeTab: WorkspaceTab;
    onTabChange: (tab: WorkspaceTab) => void;
}

export const Sidebar = ({ activeTab, onTabChange }: SidebarProps) => {

    const workflowItems = [
        { id: 'grants', icon: ClipboardList, label: '공고' },
        { id: 'agent', icon: Zap, label: 'Flow' },
        { id: 'nexus-edit', icon: FileEdit, label: 'Edit' },
        { id: 'projects', icon: FolderKanban, label: 'Portfolio' },
    ];

    const utilItems = [
        { id: 'chat', icon: MessageSquare, label: '채팅' },
        { id: 'scraps', icon: Bookmark, label: '스크랩' },
    ];

    const [projects, setProjects] = React.useState<any[]>([]);

    React.useEffect(() => {
        const fetchProjects = async () => {
            try {
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) return;

                const { data, error } = await supabase
                    .from('workspace_sessions')
                    .select('id, title')
                    .eq('user_id', user.id)
                    .order('updated_at', { ascending: false });

                if (error) {
                    if (error.code !== 'PGRST205') {
                        console.log("Failed to fetch sidebar projects", error);
                    }
                    return;
                }

                if (data) setProjects(data);
            } catch (e) {
                console.log("Failed to fetch sidebar projects", e);
            }
        };

        fetchProjects();
        const interval = setInterval(fetchProjects, 5000);
        return () => clearInterval(interval);
    }, []);

    const renderItem = (item: any) => {
        const isActive = activeTab === item.id;
        const Icon = item.icon;

        return (
            <TouchableOpacity
                key={item.id}
                onPress={() => onTabChange(item.id as WorkspaceTab)}
                className={`w-[48px] h-[48px] rounded-[16px] items-center justify-center ${isActive
                    ? 'bg-blue-500/20 border border-blue-400/30'
                    : 'bg-slate-800/30'
                    }`}
                style={{
                    shadowColor: isActive ? '#3B82F6' : 'transparent',
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.3,
                    shadowRadius: 8,
                }}
            >
                <Icon
                    size={22}
                    color={isActive ? '#60A5FA' : '#94A3B8'}
                    strokeWidth={2.5}
                />
            </TouchableOpacity>
        );
    };

    return (
        <View className="h-full p-3">
            <View className="w-[64px] h-full bg-[#0F172A]/80 backdrop-blur-xl rounded-[24px] flex-col items-center py-4 shadow-2xl border border-white/5">
                {/* Logo at Top */}
                <View className="w-[48px] h-[48px] rounded-[16px] bg-gradient-to-br from-blue-500 to-purple-600 items-center justify-center mb-4 shadow-lg">
                    <Text className="text-xl font-bold text-white">✦</Text>
                </View>

                {/* Home Button - Now at the Top */}
                <TouchableOpacity
                    onPress={() => onTabChange('home')}
                    className={`w-[48px] h-[48px] rounded-[16px] items-center justify-center mb-3 ${activeTab === 'home'
                        ? 'bg-blue-500/20 border border-blue-400/30'
                        : 'bg-slate-800/30'
                        }`}
                    style={{
                        shadowColor: activeTab === 'home' ? '#3B82F6' : 'transparent',
                        shadowOffset: { width: 0, height: 4 },
                        shadowOpacity: 0.3,
                        shadowRadius: 8,
                    }}
                >
                    <Home
                        size={22}
                        color={activeTab === 'home' ? '#60A5FA' : '#94A3B8'}
                        strokeWidth={2.5}
                    />
                </TouchableOpacity>

                {/* Profile Button - Now below Home */}
                <TouchableOpacity
                    onPress={() => onTabChange('profile')}
                    className={`w-[48px] h-[48px] rounded-[16px] items-center justify-center mb-4 ${activeTab === 'profile'
                        ? 'bg-blue-500/20 border border-blue-400/30'
                        : 'bg-slate-800/30'
                        }`}
                    style={{
                        shadowColor: activeTab === 'profile' ? '#3B82F6' : 'transparent',
                        shadowOffset: { width: 0, height: 4 },
                        shadowOpacity: 0.3,
                        shadowRadius: 8,
                    }}
                >
                    <User
                        size={22}
                        color={activeTab === 'profile' ? '#60A5FA' : '#94A3B8'}
                        strokeWidth={2.5}
                    />
                </TouchableOpacity>

                {/* Divider */}
                <View className="w-8 h-[1px] bg-white/10 mb-4" />

                {/* Main Navigation — Workflow */}
                <View className="flex-1 gap-3">
                    {workflowItems.map(renderItem)}
                    {/* Divider after Portfolio */}
                    <View className="w-8 h-[1px] bg-white/10 self-center" />
                    {utilItems.map(renderItem)}
                </View>

                {/* Bottom Actions - Settings */}
                <View className="w-8 h-[1px] bg-white/10 mb-4" />

                <TouchableOpacity
                    onPress={() => onTabChange('pricing')}
                    className={`w-[48px] h-[48px] rounded-[16px] items-center justify-center mb-3 ${activeTab === 'pricing'
                        ? 'bg-amber-500/20 border border-amber-400/30'
                        : 'bg-slate-800/30'
                        }`}
                    style={{
                        shadowColor: activeTab === 'pricing' ? '#F59E0B' : 'transparent',
                        shadowOffset: { width: 0, height: 4 },
                        shadowOpacity: 0.3,
                        shadowRadius: 8,
                    }}
                >
                    <Crown
                        size={22}
                        color={activeTab === 'pricing' ? '#FBBF24' : '#94A3B8'}
                        strokeWidth={2.5}
                    />
                </TouchableOpacity>

                <TouchableOpacity
                    onPress={() => onTabChange('settings')}
                    className={`w-[48px] h-[48px] rounded-[16px] items-center justify-center ${
                        activeTab === 'settings'
                        ? 'bg-slate-500/20 border border-slate-400/30'
                        : 'bg-slate-800/30'
                    }`}
                >
                    <Settings
                        size={22}
                        color={activeTab === 'settings' ? '#94A3B8' : '#64748B'}
                        strokeWidth={2.5}
                    />
                </TouchableOpacity>
            </View>
        </View>
    );
};
