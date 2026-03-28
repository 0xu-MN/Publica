import React, { useState } from 'react';
import { View, TouchableOpacity, Text, Platform } from 'react-native';
import { Home, Zap, MessageSquare, Bookmark, Settings, User, ClipboardList, FileEdit, FolderKanban, Crown } from 'lucide-react-native';
import { supabase } from '../../lib/supabase';

export type WorkspaceTab = 'home' | 'agent' | 'nexus-edit' | 'projects' | 'chat' | 'scraps' | 'settings' | 'profile' | 'files' | 'mainhub' | 'connect' | 'support' | 'insight_all' | 'insight_science' | 'insight_economy' | 'lounge' | 'grants' | 'pricing' | 'admin';

interface SidebarProps {
    activeTab: WorkspaceTab;
    onTabChange: (tab: WorkspaceTab) => void;
}

interface NavItem {
    id: WorkspaceTab;
    icon: any;
    label: string;
    color?: 'default' | 'amber';
}

const NAV_ITEMS_TOP: NavItem[] = [
    { id: 'home',       icon: Home,          label: 'Dashboard' },
    { id: 'profile',    icon: User,          label: 'Profile' },
];

const NAV_ITEMS_WORKFLOW: NavItem[] = [
    { id: 'grants',     icon: ClipboardList, label: '공고 탐색' },
    { id: 'agent',      icon: Zap,           label: 'Publica Nexus Flow' },
    { id: 'nexus-edit', icon: FileEdit,      label: 'Publica Nexus Edit' },
    { id: 'projects',   icon: FolderKanban,  label: 'Portfolio' },
];

const NAV_ITEMS_UTIL: NavItem[] = [
    { id: 'chat',       icon: MessageSquare, label: '채팅' },
    { id: 'scraps',     icon: Bookmark,      label: '스크랩' },
];

const NAV_ITEMS_BOTTOM: NavItem[] = [
    { id: 'pricing',    icon: Crown,         label: 'Publica PRO', color: 'amber' },
    { id: 'settings',   icon: Settings,      label: '설정' },
];

