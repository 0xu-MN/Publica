import React from 'react';
import { FeedScreen } from './src/screens/FeedScreen';
import { AuthProvider } from './src/contexts/AuthContext';

export default function App() {
  return (
    <AuthProvider>
      <FeedScreen />
    </AuthProvider>
  );
}
