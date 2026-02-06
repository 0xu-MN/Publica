import React, { useEffect, useRef, useCallback, ReactNode } from 'react';
import { View, Platform, StyleSheet } from 'react-native';

function hexToRgba(hex: string, alpha: number = 1): string {
    if (!hex) return `rgba(0,0,0,${alpha})`;
    let h = hex.replace('#', '');
    if (h.length === 3) {
        h = h.split('').map(c => c + c).join('');
    }
    const int = parseInt(h, 16);
    const r = (int >> 16) & 255;
    const g = (int >> 8) & 255;
    const b = int & 255;
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

interface ElectricBorderProps {
    children?: ReactNode;
    color?: string;
    speed?: number;
    chaos?: number;
    borderRadius?: number;
    className?: string; // Still accepted for convenience
    style?: any;
}

const ElectricBorder: React.FC<ElectricBorderProps> = ({
    children,
    color = '#5227FF',
    speed = 1,
    chaos = 0.12,
    borderRadius = 24,
    className = '',
    style
}) => {
    // Safety Fallback for Mobile
    if (Platform.OS !== 'web') {
        return (
            <View style={[{ borderRadius, overflow: 'hidden' }, style]}>
                {children}
            </View>
        );
    }

    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const animationRef = useRef<number | null>(null);
    const timeRef = useRef(0);
    const lastFrameTimeRef = useRef(0);

    const random = useCallback((x: number): number => {
        return (Math.sin(x * 12.9898) * 43758.5453) % 1;
    }, []);

    const noise2D = useCallback((x: number, y: number): number => {
        const i = Math.floor(x);
        const j = Math.floor(y);
        const fx = x - i;
        const fy = y - j;
        const a = random(i + j * 57);
        const b = random(i + 1 + j * 57);
        const c = random(i + (j + 1) * 57);
        const d = random(i + 1 + (j + 1) * 57);
        const ux = fx * fx * (3.0 - 2.0 * fx);
        const uy = fy * fy * (3.0 - 2.0 * fy);
        return a * (1 - ux) * (1 - uy) + b * ux * (1 - uy) + c * (1 - ux) * uy + d * ux * uy;
    }, [random]);

    const octavedNoise = useCallback((x: number, octaves: number, lacunarity: number, gain: number, baseAmplitude: number, baseFrequency: number, time: number, seed: number, baseFlatness: number): number => {
        let y = 0;
        let amplitude = baseAmplitude;
        let frequency = baseFrequency;
        for (let i = 0; i < octaves; i++) {
            let octaveAmplitude = amplitude;
            if (i === 0) octaveAmplitude *= baseFlatness;
            y += octaveAmplitude * noise2D(frequency * x + seed * 100, time * frequency * 0.3);
            frequency *= lacunarity;
            amplitude *= gain;
        }
        return y;
    }, [noise2D]);

    const getCornerPoint = useCallback((centerX: number, centerY: number, radius: number, startAngle: number, arcLength: number, progress: number): { x: number; y: number } => {
        const angle = startAngle + progress * arcLength;
        return { x: centerX + radius * Math.cos(angle), y: centerY + radius * Math.sin(angle) };
    }, []);

    const getRoundedRectPoint = useCallback((t: number, left: number, top: number, width: number, height: number, radius: number): { x: number; y: number } => {
        const straightWidth = width - 2 * radius;
        const straightHeight = height - 2 * radius;
        const cornerArc = (Math.PI * radius) / 2;
        const totalPerimeter = 2 * straightWidth + 2 * straightHeight + 4 * cornerArc;
        const distance = t * totalPerimeter;
        let acc = 0;
        if (distance <= acc + straightWidth) return { x: left + radius + ((distance - acc) / straightWidth) * straightWidth, y: top };
        acc += straightWidth;
        if (distance <= acc + cornerArc) return getCornerPoint(left + width - radius, top + radius, radius, -Math.PI / 2, Math.PI / 2, (distance - acc) / cornerArc);
        acc += cornerArc;
        if (distance <= acc + straightHeight) return { x: left + width, y: top + radius + ((distance - acc) / straightHeight) * straightHeight };
        acc += straightHeight;
        if (distance <= acc + cornerArc) return getCornerPoint(left + width - radius, top + height - radius, radius, 0, Math.PI / 2, (distance - acc) / cornerArc);
        acc += cornerArc;
        if (distance <= acc + straightWidth) return { x: left + width - radius - ((distance - acc) / straightWidth) * straightWidth, y: top + height };
        acc += straightWidth;
        if (distance <= acc + cornerArc) return getCornerPoint(left + radius, top + height - radius, radius, Math.PI / 2, Math.PI / 2, (distance - acc) / cornerArc);
        acc += cornerArc;
        if (distance <= acc + straightHeight) return { x: left, y: top + height - radius - ((distance - acc) / straightHeight) * straightHeight };
        acc += straightHeight;
        return getCornerPoint(left + radius, top + radius, radius, Math.PI, Math.PI / 2, (distance - acc) / cornerArc);
    }, [getCornerPoint]);

    useEffect(() => {
        const canvas = canvasRef.current;
        const container = containerRef.current;
        if (!canvas || !container) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const borderOffset = 60;
        const updateSize = () => {
            const rect = container.getBoundingClientRect();
            if (rect.width === 0) return { width: 0, height: 0 };
            const width = rect.width + borderOffset * 2;
            const height = rect.height + borderOffset * 2;
            const dpr = Math.min(window.devicePixelRatio || 1, 2);
            canvas.width = width * dpr;
            canvas.height = height * dpr;
            canvas.style.width = width + 'px';
            canvas.style.height = height + 'px';
            ctx.scale(dpr, dpr);
            return { width, height };
        };

        let { width, height } = updateSize();

        const draw = (currentTime: number) => {
            if (!ctx || width === 0) return;
            const deltaTime = (currentTime - lastFrameTimeRef.current) / 1000;
            if (isNaN(deltaTime) || deltaTime > 0.1) {
                lastFrameTimeRef.current = currentTime;
                animationRef.current = requestAnimationFrame(draw);
                return;
            }
            timeRef.current += deltaTime * speed;
            lastFrameTimeRef.current = currentTime;

            ctx.setTransform(1, 0, 0, 1, 0, 0);
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.scale(Math.min(window.devicePixelRatio || 1, 2), Math.min(window.devicePixelRatio || 1, 2));

            ctx.strokeStyle = color;
            ctx.lineWidth = 2;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';

            const left = borderOffset, top = borderOffset;
            const bWidth = width - borderOffset * 2, bHeight = height - borderOffset * 2;
            const rad = Math.min(borderRadius, Math.min(bWidth, bHeight) / 2);
            const sampleCount = Math.floor((2 * (bWidth + bHeight) + 2 * Math.PI * rad) / 2);

            ctx.beginPath();
            for (let i = 0; i <= sampleCount; i++) {
                const p = i / sampleCount;
                const pt = getRoundedRectPoint(p, left, top, bWidth, bHeight, rad);
                const xN = octavedNoise(p * 8, 10, 1.6, 0.7, chaos, 10, timeRef.current, 0, 0);
                const yN = octavedNoise(p * 8, 10, 1.6, 0.7, chaos, 10, timeRef.current, 1, 0);
                const dX = pt.x + xN * 60, dY = pt.y + yN * 60;
                if (i === 0) ctx.moveTo(dX, dY); else ctx.lineTo(dX, dY);
            }
            ctx.closePath();
            ctx.stroke();
            animationRef.current = requestAnimationFrame(draw);
        };

        const ro = new ResizeObserver(() => {
            const sz = updateSize();
            width = sz.width; height = sz.height;
        });
        ro.observe(container);
        animationRef.current = requestAnimationFrame(draw);
        return () => { if (animationRef.current) cancelAnimationFrame(animationRef.current); ro.disconnect(); };
    }, [color, speed, chaos, borderRadius, octavedNoise, getRoundedRectPoint]);

    return (
        <div
            ref={containerRef}
            className={`isolate ${className}`}
            style={{ position: 'relative', overflow: 'visible', borderRadius, ...style }}
        >
            {/* Canvas Centered */}
            <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', pointerEvents: 'none', zIndex: 2 }}>
                <canvas ref={canvasRef} style={{ display: 'block' }} />
            </div>

            {/* Glowing Borders */}
            <div style={{ position: 'absolute', inset: 0, borderRadius: 'inherit', pointerEvents: 'none', zIndex: 0 }}>
                <div style={{ position: 'absolute', inset: 0, borderRadius: 'inherit', border: `2px solid ${hexToRgba(color, 0.6)}`, filter: 'blur(1px)' }} />
                <div style={{ position: 'absolute', inset: 0, borderRadius: 'inherit', border: `2px solid ${color}`, filter: 'blur(4px)' }} />
                <div style={{ position: 'absolute', inset: -10, borderRadius: 'inherit', filter: 'blur(32px)', background: `linear-gradient(-30deg, ${color}, transparent, ${color})`, opacity: 0.3, zIndex: -1 }} />
            </div>

            {/* Content Wrapper */}
            <div style={{ position: 'relative', zIndex: 1, height: '100%', width: '100%', borderRadius: 'inherit' }}>
                {children}
            </div>
        </div>
    );
};

export default ElectricBorder;
