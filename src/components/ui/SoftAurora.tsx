import React, { useEffect, useRef } from 'react';
import { Platform, View, StyleSheet } from 'react-native';

interface SoftAuroraProps {
  color1?: string;
  color2?: string;
  speed?: number;
  brightness?: number;
  mouseInfluence?: number;
  octaveDecay?: number;
  children?: React.ReactNode;
  style?: any;
}

// GLSL Fragment Shader — Soft Aurora
const FRAG_SHADER = `
precision mediump float;
uniform float uTime;
uniform vec2 uResolution;
uniform vec2 uMouse;
uniform float uSpeed;
uniform float uBrightness;
uniform float uOctaveDecay;
uniform vec3 uColor1;
uniform vec3 uColor2;
uniform float uMouseInfluence;

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(hash(i), hash(i + vec2(1,0)), u.x),
    mix(hash(i + vec2(0,1)), hash(i + vec2(1,1)), u.x),
    u.y
  );
}

float fbm(vec2 p) {
  float v = 0.0;
  float a = 0.5;
  for (int i = 0; i < 5; i++) {
    v += a * noise(p);
    p = p * 2.0 + vec2(1.7, 9.2);
    a *= uOctaveDecay * 2.0;
  }
  return v;
}

void main() {
  vec2 uv = gl_FragCoord.xy / uResolution;
  vec2 mouse = uMouse / uResolution;
  float t = uTime * uSpeed;

  // Mouse influence
  vec2 offset = (mouse - 0.5) * uMouseInfluence;
  uv += offset;

  // Aurora waves
  float n1 = fbm(uv * 2.5 + vec2(t * 0.3, t * 0.1));
  float n2 = fbm(uv * 1.8 + vec2(-t * 0.2, t * 0.15) + vec2(n1 * 0.5));

  float band = smoothstep(0.2, 0.8, n2);
  band *= smoothstep(0.0, 0.3, uv.y) * smoothstep(1.0, 0.5, uv.y);

  vec3 col = mix(uColor1, uColor2, n1);
  col *= band * uBrightness;

  // Subtle glow on top
  float glow = smoothstep(0.6, 1.0, n2) * 0.3;
  col += uColor2 * glow * uBrightness;

  gl_FragColor = vec4(col, band * 0.85);
}
`;

const VERT_SHADER = `
attribute vec2 aPosition;
void main() {
  gl_Position = vec4(aPosition, 0.0, 1.0);
}
`;

function hexToVec3(hex: string): [number, number, number] {
  const clean = hex.replace('#', '');
  const r = parseInt(clean.substring(0, 2), 16) / 255;
  const g = parseInt(clean.substring(2, 4), 16) / 255;
  const b = parseInt(clean.substring(4, 6), 16) / 255;
  return [r, g, b];
}

export const SoftAurora: React.FC<SoftAuroraProps> = ({
  color1 = '#f7f7f7',
  color2 = '#e100ff',
  speed = 1.3,
  brightness = 0.7,
  mouseInfluence = 0.1,
  octaveDecay = 0.04,
  children,
  style,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rafRef = useRef<number>(0);
  const mouseRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    if (Platform.OS !== 'web') return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = canvas.getContext('webgl', { alpha: true, premultipliedAlpha: false });
    if (!gl) return;

    // Compile shaders
    const compileShader = (type: number, src: string) => {
      const s = gl.createShader(type)!;
      gl.shaderSource(s, src);
      gl.compileShader(s);
      return s;
    };

    const prog = gl.createProgram()!;
    gl.attachShader(prog, compileShader(gl.VERTEX_SHADER, VERT_SHADER));
    gl.attachShader(prog, compileShader(gl.FRAGMENT_SHADER, FRAG_SHADER));
    gl.linkProgram(prog);
    gl.useProgram(prog);

    // Full-screen quad
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 1,-1, -1,1, 1,1]), gl.STATIC_DRAW);
    const pos = gl.getAttribLocation(prog, 'aPosition');
    gl.enableVertexAttribArray(pos);
    gl.vertexAttribPointer(pos, 2, gl.FLOAT, false, 0, 0);

    // Uniforms
    const uTime = gl.getUniformLocation(prog, 'uTime');
    const uRes = gl.getUniformLocation(prog, 'uResolution');
    const uMouse = gl.getUniformLocation(prog, 'uMouse');
    const uSpeed = gl.getUniformLocation(prog, 'uSpeed');
    const uBright = gl.getUniformLocation(prog, 'uBrightness');
    const uDecay = gl.getUniformLocation(prog, 'uOctaveDecay');
    const uC1 = gl.getUniformLocation(prog, 'uColor1');
    const uC2 = gl.getUniformLocation(prog, 'uColor2');
    const uMI = gl.getUniformLocation(prog, 'uMouseInfluence');

    const [r1,g1,b1] = hexToVec3(color1);
    const [r2,g2,b2] = hexToVec3(color2);

    gl.uniform1f(uSpeed, speed);
    gl.uniform1f(uBright, brightness);
    gl.uniform1f(uDecay, octaveDecay);
    gl.uniform3f(uC1, r1, g1, b1);
    gl.uniform3f(uC2, r2, g2, b2);
    gl.uniform1f(uMI, mouseInfluence);

    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    const resize = () => {
      canvas.width = canvas.offsetWidth * window.devicePixelRatio;
      canvas.height = canvas.offsetHeight * window.devicePixelRatio;
      gl.viewport(0, 0, canvas.width, canvas.height);
    };
    resize();
    window.addEventListener('resize', resize);

    const onMouse = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouseRef.current = {
        x: (e.clientX - rect.left) * window.devicePixelRatio,
        y: (rect.height - (e.clientY - rect.top)) * window.devicePixelRatio,
      };
    };
    window.addEventListener('mousemove', onMouse, { passive: true });

    let startTime = Date.now();
    const render = () => {
      const t = (Date.now() - startTime) / 1000;
      gl.uniform1f(uTime, t);
      gl.uniform2f(uRes, canvas.width, canvas.height);
      gl.uniform2f(uMouse, mouseRef.current.x, mouseRef.current.y);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      rafRef.current = requestAnimationFrame(render);
    };
    render();

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', onMouse);
    };
  }, [color1, color2, speed, brightness, mouseInfluence, octaveDecay]);

  if (Platform.OS !== 'web') {
    return <View style={[styles.container, style]}>{children}</View>;
  }

  return (
    <View style={[styles.container, style]}>
      {/* WebGL canvas */}
      <canvas
        ref={canvasRef}
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          pointerEvents: 'none',
          borderRadius: 'inherit',
        } as any}
      />
      {/* Content on top */}
      <View style={styles.content}>
        {children}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    overflow: 'hidden',
  },
  content: {
    position: 'relative',
    zIndex: 1,
  },
});
