import React, { useMemo, useRef, useState, useEffect, Suspense } from "react";
import * as THREE from "three";
import { Canvas, useFrame, useThree, useLoader } from "@react-three/fiber";
import { PerformanceMonitor } from "@react-three/drei";
import roomUrl from "../assets/common-room.webp";

export { roomUrl };

/* =====================================================================
   The Common Room — the painted underwater common room, brought to life
   in one fragment shader: candles flicker and glow, lake light ripples
   through the windows, the marble floor shimmers, mist rolls across the
   floor and emerald smoke drifts through the hall. Pointer = parallax.
   ===================================================================== */
const frag = /* glsl */`
precision highp float;
uniform sampler2D uImg; uniform float uTime; uniform vec2 uRes; uniform vec2 uPtr; uniform float uImgAsp; uniform float uQ;
varying vec2 vUv;
float h21(vec2 p){ p = fract(p*vec2(123.34, 456.21)); p += dot(p, p+45.32); return fract(p.x*p.y); }
float n2(vec2 p){ vec2 i=floor(p), f=fract(p); f=f*f*(3.0-2.0*f);
  return mix(mix(h21(i), h21(i+vec2(1,0)), f.x), mix(h21(i+vec2(0,1)), h21(i+vec2(1,1)), f.x), f.y); }
float fbm(vec2 p){ float v=0.0, a=.5; mat2 m=mat2(1.6,1.2,-1.2,1.6); for(int i=0;i<6;i++){ if(float(i)>=uQ) break; v+=a*n2(p); p=m*p; a*=.5; } return v; }
float lum(vec3 c){ return dot(c, vec3(.299,.587,.114)); }
float warmMask(vec3 c){ return smoothstep(.5, .85, lum(c)) * smoothstep(.04, .2, c.r - c.b); }

void main(){
  float t = uTime, sAsp = uRes.x / uRes.y;
  // cover-fit the 4:3 painting, slightly zoomed so parallax never shows an edge
  vec2 uv = vUv - .5;
  if (sAsp > uImgAsp) uv.y *= uImgAsp / sAsp; else uv.x *= sAsp / uImgAsp;
  float zoom = 1.08 + .012 * sin(t * .05);
  uv /= zoom;
  // depth-weighted parallax: the floor (near) moves more than the far windows
  float near = smoothstep(.15, -.5, uv.y);
  uv += uPtr * (.012 + .02 * near);
  vec2 iuv = uv + .5;

  // wet marble shimmer on the floor
  float floorM = smoothstep(.36, .2, iuv.y);
  iuv.x += sin(iuv.y * 260.0 + t * 1.3 + n2(iuv * 30.0) * 4.0) * .0009 * floorM;

  vec3 base = texture2D(uImg, iuv).rgb;
  vec3 col = base;

  // --- candles: flicker in place + warm halo ---
  float w = warmMask(base);
  float flick = .8 + .4 * n2(vec2(floor(iuv.x * 90.0), floor(iuv.y * 60.0)) * 7.0 + t * 4.0) + .1 * sin(t * 11.0 + iuv.x * 50.0);
  col += base * w * (flick - 1.0) * 1.4;
  if (uQ > 4.5) {
    float halo = 0.0;
    for (int i = 0; i < 8; i++) { float a = float(i) * .785; halo += warmMask(texture2D(uImg, iuv + vec2(cos(a), sin(a)) * .007).rgb); }
    col += vec3(1.0, .68, .32) * halo * .045 * flick;
  }

  // --- lake light through the windows: moving caustics ---
  float teal = smoothstep(.04, .2, base.g - base.r) * smoothstep(.12, .45, lum(base)) * smoothstep(.3, .5, iuv.y);
  float c1 = n2(iuv * vec2(38.0, 26.0) + vec2(t * .35, t * .22)), c2 = n2(iuv * vec2(52.0, 34.0) - vec2(t * .28, -t * .31));
  float caustic = pow(1.0 - abs(c1 + c2 - 1.0), 7.0);
  float rays = pow(max(0.0, sin(iuv.x * 55.0 + iuv.y * 14.0 - t * .6)), 12.0) * .5;
  col += vec3(.35, 1.0, .82) * (caustic * .32 + rays * .12) * teal;

  // --- mist rolling across the floor ---
  vec2 fp = vec2(iuv.x * 2.2 + t * .03, iuv.y * 7.0);
  float f1 = fbm(fp), f2 = fbm(fp * 1.7 + vec2(-t * .05, 0.0) + f1);
  float fogMask = smoothstep(.5, .18, iuv.y) * (.6 + .4 * smoothstep(.0, .25, iuv.y));
  col = mix(col, vec3(.55, .72, .68), clamp((f1 * .7 + f2 * .55 - .5) * 1.5, 0.0, 1.0) * fogMask * .55);

  // --- emerald smoke drifting through the hall ---
  vec2 p = vec2((vUv.x - .5) * sAsp, vUv.y);
  vec2 q = vec2(fbm(p * 1.3 + vec2(0.0, -t * .03)), fbm(p * 1.3 + vec2(5.2, 1.3) - t * .02));
  float smk = fbm(p * 2.0 + q * 2.6 + vec2(t * .015, -t * .028));
  col += vec3(.05, .3, .19) * smoothstep(.52, .95, smk) * .5;

  // --- embers rising from the candles ---
  for (int i = 0; i < 14; i++) {
    float fi = float(i), sp = .02 + h21(vec2(fi, 1.0)) * .03;
    vec2 ep = vec2(h21(vec2(fi, 7.0)) * sAsp - sAsp * .5 + sin(t * .4 + fi) * .03, fract(h21(vec2(fi, 3.0)) + t * sp) * 1.2 - .1);
    col += vec3(1.0, .7, .35) * exp(-length((p - vec2(ep.x, ep.y))) * 700.0) * (.6 + .4 * sin(t * 6.0 + fi));
  }

  // grade, vignette, grain
  col = pow(max(col, 0.0), vec3(.96));
  float vig = smoothstep(1.3, .35, length((vUv - .5) * vec2(sAsp * .75, 1.0)));
  col *= .6 + .4 * vig;
  col += (h21(vUv * uRes + fract(t)) - .5) * .014;
  gl_FragColor = vec4(col, 1.0);
}`;
const vert = /* glsl */`varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }`;

