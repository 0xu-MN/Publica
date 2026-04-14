import React, { useState } from 'react';
import { View, TouchableOpacity, Text, Platform } from 'react-native';
import { Home, Zap, MessageSquare, Bookmark, Settings, User, ClipboardList, FileEdit, FolderKanban, Crown } from 'lucide-react-native';
import { supabase } from '../../lib/supabase';

export type WorkspaceTab = 'home' | 'agent' | 'nexus-edit' | 'projects' | 'chat' | 'scraps' | 'settings' | 'profile' | 'files' | 'mainhub' | 'connect' | 'support' | 'insight_all' | 'insight_science' | 'insight_economy' | 'lounge' | 'grants' | 'pricing' | 'admin' | 'guide';

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
            ? { backgroundColor: 'rgba(245, 158, 11, 0.2)', borderColor: 'rgba(251, 191, 36, 0.3)', borderWidth: 1 }
            : { backgroundColor: 'rgba(124, 58, 237, 0.1)', borderColor: 'rgba(124, 58, 237, 0.2)', borderWidth: 1, shadowColor: '#7C3AED', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 5 };
        const activeIconColor = isAmber ? '#FBBF24' : '#7C3AED';

        return (
            <View key={item.id} style={{ position: 'relative' }}>
                <TouchableOpacity
                    onPress={() => onTabChange(item.id)}
                    className={`w-[48px] h-[48px] rounded-[18px] items-center justify-center ${extraClass || ''} ${!isActive ? 'bg-transparent hover:bg-slate-50' : ''}`}
                    style={[
                        isActive ? activeStyle : {},
                        { transition: 'all 0.2s ease-in-out' } as any
                    ]}
                    // Web hover via onMouseEnter/Leave (React Native Web supports these)
                    {...(isWeb ? {
                        onPointerEnter: (e: any) => {
                            const el = e?.currentTarget || e?.target;
                            const rect = el?.getBoundingClientRect?.();
                            setHoveredTab(item.id);
                            setHoveredLabel(item.label);
                            if (rect) setHoveredY(rect.top);
                        },
                        onPointerLeave: () => setHoveredTab(null),
                    } : {})}
                >
                    <Icon
                        size={22}
                        color={isActive ? activeIconColor : '#94A3B8'}
                        strokeWidth={isActive ? 2.5 : 2}
                    />
                    {isActive && (
                        <View className="absolute left-[-12px] w-1 h-6 rounded-r-full" style={{ backgroundColor: '#7C3AED' }} />
                    )}
                </TouchableOpacity>
            </View>
        );
    };

    return (
        <View className="h-full p-3" style={{ position: 'relative', zIndex: 100 }}>
            <View className="w-[68px] h-full shadow-2xl shadow-black/5 rounded-[28px] flex-col items-center py-6 border border-[#E2E8F0]" style={{ backgroundColor: '#FDF8F3' }}>
                {/* Logo / Guide Button */}
                <TouchableOpacity
                    onPress={() => onTabChange('guide')}
                    className={`w-[48px] h-[48px] rounded-[18px] items-center justify-center mb-8 shadow-lg`}
                    style={{ 
                        backgroundColor: activeTab === 'guide' ? '#5B21B6' : '#7C3AED',
                        shadowColor: '#7C3AED',
                        shadowOffset: { width: 0, height: 4 },
                        shadowOpacity: activeTab === 'guide' ? 0.4 : 0.3,
                        shadowRadius: 10
                    }}
                    {...(isWeb ? {
                        onPointerEnter: (e: any) => {
                            const el = e?.currentTarget || e?.target;
                            const rect = el?.getBoundingClientRect?.();
                            setHoveredTab('guide');
                            setHoveredLabel('에이전트 가이드');
                            if (rect) setHoveredY(rect.top);
                        },
                        onPointerLeave: () => setHoveredTab(null),
                    } : {})}
                >
                    <Text className="text-2xl font-bold text-white">✦</Text>
                </TouchableOpacity>

                {/* Top nav: Home + Profile */}
                <View className="mb-6">
                    {NAV_ITEMS_TOP.map((item, i) =>
                        renderItem(item, i === NAV_ITEMS_TOP.length - 1 ? '' : 'mb-3')
                    )}
                </View>

                {/* Divider */}
                <View className="w-10 h-[1px] bg-[#F1F5F9] mb-6" />

                {/* Workflow items */}
                <View className="flex-1 gap-3 items-center">
                    {NAV_ITEMS_WORKFLOW.map((item) => renderItem(item))}
                    <View className="w-10 h-[1px] my-2" style={{ backgroundColor: '#F1F5F9' }} />
                    {NAV_ITEMS_UTIL.map((item) => renderItem(item))}
                </View>

                {/* Divider */}
                <View className="w-10 h-[1px] mb-6" style={{ backgroundColor: '#F1F5F9' }} />

                {/* Bottom items: Pricing + Settings */}
                <View className="gap-3">
                    {NAV_ITEMS_BOTTOM.map((item) =>
                        renderItem(item)
                    )}
                </View>
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
                            backgroundColor: '#FFFFFF',
                            borderColor: '#E2E8F0',
                            borderWidth: 1,
                            borderRadius: 10,
                            paddingHorizontal: 12,
                            paddingVertical: 7,
                            shadowColor: '#000',
                            shadowOffset: { width: 0, height: 4 },
                            shadowOpacity: 0.1,
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
                                borderRightColor: '#FFFFFF',
                            }}
                        />
                        <Text
                            style={[{
                                color: '#1E293B',
                                fontSize: 12,
                                fontWeight: '700',
                            }, { whiteSpace: 'nowrap' } as any]}
                        >
                            {hoveredLabel}
                        </Text>
                    </View>
                </View>
            )}
        </View>
    );
};
