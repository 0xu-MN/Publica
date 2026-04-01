import React from 'react';
import { View, Modal, Pressable, Platform, Alert, StyleSheet } from 'react-native';
import Animated, { SlideInUp } from 'react-native-reanimated';
import { useAuth } from '../contexts/AuthContext';
import { AuthModal } from './AuthModal';
import { InsightDetailPane } from './InsightDetailPane';

interface InsightDetailModalProps {
    item: any | null;
    visible: boolean;
    onClose: () => void;
    isScrapped?: boolean;
    onToggleScrap?: (item: any, newStatus: boolean) => void;
}

export const InsightDetailModal: React.FC<InsightDetailModalProps> = ({ item, visible, onClose, isScrapped, onToggleScrap }) => {
    const { user } = useAuth();
    const [authModalVisible, setAuthModalVisible] = React.useState(false);
    const [isBookmarked, setIsBookmarked] = React.useState(false);

    // Check bookmark status when item opens
    React.useEffect(() => {
        if (item && user) {
            checkBookmarkStatus();
        } else {
            setIsBookmarked(false);
        }
    }, [item, user]);

    // Use props if available, or fetch fresh status
    const checkBookmarkStatus = async () => {
        // If the parent passed the status, trust it first (optimization)
        if (isScrapped !== undefined) {
            setIsBookmarked(isScrapped);
            return;
        }

        if (!item || !user) return;

        // Fallback: Check via service (AsyncStorage/DB)
        const { getScrappedIds } = require('../services/newsService');
        const ids = await getScrappedIds(user.id);
        setIsBookmarked(ids.has(item.headline || item.title));
    };

    const handleBookmark = async () => {
        if (!user) {
            setAuthModalVisible(true);
            return;
        }

        if (!item) return;

        try {
            const { toggleScrap } = require('../services/newsService');
            // Toggle in service (AsyncStorage)
            const newStatus = await toggleScrap(user.id, item);
            setIsBookmarked(newStatus);

            // Notify parent to update its state
            if (onToggleScrap) {
                onToggleScrap(item, newStatus);
            }
        } catch (error) {
            console.error('Bookmark error:', error);
        }
    };

    if (!item) return null;

    return (
        <Modal
            visible={visible}
            animationType="fade"
            transparent
            onRequestClose={onClose}
            statusBarTranslucent
        >
            <View
                style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20, backgroundColor: 'rgba(253, 248, 243, 0.4)' }}
            >
                <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />

                <Animated.View
                    entering={SlideInUp.duration(400).springify()}
                    style={[
                        { width: 500, maxHeight: '90%', borderRadius: 40, overflow: 'hidden', backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E2E8F0' },
                        Platform.OS === 'web' ? { filter: 'drop-shadow(0px 20px 40px rgba(0,0,0,0.1))' } : { elevation: 15, shadowColor: '#000', shadowOffset: { width: 0, height: 15 }, shadowOpacity: 0.1, shadowRadius: 30 }
                    ]}
                >
                    <InsightDetailPane
                        item={item}
                        onClose={onClose}
                        isBookmarked={isBookmarked}
                        onToggleBookmark={handleBookmark}
                    />
                </Animated.View>
            </View>
            <AuthModal
                visible={authModalVisible}
                onClose={() => setAuthModalVisible(false)}
            />
        </Modal >
    );
};
