/**
 * BorderGlow — 버튼/카드 hover 시 테두리에서 즉각 뿜어나오는 글로우
 *
 * 동작 방식:
 * - 호버 진입 → box-shadow 즉각(0ms) 등장
 * - 호버 이탈 → box-shadow 즉각 사라짐 (번쩍임 없음)
 * - View 사용으로 자식 요소 크기 레이아웃 유지
 */
import React, { useState, type ReactNode } from 'react';
import { Platform, View } from 'react-native';

interface BorderGlowProps {
  children?: ReactNode;
  glowColor?: string;
  borderRadius?: number;
  glowRadius?: number;
  [key: string]: any; // Allow any other props like edgeSensitivity silently ignored
}

function getAlphaColor(color: string, alpha: number) {
  if (color.startsWith('hsl')) {
    const match = color.match(/([\d.]+)\s*,?\s*([\d.]+%?)\s*,?\s*([\d.]+%?)/);
    if (match) {
      return `hsla(${match[1]}, ${match[2]}, ${match[3]}, ${alpha})`;
    }
  }
  if (color.startsWith('#')) {
    const aHex = Math.round(alpha * 255).toString(16).padStart(2, '0');
    return color.length === 4 
      ? `#${color[1]}${color[1]}${color[2]}${color[2]}${color[3]}${color[3]}${aHex}`
      : `${color.substring(0, 7)}${aHex}`;
  }
  return color;
}

export default function BorderGlow({
  children,
  glowColor = '#7C3AED',
  borderRadius = 16,
  glowRadius = 20,
}: BorderGlowProps) {
  const [hovered, setHovered] = useState(false);

  if (Platform.OS !== 'web') {
    return <>{children}</>;
  }

  const col = glowColor;
  const r = glowRadius;

  const wrapStyle: React.CSSProperties = {
    // 🌟 'inline-flex'만으로는 부족했다 — 부모가 RN 기본 column flex(align-items:stretch)면
    // 자식이 inline-flex여도 부모가 cross-axis(가로폭)를 강제로 늘려버린다. 그 늘어난 폭 전체에
    // hover 글로우(box-shadow)가 퍼져서 버튼 옆에 길쭉한 빈 박스가 나타났던 것.
    // alignSelf:'flex-start'로 부모의 stretch를 무시하고 자기 콘텐츠 크기만 차지하게 고정.
    display: 'inline-flex',
    alignSelf: 'flex-start',
    borderRadius,
    boxShadow: hovered
      ? `0 0 0 1.5px ${getAlphaColor(col, 1)}, 0 0 ${r * 0.5}px 3px ${getAlphaColor(col, 0.7)}, 0 0 ${r}px 6px ${getAlphaColor(col, 0.4)}, 0 0 ${r * 2}px 12px ${getAlphaColor(col, 0.15)}`
      : 'none',
  };

  return (
    <div
      style={wrapStyle}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {children}
    </div>
  );
}
