// src/features/agent/AgentLayout.ts

export const LAYOUT = {
    CARD_HEIGHT: 160,       // 카드 높이
    CARD_GAP: 20,           // 카드 상하 간격
    CONNECTOR_WIDTH: 80,    // 부모-자식 가로 거리 (선 길이)

    // 노드 하나가 차지하는 실제 수직 공간 (계산용)
    get NODE_HEIGHT() {
        return this.CARD_HEIGHT + this.CARD_GAP;
    }
};
