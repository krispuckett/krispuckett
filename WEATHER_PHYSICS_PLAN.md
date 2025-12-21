# Weather Physics Animation System - Implementation Plan

## Overview

Build a performant, physics-based weather system (rain/snow) that:
1. Simulates realistic particle physics (gravity, wind, terminal velocity)
2. Responds to lighting conditions (sun position, ambient light)
3. **Collides with UI elements** - particles bounce off windows/panels like roofs

---

## Architecture Decision: WebGL Particle System

### Why WebGL/Three.js over CSS/Canvas2D?

| Approach | Particles | Physics | UI Collision | Performance |
|----------|-----------|---------|--------------|-------------|
| CSS | ~100 | ❌ | ❌ | Poor |
| Canvas2D | ~5,000 | ✅ | ✅ | Good |
| **WebGL/Three.js** | ~100,000+ | ✅ | ✅ | Excellent |

**Decision: Three.js with GPU-accelerated particle shaders**

---

## Core Components

### 1. `WeatherSystem.tsx` - Main Controller
```
/src/components/weather/
├── WeatherSystem.tsx      # Main orchestrator
├── RainRenderer.tsx       # Rain-specific shader/logic
├── SnowRenderer.tsx       # Snow-specific shader/logic
├── WeatherPhysics.ts      # Physics engine (gravity, wind, collisions)
├── UICollisionMap.ts      # Tracks UI element bounding boxes
└── shaders/
    ├── rain.vert          # Rain vertex shader
    ├── rain.frag          # Rain fragment shader
    ├── snow.vert          # Snow vertex shader
    └── snow.frag          # Snow fragment shader
```

### 2. Physics Engine Design

```typescript
interface Particle {
  position: Vector3;      // Current position
  velocity: Vector3;      // Current velocity
  mass: number;           // Affects gravity/wind response
  size: number;           // Visual size
  opacity: number;        // For fade effects
  lifetime: number;       // Time alive
}

interface PhysicsConfig {
  gravity: Vector3;           // Default: (0, -9.8, 0)
  wind: Vector3;              // Dynamic wind direction
  terminalVelocity: number;   // Max fall speed
  turbulence: number;         // Randomness factor
  bounceCoefficient: number;  // Energy retained on collision (0-1)
}
```

### 3. UI Collision System

**Key Innovation: DOM-to-WebGL Coordinate Mapping**

```typescript
interface UICollider {
  id: string;
  bounds: DOMRect;           // Screen-space bounding box
  worldBounds: Box3;         // Converted to WebGL coordinates
  surfaceNormal: Vector3;    // For bounce direction
  type: 'roof' | 'wall' | 'awning';
}

class UICollisionMap {
  private colliders: Map<string, UICollider>;

  // Register a DOM element as a collider
  registerElement(element: HTMLElement, type: ColliderType): void;

  // Update positions on scroll/resize
  updateBounds(): void;

  // Check particle collision
  checkCollision(particle: Particle): CollisionResult | null;
}
```

---

## Implementation Phases

### Phase 1: Core Particle System (GPU-Based)

**Goal**: Render 50,000+ particles at 60fps

**Technique**: Instanced rendering with transform feedback

```glsl
// rain.vert - Vertex Shader
attribute vec3 position;
attribute vec3 velocity;
attribute float size;
attribute float opacity;

uniform float uTime;
uniform float uDeltaTime;
uniform vec3 uGravity;
uniform vec3 uWind;
uniform sampler2D uCollisionMap; // Baked UI collision data

varying float vOpacity;
varying vec2 vUv;

void main() {
  // Physics update on GPU
  vec3 newVelocity = velocity + (uGravity + uWind) * uDeltaTime;
  vec3 newPosition = position + newVelocity * uDeltaTime;

  // Collision detection via texture lookup
  vec2 screenPos = projectToScreen(newPosition);
  vec4 collisionData = texture2D(uCollisionMap, screenPos);

  if (collisionData.a > 0.0) {
    // Bounce: reflect velocity around surface normal
    vec3 normal = collisionData.rgb * 2.0 - 1.0;
    newVelocity = reflect(newVelocity, normal) * 0.3; // 30% energy retained
    newPosition = position; // Stay at collision point
  }

  gl_Position = projectionMatrix * modelViewMatrix * vec4(newPosition, 1.0);
  gl_PointSize = size * (300.0 / length(gl_Position.xyz));
  vOpacity = opacity;
}
```

