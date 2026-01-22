import React, { useRef } from 'react';
import { View, PanResponder, PixelRatio, Platform } from 'react-native';
import { GLView } from 'expo-gl';
import * as THREE from 'three';

// --- User Provided Shaders (Exact Copy) ---

const vertexShader = `
precision highp float;

void main() {
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const fragmentShader = `
precision highp float;

uniform float iTime;
uniform vec3  iResolution;
uniform float animationSpeed;

uniform bool enableTop;
uniform bool enableMiddle;
uniform bool enableBottom;

uniform int topLineCount;
uniform int middleLineCount;
uniform int bottomLineCount;

uniform float topLineDistance;
uniform float middleLineDistance;
uniform float bottomLineDistance;

uniform vec3 topWavePosition;
uniform vec3 middleWavePosition;
uniform vec3 bottomWavePosition;

uniform vec2 iMouse;
uniform bool interactive;
uniform float bendRadius;
uniform float bendStrength;
uniform float bendInfluence;

uniform bool parallax;
uniform float parallaxStrength;
uniform vec2 parallaxOffset;

uniform vec3 lineGradient[8];
uniform int lineGradientCount;

const vec3 BLACK = vec3(0.0);
const vec3 PINK = vec3(233.0, 71.0, 245.0) / 255.0;
const vec3 BLUE = vec3(47.0, 75.0, 162.0) / 255.0;

mat2 rotate(float r) {
  return mat2(cos(r), sin(r), -sin(r), cos(r));
}

vec3 background_color(vec2 uv) {
  vec3 col = vec3(0.0);

  float y = sin(uv.x - 0.2) * 0.3 - 0.1;
  float m = uv.y - y;

  col += mix(BLUE, BLACK, smoothstep(0.0, 1.0, abs(m)));
  col += mix(PINK, BLACK, smoothstep(0.0, 1.0, abs(m - 0.8)));
  return col * 0.5;
}

vec3 getLineColor(float t, vec3 baseColor) {
  if (lineGradientCount <= 0) {
    return baseColor;
  }

  vec3 gradientColor;

  if (lineGradientCount == 1) {
    gradientColor = lineGradient[0];
  } else {
    float clampedT = clamp(t, 0.0, 0.9999);
    float scaled = clampedT * float(lineGradientCount - 1);
    int idx = int(floor(scaled));
    float f = fract(scaled);
    int idx2 = min(idx + 1, lineGradientCount - 1);

    vec3 c1 = lineGradient[idx];
    vec3 c2 = lineGradient[idx2];

    gradientColor = mix(c1, c2, f);
  }

  return gradientColor * 0.5;
}

  float wave(vec2 uv, float offset, vec2 screenUv, vec2 mouseUv, bool shouldBend) {
  float time = iTime * animationSpeed;

  float x_offset = offset;
  float x_movement = time * 0.1;
  float amp = sin(offset + time * 0.2) * 0.3;
  float y = sin(uv.x + x_offset + x_movement) * amp;

  if (shouldBend) {
    vec2 d = screenUv - mouseUv;
    float influence = exp(-dot(d, d) * bendRadius); // radial falloff around cursor
    float bendOffset = (mouseUv.y - screenUv.y) * influence * bendStrength * bendInfluence;
    y += bendOffset;
  }

  float m = uv.y - y;
  return 0.0175 / max(abs(m) + 0.01, 1e-3) + 0.01;
}

