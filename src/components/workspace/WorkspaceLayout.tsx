import React, { useState, useEffect } from 'react';
import { View, SafeAreaView, ActivityIndicator } from 'react-native';
// ⚠️ STATIC IMPORT (Improved Stability)
import AsyncStorage from '@react-native-async-storage/async-storage';

import { Sidebar, WorkspaceTab } from './Sidebar';
import { HomeView } from './views/HomeView';
import { AgentView } from '../../features/agent/AgentView';
import { FilesView, SupportView } from './views/Placeholders';

interface WorkspaceLayoutProps {
    onClose?: () => void;
}

export const WorkspaceLayout = ({ onClose }: WorkspaceLayoutProps) => {
    // Default to 'home', but we will load state immediately
    const [activeTab, setActiveTabState] = useState<WorkspaceTab>('home');
    const [isLoaded, setIsLoaded] = useState(false);

    // 🔄 Persistence Logic (Load on Mount)
    useEffect(() => {
        const loadTab = async () => {
            try {
                const saved = await AsyncStorage.getItem('WORKSPACE_ACTIVE_TAB');
                console.log("🔄 [Persistence] Loading Tab:", saved);

                if (saved) {
                    setActiveTabState(saved as WorkspaceTab);
                }
            } catch (e) {
                console.error("❌ [Persistence] Failed to load tab state", e);
            } finally {
                // Ensure state is updated before rendering content
                setIsLoaded(true);
            }
        };
        loadTab();
    }, []);

    // Save on Change
    const setActiveTab = async (tab: WorkspaceTab) => {
        console.log("💾 [Persistence] Saving Tab:", tab);
        setActiveTabState(tab);
        try {
            await AsyncStorage.setItem('WORKSPACE_ACTIVE_TAB', tab);
        } catch (e) {
            console.error("❌ [Persistence] Failed to save tab state", e);
        }
    };

    const renderContent = () => {
        if (!isLoaded) {
            return (
                <View className="flex-1 items-center justify-center bg-[#020617]">
                    <ActivityIndicator size="large" color="#3B82F6" />
                </View>
            );
        }

        switch (activeTab) {
            case 'home':
                return <HomeView />;
            case 'agent':
                return <AgentView />;
            case 'files':
                return <FilesView />;
            case 'support':
                return <SupportView />;
            default:
                return <HomeView />;
        }
    };

    return (
        <View className="flex-1 flex-row bg-[#020617]">
            {/* Sidebar (Fixed Left) */}
            <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />

            {/* Main Content Area (Dynamic Right) */}
            <View className="flex-1 flex-col">
                {/* We can add a top bar here if needed, or let views handle it */}
                {renderContent()}
            </View>
        </View>
    );
};
