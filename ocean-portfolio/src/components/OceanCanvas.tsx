'use client';

import { useEffect, useRef, useCallback } from 'react';
import * as THREE from 'three';

const vertexShader = `
void main() {
    gl_Position = vec4(position, 1.0);
}
`;

// Exact port of afl_ext's Seascape shader from Shadertoy
const fragmentShader = `
precision highp float;

uniform vec2 iResolution;
uniform float iTime;
uniform vec4 iMouse;

#define DRAG_MULT 0.38
#define WATER_DEPTH 1.0
#define CAMERA_HEIGHT 1.5
#define ITERATIONS_RAYMARCH 12
#define ITERATIONS_NORMAL 36

vec2 wavedx(vec2 position, vec2 direction, float frequency, float timeshift) {
  float x = dot(direction, position) * frequency + timeshift;
  float wave = exp(sin(x) - 1.0);
  float dx = wave * cos(x);
  return vec2(wave, -dx);
}

float getwaves(vec2 position, int iterations) {
  float wavePhaseShift = length(position) * 0.1;
  float iter = 0.0;
  float frequency = 1.0;
  float timeMultiplier = 2.0;
  float weight = 1.0;
  float sumOfValues = 0.0;
  float sumOfWeights = 0.0;
  for(int i = 0; i < 36; i++) {
    if(i >= iterations) break;
    vec2 p = vec2(sin(iter), cos(iter));
    vec2 res = wavedx(position, p, frequency, iTime * timeMultiplier + wavePhaseShift);
    position += p * res.y * weight * DRAG_MULT;
    sumOfValues += res.x * weight;
    sumOfWeights += weight;
    weight = mix(weight, 0.0, 0.2);
    frequency *= 1.18;
    timeMultiplier *= 1.07;
    iter += 1232.399963;
  }
  return sumOfValues / sumOfWeights;
}

float raymarchwater(vec3 camera, vec3 start, vec3 end, float depth) {
  vec3 pos = start;
  vec3 dir = normalize(end - start);
  for(int i = 0; i < 64; i++) {
    float height = getwaves(pos.xz, ITERATIONS_RAYMARCH) * depth - depth;
    if(height + 0.01 > pos.y) {
      return distance(pos, camera);
    }
    pos += dir * (pos.y - height);
  }
  return distance(start, camera);
}

vec3 normal(vec2 pos, float e, float depth) {
  vec2 ex = vec2(e, 0);
  float H = getwaves(pos.xy, ITERATIONS_NORMAL) * depth;
  vec3 a = vec3(pos.x, H, pos.y);
  return normalize(
    cross(
      a - vec3(pos.x - e, getwaves(pos.xy - ex.xy, ITERATIONS_NORMAL) * depth, pos.y),
      a - vec3(pos.x, getwaves(pos.xy + ex.yx, ITERATIONS_NORMAL) * depth, pos.y + e)
    )
  );
}

mat3 createRotationMatrixAxisAngle(vec3 axis, float angle) {
  float s = sin(angle);
  float c = cos(angle);
  float oc = 1.0 - c;
  return mat3(
    oc * axis.x * axis.x + c, oc * axis.x * axis.y - axis.z * s, oc * axis.z * axis.x + axis.y * s,
    oc * axis.x * axis.y + axis.z * s, oc * axis.y * axis.y + c, oc * axis.y * axis.z - axis.x * s,
    oc * axis.z * axis.x - axis.y * s, oc * axis.y * axis.z + axis.x * s, oc * axis.z * axis.z + c
  );
}

vec3 getRay(vec2 fragCoord) {
  vec2 uv = ((fragCoord.xy / iResolution.xy) * 2.0 - 1.0) * vec2(iResolution.x / iResolution.y, 1.0);
  vec3 proj = normalize(vec3(uv.x, uv.y, 1.5));

  vec2 normalizedMouse = iMouse.xy / iResolution.xy;
  // Default to looking slightly down at horizon when no mouse input
  float mouseX = normalizedMouse.x;
  float mouseY = normalizedMouse.y == 0.0 ? 0.27 : normalizedMouse.y;

  return createRotationMatrixAxisAngle(vec3(0.0, -1.0, 0.0), 3.0 * ((mouseX + 0.5) * 2.0 - 1.0))
    * createRotationMatrixAxisAngle(vec3(1.0, 0.0, 0.0), 0.5 + 1.5 * ((mouseY * 1.0) * 2.0 - 1.0))
    * proj;
}

float intersectPlane(vec3 origin, vec3 direction, vec3 point, vec3 normal) {
  return clamp(dot(point - origin, normal) / dot(direction, normal), -1.0, 9991999.0);
}

vec3 extra_cheap_atmosphere(vec3 raydir, vec3 sundir) {
  float special_trick = 1.0 / (raydir.y * 1.0 + 0.1);
  float special_trick2 = 1.0 / (sundir.y * 11.0 + 1.0);
  float raysundt = pow(abs(dot(sundir, raydir)), 2.0);
  float sundt = pow(max(0.0, dot(sundir, raydir)), 8.0);
  float mymie = sundt * special_trick * 0.2;
  vec3 suncolor = mix(vec3(1.0), max(vec3(0.0), vec3(1.0) - vec3(5.5, 13.0, 22.4) / 22.4), special_trick2);
  vec3 bluesky = vec3(5.5, 13.0, 22.4) / 22.4 * suncolor;
  vec3 bluesky2 = max(vec3(0.0), bluesky - vec3(5.5, 13.0, 22.4) * 0.002 * (special_trick + -6.0 * sundir.y * sundir.y));
  bluesky2 *= special_trick * (0.24 + raysundt * 0.24);
  return bluesky2 * (1.0 + 1.0 * pow(1.0 - raydir.y, 3.0));
}

vec3 getSunDirection() {
  return normalize(vec3(-0.0773502691896258, 0.5 + sin(iTime * 0.2 + 2.6) * 0.45, 0.5773502691896258));
}

vec3 getAtmosphere(vec3 dir) {
  return extra_cheap_atmosphere(dir, getSunDirection()) * 0.5;
}

float getSun(vec3 dir) {
  return pow(max(0.0, dot(dir, getSunDirection())), 720.0) * 210.0;
}

vec3 aces_tonemap(vec3 color) {
  mat3 m1 = mat3(
    0.59719, 0.07600, 0.02840,
    0.35458, 0.90834, 0.13383,
    0.04823, 0.01566, 0.83777
  );
  mat3 m2 = mat3(
    1.60475, -0.10208, -0.00327,
    -0.53108,  1.10813, -0.07276,
    -0.07367, -0.00605,  1.07602
  );
  vec3 v = m1 * color;
  vec3 a = v * (v + 0.0245786) - 0.000090537;
  vec3 b = v * (0.983729 * v + 0.4329510) + 0.238081;
  return pow(clamp(m2 * (a / b), 0.0, 1.0), vec3(1.0 / 2.2));
}

void main() {
  vec3 ray = getRay(gl_FragCoord.xy);

  if(ray.y >= 0.0) {
    vec3 C = getAtmosphere(ray) + getSun(ray);
    gl_FragColor = vec4(aces_tonemap(C * 2.0), 1.0);
    return;
  }

  vec3 waterPlaneHigh = vec3(0.0, 0.0, 0.0);
  vec3 waterPlaneLow = vec3(0.0, -WATER_DEPTH, 0.0);
  vec3 origin = vec3(iTime * 0.2, CAMERA_HEIGHT, 1.0);

  float highPlaneHit = intersectPlane(origin, ray, waterPlaneHigh, vec3(0.0, 1.0, 0.0));
  float lowPlaneHit = intersectPlane(origin, ray, waterPlaneLow, vec3(0.0, 1.0, 0.0));
  vec3 highHitPos = origin + ray * highPlaneHit;
  vec3 lowHitPos = origin + ray * lowPlaneHit;

  float dist = raymarchwater(origin, highHitPos, lowHitPos, WATER_DEPTH);
  vec3 waterHitPos = origin + ray * dist;

  vec3 N = normal(waterHitPos.xz, 0.01, WATER_DEPTH);
  N = mix(N, vec3(0.0, 1.0, 0.0), 0.8 * min(1.0, sqrt(dist * 0.01) * 1.1));

  float fresnel = (0.04 + (1.0 - 0.04) * (pow(1.0 - max(0.0, dot(-N, ray)), 5.0)));

  vec3 R = normalize(reflect(ray, N));
  R.y = abs(R.y);

  vec3 reflection = getAtmosphere(R) + getSun(R);
  vec3 scattering = vec3(0.0293, 0.0698, 0.1717) * 0.1 * (0.2 + (waterHitPos.y + WATER_DEPTH) / WATER_DEPTH);

  vec3 C = fresnel * reflection + scattering;
  gl_FragColor = vec4(aces_tonemap(C * 2.0), 1.0);
}
`;

