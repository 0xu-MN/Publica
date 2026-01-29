import React, { useEffect } from 'react';
import { View, TouchableOpacity, Text, Dimensions, Animated, Easing } from 'react-native';
import { Pin, Trash2, Edit2, Link, Sparkles, Plus, X } from 'lucide-react-native';

export interface RadialMenuAction {
    id: string;
    icon: React.ElementType;
    label: string;
    color?: string;
    onPress: () => void;
}

interface RadialMenuProps {
    visible: boolean;
    x: number;
    y: number;
    onClose: () => void;
    actions?: RadialMenuAction[];
}

const DEFAULT_ACTIONS: RadialMenuAction[] = [
    { id: 'pin', icon: Pin, label: '고정', color: '#60A5FA', onPress: () => console.log('Pin') },
    { id: 'delete', icon: Trash2, label: '삭제', color: '#F87171', onPress: () => console.log('Delete') },
    { id: 'edit', icon: Edit2, label: '편집', color: '#A78BFA', onPress: () => console.log('Edit') },
    { id: 'connect', icon: Link, label: '연결', color: '#34D399', onPress: () => console.log('Connect') },
    { id: 'analyze', icon: Sparkles, label: 'AI 분석', color: '#FBBF24', onPress: () => console.log('Analyze') },
    { id: 'add', icon: Plus, label: '노드 추가', color: '#E2E8F0', onPress: () => console.log('Add') },
];

export const RadialMenu = ({ visible, x, y, onClose, actions = DEFAULT_ACTIONS }: RadialMenuProps) => {
    const scaleAnim = React.useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (visible) {
            Animated.spring(scaleAnim, {
                toValue: 1,
                useNativeDriver: true,
                friction: 6,
                tension: 60
            }).start();
        } else {
            Animated.timing(scaleAnim, {
                toValue: 0,
                duration: 200,
                useNativeDriver: true
            }).start();
        }
    }, [visible]);

    if (!visible) return null;

    const radius = 80; // Distance from center
    const totalItems = actions.length;
    const angleStep = (2 * Math.PI) / totalItems;

    return (
        <View
            className="absolute z-50"
            style={{
                left: x - 120, // Center the 240x240 container
                top: y - 120,
                width: 240,
                height: 240,
                pointerEvents: 'box-none'
            }}
        >
            {/* Backdrop Area to detect click outside - handled by parent overlay usually, but here specific close handling */}

            {/* Center Close/Trigger Button */}
            <TouchableOpacity
                onPress={onClose}
                activeOpacity={0.8}
                className="absolute left-[96px] top-[96px] w-12 h-12 bg-[#0F172A] rounded-full border border-white/20 items-center justify-center shadow-lg shadow-black/50 z-20"
            >
                <X size={20} color="#94A3B8" />
            </TouchableOpacity>

            {/* Radial Items */}
            {actions.map((action, index) => {
                const angle = index * angleStep - Math.PI / 2; // Start from top (-90deg)

                // Calculate position relative to center (120, 120)
                const itemX = 120 + radius * Math.cos(angle) - 24; // -24 for half item size
                const itemY = 120 + radius * Math.sin(angle) - 24;

                const rotate = scaleAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['0deg', '360deg']
                });

                return (
                    <Animated.View
                        key={action.id}
                        style={{
                            position: 'absolute',
                            left: itemX,
                            top: itemY,
                            transform: [
                                { scale: scaleAnim },
                                // { rotate: rotate } // Optional spin effect
                            ]
                        }}
                    >
                        <TouchableOpacity
                            onPress={() => {
                                action.onPress();
                                onClose();
                            }}
                            className="items-center justify-center"
                        >
                            <View
                                className="w-12 h-12 bg-[#1E293B] rounded-full border border-white/10 items-center justify-center shadow-xl shadow-black/30 mb-1"
                                style={{ borderColor: action.color ? `${action.color}40` : '#ffffff20' }}
                            >
                                <action.icon size={20} color={action.color || 'white'} />
                            </View>
                            {/* Optional Label */}
                            {/* <View className="bg-black/60 px-2 py-0.5 rounded">
                                <Text className="text-white text-[10px] font-bold">{action.label}</Text>
                            </View> */}
                        </TouchableOpacity>
                    </Animated.View>
                );
            })}
        </View>
    );
};
