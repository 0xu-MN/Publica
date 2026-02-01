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
                            style={[styles.dropdownItem, currentMode === mode.id && { backgroundColor: '#334155' }]}
                            onPress={() => { onSelectMode(mode.id); setVisible(false); }}
                        >
                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                <View style={{ width: 24, alignItems: 'center' }}>{mode.icon}</View>
                                <Text style={[styles.dropdownItemTitle, currentMode === mode.id && { color: 'white' }]}>{mode.id}</Text>
                            </View>
                            {currentMode === mode.id && <Check size={14} color="#10B981" />}
                        </TouchableOpacity>
                    ))}
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    modeTrigger: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#111', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: '#222' },
    modeTriggerText: { color: 'white', fontSize: 13, fontWeight: '600', marginLeft: 8, marginRight: 8 },
    dropdownMenu: { position: 'absolute', top: 45, left: 0, width: 220, backgroundColor: '#111', borderRadius: 8, borderWidth: 1, borderColor: '#333', padding: 4 },
    dropdownItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 10, borderRadius: 6 },
    dropdownItemTitle: { color: '#94A3B8', fontSize: 13, marginLeft: 10 },
});
