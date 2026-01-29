import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';

interface BranchNode {
    id: string;
    label: string;
    description: string;
}

interface MindMapData {
    root_node: string;
    branches: BranchNode[];
}

interface MindMapRendererProps {
    data: MindMapData;
    onNodeClick: (label: string) => void;
}

export const MindMapRenderer = ({ data, onNodeClick }: MindMapRendererProps) => {
    if (!data) return null;

    return (
        <ScrollView contentContainerStyle={styles.container}>
            {/* Root Node */}
            <View style={styles.rootNode}>
                <Text style={styles.rootText}>{data.root_node}</Text>
            </View>

            <View style={styles.verticalLine} />

            {/* Branches */}
            <View style={styles.branchesContainer}>
                {data.branches?.map((branch) => (
                    <View key={branch.id} style={styles.branchWrapper}>
                        <View style={styles.branchLine} />
                        <TouchableOpacity
                            style={styles.branchCard}
                            onPress={() => onNodeClick(branch.label)}
                        >
                            {/* 🛡️ SAFE RENDERING: Only Text inside Text */}
                            <Text style={styles.branchTitle}>{branch.label}</Text>
                            <Text style={styles.branchDesc}>{branch.description}</Text>
                        </TouchableOpacity>
                    </View>
                ))}
            </View>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: { alignItems: 'center', paddingVertical: 20 },
    rootNode: {
        backgroundColor: '#3b82f6', padding: 15, borderRadius: 30,
        borderWidth: 2, borderColor: '#60a5fa', marginBottom: 5
    },
    rootText: { color: 'white', fontWeight: 'bold', fontSize: 16 },
    verticalLine: { width: 2, height: 20, backgroundColor: '#4b5563' },
    branchesContainer: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 10 },
    branchWrapper: { alignItems: 'center', width: 140 },
    branchLine: { width: 2, height: 15, backgroundColor: '#4b5563', marginBottom: 5 },
    branchCard: {
        backgroundColor: '#1f2937', padding: 10, borderRadius: 10,
        borderWidth: 1, borderColor: '#374151', width: '100%', alignItems: 'center'
    },
    branchTitle: { color: '#e5e7eb', fontWeight: 'bold', fontSize: 13, marginBottom: 4, textAlign: 'center' },
    branchDesc: { color: '#9ca3af', fontSize: 10, textAlign: 'center' }
});
