import React, { useState } from 'react';
import { Text, View, Pressable, Platform, TouchableOpacity, StyleSheet } from 'react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withSpring
} from 'react-native-reanimated';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { NewsItem } from '../data/mockData';
import { Clock, Bookmark } from 'lucide-react-native';

interface InsightCardProps {
    item: NewsItem;
    style?: any;
    desktopMode?: boolean;
    onPress?: () => void;
    onBookmarkPress?: () => void;
    isScrapped?: boolean;
}

export const InsightCard: React.FC<InsightCardProps> = ({ item, style, desktopMode = false, onPress, onBookmarkPress, isScrapped = false }) => {
    const cardHeight = 350;
    const [isHovered, setIsHovered] = useState(false);

    const rStyleContainer = useAnimatedStyle(() => {
        return {
            transform: [{ scale: withSpring(isHovered ? 1.02 : 1) }],
        };
    });

    const handleHoverIn = () => {
        if (Platform.OS === 'web') {
            setIsHovered(true);
        }
    };

    const handleHoverOut = () => {
        if (Platform.OS === 'web') {
            setIsHovered(false);
        }
    };

    const isScience = item.category === 'Science';
    const categoryColor = isScience ? '#7C3AED' : '#10B981';
    const categoryBg = isScience ? '#7C3AED08' : '#10B98108';
    const categoryLabel = isScience ? '과학' : '경제';

    return (
        <Animated.View style={[rStyleContainer, styles.container]}>
            <Pressable
                onPress={onPress}
                // @ts-ignore
                onHoverIn={handleHoverIn}
                onHoverOut={handleHoverOut}
                style={[style, { width: '100%' }]}
            >
                <View
                    style={[
                        styles.card,
                        { height: cardHeight },
                        isHovered && styles.cardHovered
                    ]}
                >
                    {/* Background Image */}
                    <Image
                        source={{ uri: item.imageUrl }}
                        style={styles.image}
                        contentFit="cover"
                        contentPosition="center"
                        transition={500}
                    />

                    {/* Light Gradient Overlay */}
                    <LinearGradient
                        colors={['rgba(255, 255, 255, 0)', 'rgba(255, 255, 255, 0.4)', 'rgba(255, 255, 255, 0.95)']}
                        locations={[0, 0.4, 0.8]}
                        style={styles.gradient}
                    />

                    {/* Top Badges */}
                    <View style={styles.topRow}>
                        <View
                            style={[styles.categoryBadge, { backgroundColor: categoryBg, borderColor: categoryColor + '20' }]}
                        >
                            <Text style={[styles.categoryText, { color: categoryColor }]}>{categoryLabel}</Text>
                        </View>
                        <TouchableOpacity
                            style={[
                                styles.bookmarkBtn,
                                isScrapped && styles.bookmarkBtnActive
                            ]}
                            onPress={(e) => {
                                e.stopPropagation();
                                onBookmarkPress?.();
                            }}
                            activeOpacity={0.7}
                        >
                            <Bookmark
                                size={18}
                                color={isScrapped ? "#7C3AED" : "#64748B"}
                                fill={isScrapped ? "#7C3AED" : "none"}
                            />
                        </TouchableOpacity>
                    </View>

                    {/* Bottom Content */}
                    <View style={styles.bottomContent}>
                        {/* Tags */}
                        <View style={styles.tagRow}>
                            {item.tags?.slice(0, 3).map((tag, i) => (
                                <Text key={i} style={styles.tagText}>{tag}</Text>
                            ))}
                        </View>

                        <Text
                            style={[
                                styles.title,
                                { fontSize: desktopMode ? 20 : 18 }
                            ]}
                            numberOfLines={3}
                        >
                            {item.title}
                        </Text>

                        <View style={styles.footer}>
                            <View style={styles.sourceBox}>
                                <Text style={styles.sourceText}>{item.source}</Text>
                                <View style={styles.dot} />
                                <Clock size={12} color="#94A3B8" />
                                <Text style={styles.timeText}>{item.timestamp}</Text>
                            </View>
                        </View>
                    </View>
                </View>
            </Pressable>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    container: { width: '100%', marginBottom: 20 },
    card: {
        width: '100%',
        backgroundColor: '#FFFFFF',
        borderRadius: 28,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: '#E2E8F0',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.04,
        shadowRadius: 12,
    },
    cardHovered: {
        borderColor: '#7C3AED30',
        shadowOpacity: 0.1,
        shadowRadius: 20,
        shadowOffset: { width: 0, height: 8 },
    },
    image: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: '100%',
        height: '100%',
    },
    gradient: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
    },
    topRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        padding: 20,
    },
    categoryBadge: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 10,
        borderWidth: 1,
    },
    categoryText: {
        fontSize: 10,
        fontWeight: '900',
        textTransform: 'uppercase',
    },
    bookmarkBtn: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: 'rgba(255, 255, 255, 0.8)',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: 'rgba(0, 0, 0, 0.05)',
    },
    bookmarkBtnActive: {
        backgroundColor: '#7C3AED08',
        borderColor: '#7C3AED20',
    },
    bottomContent: {
        flex: 1,
        justifyContent: 'flex-end',
        padding: 24,
    },
    tagRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginBottom: 12,
        gap: 6,
    },
    tagText: {
        fontSize: 10,
        fontWeight: '700',
        color: '#7C3AED',
        backgroundColor: '#7C3AED08',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
    },
    title: {
        color: '#18181b',
        fontWeight: '900',
        lineHeight: 26,
        marginBottom: 16,
        letterSpacing: -0.5,
    },
    footer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    sourceBox: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F8FAFC',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 8,
    },
    sourceText: {
        color: '#475569',
        fontSize: 11,
        fontWeight: '800',
    },
    dot: {
        width: 3,
        height: 3,
        borderRadius: 1.5,
        backgroundColor: '#CBD5E1',
        marginHorizontal: 8,
    },
    timeText: {
        color: '#94A3B8',
        fontSize: 11,
        fontWeight: '600',
        marginLeft: 4,
    },
});
