import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { List } from 'lucide-react-native';

export interface TOCItem {
    id: string;
    title: string;       // The display title shown in TOC
    rawTitle: string;    // Original full text from block
    page: number;
    y: number;
    x: number;
    readingOrder: number; // Important for multi-column order
    level: number;       // 1 = top section, 2 = subsection, 3 = sub-subsection
    number?: string;     // Extracted number prefix
}

interface TableOfContentsProps {
    items: TOCItem[];
    onItemClick: (page: number, y: number) => void;
    activeId?: string;
}

// Indent per level (px)
const INDENT: Record<number, number> = { 1: 0, 2: 12, 3: 22 };
// Font size per level
const FONT_SIZE: Record<number, number> = { 1: 13, 2: 12, 3: 11 };
// Font weight per level
const FONT_WEIGHT: Record<number, '700' | '600' | '400'> = { 1: '700', 2: '600', 3: '400' };
// Dot colour per level (accent)
const DOT_COLOR: Record<number, string> = { 1: '#7C3AED', 2: '#94A3B8', 3: '#CBD5E1' };

export const TableOfContents = ({ items, onItemClick, activeId }: TableOfContentsProps) => {
    if (!items || items.length === 0) {
        return (
            <View style={styles.container}>
                <View style={styles.header}>
                    <List size={14} color="#475569" />
                    <Text style={styles.headerText}>목차</Text>
                    <Text style={styles.itemCount}>0</Text>
                </View>
                <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20 }}>
                    <Text style={{ color: '#94A3B8', fontSize: 13, textAlign: 'center', lineHeight: 20 }}>
                        스캔된 이미지 파일이거나{'\n'}구조를 인식할 수 없는{'\n'}문서입니다.
                    </Text>
                </View>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <List size={14} color="#475569" />
                <Text style={styles.headerText}>목차</Text>
                <Text style={styles.itemCount}>{items.length}</Text>
            </View>
            <ScrollView style={styles.list} showsVerticalScrollIndicator={false}>
                {items.map((item, index) => {
                    const level = Math.min(Math.max(item.level || 1, 1), 3);
                    const isActive = item.id === activeId;
                    const indent = INDENT[level] || 0;
                    const fontSize = FONT_SIZE[level] || 12;
                    const fontWeight = FONT_WEIGHT[level] || '400';
                    const dotColor = DOT_COLOR[level];

                    return (
                        <TouchableOpacity
                            key={item.id || index}
                            style={[
                                styles.item,
                                { paddingLeft: 12 + indent },
                                isActive && styles.activeItem
                            ]}
                            onPress={() => onItemClick(item.page, item.y)}
                            activeOpacity={0.7}
                        >
                            {/* Level indicator dot */}
                            <View style={[styles.dot, { backgroundColor: dotColor }]} />

                            {/* Title (Number + Title) */}
                            <Text
                                style={[
                                    styles.itemTitle,
                                    { fontSize, fontWeight },
                                    isActive && styles.activeText
                                ]}
                                numberOfLines={2}
                            >
                                {item.title}
                            </Text>

                            {/* Page number */}
                            <Text style={styles.itemPage}>{item.page}</Text>
                        </TouchableOpacity>
                    );
                })}
                <View style={{ height: 40 }} />
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        width: 220,
        backgroundColor: 'white',
        borderRightWidth: 1,
        borderColor: '#E2E8F0',
        height: '100%',
        position: 'absolute',
        left: 0,
        top: 0,
        zIndex: 10,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderColor: '#F1F5F9',
        gap: 6
    },
    headerText: {
        fontSize: 11,
        fontWeight: '700',
        color: '#64748B',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        flex: 1
    },
    itemCount: {
        fontSize: 10,
        color: '#94A3B8',
        backgroundColor: '#F1F5F9',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 10,
    },
    list: { flex: 1 },
    item: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 7,
        paddingRight: 8,
        borderBottomWidth: 1,
        borderColor: '#F8FAFC',
        gap: 6,
    },
    activeItem: {
        backgroundColor: 'rgba(124, 58, 237, 0.05)',
    },
    dot: {
        width: 5,
        height: 5,
        borderRadius: 3,
        flexShrink: 0,
    },
    numBadge: {
        backgroundColor: '#7C3AED',
        borderRadius: 3,
        paddingHorizontal: 4,
        paddingVertical: 1,
        flexShrink: 0,
    },
    numBadgeText: {
        fontSize: 9,
        color: 'white',
        fontWeight: '700',
    },
    itemTitle: {
        color: '#27272a',
        flex: 1,
        lineHeight: 16,
    },
    activeText: {
        color: '#7C3AED',
    },
    itemPage: {
        fontSize: 10,
        color: '#CBD5E1',
        fontVariant: ['tabular-nums'],
        width: 18,
        textAlign: 'right',
    }
});
