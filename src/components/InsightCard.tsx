import React, { useState } from 'react';
import { StyleSheet, Text, View, Pressable, Dimensions, Platform } from 'react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withSpring
} from 'react-native-reanimated';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { NewsItem } from '../data/mockData';
import { Clock, Bookmark } from 'lucide-react-native';

const { width } = Dimensions.get('window');

interface InsightCardProps {
    item: NewsItem;
    style?: any;
    desktopMode?: boolean;
    onPress?: () => void;
}

export const InsightCard: React.FC<InsightCardProps> = ({ item, style, desktopMode = false, onPress }) => {
    const cardHeight = 320; // Fixed height for uniform grid layout
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
    const categoryColor = isScience ? '#0EA5E9' : '#10B981';
    const categoryBg = isScience ? 'rgba(14, 165, 233, 0.2)' : 'rgba(16, 185, 129, 0.2)';
    const categoryLabel = isScience ? '과학' : '경제';

    return (
        <Animated.View style={[styles.containerWrapper, rStyleContainer]}>
            <Pressable
                onPress={onPress}
                // @ts-ignore - web functionality
                onHoverIn={handleHoverIn}
                onHoverOut={handleHoverOut}
                style={[styles.container, { height: cardHeight }, style]}
            >
                <View style={[styles.card, isHovered && styles.cardHovered]}>
                    <Image
                        source={{ uri: item.imageUrl }}
                        style={StyleSheet.absoluteFill}
                        contentFit="cover"
                        transition={500}
                    />
                    <LinearGradient
                        colors={['transparent', 'rgba(5, 11, 20, 0.6)', 'rgba(5, 11, 20, 0.95)']}
                        locations={[0, 0.6, 1]}
                        style={StyleSheet.absoluteFill}
                    />

                    {/* Glare Effect (Web Only) */}
                    {isHovered && Platform.OS === 'web' && (
                        <LinearGradient
                            colors={['rgba(255,255,255,0.1)', 'transparent']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={StyleSheet.absoluteFill}
                        />
                    )}

                    {/* Top Badges */}
                    <View style={styles.topRow}>
                        <View style={[styles.categoryBadge, { backgroundColor: categoryBg, borderColor: categoryColor }]}>
                            <Text style={[styles.categoryText, { color: categoryColor }]}>{categoryLabel}</Text>
                        </View>
                        <View style={styles.iconButton}>
                            <Bookmark size={16} color="white" opacity={0.8} />
                        </View>
                    </View>

                    {/* Bottom Content */}
                    <View style={styles.contentFront}>
                        <View style={styles.tagsRow}>
                            {item.tags?.map((tag, i) => (
                                <Text key={i} style={styles.hashTag}>{tag}</Text>
                            ))}
                        </View>
                        <Text style={[styles.title, desktopMode && { fontSize: 20 }]} numberOfLines={3}>{item.title}</Text>
                        <View style={styles.metaRow}>
                            <Text style={styles.sourceText}>{item.source}</Text>
                            <Text style={styles.dot}>•</Text>
                            <Text style={styles.timeText}>{item.timestamp}</Text>
                            <View style={{ flex: 1 }} />
                            <Clock size={12} color="#94A3B8" style={{ marginRight: 4 }} />
                            <Text style={styles.readTime}>{item.readTime}</Text>
                        </View>
                    </View>
                </View>
            </Pressable>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    containerWrapper: {
        width: '100%',
        marginBottom: 16,
    },
    container: {
        width: '100%',
        borderRadius: 20,
    },
    card: {
        ...StyleSheet.absoluteFillObject,
        borderRadius: 24, // Increased for modern look
        overflow: 'hidden',
        borderWidth: 1, // Standard border width
        borderColor: 'rgba(255,255,255,0.1)', // Slightly more visible border
    },
    cardHovered: {
        borderColor: 'rgba(255,255,255,0.3)',
        transform: [{ scale: 1.02 }], // Scale effect
        ...Platform.select({
            web: {
                boxShadow: '0 10px 30px -10px rgba(0, 0, 0, 0.5)',
            }
        })
    },
    topRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        padding: 16,
    },
    categoryBadge: {
        paddingHorizontal: 12,
        paddingVertical: 5,
        borderRadius: 12,
        borderWidth: 1,
        flexDirection: 'row',
        alignItems: 'center',
    },
    categoryText: {
        fontSize: 11,
        fontWeight: '700',
        textTransform: 'uppercase',
    },
    iconButton: {
        width: 32,
        height: 32,
        backgroundColor: 'rgba(0,0,0,0.3)',
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    contentFront: {
        flex: 1,
        justifyContent: 'flex-end',
        padding: 16,
        paddingBottom: 20,
    },
    tagsRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginBottom: 10,
        gap: 6,
    },
    hashTag: {
        color: '#94A3B8',
        fontSize: 11,
        backgroundColor: 'rgba(255,255,255,0.1)',
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 6,
        overflow: 'hidden',
    },
    title: {
        color: 'white',
        fontSize: 18,
        fontWeight: '700',
        lineHeight: 26,
        marginBottom: 12,
    },
    metaRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    sourceText: {
        color: '#E2E8F0',
        fontSize: 12,
        fontWeight: '600',
    },
    dot: {
        color: '#64748B',
        marginHorizontal: 8,
        fontSize: 10,
    },
    timeText: {
        color: '#94A3B8',
        fontSize: 12,
    },
    readTime: {
        color: '#94A3B8',
        fontSize: 12,
    },
});