void mainImage(out vec4 fragColor, in vec2 fragCoord) {
  vec2 baseUv = (2.0 * fragCoord - iResolution.xy) / iResolution.y;
  baseUv.y *= -1.0;

  if (parallax) {
    baseUv += parallaxOffset;
  }

  vec3 col = vec3(0.0);

  vec3 b = lineGradientCount > 0 ? vec3(0.0) : background_color(baseUv);

  vec2 mouseUv = vec2(0.0);
  if (interactive) {
    mouseUv = (2.0 * iMouse - iResolution.xy) / iResolution.y;
    mouseUv.y *= -1.0;
  }

  if (enableBottom) {
    for (int i = 0; i < bottomLineCount; ++i) {
      float fi = float(i);
      float t = fi / max(float(bottomLineCount - 1), 1.0);
      vec3 lineCol = getLineColor(t, b);
      
      float angle = bottomWavePosition.z * log(length(baseUv) + 1.0);
      vec2 ruv = baseUv * rotate(angle);
      col += lineCol * wave(
        ruv + vec2(bottomLineDistance * fi + bottomWavePosition.x, bottomWavePosition.y),
        1.5 + 0.2 * fi,
        baseUv,
        mouseUv,
        interactive
      ) * 0.2;
    }
  }

  if (enableMiddle) {
    for (int i = 0; i < middleLineCount; ++i) {
      float fi = float(i);
      float t = fi / max(float(middleLineCount - 1), 1.0);
      vec3 lineCol = getLineColor(t, b);
      
      float angle = middleWavePosition.z * log(length(baseUv) + 1.0);
      vec2 ruv = baseUv * rotate(angle);
      col += lineCol * wave(
        ruv + vec2(middleLineDistance * fi + middleWavePosition.x, middleWavePosition.y),
        2.0 + 0.15 * fi,
        baseUv,
        mouseUv,
        interactive
      );
    }
  }

  if (enableTop) {
    for (int i = 0; i < topLineCount; ++i) {
      float fi = float(i);
      float t = fi / max(float(topLineCount - 1), 1.0);
      vec3 lineCol = getLineColor(t, b);
      
      float angle = topWavePosition.z * log(length(baseUv) + 1.0);
      vec2 ruv = baseUv * rotate(angle);
      ruv.x *= -1.0;
      col += lineCol * wave(
        ruv + vec2(topLineDistance * fi + topWavePosition.x, topWavePosition.y),
        1.0 + 0.2 * fi,
        baseUv,
        mouseUv,
        interactive
      ) * 0.1;
    }
  }

  // Fade edges (Vignette) - simplified interactions
  // Using manual transparency for now to ensure visibility
  vec2 uv = fragCoord.xy / iResolution.xy;
  float alphaX = smoothstep(0.0, 0.2, uv.x) * (1.0 - smoothstep(0.8, 1.0, uv.x));
  float alphaY = smoothstep(0.0, 0.2, uv.y) * (1.0 - smoothstep(0.8, 1.0, uv.y));
  float alpha = alphaX * alphaY;

  fragColor = vec4(col, alpha);
}

