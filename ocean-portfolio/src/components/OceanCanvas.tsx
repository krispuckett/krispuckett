'use client';

import { useEffect, useRef, useMemo, useState, useCallback } from 'react';
import * as THREE from 'three';
import { useSunPosition } from '@/hooks/useSunPosition';

const vertexShader = `
varying vec2 vUv;

void main() {
    vUv = uv;
    gl_Position = vec4(position, 1.0);
}
`;

const fragmentShader = `
precision highp float;

uniform vec2 iResolution;
uniform float iTime;
uniform vec2 iMouse;
uniform float sunHeight;
uniform float sunAngle;
uniform float cameraY;
uniform float cameraPitch;

varying vec2 vUv;

const int NUM_STEPS = 8;
const float PI = 3.141592653589793;
const float EPSILON = 1e-3;

const int ITER_GEOMETRY = 3;
const int ITER_FRAGMENT = 5;
const float SEA_HEIGHT = 0.6;
const float SEA_CHOPPY = 4.0;
const float SEA_SPEED = 0.8;
const float SEA_FREQ = 0.16;
const vec3 SEA_BASE = vec3(0.0, 0.09, 0.18);
const vec3 SEA_WATER_COLOR = vec3(0.8, 0.9, 0.6) * 0.6;
#define SEA_TIME (1.0 + iTime * SEA_SPEED)
const mat2 octave_m = mat2(1.6, 1.2, -1.2, 1.6);

mat3 fromEuler(vec3 ang) {
    vec2 a1 = vec2(sin(ang.x), cos(ang.x));
    vec2 a2 = vec2(sin(ang.y), cos(ang.y));
    vec2 a3 = vec2(sin(ang.z), cos(ang.z));
    mat3 m;
    m[0] = vec3(
        a1.y * a3.y + a1.x * a2.x * a3.x,
        a1.y * a2.x * a3.x + a3.y * a1.x,
        -a2.y * a3.x
    );
    m[1] = vec3(-a2.y * a1.x, a1.y * a2.y, a2.x);
    m[2] = vec3(
        a3.y * a1.x * a2.x + a1.y * a3.x,
        a1.x * a3.x - a1.y * a3.y * a2.x,
        a2.y * a3.y
    );
    return m;
}

float hash(vec2 p) {
    float h = dot(p, vec2(127.1, 311.7));
    return fract(sin(h) * 43758.5453123);
}

float noise(in vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return -1.0 + 2.0 * mix(
        mix(hash(i + vec2(0.0, 0.0)), hash(i + vec2(1.0, 0.0)), u.x),
        mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x),
        u.y
    );
}

float diffuse(vec3 n, vec3 l, float p) {
    return pow(dot(n, l) * 0.4 + 0.6, p);
}

float specular(vec3 n, vec3 l, vec3 e, float s) {
    float nrm = (s + 8.0) / (PI * 8.0);
    return pow(max(dot(reflect(e, n), l), 0.0), s) * nrm;
}

vec3 getSkyColor(vec3 e, float sunH, float sunA) {
    vec3 sunDir = normalize(vec3(cos(sunA), max(sunH, -0.1), sin(sunA)));
    float skyGradient = max(e.y, 0.0);

    vec3 dayColor = vec3(0.5, 0.7, 1.0);
    vec3 sunsetColor = vec3(1.0, 0.5, 0.2);
    vec3 nightColor = vec3(0.02, 0.02, 0.08);

    vec3 skyBase;
    if (sunH > 0.2) {
        skyBase = mix(dayColor * 0.8, dayColor * 0.3, skyGradient);
    } else if (sunH > -0.1) {
        float t = (sunH + 0.1) / 0.3;
        vec3 horizonColor = mix(sunsetColor, dayColor * 0.8, t);
        vec3 zenithColor = mix(nightColor * 2.0, dayColor * 0.3, t);
        skyBase = mix(horizonColor, zenithColor, skyGradient);
    } else {
        float nightFade = clamp((-sunH - 0.1) / 0.3, 0.0, 1.0);
        skyBase = mix(nightColor * 2.0, nightColor, skyGradient);
        vec2 starUv = e.xz / (e.y + 0.01) * 20.0;
        float stars = pow(hash(floor(starUv * 100.0)), 20.0) * nightFade;
        skyBase += vec3(stars);
    }

    float sunDot = max(dot(e, sunDir), 0.0);
    vec3 sunGlow = vec3(1.0, 0.8, 0.5) * pow(sunDot, 8.0) * max(sunH + 0.2, 0.0);
    vec3 sunCore = vec3(1.0, 1.0, 0.9) * pow(sunDot, 256.0) * max(sunH, 0.0);

    return skyBase + sunGlow + sunCore;
}

float sea_octave(vec2 uv, float choppy) {
    uv += noise(uv);
    vec2 wv = 1.0 - abs(sin(uv));
    vec2 swv = abs(cos(uv));
    wv = mix(wv, swv, wv);
    return pow(1.0 - pow(wv.x * wv.y, 0.65), choppy);
}

float map(vec3 p) {
    float freq = SEA_FREQ;
    float amp = SEA_HEIGHT;
    float choppy = SEA_CHOPPY;
    vec2 uv = p.xz;
    uv.x *= 0.75;

    float d, h = 0.0;
    for (int i = 0; i < ITER_GEOMETRY; i++) {
        d = sea_octave((uv + SEA_TIME) * freq, choppy);
        d += sea_octave((uv - SEA_TIME) * freq, choppy);
        h += d * amp;
        uv *= octave_m;
        freq *= 1.9;
        amp *= 0.22;
        choppy = mix(choppy, 1.0, 0.2);
    }
    return p.y - h;
}

float map_detailed(vec3 p) {
    float freq = SEA_FREQ;
    float amp = SEA_HEIGHT;
    float choppy = SEA_CHOPPY;
    vec2 uv = p.xz;
    uv.x *= 0.75;

    float d, h = 0.0;
    for (int i = 0; i < ITER_FRAGMENT; i++) {
        d = sea_octave((uv + SEA_TIME) * freq, choppy);
        d += sea_octave((uv - SEA_TIME) * freq, choppy);
        h += d * amp;
        uv *= octave_m;
        freq *= 1.9;
        amp *= 0.22;
        choppy = mix(choppy, 1.0, 0.2);
    }
    return p.y - h;
}

vec3 getSeaColor(vec3 p, vec3 n, vec3 l, vec3 eye, vec3 dist) {
    float fresnel = clamp(1.0 - dot(n, -eye), 0.0, 1.0);
    fresnel = pow(fresnel, 3.0) * 0.5;

    vec3 reflected = getSkyColor(reflect(eye, n), sunHeight, sunAngle);
    vec3 refracted = SEA_BASE + diffuse(n, l, 80.0) * SEA_WATER_COLOR * 0.12;

    vec3 color = mix(refracted, reflected, fresnel);

    float atten = max(1.0 - dot(dist, dist) * 0.001, 0.0);
    color += SEA_WATER_COLOR * (p.y - SEA_HEIGHT) * 0.18 * atten;

    vec3 sunDir = normalize(vec3(cos(sunAngle), max(sunHeight, 0.0), sin(sunAngle)));
    color += vec3(specular(n, sunDir, eye, 60.0)) * max(sunHeight, 0.0);

    return color;
}

vec3 getNormal(vec3 p, float eps) {
    vec3 n;
    n.y = map_detailed(p);
    n.x = map_detailed(vec3(p.x + eps, p.y, p.z)) - n.y;
    n.z = map_detailed(vec3(p.x, p.y, p.z + eps)) - n.y;
    n.y = eps;
    return normalize(n);
}

float heightMapTracing(vec3 ori, vec3 dir, out vec3 p) {
    float tm = 0.0;
    float tx = 1000.0;
    float hx = map(ori + dir * tx);
    if (hx > 0.0) {
        p = ori + dir * tx;
        return tx;
    }
    float hm = map(ori + dir * tm);
    float tmid = 0.0;
    for (int i = 0; i < NUM_STEPS; i++) {
        tmid = mix(tm, tx, hm / (hm - hx));
        p = ori + dir * tmid;
        float hmid = map(p);
        if (hmid < 0.0) {
            tx = tmid;
            hx = hmid;
        } else {
            tm = tmid;
            hm = hmid;
        }
    }
    return tmid;
}

vec3 getPixel(in vec2 coord, float time) {
    vec2 uv = coord / iResolution.xy;
    uv = uv * 2.0 - 1.0;
    uv.x *= iResolution.x / iResolution.y;

    // Use mouse for horizontal rotation, cameraPitch for vertical
    float angleY = iMouse.x * PI * 0.5;  // Horizontal pan (-PI/4 to PI/4)
    float angleX = cameraPitch;           // Vertical tilt from uniform

    vec3 ang = vec3(0.0, angleY, angleX);
    vec3 ori = vec3(0.0, 3.5 + cameraY, time * 2.0);
    vec3 dir = normalize(vec3(uv.xy, -2.0));
    dir.z += length(uv) * 0.14;
    dir = normalize(dir) * fromEuler(ang);

    vec3 p;
    heightMapTracing(ori, dir, p);
    vec3 dist = p - ori;
    vec3 n = getNormal(p, dot(dist, dist) * EPSILON);

    vec3 light = normalize(vec3(cos(sunAngle), max(sunHeight, 0.1), sin(sunAngle)));

    vec3 color = mix(
        getSkyColor(dir, sunHeight, sunAngle),
        getSeaColor(p, n, light, dir, dist),
        pow(smoothstep(0.0, -0.02, dir.y), 0.2)
    );

    return color;
}

void main() {
    float time = iTime * 0.3;
    vec3 color = getPixel(gl_FragCoord.xy, time);
    color = pow(color, vec3(0.65));
    gl_FragColor = vec4(color, 1.0);
}
`;

