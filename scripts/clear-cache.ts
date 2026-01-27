import AsyncStorage from '@react-native-async-storage/async-storage';

async function clearCache() {
    try {
        await AsyncStorage.clear();
        console.log('✅ AsyncStorage cache cleared!');
    } catch (e) {
        console.error('Error clearing cache:', e);
    }
}

clearCache();
