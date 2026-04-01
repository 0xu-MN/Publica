import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { ChevronDown, Check, Zap, BookOpen, Map } from 'lucide-react-native';

export const ModeDropdown = ({ currentMode, onSelectMode }: any) => {
    const [visible, setVisible] = useState(false);
    const modes = [
        { id: 'Hypothesis Generator', icon: <Zap size={14} color="#F59E0B" /> },
        { id: 'Literature Review', icon: <BookOpen size={14} color="#3B82F6" /> },
        { id: 'Research Planner', icon: <Map size={14} color="#10B981" /> },
    ];
    const activeMode = modes.find(m => m.id === currentMode) || modes[0];

    return (
        <View style={{ zIndex: 100 }}>
            <TouchableOpacity style={styles.modeTrigger} onPress={() => setVisible(!visible)}>
                {activeMode.icon}
                <Text style={styles.modeTriggerText}>{activeMode.id}</Text>
                <ChevronDown size={12} color="#94A3B8" />
            </TouchableOpacity>
            {visible && (
                <View style={styles.dropdownMenu}>
                    {modes.map((mode) => (
                        <TouchableOpacity
                            key={mode.id}
                            style={[styles.dropdownItem, currentMode === mode.id && { backgroundColor: 'rgba(124, 58, 237, 0.1)' }]}
                            onPress={() => { onSelectMode(mode.id); setVisible(false); }}
                        >
                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                <View style={{ width: 24, alignItems: 'center' }}>{mode.icon}</View>
                                <Text style={[styles.dropdownItemTitle, currentMode === mode.id && { color: '#27272a' }]}>{mode.id}</Text>
                            </View>
                            {currentMode === mode.id && <Check size={14} color="#7C3AED" />}
                        </TouchableOpacity>
                    ))}
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    modeTrigger: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 24, borderWidth: 1.5, borderColor: '#E2E8F0', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 5 },
    modeTriggerText: { color: '#27272a', fontSize: 13, fontWeight: '900', marginLeft: 10, marginRight: 10, letterSpacing: -0.3 },
    dropdownMenu: { position: 'absolute', top: 50, left: 0, width: 240, backgroundColor: '#FFFFFF', borderRadius: 16, borderWidth: 1, borderColor: '#E2E8F0', padding: 6, shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.1, shadowRadius: 20 },
    dropdownItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 12, borderRadius: 10 },
    dropdownItemTitle: { color: '#64748B', fontSize: 13, marginLeft: 12, fontWeight: '700' },
});
