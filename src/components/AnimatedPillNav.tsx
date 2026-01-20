import React, { useRef, useEffect, useState } from 'react';
import { View, TouchableOpacity, Text, Animated, Easing, LayoutChangeEvent } from 'react-native';

export interface AnimatedPillNavProps {
    items: string[];
    activeItem: string;
    onItemChange: (item: string) => void;
    renderIcon?: (item: string, isActive: boolean) => React.ReactNode;
    backgroundColor?: string;
    activeBackgroundColor?: string;
    textColor?: string;
    activeTextColor?: string;
    borderColor?: string;
}

export const AnimatedPillNav: React.FC<AnimatedPillNavProps> = ({
    items,
    activeItem,
    onItemChange,
    renderIcon,
    backgroundColor = 'rgba(15, 23, 42, 0.8)',
    activeBackgroundColor = 'rgb(51, 65, 85)',
    textColor = 'rgb(148, 163, 184)',
    activeTextColor = 'rgb(255, 255, 255)',
    borderColor = 'rgba(255, 255, 255, 0.1)'
}) => {
    const [itemLayouts, setItemLayouts] = useState<{ [key: string]: { x: number; width: number } }>({});
    const slideAnim = useRef(new Animated.Value(0)).current;
    const widthAnim = useRef(new Animated.Value(100)).current;

    // Calculate active item index
    const activeIndex = items.indexOf(activeItem);

    // When active item changes, animate to new position
    useEffect(() => {
        if (itemLayouts[activeItem]) {
            Animated.parallel([
                Animated.timing(slideAnim, {
                    toValue: itemLayouts[activeItem].x,
                    duration: 300,
                    easing: Easing.bezier(0.4, 0.0, 0.2, 1), // ease-in-out
                    useNativeDriver: false, // Can't use native driver for layout animations
                }),
                Animated.timing(widthAnim, {
                    toValue: itemLayouts[activeItem].width,
                    duration: 300,
                    easing: Easing.bezier(0.4, 0.0, 0.2, 1),
                    useNativeDriver: false,
                })
            ]).start();
        }
    }, [activeItem, itemLayouts]);

    const handleLayout = (item: string, event: LayoutChangeEvent) => {
        const { x, width } = event.nativeEvent.layout;
        setItemLayouts(prev => ({
            ...prev,
            [item]: { x, width }
        }));
    };

    return (
        <View
            style={{
                height: 48,
                paddingHorizontal: 4,
                borderRadius: 9999,
                backgroundColor,
                borderWidth: 1,
                borderColor,
                flexDirection: 'row',
                alignItems: 'center',
                position: 'relative',
            }}
        >
            {/* Animated Background Slider */}
            {itemLayouts[activeItem] && (
                <Animated.View
                    style={{
                        position: 'absolute',
                        height: 40,
                        backgroundColor: activeBackgroundColor,
                        borderRadius: 9999,
                        left: slideAnim,
                        width: widthAnim,
                        shadowColor: '#000',
                        shadowOffset: { width: 0, height: 1 },
                        shadowOpacity: 0.1,
                        shadowRadius: 2,
                    }}
                />
            )}

            {/* Items */}
            {items.map((item) => {
                const isActive = item === activeItem;
                return (
                    <TouchableOpacity
                        key={item}
                        onPress={() => onItemChange(item)}
                        onLayout={(e) => handleLayout(item, e)}
                        style={{
                            height: 40,
                            paddingHorizontal: 24,
                            borderRadius: 9999,
                            justifyContent: 'center',
                            flexDirection: 'row',
                            alignItems: 'center',
                            zIndex: 1,
                        }}
                    >
                        {renderIcon && (
                            <View style={{ marginRight: renderIcon(item, isActive) ? 4 : 0 }}>
                                {renderIcon(item, isActive)}
                            </View>
                        )}
                        <Text
                            style={{
                                fontSize: 14,
                                fontWeight: '600',
                                color: isActive ? activeTextColor : textColor,
                            }}
                        >
                            {item}
                        </Text>
                    </TouchableOpacity>
                );
            })}
        </View>
    );
};
