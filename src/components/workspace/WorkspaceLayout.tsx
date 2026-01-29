import React, { useState } from 'react';
import { View, SafeAreaView } from 'react-native';
import { Sidebar, WorkspaceTab } from './Sidebar';
import { HomeView } from './views/HomeView';
import { AgentView } from './views/AgentView';
import { FilesView, SupportView } from './views/Placeholders';

interface WorkspaceLayoutProps {
    onClose?: () => void;
}

export const WorkspaceLayout = ({ onClose }: WorkspaceLayoutProps) => {
    const [activeTab, setActiveTab] = useState<WorkspaceTab>('home');

    const renderContent = () => {
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
