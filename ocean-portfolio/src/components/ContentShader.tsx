'use client';

import { useEffect, useRef } from 'react';
import * as THREE from 'three';

const vertexShader = `
void main() {
    gl_Position = vec4(position, 1.0);
}
`;

// Multi-effect shader inspired by Unicorn Studio layered distortion
// Combines: gradient background, glow, liquify, and mouse trail
const fragmentShader = `
precision highp float;

uniform vec2 iResolution;
uniform float iTime;
uniform vec2 iMouse;
uniform vec2 iPrevMouse;
uniform sampler2D iPrevFrame;

#define PI 3.14159265359
#define TWO_PI 6.28318530718

// Simplex noise
vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 permute(vec4 x) { return mod289(((x*34.0)+1.0)*x); }
vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }

float snoise(vec3 v) {
  const vec2 C = vec2(1.0/6.0, 1.0/3.0);
  const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);

  vec3 i  = floor(v + dot(v, C.yyy));
  vec3 x0 = v - i + dot(i, C.xxx);

  vec3 g = step(x0.yzx, x0.xyz);
  vec3 l = 1.0 - g;
  vec3 i1 = min(g.xyz, l.zxy);
  vec3 i2 = max(g.xyz, l.zxy);

  vec3 x1 = x0 - i1 + C.xxx;
  vec3 x2 = x0 - i2 + C.yyy;
  vec3 x3 = x0 - D.yyy;

  i = mod289(i);
  vec4 p = permute(permute(permute(
      i.z + vec4(0.0, i1.z, i2.z, 1.0))
    + i.y + vec4(0.0, i1.y, i2.y, 1.0))
    + i.x + vec4(0.0, i1.x, i2.x, 1.0));

  float n_ = 0.142857142857;
  vec3  ns = n_ * D.wyz - D.xzx;

  vec4 j = p - 49.0 * floor(p * ns.z * ns.z);

  vec4 x_ = floor(j * ns.z);
  vec4 y_ = floor(j - 7.0 * x_);

  vec4 x = x_ *ns.x + ns.yyyy;
  vec4 y = y_ *ns.x + ns.yyyy;
  vec4 h = 1.0 - abs(x) - abs(y);

  vec4 b0 = vec4(x.xy, y.xy);
  vec4 b1 = vec4(x.zw, y.zw);

  vec4 s0 = floor(b0)*2.0 + 1.0;
  vec4 s1 = floor(b1)*2.0 + 1.0;
  vec4 sh = -step(h, vec4(0.0));

  vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy;
  vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww;

  vec3 p0 = vec3(a0.xy, h.x);
  vec3 p1 = vec3(a0.zw, h.y);
  vec3 p2 = vec3(a1.xy, h.z);
  vec3 p3 = vec3(a1.zw, h.w);

  vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2,p2), dot(p3,p3)));
  p0 *= norm.x;
  p1 *= norm.y;
  p2 *= norm.z;
  p3 *= norm.w;

  vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
  m = m * m;
  return 42.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
}

mat2 rot(float a) {
  return mat2(cos(a), -sin(a), sin(a), cos(a));
}

// Liquify distortion
vec2 liquify(vec2 uv, float time) {
  float aspectRatio = iResolution.x / iResolution.y;
  vec2 pos = vec2(0.5, 0.7); // Center of distortion

  uv -= pos;
  uv.x *= aspectRatio;

  float freq = 3.25;
  float t = time * 0.025;
  float amplitude = 0.04;

  for (float i = 1.0; i <= 3.0; i++) {
    uv = uv * rot(i / 3.0 * PI * 2.0);
    float ff = i * freq;
    uv.x += amplitude * cos(ff * uv.y + t);
    uv.y += amplitude * sin(ff * uv.x + t);
  }

  uv.x /= aspectRatio;
  uv += pos;
  return uv;
}

void main() {
  vec2 uv = gl_FragCoord.xy / iResolution.xy;
  float aspectRatio = iResolution.x / iResolution.y;

  // --- Background gradient ---
  vec3 bgColor = vec3(0.082, 0.082, 0.082); // Dark gray #151515

  // --- Blue glow circle near bottom ---
  vec2 glowPos = vec2(0.5, 1.0); // Below center
  float glowRadius = 0.37;
  float glowDist = distance(uv * vec2(aspectRatio, 1.0), glowPos * vec2(aspectRatio, 1.0));
  float glow = smoothstep(glowRadius + 0.5, glowRadius - 0.2, glowDist);
  vec3 glowColor = vec3(0.0, 0.35, 0.69); // Deep blue
  vec3 color = mix(bgColor, glowColor, glow * 0.4);

  // --- Apply liquify distortion ---
  vec2 distortedUV = liquify(uv, iTime);
  float distortAmount = length(distortedUV - uv);

  // Add noise-based displacement
  float noise = snoise(vec3(uv * 3.0, iTime * 0.1)) * 0.02;
  distortedUV += noise;

  // --- Mouse trail effect ---
  vec2 mouseNorm = iMouse / iResolution;
  vec2 prevMouseNorm = iPrevMouse / iResolution;
  vec2 mouseDir = mouseNorm - prevMouseNorm;
  float mouseDist = length(mouseDir);

  if (mouseDist > 0.001) {
    vec2 toMouse = uv - mouseNorm;
    toMouse.x *= aspectRatio;
    float mouseRadius = 0.15;
    float mouseInfluence = smoothstep(mouseRadius, 0.0, length(toMouse));

    // Chromatic aberration on mouse trail
    float chromaStrength = mouseInfluence * min(mouseDist * 20.0, 0.5) * 0.1;
    vec2 chromaDir = normalize(mouseDir);

    vec3 colorR = color;
    vec3 colorB = color;

    // Offset red and blue channels
    vec2 uvR = uv - chromaDir * chromaStrength;
    vec2 uvB = uv + chromaDir * chromaStrength;

    // Recalculate glow for offset UVs
    float glowR = smoothstep(glowRadius + 0.5, glowRadius - 0.2,
      distance(uvR * vec2(aspectRatio, 1.0), glowPos * vec2(aspectRatio, 1.0)));
    float glowB = smoothstep(glowRadius + 0.5, glowRadius - 0.2,
      distance(uvB * vec2(aspectRatio, 1.0), glowPos * vec2(aspectRatio, 1.0)));

    colorR = mix(bgColor, glowColor, glowR * 0.4);
    colorB = mix(bgColor, glowColor, glowB * 0.4);

    color.r = mix(color.r, colorR.r, mouseInfluence);
    color.b = mix(color.b, colorB.b, mouseInfluence);
  }

  // --- Subtle godrays from glow ---
  float rayAngle = atan(uv.y - 1.0, uv.x - 0.5);
  float rays = sin(rayAngle * 8.0 + iTime * 0.5) * 0.5 + 0.5;
  rays *= glow * 0.08;
  color += vec3(0.0, 0.2, 0.4) * rays;

  // --- Add subtle noise/grain ---
  float grain = (snoise(vec3(uv * 500.0, iTime)) * 0.5 + 0.5) * 0.02;
  color += grain;

  gl_FragColor = vec4(color, 1.0);
}
`;

