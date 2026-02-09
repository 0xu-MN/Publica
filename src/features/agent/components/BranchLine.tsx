import React from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Path, Defs, LinearGradient, Stop } from 'react-native-svg';
import { LAYOUT } from '../AgentLayout';

interface BranchLineProps {
    isSelected: boolean;
    myIndex: number;
    parentIndex: number;
}

export const BranchLine = ({ isSelected, myIndex, parentIndex }: BranchLineProps) => {
    // 1. 부모와 나 사이의 수직 거리(Delta Y) 계산
    const verticalDiff = (parentIndex - myIndex) * (LAYOUT.CARD_HEIGHT + LAYOUT.CARD_GAP);

    // 2. 좌표 정의
    const centerY = LAYOUT.CARD_HEIGHT / 2;
    // Parent right anchor is at -4 relative to parent right edge. 
    // Gap is 50. So parent right edge is at -50 relative to my left edge.
    // Parent anchor right is at -46 relative to my left edge.
    // My anchor left is at -4 relative to my left edge.
    // SVG viewbox starts at -50.
    // Parent anchor X: -46 - (-50) = 4
    // My anchor X: -4 - (-50) = 46
    const startX = 4;
    const startY = centerY + verticalDiff;
    const endX = LAYOUT.CONNECTOR_WIDTH - 4; // LAYOUT.CONNECTOR_WIDTH is 50, so 46
    const endY = centerY;

    // 3. 베지에 곡선 핸들
    const cp1X = LAYOUT.CONNECTOR_WIDTH * 0.5;
    const cp1Y = startY;
    const cp2X = LAYOUT.CONNECTOR_WIDTH * 0.5;
    const cp2Y = endY;

    const pathData = `M ${startX} ${startY} C ${cp1X} ${cp1Y}, ${cp2X} ${cp2Y}, ${endX} ${endY}`;

    return (
        <View style={styles.connectorPos}>
            <Svg width={LAYOUT.CONNECTOR_WIDTH} height={LAYOUT.CARD_HEIGHT + Math.abs(verticalDiff)} style={{ overflow: 'visible' }}>
                <Defs>
                    <LinearGradient id="grad" x1="0" y1="0" x2="1" y2="0">
                        <Stop offset="0" stopColor={isSelected ? "#10B981" : "#334155"} stopOpacity="0.6" />
                        <Stop offset="1" stopColor={isSelected ? "#10B981" : "#334155"} stopOpacity="1" />
                    </LinearGradient>
                </Defs>
                <Path
                    d={pathData}
                    stroke={isSelected ? "#10B981" : "#334155"}
                    strokeWidth={isSelected ? "2" : "1"}
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
