import React from 'react';
import { WorkspaceLayout } from './workspace/WorkspaceLayout';

interface WorkspaceProps {
    onClose?: () => void;
    initialSession?: any;
}

export const Workspace = ({ onClose, initialSession }: WorkspaceProps) => {
    return (
        <WorkspaceLayout onClose={onClose} initialSession={initialSession} />
    );
};