interface OceanCanvasProps {
  cameraY?: number;
  isActive?: boolean;
  className?: string;
}

export default function OceanCanvas({
  cameraY = 0,
  isActive = true,
  className = '',
}: OceanCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.OrthographicCamera | null>(null);
  const materialRef = useRef<THREE.ShaderMaterial | null>(null);
  const animationFrameRef = useRef<number>(0);
  const startTimeRef = useRef<number>(Date.now());

  // Drag state for camera rotation
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [cameraRotation, setCameraRotation] = useState({ x: 0, y: 0 }); // x = horizontal pan, y = pitch
  const [rotationOffset, setRotationOffset] = useState({ x: 0, y: 0 });

  const sunPosition = useSunPosition();

  // Create uniforms - start with horizontal view (pitch looking slightly down at waves)
  const uniforms = useMemo(
    () => ({
      iResolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
      iTime: { value: 0.0 },
      iMouse: { value: new THREE.Vector2(0.0, 0.0) }, // x = horizontal rotation (-0.5 to 0.5)
      sunHeight: { value: 0.5 },
      sunAngle: { value: Math.PI / 2 },
      cameraY: { value: 0.0 },
      cameraPitch: { value: 0.15 }, // Slight downward tilt to see waves
    }),
    []
  );

  // Mouse/touch handlers for drag interaction
  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
    setRotationOffset(cameraRotation);
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }, [cameraRotation]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!isDragging) return;

    const deltaX = (e.clientX - dragStart.x) / window.innerWidth;
    const deltaY = (e.clientY - dragStart.y) / window.innerHeight;

    // Clamp rotation values
    const newX = Math.max(-0.5, Math.min(0.5, rotationOffset.x + deltaX));
    const newY = Math.max(-0.3, Math.min(0.4, rotationOffset.y + deltaY * 0.5));

    setCameraRotation({ x: newX, y: newY });
  }, [isDragging, dragStart, rotationOffset]);

  const handlePointerUp = useCallback((e: React.PointerEvent) => {
    setIsDragging(false);
    (e.target as HTMLElement).releasePointerCapture(e.pointerId);
  }, []);

  // Initialize Three.js
  useEffect(() => {
    if (!containerRef.current) return;

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    const scene = new THREE.Scene();
    sceneRef.current = scene;

    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    cameraRef.current = camera;

    const material = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms,
    });
    materialRef.current = material;

    const geometry = new THREE.PlaneGeometry(2, 2);
    const mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);

    const handleResize = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      renderer.setSize(width, height);
      uniforms.iResolution.value.set(width, height);
    };

    window.addEventListener('resize', handleResize);

    const animate = () => {
      if (!isActive) {
        animationFrameRef.current = requestAnimationFrame(animate);
        return;
      }

      const elapsedTime = (Date.now() - startTimeRef.current) / 1000;
      uniforms.iTime.value = elapsedTime;

      renderer.render(scene, camera);
      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationFrameRef.current);
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
      geometry.dispose();
      material.dispose();
      if (containerRef.current && renderer.domElement) {
        containerRef.current.removeChild(renderer.domElement);
      }
    };
  }, [uniforms, isActive]);

  // Update camera rotation uniforms
  useEffect(() => {
    if (materialRef.current) {
      materialRef.current.uniforms.iMouse.value.set(cameraRotation.x, 0);
      materialRef.current.uniforms.cameraPitch.value = 0.15 + cameraRotation.y;
    }
  }, [cameraRotation]);

  // Update sun position uniform
  useEffect(() => {
    if (materialRef.current) {
      materialRef.current.uniforms.sunHeight.value = sunPosition.sunHeight;
      materialRef.current.uniforms.sunAngle.value = sunPosition.sunAngle;
    }
  }, [sunPosition]);

  // Update camera Y position
  useEffect(() => {
    if (materialRef.current) {
      materialRef.current.uniforms.cameraY.value = cameraY;
    }
  }, [cameraY]);

  return (
    <div
      ref={containerRef}
      className={`fixed inset-0 ${className}`}
      style={{ zIndex: 0, cursor: isDragging ? 'grabbing' : 'grab' }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
    />
  );
}
