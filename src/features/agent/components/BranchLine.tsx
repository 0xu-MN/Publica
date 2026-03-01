import React from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Path, Defs, LinearGradient, Stop } from 'react-native-svg';
import { LAYOUT } from '../AgentLayout';

interface BranchLineProps {
    isSelected: boolean;
    myIndex: number;
    parentIndex: number;
    verticalDiff?: number;
}

export const BranchLine = ({ isSelected, myIndex, parentIndex, verticalDiff }: BranchLineProps) => {
    // 1. 부모와 나 사이의 수직 거리(Delta Y)
    const finalVerticalDiff = verticalDiff !== undefined
        ? verticalDiff
        : (parentIndex - myIndex) * (LAYOUT.CARD_HEIGHT + LAYOUT.CARD_GAP);

    // 2. SVG Box Dimensions
    // The width is always the set connector width. 
    // The height must be at least the vertical difference between the two center points, plus a small buffer (e.g. 2px) so strokes aren't clipped.
    // However, if they are horizontally perfectly aligned (diff === 0), we still need a minimal height to paint the horizontal line.
    const svgWidth = LAYOUT.CONNECTOR_WIDTH;
    const svgHeight = Math.max(Math.abs(finalVerticalDiff), 2); // Minimum 2px height to avoid invisible SVG

    // 3. 내부 좌표 매핑
    // `verticalDiff` is negative if parent is ABOVE us (we are lower).
    // `verticalDiff` is positive if parent is BELOW us (we are higher).

    const isParentAbove = finalVerticalDiff < 0;

    // Parent dot is always on the left edge of this SVG connecting space.
    // Child dot is always on the right edge of this SVG connecting space.
    const startX = 0;
    const endX = svgWidth;

    // If parent is above us, parent startY is at top (0), and child endY is at bottom (svgHeight).
    // If parent is below us, parent startY is at bottom (svgHeight), and child endY is at top (0).
    const startY = isParentAbove ? 0 : svgHeight;
    const endY = isParentAbove ? svgHeight : 0;

    // 4. 베지에 곡선 핸들 (More graceful curve)
    // Pull the control points horizontally towards the middle so it flows smoothly out of the dots
    const cp1X = startX + (endX - startX) * 0.45;
    const cp1Y = startY;
    const cp2X = endX - (endX - startX) * 0.45;
    const cp2Y = endY;

    const pathData = `M ${startX} ${startY} C ${cp1X} ${cp1Y}, ${cp2X} ${cp2Y}, ${endX} ${endY}`;

    // 5. Box Offset
    // We position the SVG container so its top edge perfectly aligns with whoever is higher up (parent or child).
    // The `TowerCard` anchor origin is at top: 50% of the child card.
    // So if the parent is ABOVE us, the SVG top should be pushed UP by the exact vertical difference.
    // If the parent is BELOW us, the child is higher, so the SVG top stays right at our center point (offset 0).
    const topOffset = isParentAbove ? -Math.abs(finalVerticalDiff) : 0;

    return (
        <View style={[styles.connectorPos, { top: '50%', marginTop: topOffset, left: -LAYOUT.CONNECTOR_WIDTH }]}>
            <Svg width={svgWidth} height={svgHeight} style={{ overflow: 'visible' }}>
                <Defs>
                    <LinearGradient id="grad" x1="0" y1="0" x2="1" y2="0">
                        <Stop offset="0" stopColor={isSelected ? "#10B981" : "#334155"} stopOpacity="0.6" />
                        <Stop offset="1" stopColor={isSelected ? "#10B981" : "#334155"} stopOpacity="1" />
                    </LinearGradient>
                </Defs>
                <Path
                    d={pathData}
                    stroke={isSelected ? "#10B981" : "#334155"}
                    strokeWidth={isSelected ? "2.5" : "1.5"}
                    fill="none"
                />
            </Svg>
        </View>
    );
};

const styles = StyleSheet.create({
    connectorPos: {
        position: 'absolute',
        left: -LAYOUT.CONNECTOR_WIDTH,
        top: 0,
        width: LAYOUT.CONNECTOR_WIDTH,
        zIndex: -1,
        overflow: 'visible'
    }
});