### Phase 2: Rain Rendering

**Visual Characteristics:**
- Elongated streaks (motion blur effect)
- Slight blue tint
- Splash effect on collision
- Transparency based on depth

```glsl
// rain.frag - Fragment Shader
varying float vOpacity;
varying vec2 vUv;

uniform vec3 uLightDirection;
uniform vec3 uLightColor;
uniform float uIntensity;

void main() {
  // Elongated raindrop shape
  vec2 center = gl_PointCoord - 0.5;
  float dist = length(center * vec2(1.0, 3.0)); // Stretch vertically

  if (dist > 0.5) discard;

  // Lighting interaction
  float lightFactor = dot(normalize(vec3(center, 1.0)), uLightDirection);
  vec3 color = mix(vec3(0.6, 0.7, 0.9), uLightColor, lightFactor * 0.3);

  // Edge fade
  float alpha = smoothstep(0.5, 0.2, dist) * vOpacity * uIntensity;

  gl_FragColor = vec4(color, alpha);
}
```

### Phase 3: Snow Rendering

**Visual Characteristics:**
- Slower fall speed
- Gentle swaying motion (sin wave)
- Accumulation effect
- Soft, round particles
- Depth-based blur

```glsl
// snow.vert - Vertex Shader
attribute vec3 position;
attribute float size;
attribute float phase; // Unique per-particle for sway offset

uniform float uTime;
uniform float uWindStrength;

void main() {
  vec3 pos = position;

  // Gentle swaying motion
  pos.x += sin(uTime * 0.5 + phase) * 0.3;
  pos.z += cos(uTime * 0.3 + phase * 1.5) * 0.2;

  // Slower, more floaty fall
  pos.y -= uTime * 0.5; // Much slower than rain

  gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
  gl_PointSize = size * (200.0 / length(gl_Position.xyz));
}
```

### Phase 4: UI Collision Detection

**Strategy: Hybrid CPU-GPU Approach**

1. **CPU Side**: Track DOM elements, compute bounding boxes
2. **GPU Side**: Bake collision data into texture, sample in shader

```typescript
// UICollisionMap.ts
export class UICollisionMap {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private texture: THREE.DataTexture;
  private elements: Map<string, ColliderElement> = new Map();

  constructor(width: number, height: number) {
    this.canvas = document.createElement('canvas');
    this.canvas.width = width;
    this.canvas.height = height;
    this.ctx = this.canvas.getContext('2d')!;
    this.texture = new THREE.DataTexture(
      new Uint8Array(width * height * 4),
      width,
      height
    );
  }

  registerElement(
    id: string,
    element: HTMLElement,
    options: { type: 'roof' | 'wall'; normal?: Vector3 }
  ) {
    this.elements.set(id, {
      element,
      type: options.type,
      normal: options.normal || new Vector3(0, 1, 0) // Default: up
    });
  }

  updateCollisionTexture() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    for (const [id, collider] of this.elements) {
      const rect = collider.element.getBoundingClientRect();

      // Encode surface normal in RGB, collision flag in Alpha
      const r = Math.floor((collider.normal.x + 1) * 127.5);
      const g = Math.floor((collider.normal.y + 1) * 127.5);
      const b = Math.floor((collider.normal.z + 1) * 127.5);

      this.ctx.fillStyle = `rgba(${r}, ${g}, ${b}, 1)`;

      // Draw collision zone (with padding for particle radius)
      this.ctx.fillRect(
        rect.left - 2,
        rect.top - 5, // Particles hit "roof" slightly above
        rect.width + 4,
        10 // Thin collision strip at top edge
      );
    }

    // Update Three.js texture
    const imageData = this.ctx.getImageData(
      0, 0, this.canvas.width, this.canvas.height
    );
    this.texture.image.data.set(imageData.data);
    this.texture.needsUpdate = true;
  }
}
```