function Scene({ quality }) {
  const { size, viewport, pointer } = useThree();
  const img = useLoader(THREE.TextureLoader, roomUrl);
  const mat = useMemo(() => {
    img.colorSpace = THREE.NoColorSpace; img.anisotropy = 8; img.minFilter = THREE.LinearMipmapLinearFilter; img.needsUpdate = true;
    return new THREE.ShaderMaterial({
      vertexShader: vert, fragmentShader: frag, depthTest: false, depthWrite: false,
      uniforms: { uImg: { value: img }, uTime: { value: 0 }, uRes: { value: new THREE.Vector2(1, 1) }, uPtr: { value: new THREE.Vector2() }, uImgAsp: { value: img.image.width / img.image.height }, uQ: { value: quality === "low" ? 4 : 6 } }
    });
  }, [img, quality]);
  const ptr = useRef(new THREE.Vector2());
  useEffect(() => () => mat.dispose(), [mat]);
  useFrame(({ clock }) => {
    mat.uniforms.uTime.value = clock.elapsedTime;
    mat.uniforms.uRes.value.set(size.width * viewport.dpr, size.height * viewport.dpr);
    ptr.current.lerp(pointer, .04); mat.uniforms.uPtr.value.copy(ptr.current);
  });
  return <mesh frustumCulled={false} material={mat}><planeGeometry args={[2, 2]} /></mesh>;
}

export default function CommonRoom({ fx }) {
  const quality = fx === "ultra" ? "ultra" : fx === "low" ? "low" : "high";
  const maxDpr = quality === "ultra" ? Math.min(window.devicePixelRatio || 1, 2.5) : quality === "high" ? Math.min(window.devicePixelRatio || 1, 1.6) : .8;
  const [dpr, setDpr] = useState(maxDpr);
  useEffect(() => setDpr(maxDpr), [maxDpr]);
  return (
    <Canvas className="scene" dpr={dpr} gl={{ antialias: false, powerPreference: "high-performance" }} orthographic camera={{ position: [0, 0, 1] }}>
      <PerformanceMonitor onDecline={() => setDpr(d => Math.max(.6, +(d * .8).toFixed(2)))} onIncline={() => setDpr(d => Math.min(maxDpr, +(d * 1.1).toFixed(2)))} flipflops={4} />
      <Suspense fallback={null}><Scene quality={quality} /></Suspense>
    </Canvas>
  );
}
