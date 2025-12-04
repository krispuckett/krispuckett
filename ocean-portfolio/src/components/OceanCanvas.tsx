'use client';

import { useEffect, useRef } from 'react';
import * as THREE from 'three';

const vertexShader = `
void main() {
    gl_Position = vec4(position, 1.0);
}
`;

// Custom sunset ocean shader - inspired by afl_ext's Seascape
// Customized with warm sunset palette and golden hour lighting
const fragmentShader = `
precision highp float;

uniform vec2 iResolution;
uniform float iTime;
uniform vec4 iMouse;

#define DRAG_MULT 0.38
#define WATER_DEPTH 1.0
#define CAMERA_HEIGHT 1.2
#define ITERATIONS_RAYMARCH 12
#define ITERATIONS_NORMAL 36

// Custom color palette - warm sunset tones
vec3 sunsetOrange = vec3(1.0, 0.45, 0.2);
vec3 sunsetPink = vec3(0.95, 0.4, 0.5);
vec3 sunsetPurple = vec3(0.4, 0.2, 0.5);
vec3 deepBlue = vec3(0.1, 0.15, 0.35);
vec3 horizonGold = vec3(1.0, 0.7, 0.3);

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
  float mouseX = normalizedMouse.x;
  float mouseY = normalizedMouse.y == 0.0 ? 0.35 : normalizedMouse.y;

  return createRotationMatrixAxisAngle(vec3(0.0, -1.0, 0.0), 3.0 * ((mouseX + 0.5) * 2.0 - 1.0))
    * createRotationMatrixAxisAngle(vec3(1.0, 0.0, 0.0), 0.5 + 1.5 * ((mouseY * 1.0) * 2.0 - 1.0))
    * proj;
}

float intersectPlane(vec3 origin, vec3 direction, vec3 point, vec3 normal) {
  return clamp(dot(point - origin, normal) / dot(direction, normal), -1.0, 9991999.0);
}

// Custom sunset sky atmosphere
vec3 getSunsetSky(vec3 raydir, vec3 sundir) {
  float sunHeight = sundir.y;

  // Base sky gradient - deep blue at top, warm at horizon
  float horizonBlend = pow(1.0 - max(0.0, raydir.y), 3.0);
  float zenithBlend = max(0.0, raydir.y);

  // Sunset colors based on height in sky
  vec3 zenithColor = mix(deepBlue, sunsetPurple, 0.3);
  vec3 midColor = mix(sunsetPink, sunsetOrange, horizonBlend);
  vec3 horizonColor = mix(horizonGold, sunsetOrange, 0.5);

  // Blend sky colors
  vec3 sky = mix(horizonColor, midColor, pow(zenithBlend, 0.5));
  sky = mix(sky, zenithColor, pow(zenithBlend, 1.5));

  // Sun glow
  float sunDot = max(0.0, dot(raydir, sundir));
  float sunGlow = pow(sunDot, 8.0) * 0.5;
  float sunCore = pow(sunDot, 256.0) * 2.0;

  // Warm sun color
  vec3 sunColor = vec3(1.0, 0.85, 0.6);
  sky += sunColor * sunGlow;
  sky += sunColor * sunCore;

  // Atmospheric haze near horizon
  float haze = pow(1.0 - abs(raydir.y), 8.0);
  sky = mix(sky, horizonGold * 0.8, haze * 0.3);

  return sky;
}

vec3 getSunDirection() {
  // Sun low on horizon for golden hour - slight movement over time
  float sunAngle = 0.15 + sin(iTime * 0.05) * 0.05;
  return normalize(vec3(0.5, sunAngle, 0.7));
}

vec3 getAtmosphere(vec3 dir) {
  return getSunsetSky(dir, getSunDirection());
}

float getSun(vec3 dir) {
  return pow(max(0.0, dot(dir, getSunDirection())), 720.0) * 150.0;
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
    gl_FragColor = vec4(aces_tonemap(C * 1.5), 1.0);
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

  // Custom water color - deep teal with warm undertones
  vec3 waterDeep = vec3(0.02, 0.06, 0.1);
  vec3 waterShallow = vec3(0.03, 0.08, 0.12);
  float depthFactor = (waterHitPos.y + WATER_DEPTH) / WATER_DEPTH;
  vec3 scattering = mix(waterDeep, waterShallow, depthFactor) * 0.8;

  // Add warm reflection from sunset
  vec3 warmReflect = sunsetOrange * 0.02 * fresnel;
  scattering += warmReflect;

  vec3 C = fresnel * reflection + scattering;

  // Slight fog/atmosphere at distance
  float fogDist = smoothstep(0.0, 100.0, dist);
  vec3 fogColor = mix(horizonGold, sunsetPink, 0.3) * 0.15;
  C = mix(C, fogColor, fogDist * 0.3);

  gl_FragColor = vec4(aces_tonemap(C * 1.5), 1.0);
}
`;

interface OceanCanvasProps {
  className?: string;
}

export default function OceanCanvas({ className = '' }: OceanCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    let animationFrameId: number;
    const startTime = Date.now();
    let hasInteracted = false;
    const mouse = { x: 0, y: 0, isDown: false };
    const mouseTarget = { x: 0, y: 0 };

    // Create renderer
    const renderer = new THREE.WebGLRenderer({
      antialias: false,
      powerPreference: 'high-performance'
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    container.appendChild(renderer.domElement);

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

    // Event handlers
    const handleResize = () => {
      renderer.setSize(window.innerWidth, window.innerHeight);
      uniforms.iResolution.value.set(window.innerWidth, window.innerHeight);
    };

    const handleMouseDown = (e: MouseEvent) => {
      hasInteracted = true;
      mouse.isDown = true;
      mouse.x = e.clientX;
      mouse.y = e.clientY;
      mouseTarget.x = e.clientX;
      mouseTarget.y = e.clientY;
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (mouse.isDown) {
        mouseTarget.x = e.clientX;
        mouseTarget.y = e.clientY;
      }
    };

    const handleMouseUp = () => {
      mouse.isDown = false;
    };

    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        hasInteracted = true;
        mouse.isDown = true;
        mouse.x = e.touches[0].clientX;
        mouse.y = e.touches[0].clientY;
        mouseTarget.x = e.touches[0].clientX;
        mouseTarget.y = e.touches[0].clientY;
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length > 0 && mouse.isDown) {
        mouseTarget.x = e.touches[0].clientX;
        mouseTarget.y = e.touches[0].clientY;
      }
    };

    const handleTouchEnd = () => {
      mouse.isDown = false;
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
      animationFrameId = requestAnimationFrame(animate);

      uniforms.iTime.value = (Date.now() - startTime) / 1000;

      if (hasInteracted) {
        if (mouse.isDown) {
          mouse.x += (mouseTarget.x - mouse.x) * 0.15;
          mouse.y += (mouseTarget.y - mouse.y) * 0.15;
        }
        uniforms.iMouse.value.set(
          mouse.x,
          window.innerHeight - mouse.y,
          mouse.isDown ? 1 : 0,
          0
        );
      }

      renderer.render(scene, camera);
    };

    animate();

    // Cleanup
    return () => {
      cancelAnimationFrame(animationFrameId);
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
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className={`absolute inset-0 ${className}`}
      style={{ cursor: 'grab', touchAction: 'none' }}
    />
  );
}