void main() {
  vec4 color = vec4(0.0);
  mainImage(color, gl_FragCoord.xy);
  gl_FragColor = color;
}
`;

// --- Helper Types & Functions ---

const MAX_GRADIENT_STOPS = 8;
type WavePosition = { x: number; y: number; rotate: number; };

function hexToVec3(hex: string) {
  let value = hex.trim();
  if (value.startsWith('#')) value = value.slice(1);
  let r = 255, g = 255, b = 255;
  if (value.length === 3) {
    r = parseInt(value[0] + value[0], 16);
    g = parseInt(value[1] + value[1], 16);
    b = parseInt(value[2] + value[2], 16);
  } else if (value.length === 6) {
    r = parseInt(value.slice(0, 2), 16);
    g = parseInt(value.slice(2, 4), 16);
    b = parseInt(value.slice(4, 6), 16);
  }
  return new THREE.Vector3(r / 255, g / 255, b / 255);
}

// --- Main Component ---

interface FloatingLinesProps {
  linesGradient?: string[];
  enabledWaves?: Array<'top' | 'middle' | 'bottom'>;
  lineCount?: number | number[];
  lineDistance?: number | number[];
  topWavePosition?: WavePosition;
  middleWavePosition?: WavePosition;
  bottomWavePosition?: WavePosition;
  animationSpeed?: number;
  interactive?: boolean;
  bendRadius?: number;
  bendStrength?: number;
  mouseDamping?: number;
  parallax?: boolean;
  parallaxStrength?: number;
  color?: string; // fallback prop from simplified usage
  height?: number;
}

export const FloatingLines = ({
  linesGradient,
  enabledWaves = ['top', 'middle', 'bottom'],
  lineCount = [5],
  lineDistance = [5],
  topWavePosition = { x: 10.0, y: 0.5, rotate: -0.4 },
  middleWavePosition = { x: 5.0, y: 0.0, rotate: 0.2 },
  bottomWavePosition = { x: 2.0, y: -0.7, rotate: 0.4 }, // Adjusted rotate for visible sweep
  animationSpeed = 1,
  interactive = true,
  bendRadius = 5.0,
  bendStrength = -0.5,
  mouseDamping = 0.05,
  parallax = true,
  parallaxStrength = 0.2,
  height = 400
}: FloatingLinesProps) => {

  // Interaction Refs
  const targetMouseRef = useRef(new THREE.Vector2(-1000, -1000));
  const currentMouseRef = useRef(new THREE.Vector2(-1000, -1000));
  const targetInfluenceRef = useRef(0);
  const currentInfluenceRef = useRef(0);
  const targetParallaxRef = useRef(new THREE.Vector2(0, 0));
  const currentParallaxRef = useRef(new THREE.Vector2(0, 0));

  // Handler for Pointer Moves (Web Hover / Touch), avoids strict PanResponder needing click
  const handlePointerMove = (event: any) => {
    if (!interactive) return;

    // Native event gives us location within key view props on Web
    // On React Native Web, event.nativeEvent.offsetX/Y or layerX/Y often helpful, 
    // but 'locationX' / 'locationY' from TouchEvent is consistent in RN.
    // For 'onPointerMove' (react-native-web or RN 0.72+):
    const e = event.nativeEvent;
    // x, y relative to the target
    const x = e.locationX ?? e.layerX ?? e.offsetX;
    const y = e.locationY ?? e.layerY ?? e.offsetY;

    targetMouseRef.current.set(x, y);
    targetInfluenceRef.current = 1.0;
  };

  const handlePointerLeave = () => {
    targetInfluenceRef.current = 0.0;
  };

  const onContextCreate = async (gl: any) => {
    // 1. Setup Renderer
    // expo-gl: we pass the gl context directly
    const renderer = new THREE.WebGLRenderer({
      context: gl,
      alpha: true, // IMPORTANT: Enable transparency
      antialias: true
    });
    renderer.setClearColor(0x000000, 0); // Clear to Transparent

    // Define pixelRatio for logic calculations later
    const pixelRatio = PixelRatio.get();

    // Simplify sizing to 1:1 to strictly match buffer
    renderer.setPixelRatio(1);
    renderer.setSize(gl.drawingBufferWidth, gl.drawingBufferHeight);
    // rendererRef.current = renderer; // Not used in the provided snippet, but good to keep if needed elsewhere

    // 2. Setup Scene & Camera
    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    camera.position.z = 1;

    // 3. Prepare Uniforms
    const getLineCount = (type: string) => {
      if (typeof lineCount === 'number') return lineCount;
      const idx = enabledWaves.indexOf(type as any);
      return idx !== -1 ? (lineCount[idx] ?? 6) : 0;
    };
    const getLineDist = (type: string) => {
      if (typeof lineDistance === 'number') return lineDistance;
      const idx = enabledWaves.indexOf(type as any);
      return idx !== -1 ? (lineDistance[idx] ?? 0.1) : 0.1;
    };

    const uniforms = {
      iTime: { value: 0 },
      iResolution: { value: new THREE.Vector3(gl.drawingBufferWidth, gl.drawingBufferHeight, 1) },
      animationSpeed: { value: animationSpeed },
      enableTop: { value: enabledWaves.includes('top') },
      enableMiddle: { value: enabledWaves.includes('middle') },
      enableBottom: { value: enabledWaves.includes('bottom') },
      topLineCount: { value: getLineCount('top') },
      middleLineCount: { value: getLineCount('middle') },
      bottomLineCount: { value: getLineCount('bottom') },
      topLineDistance: { value: getLineDist('top') * 0.01 },
      middleLineDistance: { value: getLineDist('middle') * 0.01 },
      bottomLineDistance: { value: getLineDist('bottom') * 0.01 },
      topWavePosition: { value: new THREE.Vector3(topWavePosition.x, topWavePosition.y, topWavePosition.rotate) },
      middleWavePosition: { value: new THREE.Vector3(middleWavePosition.x, middleWavePosition.y, middleWavePosition.rotate) },
      bottomWavePosition: { value: new THREE.Vector3(bottomWavePosition.x, bottomWavePosition.y, bottomWavePosition.rotate) },
      iMouse: { value: new THREE.Vector2(-1000, -1000) },
      interactive: { value: interactive },
      bendRadius: { value: bendRadius },
      bendStrength: { value: bendStrength },
      bendInfluence: { value: 0 },
      parallax: { value: parallax },
      parallaxStrength: { value: parallaxStrength },
      parallaxOffset: { value: new THREE.Vector2(0, 0) },
      lineGradient: { value: Array(MAX_GRADIENT_STOPS).fill(null).map(() => new THREE.Vector3(1, 1, 1)) },
      lineGradientCount: { value: 0 }
    };

    // Handle Gradients
    if (linesGradient && linesGradient.length > 0) {
      const stops = linesGradient.slice(0, MAX_GRADIENT_STOPS);
      uniforms.lineGradientCount.value = stops.length;
      stops.forEach((hex, i) => {
        const c = hexToVec3(hex);
        uniforms.lineGradient.value[i].set(c.x, c.y, c.z);
      });
    }

    // uniformsRef.current = uniforms; // Not used in the provided snippet, but good to keep if needed elsewhere

    // 4. Mesh
    const geometry = new THREE.PlaneGeometry(2, 2);
    const material = new THREE.ShaderMaterial({
      uniforms,
      vertexShader,
      fragmentShader,
      transparent: true, // IMPORTANT: Enable material transparency
    });
    const mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);

    // 5. Render Loop
    const clock = new THREE.Clock();
    const animate = () => {
      // if (!rendererRef.current) return; // Not used in the provided snippet

      uniforms.iTime.value = clock.getElapsedTime();

      if (interactive) {
        currentMouseRef.current.lerp(targetMouseRef.current, mouseDamping);

        const dpr = pixelRatio;
        const mx = currentMouseRef.current.x * dpr;
        const my = currentMouseRef.current.y * dpr;

        // Update iMouse for Shader (Flip Y for WebGL)
        uniforms.iMouse.value.set(mx, (gl.drawingBufferHeight - my));

        currentInfluenceRef.current += (targetInfluenceRef.current - currentInfluenceRef.current) * mouseDamping;
        uniforms.bendInfluence.value = currentInfluenceRef.current;
      }

      if (parallax) {
        // Reuse targetMouseRef for Parallax center calc
        const w = gl.drawingBufferWidth / pixelRatio;
        const h = gl.drawingBufferHeight / pixelRatio;
        if (w > 0 && h > 0) {
          const cx = w / 2;
          const cy = h / 2;
          const mx = targetMouseRef.current.x;
          const my = targetMouseRef.current.y;
          const ox = (mx - cx) / w;
          const oy = -(my - cy) / h; // Flip Y for parallax direction?

          targetParallaxRef.current.set(ox * parallaxStrength, oy * parallaxStrength);
          currentParallaxRef.current.lerp(targetParallaxRef.current, mouseDamping);
          uniforms.parallaxOffset.value.copy(currentParallaxRef.current);
        }
      }

      renderer.render(scene, camera);
      gl.endFrameEXP(); // Expo GL specific frame end
      requestAnimationFrame(animate);
    };
    animate();
  };

  return (
    <View
      style={{ width: '100%', height: height, overflow: 'hidden' }}
      // @ts-ignore - React Native Web supports onPointerMove
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
    >
      <GLView
        style={{ flex: 1 }}
        onContextCreate={onContextCreate}
      />
      {/* Transparent Overlay for touch events if needed in future */}
    </View>
  );
};

