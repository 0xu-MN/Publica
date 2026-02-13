import React, { forwardRef, useImperativeHandle } from 'react';
import { View, Text, StyleSheet } from 'react-native';

export const PDFViewerPanel = forwardRef(({ url, onQuote }: { url: string, onQuote?: (text: string) => void }, ref) => {

    useImperativeHandle(ref, () => ({
        scrollToPage: (page: number) => {
            console.log(`[Native] Scroll to page ${page} requested (Not implemented)`);
        }
    }));

    return (
        <View style={styles.container}>
            <Text style={styles.text}>PDF Viewer is currently Web-Only.</Text>
            <Text style={styles.subText}>{url}</Text>
        </View>
    );
});

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#1E293B', justifyContent: 'center', alignItems: 'center' },
    text: { color: 'white', fontSize: 16, marginBottom: 8 },
    subText: { color: '#94A3B8', fontSize: 12 }
});
