import React from 'react';
import { WorkspaceLayout } from './workspace/WorkspaceLayout';

interface WorkspaceProps {
    onClose?: () => void;
}

export const Workspace = ({ onClose }: WorkspaceProps) => {
    return (
        <WorkspaceLayout onClose={onClose} />
    );
};