### Phase 5: Lighting Integration

**Connect to existing `useSunPosition` hook:**

```typescript
// WeatherLighting.ts
export function useWeatherLighting() {
  const { sunAngle, sunHeight, timeOfDay } = useSunPosition();

  return useMemo(() => {
    // Light direction from sun position
    const lightDirection = new Vector3(
      Math.cos(sunAngle),
      sunHeight,
      Math.sin(sunAngle)
    ).normalize();

    // Light color based on time of day
    const lightColor = (() => {
      switch (timeOfDay) {
        case 'dawn':
        case 'dusk':
          return new Color(0xff7f50); // Sunset orange
        case 'day':
          return new Color(0xffffff); // White
        case 'night':
          return new Color(0x4466aa); // Blue moonlight
      }
    })();

    // Ambient intensity
    const ambientIntensity = timeOfDay === 'night' ? 0.2 : 0.8;

    return { lightDirection, lightColor, ambientIntensity };
  }, [sunAngle, sunHeight, timeOfDay]);
}
```

### Phase 6: Splash/Impact Effects

**On collision, spawn secondary particles:**

```typescript
interface SplashConfig {
  count: number;           // Particles to spawn
  spread: number;          // Angle spread
  velocityScale: number;   // Speed multiplier
  lifetime: number;        // How long splash lives
}

function createSplash(
  position: Vector3,
  impactVelocity: Vector3,
  config: SplashConfig
): Particle[] {
  const splashes: Particle[] = [];

  for (let i = 0; i < config.count; i++) {
    const angle = (Math.random() - 0.5) * config.spread;
    const speed = impactVelocity.length() * config.velocityScale * Math.random();

    splashes.push({
      position: position.clone(),
      velocity: new Vector3(
        Math.sin(angle) * speed,
        Math.abs(Math.cos(angle)) * speed * 0.5,
        (Math.random() - 0.5) * speed * 0.3
      ),
      mass: 0.1,
      size: 2,
      opacity: 0.8,
      lifetime: config.lifetime
    });
  }

  return splashes;
}
```

---

## Performance Optimizations

### 1. Particle Pool with Object Reuse
```typescript
class ParticlePool {
  private pool: Particle[] = [];
  private active: Set<Particle> = new Set();

  acquire(): Particle {
    const particle = this.pool.pop() || this.createNew();
    this.active.add(particle);
    return particle;
  }

  release(particle: Particle) {
    this.active.delete(particle);
    this.reset(particle);
    this.pool.push(particle);
  }
}
```

### 2. Spatial Hashing for Collision
```typescript
class SpatialHash {
  private cellSize: number;
  private grid: Map<string, Particle[]> = new Map();

  // O(1) lookup for nearby particles
  getNearby(position: Vector3): Particle[] {
    const cellKey = this.getCellKey(position);
    return this.grid.get(cellKey) || [];
  }
}
```

### 3. Level of Detail (LOD)
```typescript
function calculateParticleCount(distance: number, baseCount: number): number {
  if (distance < 100) return baseCount;
  if (distance < 500) return baseCount * 0.5;
  return baseCount * 0.2;
}
```

### 4. Frustum Culling
```typescript
// Only simulate particles in view
const frustum = new THREE.Frustum();
frustum.setFromProjectionMatrix(camera.projectionMatrix);

particles.forEach(p => {
  if (frustum.containsPoint(p.position)) {
    updateParticle(p);
  }
});
```

### 5. Web Workers for Physics
```typescript
// physicsWorker.ts
self.onmessage = (e) => {
  const { particles, deltaTime, config } = e.data;

  // Heavy physics calculations off main thread
  const updated = particles.map(p => updatePhysics(p, deltaTime, config));

  self.postMessage({ particles: updated });
};
```

---

## API Design

### Usage Example

