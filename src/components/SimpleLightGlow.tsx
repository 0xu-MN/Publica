import React from 'react';
import { View } from 'react-native';
import Svg, { Defs, LinearGradient as SvgLinearGradient, Stop, Path } from 'react-native-svg';

interface SimpleLightGlowProps {
    color?: string;
    intensity?: number;
    width?: number;
    height?: number;
}

export const SimpleLightGlow: React.FC<SimpleLightGlowProps> = ({
    color = '#93C5FD',
    intensity = 0.6,
    width = 500,
    height = 300,
}) => {
    // Create multiple ray shapes that fan out from the center top
    const rays = [];
    const numRays = 7; // Number of light rays
    const centerX = width / 2;
    const startY = 0;

    for (let i = 0; i < numRays; i++) {
        const angle = ((i - (numRays - 1) / 2) * 15); // Spread rays -45 to +45 degrees
        const rayWidth = 40 + (i % 2) * 20; // Varying widths for depth
        const rayLength = height;

        // Calculate ray endpoints
        const angleRad = (angle * Math.PI) / 180;
        const leftOffset = -rayWidth / 2;
        const rightOffset = rayWidth / 2;

        // Bottom spread
        const bottomSpread = 80 + Math.abs(angle) * 2;
        const bottomLeft = centerX + leftOffset + Math.sin(angleRad) * rayLength - bottomSpread;
        const bottomRight = centerX + rightOffset + Math.sin(angleRad) * rayLength + bottomSpread;
        const bottomY = rayLength;

        const pathData = `
            M ${centerX + leftOffset} ${startY}
            L ${centerX + rightOffset} ${startY}
            L ${bottomRight} ${bottomY}
            L ${bottomLeft} ${bottomY}
            Z
        `;

        rays.push(
            <Path
                key={i}
                d={pathData}
                fill={`url(#gradient${i})`}
                opacity={0.3 + (Math.abs((numRays - 1) / 2 - i) / numRays) * 0.4}
            />
        );
    }

    return (
        <View style={{ width, height }} className="items-center justify-start overflow-hidden">
            <Svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
                <Defs>
                    {Array.from({ length: numRays }).map((_, i) => (
                        <SvgLinearGradient
                            key={i}
                            id={`gradient${i}`}
                            x1="0"
                            y1="0"
                            x2="0"
                            y2="1"
                        >
                            <Stop offset="0%" stopColor={color} stopOpacity={intensity * 0.8} />
                            <Stop offset="50%" stopColor={color} stopOpacity={intensity * 0.4} />
                            <Stop offset="100%" stopColor={color} stopOpacity={0} />
                        </SvgLinearGradient>
                    ))}
                </Defs>
                {rays}
            </Svg>
        </View>
    );
};
