import React, { useState, useEffect } from 'react';
import { View, Platform } from 'react-native';

interface SoftAuroraProps {
  speed?: number;
  scale?: number;
  brightness?: number;
  color1?: string;
  color2?: string;
  noiseFrequency?: number;
  noiseAmplitude?: number;
  bandHeight?: number;
  bandSpread?: number;
  octaveDecay?: number;
  layerOffset?: number;
  colorSpeed?: number;
  enableMouseInteraction?: boolean;
  mouseInfluence?: number;
  style?: any;
  children?: React.ReactNode;
}

export const SoftAurora = ({ children, style, ...props }: SoftAuroraProps) => {
  const [InnerComponent, setInnerComponent] = useState<any>(null);

  useEffect(() => {
    // Dynamically import the pure ReactBits component that uses ogl to avoid top-level SSR crash
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      import('./SoftAuroraInner')
        .then((mod) => setInnerComponent(() => mod.default))
        .catch((err) => console.error('Failed to load SoftAuroraInner:', err));
    }
  }, []);

  if (Platform.OS !== 'web' || !InnerComponent) {
    // SSR Fallback or Native Fallback
    return <View style={style}>{children}</View>;
  }

  // Pure ReactBits component renders to an absolute canvas which we put behind children
  return (
    <View style={[{ position: 'relative', overflow: 'hidden' }, style]}>
      <View style={{ position: 'absolute', inset: 0, zIndex: 0, opacity: 0.8 }}>
        <InnerComponent {...props} />
      </View>
      <View style={{ position: 'relative', zIndex: 1 }}>
        {children}
      </View>
    </View>
  );
};
