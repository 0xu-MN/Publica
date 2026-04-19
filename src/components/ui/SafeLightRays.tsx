import React, { useState, useEffect } from 'react';
import { View, Platform } from 'react-native';

export const SafeLightRays = (props: any) => {
    const [LightRaysComponent, setLightRaysComponent] = useState<any>(null);

    useEffect(() => {
        if (Platform.OS === 'web' && typeof window !== 'undefined') {
            // Dynamically import to avoid Node.js SSR missing window/document errors which crash Expo
            import('../LightRays').then((mod) => {
                setLightRaysComponent(() => mod.default);
            }).catch(err => console.error("Failed to load LightRays:", err));
        }
    }, []);

    if (!LightRaysComponent) {
        return <View style={{ flex: 1, width: '100%', height: '100%', backgroundColor: 'transparent' }} />;
    }

    return <LightRaysComponent {...props} />;
};
