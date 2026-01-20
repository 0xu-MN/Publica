import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { NavigationContainer } from '@react-navigation/native';
import { View, Platform } from 'react-native';
import { Home, FlaskConical, TrendingUp, User, Heart } from 'lucide-react-native';

// Screens
import { FeedScreen } from '../screens/FeedScreen';
import { SupportScreen } from '../screens/SupportScreen';
import { ProfileScreen } from '../screens/ProfileScreen';

const Tab = createBottomTabNavigator();

export const RootNavigator = () => {
    return (
        <NavigationContainer>
            <Tab.Navigator
                screenOptions={{
                    headerShown: false,
                    tabBarStyle: {
                        backgroundColor: '#050B14',
                        borderTopColor: 'rgba(255,255,255,0.05)',
                        height: Platform.OS === 'ios' ? 88 : 60,
                        paddingTop: 5,
                        paddingBottom: Platform.OS === 'ios' ? 30 : 5,
                    },
                    tabBarActiveTintColor: '#3B82F6',
                    tabBarInactiveTintColor: '#64748B',
                    tabBarLabelStyle: {
                        fontSize: 11,
                        fontWeight: '500',
                    }
                }}
            >
                <Tab.Screen
                    name="Home"
                    component={FeedScreen}
                    options={{
                        tabBarLabel: '홈',
                        tabBarIcon: ({ color, size }) => <Home size={size} color={color} />
                    }}
                />

                {/* TEMPORARILY DISABLED FOR DEBUGGING
                <Tab.Screen
                    name="Science"
                    component={FeedScreen}
                    initialParams={{ initialCategory: '과학' }}
                    options={{
                        tabBarLabel: '과학',
                        tabBarIcon: ({ color, size }) => <FlaskConical size={size} color={color} />
                    }}
                />

                <Tab.Screen
                    name="Economy"
                    component={FeedScreen}
                    initialParams={{ initialCategory: '경제' }}
                    options={{
                        tabBarLabel: '경제',
                        tabBarIcon: ({ color, size }) => <TrendingUp size={size} color={color} />
                    }}
                />
                */}

                <Tab.Screen
                    name="Support"
                    component={SupportScreen}
                    options={{
                        tabBarLabel: '서포트',
                        tabBarIcon: ({ color, size }) => <Heart size={size} color={color} />
                    }}
                />

                <Tab.Screen
                    name="Profile"
                    component={ProfileScreen}
                    options={{
                        tabBarLabel: 'MY',
                        tabBarIcon: ({ color, size }) => <User size={size} color={color} />
                    }}
                />
            </Tab.Navigator>
        </NavigationContainer>
    );
};
