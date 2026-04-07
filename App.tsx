import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { FeedScreen } from './src/screens/FeedScreen';
import { AuthProvider } from './src/contexts/AuthContext';
import "./global.css"

import { RootNavigator } from './src/navigation/RootNavigator';
import { BillingSuccessHandler } from './src/components/workspace/views/BillingSuccessHandler';

export default function App() {
  // 간단한 라우팅 인터셉트: 토스페이먼츠 결제 성공 리다이렉트 처리
  if (typeof window !== 'undefined' && window.location.pathname.startsWith('/payment/billing-success')) {
    return (
      <SafeAreaProvider>
        <AuthProvider>
          <BillingSuccessHandler />
        </AuthProvider>
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <AuthProvider>
        <RootNavigator />
      </AuthProvider>
    </SafeAreaProvider>
  );
}
