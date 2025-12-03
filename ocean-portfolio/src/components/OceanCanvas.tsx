'use client';

import { useEffect, useRef, useCallback } from 'react';
import * as THREE from 'three';

const vertexShader = `
void main() {
    gl_Position = vec4(position, 1.0);
}
`;

// Enhanced Seascape shader with dive progress
const fragmentShader = `
precision highp float;

uniform vec2 iResolution;
uniform float iTime;
uniform vec4 iMouse;
uniform float uDiveProgress;    // 0 = above water, 1 = fully submerged
uniform float uCameraY;         // Camera Y position
uniform float uCameraPitch;     // Camera pitch angle

#define DRAG_MULT 0.38
#define WATER_DEPTH 1.0
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
  float mouseX = normalizedMouse.x;
  float mouseY = normalizedMouse.y == 0.0 ? 0.27 : normalizedMouse.y;

  // Apply dive-based pitch adjustment
  float pitchAdjust = uCameraPitch;

  return createRotationMatrixAxisAngle(vec3(0.0, -1.0, 0.0), 3.0 * ((mouseX + 0.5) * 2.0 - 1.0))
    * createRotationMatrixAxisAngle(vec3(1.0, 0.0, 0.0), 0.5 + 1.5 * ((mouseY * 1.0) * 2.0 - 1.0) + pitchAdjust)
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
  vec3 suncolor = mix(vec3(1.0), max(vec3(0.0), vec3(1.0) - vec3(5.5, 13.0, 22.4) / 22.4), special_trick2);
  vec3 bluesky = vec3(5.5, 13.0, 22.4) / 22.4 * suncolor;
  vec3 bluesky2 = max(vec3(0.0), bluesky - vec3(5.5, 13.0, 22.4) * 0.002 * (special_trick + -6.0 * sundir.y * sundir.y));
  bluesky2 *= special_trick * (0.24 + raysundt * 0.24);
  return bluesky2 * (1.0 + 1.0 * pow(1.0 - raydir.y, 3.0));
}

vec3 getSunDirection() {
  return normalize(vec3(-0.0773502691896258, 0.5 + sin(iTime * 0.1 + 2.6) * 0.3, 0.5773502691896258));
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

// Underwater color grading
vec3 underwaterColor(vec3 color, float depth) {
  // Blue-green tint that increases with depth
  vec3 waterTint = vec3(0.1, 0.4, 0.6);
  float tintStrength = smoothstep(0.0, 1.0, depth) * 0.7;
  color = mix(color, color * waterTint, tintStrength);

  // Darken with depth
  float darkness = 1.0 - smoothstep(0.0, 1.0, depth) * 0.6;
  color *= darkness;

  return color;
}

// Surface distortion effect
vec2 surfaceDistortion(vec2 uv, float progress) {
  // Distortion peaks at surface crossing (progress ~0.2)
  float distortionStrength = sin(progress * 3.14159) * 0.03;
  float wave = sin(uv.x * 20.0 + iTime * 2.0) * sin(uv.y * 15.0 + iTime * 1.5);
  return uv + vec2(wave) * distortionStrength;
}

void main() {
  vec2 fragCoord = gl_FragCoord.xy;

  // Apply surface distortion near the surface transition
  if (uDiveProgress > 0.1 && uDiveProgress < 0.4) {
    vec2 uv = fragCoord / iResolution.xy;
    uv = surfaceDistortion(uv, uDiveProgress);
    fragCoord = uv * iResolution.xy;
  }

  vec3 ray = getRay(fragCoord);

  // Camera height based on dive progress
  float cameraHeight = uCameraY;

  // Above water - normal rendering
  if (ray.y >= 0.0 && uDiveProgress < 0.25) {
    vec3 C = getAtmosphere(ray) + getSun(ray);
    gl_FragColor = vec4(aces_tonemap(C * 2.0), 1.0);
    return;
  }

  // Water plane setup
  vec3 waterPlaneHigh = vec3(0.0, 0.0, 0.0);
  vec3 waterPlaneLow = vec3(0.0, -WATER_DEPTH, 0.0);
  vec3 origin = vec3(iTime * 0.2, cameraHeight, 1.0);

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

  // Apply underwater color grading based on dive progress
  if (uDiveProgress > 0.2) {
    float underwaterDepth = smoothstep(0.2, 0.6, uDiveProgress);
    C = underwaterColor(C, underwaterDepth);

    // Add caustics effect when looking up from underwater
    if (ray.y > 0.0) {
      float caustic = pow(max(0.0, dot(ray, getSunDirection())), 4.0) * 0.5;
      C += vec3(caustic * 0.3, caustic * 0.4, caustic * 0.5) * (1.0 - underwaterDepth * 0.5);
    }
  }

  // Surface flash at the crossing point
  if (uDiveProgress > 0.15 && uDiveProgress < 0.25) {
    float flashIntensity = 1.0 - abs(uDiveProgress - 0.2) * 20.0;
    flashIntensity = max(0.0, flashIntensity) * 0.3;
    C += vec3(flashIntensity);
  }

  gl_FragColor = vec4(aces_tonemap(C * 2.0), 1.0);
}
`;