export default function ContentShader() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    let animationFrameId: number;
    const startTime = Date.now();
    const mouse = { x: 0, y: 0 };
    const prevMouse = { x: 0, y: 0 };

    // Create renderer
    const renderer = new THREE.WebGLRenderer({
      antialias: false,
      alpha: true,
      powerPreference: 'high-performance'
    });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    container.appendChild(renderer.domElement);

    // Create scene and camera
    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

    // Create uniforms
    const uniforms = {
      iResolution: { value: new THREE.Vector2(container.clientWidth, container.clientHeight) },
      iTime: { value: 0.0 },
      iMouse: { value: new THREE.Vector2(0, 0) },
      iPrevMouse: { value: new THREE.Vector2(0, 0) },
    };

    // Create shader material
    const material = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms,
    });

    // Create fullscreen quad
    const geometry = new THREE.PlaneGeometry(2, 2);
    const mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);

    // Event handlers
    const handleResize = () => {
      if (!container) return;
      renderer.setSize(container.clientWidth, container.clientHeight);
      uniforms.iResolution.value.set(container.clientWidth, container.clientHeight);
    };

    const handleMouseMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      prevMouse.x = mouse.x;
      prevMouse.y = mouse.y;
      mouse.x = e.clientX - rect.left;
      mouse.y = container.clientHeight - (e.clientY - rect.top);
    };

    // Add event listeners
    window.addEventListener('resize', handleResize);
    container.addEventListener('mousemove', handleMouseMove);

    // Animation loop
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      uniforms.iTime.value = (Date.now() - startTime) / 1000;
      uniforms.iMouse.value.set(mouse.x, mouse.y);
      uniforms.iPrevMouse.value.set(prevMouse.x, prevMouse.y);

      renderer.render(scene, camera);
    };

    animate();

    // Cleanup
    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      container.removeEventListener('mousemove', handleMouseMove);
      renderer.dispose();
      geometry.dispose();
      material.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 -z-10"
      style={{ pointerEvents: 'auto' }}
    />
  );
}
