import React, { useEffect, useState, useRef } from 'react';
import { View, Text, ScrollView, TouchableOpacity, useWindowDimensions, ActivityIndicator, Animated, Pressable } from 'react-native';
import { Svg, Path, Defs, LinearGradient, Stop, Line } from 'react-native-svg';
import { TrendingUp, TrendingDown, RefreshCw } from 'lucide-react-native';
import { fetchMarketData, MarketData } from '../services/marketService';

const CHART_HEIGHT = 100;
const CHART_WIDTH = 280;

const MarketChartCard = ({ data }: { data: MarketData }) => {
    const isPositive = data.change >= 0;
    const color = isPositive ? '#34D399' : '#F87171'; // Emerald-400 vs Red-400

    // Normalize Data for SVG
    const minVal = Math.min(...data.history);
    const maxVal = Math.max(...data.history);
    const range = maxVal - minVal || 1; // avoid divide by zero

    const points = data.history.map((val, i) => {
        const x = (i / (data.history.length - 1)) * CHART_WIDTH;
        const y = CHART_HEIGHT - ((val - minVal) / range) * CHART_HEIGHT;
        return `${x},${y}`;
    }).join(' ');

    const linePath = `M ${points}`;
    const areaPath = `${linePath} L ${CHART_WIDTH},${CHART_HEIGHT} L 0,${CHART_HEIGHT} Z`;

    return (
        <View className="w-[320px] h-[200px] bg-slate-800/40 rounded-[28px] p-5 mr-4 border border-white/5 relative overflow-hidden">
            {/* Header */}
            <View className="flex-row justify-between items-start mb-2 z-10">
                <View>
                    <Text className="text-slate-400 text-xs font-bold mb-1">{data.symbol}</Text>
                    <Text className="text-white text-lg font-bold">{data.name}</Text>
                </View>
                <View className={`items-end ${isPositive ? 'bg-emerald-500/10' : 'bg-red-500/10'} px-2 py-1 rounded-lg`}>
                    <Text className={`text-base font-bold ${isPositive ? 'text-emerald-400' : 'text-red-400'}`}>
                        {data.value.toLocaleString()}
                    </Text>
                    <View className="flex-row items-center">
                        {isPositive ? <TrendingUp size={12} color="#34D399" /> : <TrendingDown size={12} color="#F87171" />}
                        <Text className={`text-xs ml-1 ${isPositive ? 'text-emerald-400' : 'text-red-400'}`}>
                            {isPositive ? '+' : ''}{data.change} ({data.changePercent}%)
                        </Text>
                    </View>
                </View>
            </View>

            {/* Chart */}
            <View className="flex-1 -mx-5 -mb-5 mt-2 opacity-80">
                <Svg height="100%" width="100%" viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`} preserveAspectRatio="none">
                    <Defs>
                        <LinearGradient id={`grad-${data.symbol}`} x1="0" y1="0" x2="0" y2="1">
                            <Stop offset="0" stopColor={color} stopOpacity="0.3" />
                            <Stop offset="1" stopColor={color} stopOpacity="0.0" />
                        </LinearGradient>
                    </Defs>
                    <Path d={areaPath} fill={`url(#grad-${data.symbol})`} />
                    <Path d={linePath} stroke={color} strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                </Svg>
            </View>
        </View>
    );
};

export const MarketCarouselWidget = () => {
    const [marketData, setMarketData] = useState<MarketData[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const scrollViewRef = useRef<ScrollView>(null);
    const currentPositionRef = useRef(0);
    const [isPaused, setIsPaused] = useState(false);
    const [contentWidth, setContentWidth] = useState(0);
    const [scrollViewWidth, setScrollViewWidth] = useState(0);
    const rotation = useRef(new Animated.Value(0)).current;

    const loadData = async (force: boolean = false) => {
        if (force) setRefreshing(true);
        else setLoading(true);

        // Start rotation if refreshing
        if (force) {
            Animated.loop(
                Animated.timing(rotation, {
                    toValue: 1,
                    duration: 1000,
                    useNativeDriver: true,
                })
            ).start();
        }

        try {
            const data = await fetchMarketData(force);
            // Duplicate data for infinite scroll effect
            setMarketData([...data, ...data, ...data]);
        } catch (error) {
            console.error('Failed to load market data:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
            rotation.stopAnimation();
            rotation.setValue(0);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    // Auto-scroll animation
    // Auto-scroll animation
    useEffect(() => {
        if (marketData.length === 0 || scrollViewWidth === 0) return;

        const cardWidth = 336; // 320 + 16 gap
        // Using ref for current position to survive re-renders (like isPaused change)

        const scrollSpeed = 0.5; // pixels per frame

        let animationId: number;

        const animate = () => {
            if (!isPaused) {
                currentPositionRef.current += scrollSpeed;

                // Reset to beginning when reaching the end of first set
                const resetPoint = cardWidth * (marketData.length / 3);
                if (currentPositionRef.current >= resetPoint) {
                    currentPositionRef.current = 0;
                    scrollViewRef.current?.scrollTo({ x: 0, animated: false });
                } else {
                    scrollViewRef.current?.scrollTo({ x: currentPositionRef.current, animated: false });
                }
            }
            animationId = requestAnimationFrame(animate);
        };

        animationId = requestAnimationFrame(animate);

        return () => cancelAnimationFrame(animationId);
    }, [marketData, scrollViewWidth, isPaused]);

    if (loading) {
        return (
            <View className="h-[240px] justify-center items-center">
                <ActivityIndicator color="#60A5FA" />
                <Text className="text-slate-500 text-xs mt-2">시장 데이터 분석 중...</Text>
            </View>
        );
    }

    return (
        <Pressable
            className="mt-2"
            onHoverIn={() => setIsPaused(true)}
            onHoverOut={() => setIsPaused(false)}
        >
            <View className="flex-row items-center justify-between mb-4 px-2">
                <View className="flex-row items-center">
                    <TrendingUp size={18} color="#F87171" />
                    <Text className="text-slate-200 text-base font-bold ml-2">글로벌 마켓 트렌드</Text>
                    <View className="bg-red-500/10 px-2 py-0.5 rounded-full ml-2">
                        <Text className="text-red-400 text-[10px] font-bold">LIVE</Text>
                    </View>
                </View>
                <TouchableOpacity
                    onPress={() => loadData(true)}
                    disabled={refreshing}
                    className={`flex-row items-center px-3 py-1.5 rounded-full border border-white/5 ${refreshing ? 'bg-blue-500/20' : 'bg-slate-800/80'}`}
                >
                    <Animated.View style={{
                        transform: [{
                            rotate: rotation.interpolate({
                                inputRange: [0, 1],
                                outputRange: ['0deg', '360deg']
                            })
                        }],
                        marginRight: 6
                    }}>
                        <RefreshCw size={12} color={refreshing ? "#60A5FA" : "#94A3B8"} />
                    </Animated.View>
                    <Text className={`text-xs font-semibold ${refreshing ? 'text-blue-400' : 'text-slate-400'}`}>
                        {refreshing ? '갱신 중...' : '실시간 갱신'}
                    </Text>
                </TouchableOpacity>
            </View>

            <ScrollView
                ref={scrollViewRef}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingRight: 20 }}
                scrollEnabled={false} // Disable manual scrolling for auto-scroll effect
                onLayout={(e) => setScrollViewWidth(e.nativeEvent.layout.width)}
                onContentSizeChange={(width) => setContentWidth(width)}
            >
                {marketData.map((item, index) => (
                    <MarketChartCard key={`${item.symbol}-${index}`} data={item} />
                ))}
            </ScrollView>
        </Pressable>
    );
};
