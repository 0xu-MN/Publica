import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { NavigationContainer } from '@react-navigation/native';
import { View, Platform } from 'react-native';
import { Home, FlaskConical, TrendingUp, User, Heart } from 'lucide-react-native';

// Screens
import { FeedScreen } from '../screens/FeedScreen';
import { SupportScreen } from '../screens/SupportScreen';
import { ProfileScreen } from '../screens/ProfileScreen';

import { ProfileSetupScreen } from '../screens/ProfileSetupScreen';
import { useAuth } from '../contexts/AuthContext';
import { ActivityIndicator } from 'react-native';

const Tab = createBottomTabNavigator();

export const RootNavigator = () => {
    const { session, profileComplete, loading } = useAuth();

    if (loading) {
        return (
            <View style={{ flex: 1, backgroundColor: '#FDF8F3', alignItems: 'center', justifyContent: 'center' }}>
                <ActivityIndicator size="large" color="#7C3AED" />
            </View>
        );
    }

    return (
        <NavigationContainer documentTitle={{ formatter: () => 'Publica' }}>
            <FeedScreen />
        </NavigationContainer>
    );
};
