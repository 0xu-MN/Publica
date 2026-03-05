import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, ActivityIndicator, TouchableOpacity, Platform } from 'react-native';
import { ExternalLink, RefreshCw } from 'lucide-react-native';

interface GrantContentPanelProps {
    grantUrl: string;
    grantTitle?: string;
}

/**
 * 공고문 원문 패널 — K-Startup 공고 페이지의 본문 텍스트를 렌더링
 * iframe이 차단되므로 서버에서 HTML을 가져와서 텍스트로 보여줌
 */
export const GrantContentPanel: React.FC<GrantContentPanelProps> = ({ grantUrl, grantTitle }) => {
    const [content, setContent] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchGrantContent = async () => {
        setLoading(true);
        setError(null);

        try {
            // K-Startup pages have complex HTML that doesn't parse cleanly
            // Always use the clean fallback UI with 'open in new tab' button
            setError('direct_fail');
        } catch (err: any) {
            setError('direct_fail');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (grantUrl) fetchGrantContent();
    }, [grantUrl]);

    /**
     * Extract readable text content from K-Startup HTML
     * Strips scripts, styles, navigation, and returns the main body text
     */
    const extractMainContent = (html: string): string => {
        // Remove scripts, styles, and HTML tags to get clean text
        let text = html
            .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
            .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
            .replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, '')
            .replace(/<header[^>]*>[\s\S]*?<\/header>/gi, '')
            .replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, '')
            .replace(/<aside[^>]*>[\s\S]*?<\/aside>/gi, '');

        // Convert some tags to readable format
        text = text
            .replace(/<br\s*\/?>/gi, '\n')
            .replace(/<\/p>/gi, '\n\n')
            .replace(/<\/div>/gi, '\n')
            .replace(/<\/li>/gi, '\n')
            .replace(/<\/h[1-6]>/gi, '\n\n')
            .replace(/<h[1-6][^>]*>/gi, '## ')
            .replace(/<li[^>]*>/gi, '• ')
            .replace(/<[^>]+>/g, '')
            .replace(/&nbsp;/g, ' ')
            .replace(/&amp;/g, '&')
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .replace(/&quot;/g, '"')
            .replace(/\n{3,}/g, '\n\n')
            .trim();

        // Limit to reasonable length
        if (text.length > 5000) {
            text = text.substring(0, 5000) + '\n\n... (이하 생략)';
        }

        return text;
    };

    if (loading) {
        return (
            <View style={styles.centerContainer}>
                <ActivityIndicator size="large" color="#10B981" />
                <Text style={styles.loadingText}>공고문 원문 로딩 중...</Text>
            </View>
        );
    }

    // If direct fetch failed (CORS), show informational panel with open-in-tab button
    if (error === 'direct_fail' || !content) {
        return (
            <View style={styles.container}>
                <View style={styles.fallbackContainer}>
                    <Text style={{ fontSize: 40, marginBottom: 12 }}>📋</Text>
                    <Text style={styles.fallbackTitle}>{grantTitle || '공고문 원문'}</Text>
                    <Text style={styles.fallbackDesc}>
                        K-Startup 공고문을 직접 확인하세요.{'\n'}
                        새 탭에서 원문 전체를 볼 수 있습니다.
                    </Text>
                    <TouchableOpacity
                        onPress={() => {
                            if (Platform.OS === 'web') window.open(grantUrl, '_blank');
                        }}
                        style={styles.openButton}
                    >
                        <ExternalLink size={16} color="#FFFFFF" />
                        <Text style={styles.openButtonText}>새 탭에서 열기</Text>
                    </TouchableOpacity>
                    <Text style={styles.tipText}>
                        💡 팁: 공고문을 옆 창에 띄워두고{'\n'}AI 분석과 대조하며 작업하세요
                    </Text>
                </View>
            </View>
        );
    }

    // Successfully fetched content — render it
    return (
        <View style={styles.container}>
            <ScrollView
                style={{ flex: 1 }}
                contentContainerStyle={{ padding: 16 }}
                showsVerticalScrollIndicator={true}
            >
                {grantTitle && (
                    <Text style={styles.contentTitle}>{grantTitle}</Text>
                )}
                <Text style={styles.contentText}>{content}</Text>
            </ScrollView>

            {/* Bottom bar with utility buttons */}
            <View style={styles.bottomBar}>
                <TouchableOpacity onPress={fetchGrantContent} style={styles.refreshBtn}>
                    <RefreshCw size={14} color="#64748B" />
                </TouchableOpacity>
                <TouchableOpacity
                    onPress={() => {
                        if (Platform.OS === 'web') window.open(grantUrl, '_blank');
                    }}
                    style={styles.externalBtn}
                >
                    <ExternalLink size={14} color="#64748B" />
                    <Text style={styles.externalBtnText}>원문 보기</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0a0a0a',
    },
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#0a0a0a',
    },
    loadingText: {
        color: '#94A3B8',
        fontSize: 13,
        marginTop: 12,
    },
    fallbackContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 32,
    },
    fallbackTitle: {
        color: '#F8FAFC',
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 8,
        textAlign: 'center',
    },
    fallbackDesc: {
        color: '#94A3B8',
        fontSize: 13,
        textAlign: 'center',
        marginBottom: 24,
        lineHeight: 20,
    },
    openButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        backgroundColor: '#10B981',
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 12,
    },
    openButtonText: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: '700',
    },
    tipText: {
        color: '#475569',
        fontSize: 11,
        marginTop: 16,
        textAlign: 'center',
        lineHeight: 16,
    },
    contentTitle: {
        color: '#F8FAFC',
        fontSize: 18,
        fontWeight: '700',
        marginBottom: 16,
        lineHeight: 26,
    },
    contentText: {
        color: '#CBD5E1',
        fontSize: 14,
        lineHeight: 22,
    },
    bottomBar: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderTopWidth: 1,
        borderColor: '#1E293B',
        backgroundColor: '#111827',
    },
    refreshBtn: {
        padding: 6,
    },
    externalBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        padding: 6,
    },
    externalBtnText: {
        color: '#64748B',
        fontSize: 12,
    },
});
