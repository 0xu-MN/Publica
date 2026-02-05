import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { FeedScreen } from './src/screens/FeedScreen';
import { AuthProvider } from './src/contexts/AuthContext';
import "./global.css"

export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <FeedScreen />
      </AuthProvider>
    </SafeAreaProvider>
  );
}
