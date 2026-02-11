import React, { useEffect, useState, useRef } from 'react';
import { View, Text, ScrollView, Animated, Pressable } from 'react-native';
import { Svg, Path } from 'react-native-svg';
import { TrendingUp, TrendingDown } from 'lucide-react-native';
import { fetchMarketData, MarketData } from '../services/marketService';

const CHART_HEIGHT = 40;
const CHART_WIDTH = 100;

const MiniChart = ({ data, color }: { data: number[], color: string }) => {
    if (!data || data.length === 0) return null;

    const minVal = Math.min(...data);
    const maxVal = Math.max(...data);
    const range = maxVal - minVal || 1;

    const points = data.map((val, i) => {
        const x = (i / (data.length - 1)) * CHART_WIDTH;
        const y = CHART_HEIGHT - ((val - minVal) / range) * CHART_HEIGHT;
        return `${x},${y}`;
    }).join(' ');

    return (
        <View className="h-[40px] w-[100px] opacity-70">
            <Svg height="100%" width="100%" viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`}>
                <Path d={`M ${points}`} stroke={color} strokeWidth="2" fill="none" />
            </Svg>
        </View>
    );
};

const MarketTickerItem = ({ item }: { item: MarketData }) => {
    const isPositive = item.change >= 0;
    const color = isPositive ? '#34D399' : '#F87171';

    return (
        <View className="flex-row items-center mr-8 gap-4 py-3">
            {/* Symbol & Name */}
            <View>
                <Text className="text-slate-400 text-[11px] font-bold mb-0.5">{item.symbol}</Text>
                <Text className="text-white text-sm font-bold">{item.name}</Text>
            </View>

            {/* Value & Change */}
            <View className="items-end min-w-[80px]">
                <Text className={`text-sm font-bold ${isPositive ? 'text-emerald-400' : 'text-red-400'}`}>
                    {item.value.toLocaleString()}
                </Text>
                <View className="flex-row items-center">
                    {isPositive ? <TrendingUp size={10} color="#34D399" /> : <TrendingDown size={10} color="#F87171" />}
                    <Text className={`text-[10px] ml-1 ${isPositive ? 'text-emerald-400' : 'text-red-400'}`}>
                        {item.changePercent}%
                    </Text>
                </View>
            </View>

            {/* Mini Chart */}
            <MiniChart data={item.history} color={color} />

            {/* Divider */}
            <View className="w-[1px] h-8 bg-white/10 ml-4" />
        </View>
    );
};

export const CompactMarketTicker = () => {
    const [marketData, setMarketData] = useState<MarketData[]>([]);
    const [isHovered, setIsHovered] = useState(false);
    const scrollViewRef = useRef<ScrollView>(null);
    const scrollX = useRef(new Animated.Value(0)).current;

    // Animation state ref to avoid closure staleness issues
    const isHoveredRef = useRef(isHovered);

    useEffect(() => {
        isHoveredRef.current = isHovered;
    }, [isHovered]);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        const data = await fetchMarketData();
        // Triple data for smooth infinite loop
        setMarketData([...data, ...data, ...data]);
    };

    useEffect(() => {
        if (marketData.length === 0) return;

        let animationFrameId: number;
        let currentOffset = 0;
        const speed = 0.5; // Pixels per frame

        const loop = () => {
            if (!isHoveredRef.current && scrollViewRef.current) {
                currentOffset += speed;
                // Reset if reached end of first set (approximate logic, can be refined)
                // For simplicity, we just scroll continuously. In a real app, we'd measure content width.
                // Here we rely on large tripled data.
                scrollViewRef.current.scrollTo({ x: currentOffset, animated: false });
            }
            animationFrameId = requestAnimationFrame(loop);
        };

        loop();

        return () => cancelAnimationFrame(animationFrameId);
    }, [marketData]);

    if (marketData.length === 0) return null;

    return (
        <Pressable
            className="w-full rounded-[20px] py-1 px-6 overflow-hidden max-w-full"
            onHoverIn={() => setIsHovered(true)}
            onHoverOut={() => setIsHovered(false)}
        >
            <View className="flex-row items-center h-full">
                <ScrollView
                    ref={scrollViewRef}
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    className="flex-1"
                    contentContainerStyle={{ paddingRight: 40 }}
                    scrollEnabled={false} // Disable manual scroll to avoid conflict
                >
                    {marketData.map((item, index) => (
                        <MarketTickerItem key={`${item.symbol}-${index}`} item={item} />
                    ))}
                </ScrollView>
            </View>
        </Pressable>
    );
};
