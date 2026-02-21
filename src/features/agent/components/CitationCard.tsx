
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';

interface CitationCardProps {
    citationId: string;
    x: number;
    y: number;
    onClose: () => void;
}

export const CitationCard: React.FC<CitationCardProps> = ({ citationId, x, y, onClose }) => {
    // Mock Data for now - In production this would query a Reference Database
    const mockRefData = {
        title: "Attention Is All You Need",
        authors: "Ashish Vaswani, Noam Shazeer, Niki Parmar, et al.",
        year: 2017,
        abstract: "The dominant sequence transduction models are based on complex recurrent or convolutional neural networks that include an encoder and a decoder..."
    };

    return (
        <View style={[styles.card, { top: y + 20, left: x }]}>
            <View style={styles.header}>
                <Text style={styles.badge}>REF {citationId}</Text>
                <TouchableOpacity onPress={onClose}>
                    <Text style={styles.close}>✕</Text>
                </TouchableOpacity>
            </View>

            <Text style={styles.title}>{mockRefData.title}</Text>
            <Text style={styles.authors}>{mockRefData.authors} ({mockRefData.year})</Text>
            <Text style={styles.abstract} numberOfLines={3}>{mockRefData.abstract}</Text>

            <TouchableOpacity style={styles.actionButton}>
                <Text style={styles.actionText}>View Full Paper</Text>
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    card: {
        position: 'absolute',
        width: 300,
        backgroundColor: 'white',
        borderRadius: 12,
        padding: 16,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
        elevation: 5,
        zIndex: 100, // Above everything
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    badge: {
        fontSize: 10,
        fontWeight: 'bold',
        color: '#3B82F6',
        backgroundColor: '#EFF6FF',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
    },
    close: {
        color: '#9CA3AF',
        fontSize: 14,
    },
    title: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#111827',
        marginBottom: 4,
    },
    authors: {
        fontSize: 12,
        color: '#4B5563',
        marginBottom: 8,
        fontStyle: 'italic',
    },
    abstract: {
        fontSize: 12,
        color: '#6B7280',
        lineHeight: 18,
        marginBottom: 12,
    },
    actionButton: {
        backgroundColor: '#F3F4F6',
        paddingVertical: 8,
        borderRadius: 6,
        alignItems: 'center',
    },
    actionText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#374151',
    }
});