interface OceanCanvasProps {
  isActive?: boolean;
  className?: string;
  diveProgress?: number;
}

export default function OceanCanvas({
  isActive = true,
  className = '',
  diveProgress = 0,
}: OceanCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const uniformsRef = useRef<{
    iResolution: { value: THREE.Vector2 };
    iTime: { value: number };
    iMouse: { value: THREE.Vector4 };
    uDiveProgress: { value: number };
    uCameraY: { value: number };
    uCameraPitch: { value: number };
  } | null>(null);
  const animationFrameRef = useRef<number>(0);
  const startTimeRef = useRef<number>(Date.now());

  // Use refs for values that change frequently
  const isActiveRef = useRef(isActive);
  isActiveRef.current = isActive;
  const diveProgressRef = useRef(diveProgress);
  diveProgressRef.current = diveProgress;

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

  // Calculate camera position based on dive progress
  const getCameraY = (progress: number): number => {
    // Smooth easing function
    const ease = (t: number) => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

    if (progress < 0.2) {
      // Above water: 1.5 -> 0
      return 1.5 - ease(progress / 0.2) * 1.5;
    } else if (progress < 0.4) {
      // At and below surface: 0 -> -2
      return -ease((progress - 0.2) / 0.2) * 2;
    } else {
      // Fully submerged
      return -2;
    }
  };

  // Calculate camera pitch based on dive progress
  const getCameraPitch = (progress: number): number => {
    if (progress < 0.15) {
      // Looking at horizon, then tilting down
      return -progress / 0.15 * 0.3; // Tilt down 0.3 radians (~17°)
    } else if (progress < 0.25) {
      // At surface, leveling out
      const t = (progress - 0.15) / 0.1;
      return -0.3 + t * 0.3; // Back to level
    } else if (progress < 0.4) {
      // Below surface, looking up
      const t = (progress - 0.25) / 0.15;
      return t * 0.5; // Tilt up 0.5 radians (~29°)
    } else {
      return 0.5;
    }
  };

  useEffect(() => {
    if (!containerRef.current) return;

    const renderer = new THREE.WebGLRenderer({
      antialias: false,
      powerPreference: 'high-performance'
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

    const uniforms = {
      iResolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
      iTime: { value: 0.0 },
      iMouse: { value: new THREE.Vector4(0, 0, 0, 0) },
      uDiveProgress: { value: 0.0 },
      uCameraY: { value: 1.5 },
      uCameraPitch: { value: 0.0 },
    };
    uniformsRef.current = uniforms;

    const material = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms,
    });

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
    renderer.domElement.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    renderer.domElement.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchmove', handleTouchMove, { passive: true });
    window.addEventListener('touchend', handleTouchEnd);

    const animate = () => {
      animationFrameRef.current = requestAnimationFrame(animate);

      if (!isActiveRef.current) return;

      const elapsedTime = (Date.now() - startTimeRef.current) / 1000;
      uniforms.iTime.value = elapsedTime;

      // Update dive progress uniforms
      const progress = diveProgressRef.current;
      uniforms.uDiveProgress.value = progress;
      uniforms.uCameraY.value = getCameraY(progress);
      uniforms.uCameraPitch.value = getCameraPitch(progress);

      // Mouse interaction (disabled when underwater)
      if (hasInteractedRef.current && progress < 0.3) {
        if (mouseRef.current.isDown) {
          mouseRef.current.x += (mouseTargetRef.current.x - mouseRef.current.x) * 0.15;
          mouseRef.current.y += (mouseTargetRef.current.y - mouseRef.current.y) * 0.15;
        }

        uniforms.iMouse.value.set(
          mouseRef.current.x,
          window.innerHeight - mouseRef.current.y,
          mouseRef.current.isDown ? 1 : 0,
          0
        );
      }

      renderer.render(scene, camera);
    };

    animate();

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
      style={{ cursor: diveProgress < 0.3 ? 'grab' : 'default', touchAction: 'none' }}
    />
  );
}
