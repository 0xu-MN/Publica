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
    const verticalDiff = (parentIndex - myIndex) * LAYOUT.NODE_HEIGHT;

    // 2. 좌표 정의
    const centerY = LAYOUT.CARD_HEIGHT / 2;
    const startX = 0;
    const startY = centerY + verticalDiff; // 부모의 Y 위치
    const endX = LAYOUT.CONNECTOR_WIDTH;
    const endY = centerY; // 나의 Y 위치

    // 3. 베지에 곡선 핸들
    const cp1X = LAYOUT.CONNECTOR_WIDTH * 0.5;
    const cp1Y = startY;
    const cp2X = LAYOUT.CONNECTOR_WIDTH * 0.5;
    const cp2Y = endY;

    const pathData = `M ${startX} ${startY} C ${cp1X} ${cp1Y}, ${cp2X} ${cp2Y}, ${endX} ${endY}`;

    return (
        <View style={styles.connectorPos}>
            <Svg width={LAYOUT.CONNECTOR_WIDTH} height={LAYOUT.CARD_HEIGHT} style={{ overflow: 'visible' }}>
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
