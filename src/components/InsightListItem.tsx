import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Icons } from '../utils/icons';

interface InsightListItemProps {
    item: any;
    onPress?: () => void;
    isScrapped?: boolean;
    onBookmarkPress?: () => void;
}

export const InsightListItem: React.FC<InsightListItemProps> = ({
    item,
    onPress,
    isScrapped,
    onBookmarkPress
}) => {
    const category = item.category || 'All';
    const isScience = category === 'Science';
    const categoryColor = isScience ? '#7C3AED' : '#10B981';
    const categoryBg = isScience ? '#F5F3FF' : '#ECFDF5';
    const categoryLabel = isScience ? '과학' : '경제';

    return (
        <TouchableOpacity
            onPress={onPress}
            activeOpacity={0.7}
            style={styles.container}
        >
            <View style={[styles.decorator, { backgroundColor: categoryColor }]} />
            
            <View style={styles.content}>
                <View style={styles.leftSection}>
                    <View style={[styles.categoryBadge, { backgroundColor: categoryBg }]}>
                        <Text style={[styles.categoryText, { color: categoryColor }]}>
                            {categoryLabel}
                        </Text>
                    </View>
                    <View style={styles.divider} />
                    <Text style={styles.title} numberOfLines={1}>
                        {item.title}
                    </Text>
                </View>

                <View style={styles.rightSection}>
                    <View style={styles.tagWrapper}>
                        {item.tags?.slice(0, 2).map((tag: string, i: number) => (
                            <View key={i} style={styles.tagPill}>
                                <Text style={styles.tagLabel}>{tag}</Text>
                            </View>
                        ))}
                    </View>

                    <TouchableOpacity
                        onPress={(e) => {
                            e.stopPropagation();
                            onBookmarkPress && onBookmarkPress();
                        }}
                        style={[styles.bookmarkBtn, isScrapped && styles.bookmarkActive]}
                    >
                        <Icons.Bookmark 
                            size={18} 
                            color={isScrapped ? "#7C3AED" : "#94A3B8"} 
                            fill={isScrapped ? "#7C3AED" : "none"} 
                        />
                    </TouchableOpacity>
                </View>
            </View>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    container: {
        width: '100%',
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#F1F5F9',
        overflow: 'hidden',
        height: 80,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.03,
        shadowRadius: 8,
        elevation: 2,
    },
    decorator: {
        width: 6,
        height: '100%',
    },
    content: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 24,
        justifyContent: 'space-between',
    },
    leftSection: {
        flex: 0.65,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
    },
    categoryBadge: {
        width: 60,
        height: 32,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
    },
    categoryText: {
        fontSize: 11,
        fontWeight: '800',
    },
    divider: {
        width: 1,
        height: 20,
        backgroundColor: '#F1F5F9',
    },
    title: {
        flex: 1,
        color: '#18181B',
        fontSize: 15,
        fontWeight: '700',
        letterSpacing: -0.2,
    },
    rightSection: {
        flex: 0.35,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-end',
        gap: 20,
    },
    tagWrapper: {
        flexDirection: 'row',
        gap: 8,
    },
    tagPill: {
        backgroundColor: '#F8FAFC',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#F1F5F9',
    },
    tagLabel: {
        color: '#64748B',
        fontSize: 11,
        fontWeight: '700',
    },
    bookmarkBtn: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#F8FAFC',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: '#F1F5F9',
    },
    bookmarkActive: {
        backgroundColor: '#F5F3FF',
        borderColor: '#7C3AED20',
    },
});
