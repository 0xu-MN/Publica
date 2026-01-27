import AsyncStorage from '@react-native-async-storage/async-storage';

export interface MarketData {
    symbol: string;
    name: string;
    value: number;
    change: number;
    changePercent: number;
    history: number[]; // Simple array for sparkline
    lastUpdated: number;
}

const CACHE_KEY = 'MARKET_DATA_CACHE_V1';
const CACHE_DURATION = 1000 * 60 * 60; // 1 Hour

// Initial Mock Data Generators for reliable demo
const generateHistory = (base: number, volatility: number, count: number = 30) => {
    let current = base;
    const history = [];
    for (let i = 0; i < count; i++) {
        const change = (Math.random() - 0.5) * volatility;
        current += change;
        history.push(current);
    }
    return history;
};

const MOCK_DATA: MarketData[] = [
    {
        symbol: 'USD/KRW',
        name: '원/달러 환율',
        value: 1385.50,
        change: 5.2,
        changePercent: 0.38,
        history: generateHistory(1380, 5, 30),
        lastUpdated: Date.now(),
    },
    {
        symbol: 'KOSPI',
        name: '코스피',
        value: 2755.40,
        change: -12.3,
        changePercent: -0.45,
        history: generateHistory(2760, 20, 30),
        lastUpdated: Date.now(),
    },
    {
        symbol: 'XAU/USD',
        name: '국제 금',
        value: 2345.10,
        change: 15.4,
        changePercent: 0.66,
        history: generateHistory(2330, 25, 30),
        lastUpdated: Date.now(),
    },
    {
        symbol: 'WTI',
        name: 'WTI 원유',
        value: 82.45,
        change: -0.55,
        changePercent: -0.67,
        history: generateHistory(83, 1.5, 30),
        lastUpdated: Date.now(),
    },
    {
        symbol: 'KOSDAQ',
        name: '코스닥',
        value: 865.20,
        change: 4.3,
        changePercent: 0.50,
        history: generateHistory(860, 5, 30),
        lastUpdated: Date.now(),
    },
    {
        symbol: 'S&P 500',
        name: 'S&P 500',
        value: 5230.50,
        change: 25.4,
        changePercent: 0.49,
        history: generateHistory(5210, 30, 30),
        lastUpdated: Date.now(),
    },
    {
        symbol: 'NASDAQ',
        name: '나스닥',
        value: 16400.10,
        change: 120.3,
        changePercent: 0.74,
        history: generateHistory(16300, 150, 30),
        lastUpdated: Date.now(),
    }
];

export const fetchMarketData = async (): Promise<MarketData[]> => {
    try {
        // 1. Check Cache
        const cached = await AsyncStorage.getItem(CACHE_KEY);
        if (cached) {
            const parsed = JSON.parse(cached);
            const now = Date.now();
            // Check if any check is old
            if (now - parsed[0].lastUpdated < CACHE_DURATION) {
                console.log('Using Cached Market Data');
                return parsed;
            }
        }

        // 2. Attempt Real API (Simulated with realistic fallback for demo stability)
        // In a real production app, we would make 4 distinct fetch calls here.
        // For this demo, we will use the generator to create "live-looking" variances
        // based on the previous mock data to simulate updates.

        console.log('Fetching Fresh Market Data...');

        // Simulating API latency
        await new Promise(resolve => setTimeout(resolve, 800));

        const freshData = MOCK_DATA.map(item => {
            // Update value slightly to look "live"
            const variance = item.value * 0.005; // 0.5% variance
            const change = (Math.random() - 0.5) * variance;
            const newValue = item.value + change;

            // Generate new history ending at new value
            const newHistory = generateHistory(newValue, variance / 2, 30);

            return {
                ...item,
                value: parseFloat(newValue.toFixed(2)),
                change: parseFloat(change.toFixed(2)),
                changePercent: parseFloat(((change / item.value) * 100).toFixed(2)),
                history: newHistory,
                lastUpdated: Date.now()
            };
        });

        // 3. Save to Cache
        await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(freshData));
        return freshData;

    } catch (error) {
        console.error('Market Data Error:', error);
        return MOCK_DATA; // Fallback
    }
};
