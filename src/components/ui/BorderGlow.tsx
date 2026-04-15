import { useRef, useState, useEffect, type ReactNode } from 'react';
import { Platform, View } from 'react-native';

interface BorderGlowProps {
  children?: ReactNode;
  edgeSensitivity?: number;
  glowColor?: string;
  backgroundColor?: string;
  borderRadius?: number;
  glowRadius?: number;
  glowIntensity?: number;
  animated?: boolean;
  colors?: string[];
}

function parseHSL(hslStr: string): { h: number; s: number; l: number } {
  const match = hslStr.match(/([\d.]+)\s*([\d.]+)%?\s*([\d.]+)%?/);
  if (!match) return { h: 262, s: 83, l: 58 };
  return {
    h: parseFloat(match[1]),
    s: parseFloat(match[2]),
    l: parseFloat(match[3])
  };
}

export default function BorderGlow({
  children,
  edgeSensitivity = 27,
  glowColor = "hsl(262, 83%, 58%)",
  backgroundColor = "transparent",
  borderRadius = 26,
  glowRadius = 77,
  glowIntensity = 2.9,
}: BorderGlowProps) {
  const containerRef = useRef<any>(null);
  const [angleDeg, setAngleDeg] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (Platform.OS !== 'web') return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;
      const el = containerRef.current as HTMLElement;
      const rect = el.getBoundingClientRect?.();
      if (!rect) return;

      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const nearEdge =
        x >= -edgeSensitivity && x <= rect.width + edgeSensitivity &&
        y >= -edgeSensitivity && y <= rect.height + edgeSensitivity &&
        (x < edgeSensitivity || x > rect.width - edgeSensitivity ||
          y < edgeSensitivity || y > rect.height - edgeSensitivity);

      setIsVisible(nearEdge);

      if (nearEdge) {
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        const angle = Math.atan2(y - centerY, x - centerX) * (180 / Math.PI) + 90;
        setAngleDeg(angle);
      }
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [edgeSensitivity]);

  // Native: pass-through
  if (Platform.OS !== 'web') {
    return <>{children}</>;
  }

  const { h, s, l } = parseHSL(glowColor);
  const base = `${h}deg ${s}% ${l}%`;
  // Do NOT clamp to 1 — callers may pass values like 0.6, 0.7 which already look right
  const intensity = glowIntensity;

  const containerStyle: any = {
    position: 'relative',
    borderRadius,
    backgroundColor,
    // NO overflow:hidden — lets the glow extend outside
    display: 'inline-flex',
    width: '100%',
  };

  // The glow window is ±50° around the mouse angle (wider = more visible)
  const halfWindow = 50;
  const startAngle = angleDeg - halfWindow;
  const endAngle   = angleDeg + halfWindow;

  // Pseudo-border glow: layered box-shadows give depth, mask focuses it near mouse edge
  const glowLayerStyle: any = {
    position: 'absolute',
    pointerEvents: 'none',
    inset: -1,           // 1px outside so the border ring is never clipped
    borderRadius: borderRadius + 1,
    zIndex: 10,
    transition: 'opacity 350ms ease-in-out',
    opacity: isVisible ? 1 : 0,
    boxShadow: [
      // Crisp 1px border ring
      `0 0 0 1.5px hsla(${base} / ${Math.min(intensity * 0.9, 1)})`,
      // Inner soft halo
      `0 0 ${glowRadius * 0.15}px 2px hsla(${base} / ${Math.min(intensity * 0.75, 1)})`,
      // Mid diffuse glow
      `0 0 ${glowRadius * 0.45}px 4px hsla(${base} / ${Math.min(intensity * 0.5, 1)})`,
      // Outer ambient glow
      `0 0 ${glowRadius}px 6px hsla(${base} / ${Math.min(intensity * 0.25, 1)})`,
      // Subtle inner glow
      `inset 0 0 ${glowRadius * 0.25}px hsla(${base} / ${Math.min(intensity * 0.18, 1)})`,
    ].join(', '),
    // Focused mask: solid glow near mouse edge, fades out on far side
    maskImage: `conic-gradient(from ${startAngle}deg at 50% 50%, transparent 0%, black 8%, black 92%, transparent 100%)`,
    WebkitMaskImage: `conic-gradient(from ${startAngle}deg at 50% 50%, transparent 0%, black 8%, black 92%, transparent 100%)`,
  };

  return (
    <View ref={containerRef} style={containerStyle}>
      {/* Glow overlay — sits on top of content */}
      <View style={glowLayerStyle} />
      {/* Content */}
      <View style={{ flex: 1, borderRadius, overflow: 'hidden' as any }}>
        {children}
      </View>
    </View>
  );
}
