import React from 'react';
import { View, ViewProps } from 'react-native';

interface SeparatorProps extends ViewProps {
    orientation?: 'horizontal' | 'vertical';
    className?: string;
}

export const Separator: React.FC<SeparatorProps> = ({
    orientation = 'horizontal',
    className = '',
    style,
    ...props
}) => {
    const baseStyle = orientation === 'horizontal' ? 'h-[1px] w-full' : 'h-full w-[1px]';
    return (
        <View
            className={`bg-slate-800/80 ${baseStyle} ${className}`}
            style={style}
            {...props}
        />
    );
};