interface OceanCanvasProps {
  className?: string;
}

export default function OceanCanvas({
  className = '',
}: OceanCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const animationFrameRef = useRef<number>(0);
  const startTimeRef = useRef<number>(Date.now());

  // Track if user has interacted - shader uses (0,0) as "no interaction" signal
  const hasInteractedRef = useRef(false);
  const mouseRef = useRef({ x: 0, y: 0, isDown: false });
  const mouseTargetRef = useRef({ x: 0, y: 0 });

  // Mouse handlers
  const handleMouseDown = useCallback((e: MouseEvent) => {
    hasInteractedRef.current = true;
    mouseRef.current.isDown = true;
    mouseRef.current.x = e.clientX;
    mouseRef.current.y = e.clientY;
    mouseTargetRef.current.x = e.clientX;
    mouseTargetRef.current.y = e.clientY;
  }, []);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (mouseRef.current.isDown) {
      mouseTargetRef.current.x = e.clientX;
      mouseTargetRef.current.y = e.clientY;
    }
  }, []);

  const handleMouseUp = useCallback(() => {
    mouseRef.current.isDown = false;
  }, []);

  // Touch handlers
  const handleTouchStart = useCallback((e: TouchEvent) => {
    if (e.touches.length > 0) {
      hasInteractedRef.current = true;
      mouseRef.current.isDown = true;
      mouseRef.current.x = e.touches[0].clientX;
      mouseRef.current.y = e.touches[0].clientY;
      mouseTargetRef.current.x = e.touches[0].clientX;
      mouseTargetRef.current.y = e.touches[0].clientY;
    }
  }, []);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (e.touches.length > 0 && mouseRef.current.isDown) {
      mouseTargetRef.current.x = e.touches[0].clientX;
      mouseTargetRef.current.y = e.touches[0].clientY;
    }
  }, []);

  const handleTouchEnd = useCallback(() => {
    mouseRef.current.isDown = false;
  }, []);

  useEffect(() => {
    if (!containerRef.current) return;

    // Create renderer
    const renderer = new THREE.WebGLRenderer({
      antialias: false, // Disable for performance
      powerPreference: 'high-performance'
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5)); // Cap pixel ratio
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Create scene and camera
    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

    // Create uniforms
    const uniforms = {
      iResolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
      iTime: { value: 0.0 },
      iMouse: { value: new THREE.Vector4(0, 0, 0, 0) },
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

    // Handle resize
    const handleResize = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      renderer.setSize(width, height);
      uniforms.iResolution.value.set(width, height);
    };

    // Add event listeners
    window.addEventListener('resize', handleResize);
    renderer.domElement.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    renderer.domElement.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchmove', handleTouchMove, { passive: true });
    window.addEventListener('touchend', handleTouchEnd);

    // Animation loop
    const animate = () => {
      animationFrameRef.current = requestAnimationFrame(animate);

      const elapsedTime = (Date.now() - startTimeRef.current) / 1000;
      uniforms.iTime.value = elapsedTime;

      // Only update mouse if user has interacted
      if (hasInteractedRef.current) {
        // Smooth mouse interpolation while dragging
        if (mouseRef.current.isDown) {
          mouseRef.current.x += (mouseTargetRef.current.x - mouseRef.current.x) * 0.15;
          mouseRef.current.y += (mouseTargetRef.current.y - mouseRef.current.y) * 0.15;
        }

        uniforms.iMouse.value.set(
          mouseRef.current.x,
          window.innerHeight - mouseRef.current.y, // Flip Y for shader
          mouseRef.current.isDown ? 1 : 0,
          0
        );
      }
      // If no interaction, iMouse stays at (0,0,0,0) and shader uses default view

      renderer.render(scene, camera);
    };

    animate();

    // Cleanup
    return () => {
      cancelAnimationFrame(animationFrameRef.current);
      window.removeEventListener('resize', handleResize);
      renderer.domElement.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      renderer.domElement.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
      renderer.dispose();
      geometry.dispose();
      material.dispose();
      if (containerRef.current && renderer.domElement) {
        containerRef.current.removeChild(renderer.domElement);
      }
    };
  }, [handleMouseDown, handleMouseMove, handleMouseUp, handleTouchStart, handleTouchMove, handleTouchEnd]);

  return (
    <div
      ref={containerRef}
      className={`absolute inset-0 ${className}`}
      style={{ cursor: 'grab', touchAction: 'none' }}
    />
  );
}
