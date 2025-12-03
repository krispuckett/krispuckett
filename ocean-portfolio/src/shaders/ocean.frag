// "Seascape" by afl_ext - ported to Three.js
// Original: https://www.shadertoy.com/view/MdXyzX
// Licensed under CC BY-NC-SA 3.0

precision highp float;

uniform vec2 iResolution;
uniform float iTime;
uniform vec4 iMouse;
uniform float sunHeight;
uniform float sunAngle;
uniform float cameraY;

varying vec2 vUv;

// Constants
const int NUM_STEPS = 8;
const float PI = 3.141592653589793;
const float EPSILON = 1e-3;

// Sea parameters
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

// Math helpers
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

// Hash function
float hash(vec2 p) {
    float h = dot(p, vec2(127.1, 311.7));
    return fract(sin(h) * 43758.5453123);
}

// Noise function
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

// Lighting
float diffuse(vec3 n, vec3 l, float p) {
    return pow(dot(n, l) * 0.4 + 0.6, p);
}

float specular(vec3 n, vec3 l, vec3 e, float s) {
    float nrm = (s + 8.0) / (PI * 8.0);
    return pow(max(dot(reflect(e, n), l), 0.0), s) * nrm;
}

// Sky color based on sun position
vec3 getSkyColor(vec3 e, float sunH, float sunA) {
    // Sun direction
    vec3 sunDir = normalize(vec3(cos(sunA), max(sunH, -0.1), sin(sunA)));

    // Base sky gradient
    float skyGradient = max(e.y, 0.0);

    // Time of day colors
    vec3 dayColor = vec3(0.5, 0.7, 1.0);
    vec3 sunsetColor = vec3(1.0, 0.5, 0.2);
    vec3 nightColor = vec3(0.02, 0.02, 0.08);

    // Interpolate based on sun height
    vec3 skyBase;
    if (sunH > 0.2) {
        // Day
        skyBase = mix(dayColor * 0.8, dayColor * 0.3, skyGradient);
    } else if (sunH > -0.1) {
        // Sunset/sunrise
        float t = (sunH + 0.1) / 0.3;
        vec3 horizonColor = mix(sunsetColor, dayColor * 0.8, t);
        vec3 zenithColor = mix(nightColor * 2.0, dayColor * 0.3, t);
        skyBase = mix(horizonColor, zenithColor, skyGradient);
    } else {
        // Night
        float nightFade = clamp((-sunH - 0.1) / 0.3, 0.0, 1.0);
        skyBase = mix(nightColor * 2.0, nightColor, skyGradient);

        // Add stars at night
        vec2 starUv = e.xz / (e.y + 0.01) * 20.0;
        float stars = pow(hash(floor(starUv * 100.0)), 20.0) * nightFade;
        skyBase += vec3(stars);
    }

    // Sun glow
    float sunDot = max(dot(e, sunDir), 0.0);
    vec3 sunGlow = vec3(1.0, 0.8, 0.5) * pow(sunDot, 8.0) * max(sunH + 0.2, 0.0);
    vec3 sunCore = vec3(1.0, 1.0, 0.9) * pow(sunDot, 256.0) * max(sunH, 0.0);

    return skyBase + sunGlow + sunCore;
}

// Sea octave
float sea_octave(vec2 uv, float choppy) {
    uv += noise(uv);
    vec2 wv = 1.0 - abs(sin(uv));
    vec2 swv = abs(cos(uv));
    wv = mix(wv, swv, wv);
    return pow(1.0 - pow(wv.x * wv.y, 0.65), choppy);
}

// Sea map
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

// Sea map detailed
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

// Get sea color
vec3 getSeaColor(vec3 p, vec3 n, vec3 l, vec3 eye, vec3 dist) {
    float fresnel = clamp(1.0 - dot(n, -eye), 0.0, 1.0);
    fresnel = pow(fresnel, 3.0) * 0.5;

    vec3 reflected = getSkyColor(reflect(eye, n), sunHeight, sunAngle);
    vec3 refracted = SEA_BASE + diffuse(n, l, 80.0) * SEA_WATER_COLOR * 0.12;

    vec3 color = mix(refracted, reflected, fresnel);

    float atten = max(1.0 - dot(dist, dist) * 0.001, 0.0);
    color += SEA_WATER_COLOR * (p.y - SEA_HEIGHT) * 0.18 * atten;

    // Add specular highlights based on sun
    vec3 sunDir = normalize(vec3(cos(sunAngle), max(sunHeight, 0.0), sin(sunAngle)));
    color += vec3(specular(n, sunDir, eye, 60.0)) * max(sunHeight, 0.0);

    return color;
}

// Get normal
vec3 getNormal(vec3 p, float eps) {
    vec3 n;
    n.y = map_detailed(p);
    n.x = map_detailed(vec3(p.x + eps, p.y, p.z)) - n.y;
    n.z = map_detailed(vec3(p.x, p.y, p.z + eps)) - n.y;
    n.y = eps;
    return normalize(n);
}

// Height map tracing
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

// Get pixel color
vec3 getPixel(in vec2 coord, float time) {
    vec2 uv = coord / iResolution.xy;
    uv = uv * 2.0 - 1.0;
    uv.x *= iResolution.x / iResolution.y;

    // Camera angle from mouse
    vec2 mouse = iMouse.xy / iResolution.xy;
    float angleY = (mouse.x - 0.5) * PI * 0.5;
    float angleX = (mouse.y - 0.5) * PI * 0.25;

    // Ray
    vec3 ang = vec3(0.0, angleY, angleX);
    vec3 ori = vec3(0.0, 3.5 + cameraY, time * 2.0);
    vec3 dir = normalize(vec3(uv.xy, -2.0));
    dir.z += length(uv) * 0.14;
    dir = normalize(dir) * fromEuler(ang);

    // Tracing
    vec3 p;
    heightMapTracing(ori, dir, p);
    vec3 dist = p - ori;
    vec3 n = getNormal(p, dot(dist, dist) * EPSILON);

    // Sun direction for lighting
    vec3 light = normalize(vec3(cos(sunAngle), max(sunHeight, 0.1), sin(sunAngle)));

    // Color
    vec3 color = mix(
        getSkyColor(dir, sunHeight, sunAngle),
        getSeaColor(p, n, light, dir, dist),
        pow(smoothstep(0.0, -0.02, dir.y), 0.2)
    );

    return color;
}

// Main
void main() {
    float time = iTime * 0.3;

    vec3 color = getPixel(gl_FragCoord.xy, time);

    // Post-processing
    color = pow(color, vec3(0.65));

    gl_FragColor = vec4(color, 1.0);
}
