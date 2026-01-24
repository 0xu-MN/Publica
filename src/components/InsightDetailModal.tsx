import React from 'react';
import { View, Modal, Pressable, Platform, Alert } from 'react-native';
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
                className="flex-1 justify-center items-center p-5"
                style={{ backgroundColor: 'rgba(0, 0, 0, 0.85)' }}
            >
                <Pressable className="absolute inset-0" onPress={onClose} />

                <Animated.View
                    entering={SlideInUp.duration(400).springify()}
                    style={[
                        { width: 500, maxHeight: '90%' },
                        Platform.OS === 'web' ? { filter: 'drop-shadow(0px 10px 20px rgba(0,0,0,0.5))' } : { elevation: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.5, shadowRadius: 20 }
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
