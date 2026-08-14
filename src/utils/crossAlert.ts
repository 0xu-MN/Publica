import { Alert, Platform } from 'react-native';

/**
 * react-native-web의 Alert.alert()는 완전한 no-op이라 웹에서는 아무 것도 뜨지 않는다.
 * (node_modules/react-native-web/dist/cjs/exports/Alert/index.js: `static alert() {}`)
 * 네이티브(iOS/Android)는 기존 Alert.alert 그대로 쓰고, 웹만 window.alert/confirm으로 대체한다.
 */
type AlertButton = { text: string; onPress?: () => void; style?: 'default' | 'cancel' | 'destructive' };

export function crossAlert(title: string, message?: string, buttons?: AlertButton[]) {
    if (Platform.OS !== 'web') {
        Alert.alert(title, message, buttons);
        return;
    }

    const fullMessage = message ? `${title}\n\n${message}` : title;

    if (!buttons || buttons.length <= 1) {
        window.alert(fullMessage);
        buttons?.[0]?.onPress?.();
        return;
    }

    // 2개 이상 버튼: confirm으로 단순화 (첫 버튼=확인/진행, 나머지=취소 취급)
    const confirmed = window.confirm(fullMessage);
    const confirmBtn = buttons.find(b => b.style !== 'cancel') || buttons[0];
    const cancelBtn = buttons.find(b => b.style === 'cancel');
    if (confirmed) confirmBtn?.onPress?.();
    else cancelBtn?.onPress?.();
}