```tsx
// In your main page or layout
import { WeatherSystem } from '@/components/weather/WeatherSystem';

export default function Page() {
  return (
    <>
      <WeatherSystem
        type="rain"
        intensity={0.7}        // 0-1
        windDirection={45}     // degrees
        windStrength={0.3}     // 0-1
        lightingEnabled={true}
        collisionEnabled={true}
      />

      {/* UI elements that particles should collide with */}
      <Window data-weather-collider="roof">
        <WindowContent />
      </Window>
    </>
  );
}
```

### Collision Registration

```tsx
// Any component can register as a collider
function FloatingWindow({ children }) {
  const ref = useRef<HTMLDivElement>(null);
  const { registerCollider } = useWeatherCollision();

  useEffect(() => {
    if (ref.current) {
      registerCollider('window-1', ref.current, {
        type: 'roof',
        normal: [0, 1, 0] // Upward-facing surface
      });
    }
  }, []);

  return <div ref={ref}>{children}</div>;
}
```

---

## File Structure (Final)

```
/src
├── components/
│   └── weather/
│       ├── WeatherSystem.tsx         # Main orchestrator component
│       ├── WeatherCanvas.tsx         # Three.js renderer
│       ├── RainEffect.tsx            # Rain-specific logic
│       ├── SnowEffect.tsx            # Snow-specific logic
│       ├── SplashEffect.tsx          # Impact splash particles
│       └── WeatherControls.tsx       # Debug/demo controls
├── lib/
│   └── weather/
│       ├── physics/
│       │   ├── PhysicsEngine.ts      # Core physics simulation
│       │   ├── ParticlePool.ts       # Object pooling
│       │   ├── SpatialHash.ts        # Collision optimization
│       │   └── physicsWorker.ts      # Web Worker for heavy calc
│       ├── collision/
│       │   ├── UICollisionMap.ts     # DOM-to-WebGL mapping
│       │   ├── CollisionTexture.ts   # GPU collision data
│       │   └── ColliderRegistry.ts   # Element registration
│       └── shaders/
│           ├── rain.vert
│           ├── rain.frag
│           ├── snow.vert
│           ├── snow.frag
│           ├── splash.vert
│           └── splash.frag
├── hooks/
│   ├── useWeatherSystem.ts           # Weather state management
│   ├── useWeatherCollision.ts        # Collision registration
│   └── useWeatherLighting.ts         # Light integration
└── contexts/
    └── WeatherContext.tsx            # Global weather state
```

---

## Implementation Order

1. **Week 1: Foundation**
   - [ ] Set up file structure
   - [ ] Create basic Three.js particle renderer
   - [ ] Implement particle pool
   - [ ] Add gravity physics

2. **Week 2: Visual Polish**
   - [ ] Rain shader with elongated drops
   - [ ] Snow shader with swaying motion
   - [ ] Lighting integration with sun position
   - [ ] Depth-based effects

3. **Week 3: Collision System**
   - [ ] UICollisionMap implementation
   - [ ] DOM-to-WebGL coordinate conversion
   - [ ] Collision texture baking
   - [ ] Bounce physics

4. **Week 4: Optimization & Polish**
   - [ ] Web Worker for physics
   - [ ] Spatial hashing
   - [ ] Frustum culling
   - [ ] Splash effects
   - [ ] Performance profiling

---

## Technical Considerations

### Browser Support
- WebGL 2.0 required (97%+ browser support)
- Fallback: Reduced particle count for WebGL 1.0
- Mobile: Automatic LOD reduction

### Memory Budget
- Target: <50MB GPU memory
- Particle limit: 100,000 active
- Texture atlas: 2048x2048

### Frame Budget
- Target: 60fps on mid-range hardware
- Physics: <2ms per frame
- Rendering: <8ms per frame
- Collision: <1ms per frame

---

## Questions for Clarification

1. **Particle density preference?** (Light drizzle vs heavy downpour)
2. **Should snow accumulate on surfaces?** (Requires additional state)
3. **Wind should be dynamic or static?** (Could tie to scroll/mouse)
4. **Integration with existing ocean shader?** (Rain hitting water surface)
5. **Mobile support priority?** (Affects complexity budget)