export const Sidebar = ({ activeTab, onTabChange }: SidebarProps) => {
    const [hoveredTab, setHoveredTab] = useState<WorkspaceTab | null>(null);
    const [hoveredY, setHoveredY] = useState(0);
    const [hoveredLabel, setHoveredLabel] = useState('');

    const isWeb = Platform.OS === 'web';

    React.useEffect(() => {
        const fetchProjects = async () => {
            try {
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) return;
                await supabase
                    .from('workspace_sessions')
                    .select('id, title')
                    .eq('user_id', user.id)
                    .order('updated_at', { ascending: false });
            } catch (e) {
                console.log("Failed to fetch sidebar projects", e);
            }
        };
        fetchProjects();
        const interval = setInterval(fetchProjects, 5000);
        return () => clearInterval(interval);
    }, []);

    const renderItem = (item: NavItem, extraClass?: string) => {
        const isActive = activeTab === item.id;
        const Icon = item.icon;
        const isAmber = item.color === 'amber';

        const activeStyle = isAmber
            ? 'bg-amber-500/20 border border-amber-400/30'
            : 'bg-blue-500/20 border border-blue-400/30';
        const activeIconColor = isAmber ? '#FBBF24' : '#60A5FA';

        return (
            <View key={item.id} style={{ position: 'relative' }}>
                <TouchableOpacity
                    onPress={() => onTabChange(item.id)}
                    className={`w-[48px] h-[48px] rounded-[16px] items-center justify-center ${extraClass || ''} ${isActive ? activeStyle : 'bg-slate-800/30'}`}
                    style={{
                        shadowColor: isActive ? (isAmber ? '#F59E0B' : '#3B82F6') : 'transparent',
                        shadowOffset: { width: 0, height: 4 },
                        shadowOpacity: 0.3,
                        shadowRadius: 8,
                    }}
                    // Web hover via onMouseEnter/Leave (React Native Web supports these)
                    {...(isWeb ? {
                        onMouseEnter: (e: any) => {
                            const rect = e?.target?.getBoundingClientRect?.();
                            setHoveredTab(item.id);
                            setHoveredLabel(item.label);
                            // Get Y offset relative to sidebar container
                            if (rect) setHoveredY(rect.top);
                        },
                        onMouseLeave: () => setHoveredTab(null),
                    } : {})}
                >
                    <Icon
                        size={22}
                        color={isActive ? activeIconColor : '#94A3B8'}
                        strokeWidth={2.5}
                    />
                </TouchableOpacity>
            </View>
        );
    };

    return (
        <View className="h-full p-3" style={{ position: 'relative', zIndex: 50 }}>
            <View className="w-[64px] h-full bg-[#0F172A]/80 backdrop-blur-xl rounded-[24px] flex-col items-center py-4 shadow-2xl border border-white/5">
                {/* Logo */}
                <View className="w-[48px] h-[48px] rounded-[16px] bg-gradient-to-br from-blue-500 to-purple-600 items-center justify-center mb-4 shadow-lg">
                    <Text className="text-xl font-bold text-white">✦</Text>
                </View>

                {/* Top nav: Home + Profile */}
                {NAV_ITEMS_TOP.map((item, i) =>
                    renderItem(item, i === NAV_ITEMS_TOP.length - 1 ? 'mb-4' : 'mb-3')
                )}

                {/* Divider */}
                <View className="w-8 h-[1px] bg-white/10 mb-4" />

                {/* Workflow items */}
                <View className="flex-1 gap-3">
                    {NAV_ITEMS_WORKFLOW.map(renderItem)}
                    <View className="w-8 h-[1px] bg-white/10 self-center" />
                    {NAV_ITEMS_UTIL.map(renderItem)}
                </View>

                {/* Divider */}
                <View className="w-8 h-[1px] bg-white/10 mb-4" />

                {/* Bottom items: Pricing + Settings */}
                {NAV_ITEMS_BOTTOM.map((item, i) =>
                    renderItem(item, i === 0 ? 'mb-3' : '')
                )}
            </View>

            {/* Floating Tooltip — web only, shown on hover */}
            {isWeb && hoveredTab && (
                <View
                    style={{
                        position: 'fixed' as any,
                        top: hoveredY,
                        left: 84, // 12px padding + 64px sidebar + 8px gap
                        zIndex: 9999,
                        pointerEvents: 'none' as any,
                    }}
                >
                    <View
                        style={{
                            backgroundColor: '#1E293B',
                            borderColor: 'rgba(255,255,255,0.1)',
                            borderWidth: 1,
                            borderRadius: 10,
                            paddingHorizontal: 12,
                            paddingVertical: 7,
                            shadowColor: '#000',
                            shadowOffset: { width: 0, height: 4 },
                            shadowOpacity: 0.4,
                            shadowRadius: 12,
                            flexDirection: 'row',
                            alignItems: 'center',
                            gap: 6,
                        }}
                    >
                        {/* Arrow pointing left */}
                        <View
                            style={{
                                position: 'absolute',
                                left: -6,
                                top: '50%' as any,
                                marginTop: -5,
                                width: 0,
                                height: 0,
                                borderTopWidth: 5,
                                borderBottomWidth: 5,
                                borderRightWidth: 6,
                                borderTopColor: 'transparent',
                                borderBottomColor: 'transparent',
                                borderRightColor: '#1E293B',
                            }}
                        />
                        <Text
                            style={{
                                color: '#F1F5F9',
                                fontSize: 12,
                                fontWeight: '700',
                                whiteSpace: 'nowrap' as any,
                            }}
                        >
                            {hoveredLabel}
                        </Text>
                    </View>
                </View>
            )}
        </View>
    );
};
