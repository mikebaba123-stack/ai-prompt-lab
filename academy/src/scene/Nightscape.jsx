import React, { useMemo, useRef, useState, useEffect } from "react";
import * as THREE from "three";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { PerformanceMonitor } from "@react-three/drei";

/* =====================================================================
   Nightscape — a moonlit castle on a cliff above a black lake, wrapped in
   drifting smoke and mist. The castle silhouette and its windows are
   painted once on canvases; everything else (sky, clouds, moon, stars,
   mountains, smoke, fog, water, lanterns) is a single fragment shader.
   ===================================================================== */

/* ---------- painted castle (silhouette + window mask) ---------- */
function paintCastle(W, H) {
  const cv = document.createElement("canvas"), wv = document.createElement("canvas");
  cv.width = wv.width = W; cv.height = wv.height = H;
  const c = cv.getContext("2d"), w = wv.getContext("2d");
  let s = 21; const r = () => ((s = (s * 16807) % 2147483647) / 2147483647);
  const X = f => f * W, Y = f => f * H;

  // cliff: jagged rock rising to a plateau
  c.fillStyle = "#05090a"; c.beginPath(); c.moveTo(X(.12), Y(1));
  const pts = [[.16, .9], [.2, .84], [.24, .78], [.27, .72], [.3, .68], [.33, .655], [.4, .645], [.5, .64], [.6, .645], [.7, .65], [.77, .66], [.8, .7], [.84, .76], [.87, .83], [.91, .9], [.96, 1]];
  for (const [x, y] of pts) c.lineTo(X(x + (r() - .5) * .006), Y(y + (r() - .5) * .012));
  c.closePath(); c.fill();
  c.strokeStyle = "rgba(120,150,150,.1)"; c.lineWidth = 2;
  for (let i = 0; i < 40; i++) { const x = .16 + r() * .7, y = .68 + r() * .3; c.beginPath(); c.moveTo(X(x), Y(y)); c.lineTo(X(x + (r() - .5) * .04), Y(y + r() * .05)); c.stroke(); }

  const towers = [];
  // [centre x, width, top y, roof: cone|spire|flat|hall, depth 0 back..1 front]
  const T = (x, wd, top, roof, depth = 1, base = .645) => towers.push({ x, wd, top, roof, depth, base });
  T(.53, .018, .2, "spire", 0); T(.47, .024, .34, "cone", 0); T(.66, .02, .3, "cone", 0); T(.39, .02, .4, "cone", 0);
  T(.58, .045, .16, "spire", .5); T(.62, .055, .4, "cone", .5); T(.7, .028, .3, "cone", .6); T(.75, .045, .46, "flat", .7);
  T(.34, .034, .44, "cone", .8, .66); T(.4, .05, .5, "flat", .8); T(.49, .14, .46, "hall", .9); T(.67, .07, .5, "flat", 1);
  T(.29, .04, .58, "cone", 1, .7); T(.8, .05, .58, "cone", 1, .72); T(.44, .03, .36, "cone", 1);
  for (const t of towers.sort((a, b) => a.depth - b.depth)) {
    const L = 3 + t.depth * 4, col = `rgb(${L},${L + 5},${L + 7})`, x0 = X(t.x - t.wd / 2), x1 = X(t.x + t.wd / 2), top = Y(t.top), base = Y(t.base + .02);
    c.fillStyle = col; c.fillRect(x0, top, x1 - x0, base - top);
    c.fillStyle = "rgba(90,125,130,.16)"; c.fillRect(x0, top, Math.max(2, (x1 - x0) * .08), base - top);            // moonlit edge
    c.fillStyle = col; c.beginPath();
    if (t.roof === "cone") { c.moveTo(x0 - (x1 - x0) * .14, top); c.lineTo((x0 + x1) / 2, top - (x1 - x0) * 1.7); c.lineTo(x1 + (x1 - x0) * .14, top); }
    else if (t.roof === "spire") { c.moveTo(x0 - (x1 - x0) * .1, top); c.lineTo((x0 + x1) / 2, top - (x1 - x0) * 3.4); c.lineTo(x1 + (x1 - x0) * .1, top); }
    else if (t.roof === "hall") { c.moveTo(x0, top); c.lineTo(x0 + (x1 - x0) * .04, top - Y(.05)); c.lineTo(x1 - (x1 - x0) * .04, top - Y(.05)); c.lineTo(x1, top); }
    else { const n = Math.max(3, Math.round((x1 - x0) / 14)); for (let i = 0; i < n; i += 2) c.rect(x0 + (i / n) * (x1 - x0), top - Y(.012), (x1 - x0) / n, Y(.012)); }
    c.fill();
    // windows (lit ones go in the emissive mask)
    const ww = Math.max(2, W * .0024), wh = Math.max(5, H * .009);
    if (t.roof === "hall") {
      for (let i = 0; i < 9; i++) { const wx = x0 + (i + .5) / 9 * (x1 - x0) - ww * .6; w.fillStyle = "rgba(255,255,255,.85)"; w.fillRect(wx, top + (base - top) * .32, ww * 1.2, wh * 3); }
    } else {
      const cols = Math.max(1, Math.floor((x1 - x0) / (ww * 3.2))), rows = Math.floor((base - top) / (wh * 2.6));
      for (let i = 0; i < cols; i++) for (let j = 0; j < rows; j++) if (r() < .08 + t.depth * .1) {
        const wx = x0 + (i + .5) / cols * (x1 - x0) - ww / 2, wy = top + wh + j * wh * 2.6;
        w.fillStyle = `rgba(255,255,255,${.55 + r() * .45})`; w.fillRect(wx, wy, ww, wh);
      }
    }
  }
  // stone bridge / viaduct to the right
  c.fillStyle = "#070c0e"; c.fillRect(X(.8), Y(.69), X(.15), Y(.025));
  for (let i = 0; i < 5; i++) { const ax = X(.81 + i * .03); c.fillRect(ax, Y(.715), X(.006), Y(.29)); }
  // lights on the path down the cliff
  for (let i = 0; i < 14; i++) { const t = i / 13; w.fillStyle = "rgba(255,255,255,.9)"; w.beginPath(); w.arc(X(.33 + t * .2), Y(.96 - t * .28 + Math.sin(t * 9) * .02), 2.5, 0, 7); w.fill(); }

  const mk = (x, srgb) => { const t = new THREE.CanvasTexture(x); if (srgb) t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; t.generateMipmaps = true; return t; };
  return { castle: mk(cv, true), win: mk(wv, false) };
}

const frag = /* glsl */`
precision highp float;
uniform float uTime; uniform vec2 uRes; uniform vec2 uPtr; uniform sampler2D uCastle; uniform sampler2D uWin; uniform float uQ;
varying vec2 vUv;
float h21(vec2 p){ p = fract(p*vec2(123.34, 456.21)); p += dot(p, p+45.32); return fract(p.x*p.y); }
float n2(vec2 p){ vec2 i=floor(p), f=fract(p); f=f*f*(3.0-2.0*f);
  return mix(mix(h21(i), h21(i+vec2(1,0)), f.x), mix(h21(i+vec2(0,1)), h21(i+vec2(1,1)), f.x), f.y); }
float fbm(vec2 p){ float v=0.0, a=.5; mat2 m=mat2(1.6,1.2,-1.2,1.6); for(int i=0;i<6;i++){ if(float(i)>=uQ) break; v+=a*n2(p); p=m*p; a*=.5; } return v; }

const float HZ = .24;                       // horizon (lake line)
const vec4 RECT = vec4(-.58, .16, 1.44, .72); // castle texture: x, y, width, height (scene units)

vec4 castleAt(vec2 p){
  vec2 t = (p - RECT.xy) / RECT.zw;
  if (t.x < 0.0 || t.x > 1.0 || t.y < 0.0 || t.y > 1.0) return vec4(0.0);
  return texture2D(uCastle, vec2(t.x, t.y));
}
float winAt(vec2 p){
  vec2 t = (p - RECT.xy) / RECT.zw;
  if (t.x < 0.0 || t.x > 1.0 || t.y < 0.0 || t.y > 1.0) return 0.0;
  return texture2D(uWin, vec2(t.x, t.y)).r;
}

void main(){
  float asp = uRes.x / uRes.y;
  vec2 uv = vUv;
  vec2 p = vec2((uv.x - .5) * asp, uv.y);              // height-normalised scene coords
  float t = uTime;
  // parallax per layer
  vec2 pSky = p + uPtr * .006, pMnt = p + uPtr * .012, pCas = p + uPtr * .022, pFog = p + uPtr * .045;

  // --- sky ---
  vec3 col = mix(vec3(.018,.05,.052), vec3(.004,.012,.014), smoothstep(.2, 1.0, uv.y));
  vec2 moon = vec2(-.22, .83) + uPtr * .006;
  float md = length(pSky - moon);
  col += vec3(.35,.55,.5) * .55 * exp(-md * 3.2) + vec3(.6,.8,.75) * .25 * exp(-md * 12.0);
  // stars
  vec2 sg = floor(pSky * 220.0); float st = h21(sg);
  if (st > .985 && uv.y > .45) col += vec3(.75,.9,.85) * smoothstep(.985, 1.0, st) * (.5 + .5 * sin(t * 2.0 + st * 80.0)) * smoothstep(.45, .7, uv.y);
  // clouds lit by the moon
  float cl = fbm(vec2(pSky.x * 1.4 + t * .008, pSky.y * 3.4 - t * .002)) ;
  float cl2 = fbm(vec2(pSky.x * 2.6 - t * .012, pSky.y * 5.0) + cl);
  float cloud = smoothstep(.42, .85, cl * .65 + cl2 * .55) * smoothstep(.32, .7, uv.y);
  vec3 cloudCol = mix(vec3(.03,.07,.075), vec3(.32,.46,.44), exp(-md * 2.4));
  col = mix(col, cloudCol, cloud * .85);
  // moon disc (over thin cloud, under thick)
  float disc = smoothstep(.047, .043, md);
  vec3 moonCol = vec3(.86,.95,.9) - .1 * fbm((pSky - moon) * 40.0);
  col = mix(col, moonCol, disc * (1.0 - cloud * .7));

  // --- far mountains ---
  float m1 = .33 + .07 * fbm(vec2(pMnt.x * 1.6 + 3.0, 1.0)) + .03 * sin(pMnt.x * 2.0);
  float m2 = .28 + .06 * fbm(vec2(pMnt.x * 2.4 + 9.0, 2.0));
  col = mix(col, vec3(.02,.045,.05), smoothstep(m1 + .002, m1 - .002, pMnt.y) * .9);
  col = mix(col, vec3(.012,.028,.03), smoothstep(m2 + .002, m2 - .002, pMnt.y));
  // haze above the lake
  col += vec3(.06,.12,.11) * exp(-abs(p.y - HZ - .03) * 18.0) * .6;

  // --- castle ---
  vec4 cs = castleAt(pCas);
  // moonlight grazing the castle from above, fading into darkness at the base
  vec3 lit = cs.rgb + vec3(.03,.06,.065) * smoothstep(.3, .85, pCas.y) + vec3(.02,.04,.04) * fbm(pCas * 60.0);
  col = mix(col, lit, cs.a);
  float wn = winAt(pCas);
  float flick = .75 + .25 * n2(vec2(floor(pCas.x * 400.0), floor(pCas.y * 300.0)) + t * 1.7);
  vec3 warm = vec3(1.0, .72, .35);
  col += warm * wn * 1.6 * flick;
  // soft window glow halo
  float halo = 0.0;
  for (int i = 0; i < 6; i++) { float a = float(i) * 1.047; halo += winAt(pCas + vec2(cos(a), sin(a)) * .006); }
  col += warm * halo * .06 * flick;

  // --- lake ---
  if (p.y < HZ) {
    float d = HZ - p.y;
    float rip = sin(p.y * 260.0 - t * 1.6 + n2(vec2(p.x * 8.0, p.y * 40.0)) * 3.0) * .0025 * (1.0 + d * 6.0);
    vec2 rp = vec2(pCas.x + rip, HZ + d * 1.05 + uPtr.y * .022);
    vec4 rc = castleAt(rp);
    vec3 water = mix(vec3(.015,.04,.045), vec3(.004,.012,.014), smoothstep(0.0, HZ, d));
    vec3 refl = mix(water, rc.rgb * .6, rc.a * .8) + warm * winAt(rp) * .7 * flick;
    // moon path on the water
    float mp = exp(-abs(p.x - moon.x) * 14.0) * (.5 + .5 * n2(vec2(p.x * 30.0, p.y * 90.0 - t)));
    refl += vec3(.4,.6,.55) * mp * .25 * smoothstep(HZ, 0.0, d * 3.0 + .02);
    col = mix(col, refl, smoothstep(0.0, .004, d));
    // floating lanterns + their reflections
    for (int i = 0; i < 9; i++) {
      float fi = float(i), hx = h21(vec2(fi, 3.7));
      vec2 lp = vec2((hx - .5) * 1.9 + sin(t * .05 + fi) * .08, .04 + h21(vec2(fi, 9.1)) * .14);
      float lf = .8 + .2 * sin(t * 5.0 + fi * 3.0);
      vec2 dd = p - lp;
      col += warm * lf * (exp(-length(dd * vec2(1.0, 1.4)) * 140.0) * 1.4 + exp(-length(dd) * 40.0) * .12);
      col += warm * lf * .25 * exp(-abs(dd.x) * 220.0) * smoothstep(0.0, -.06, dd.y) * smoothstep(-.09, -.01, dd.y) * (.5 + .5 * sin(dd.y * 400.0 + t * 3.0));
    }
  }

  // --- fog banks rolling over the water and around the cliff ---
  float f1 = fbm(vec2(pFog.x * 1.8 + t * .035, pFog.y * 6.0 - t * .01));
  float f2 = fbm(vec2(pFog.x * 3.2 - t * .05, pFog.y * 9.0) + f1 * 1.5);
  float fogMask = smoothstep(.5, .16, p.y) * (.55 + .45 * smoothstep(.0, .3, p.y));
  col = mix(col, vec3(.42,.55,.54), clamp((f1 * .7 + f2 * .5 - .45) * 1.6, 0.0, 1.0) * fogMask * .75);
  // thin mist drifting through the middle of the castle
  float f3 = fbm(vec2(pFog.x * 2.4 + t * .025, pFog.y * 12.0 + 4.0));
  col = mix(col, vec3(.3,.42,.42), smoothstep(.45, .85, f3) * exp(-abs(p.y - .5) * 9.0) * .32);
  // --- emerald magical smoke drifting across everything ---
  vec2 q = vec2(fbm(p * 1.4 + vec2(0.0, -t * .03)), fbm(p * 1.4 + vec2(5.2, 1.3) - t * .02));
  float sm = fbm(p * 2.2 + q * 2.4 + vec2(t * .015, -t * .025));
  col += vec3(.06,.32,.2) * smoothstep(.5, .95, sm) * .55;
  col += vec3(.35,.45,.44) * smoothstep(.62, 1.0, sm) * .18;

  // grade + vignette + grain
  col = pow(col, vec3(.92));
  float vig = smoothstep(1.25, .35, length((uv - .5) * vec2(asp * .8, 1.0)));
  col *= .55 + .45 * vig;
  col += (h21(uv * uRes + fract(t)) - .5) * .012;
  gl_FragColor = vec4(col, 1.0);
}`;
const vert = /* glsl */`varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }`;

function Scene({ quality }) {
  const { size, viewport, pointer } = useThree();
  const tex = useMemo(() => paintCastle(quality === "ultra" ? 4096 : 2048, quality === "ultra" ? 2048 : 1024), [quality]);
  const mat = useMemo(() => new THREE.ShaderMaterial({
    vertexShader: vert, fragmentShader: frag, depthTest: false, depthWrite: false,
    uniforms: { uTime: { value: 0 }, uRes: { value: new THREE.Vector2(1, 1) }, uPtr: { value: new THREE.Vector2() }, uCastle: { value: tex.castle }, uWin: { value: tex.win }, uQ: { value: quality === "low" ? 4 : 6 } }
  }), [tex, quality]);
  const ptr = useRef(new THREE.Vector2());
  useEffect(() => () => { tex.castle.dispose(); tex.win.dispose(); mat.dispose(); }, [tex, mat]);
  useFrame(({ clock }) => {
    mat.uniforms.uTime.value = clock.elapsedTime;
    mat.uniforms.uRes.value.set(size.width * viewport.dpr, size.height * viewport.dpr);
    ptr.current.lerp(pointer, .04); mat.uniforms.uPtr.value.copy(ptr.current);
  });
  return <mesh frustumCulled={false} material={mat}><planeGeometry args={[2, 2]} /></mesh>;
}

export default function Nightscape({ fx }) {
  const quality = fx === "ultra" ? "ultra" : fx === "low" ? "low" : "high";
  const maxDpr = quality === "ultra" ? Math.min(window.devicePixelRatio || 1, 2.5) : quality === "high" ? Math.min(window.devicePixelRatio || 1, 1.6) : .75;
  const [dpr, setDpr] = useState(maxDpr);
  useEffect(() => setDpr(maxDpr), [maxDpr]);
  return (
    <Canvas className="scene" dpr={dpr} gl={{ antialias: false, powerPreference: "high-performance" }} orthographic camera={{ position: [0, 0, 1] }}>
      <PerformanceMonitor onDecline={() => setDpr(d => Math.max(.6, +(d * .8).toFixed(2)))} onIncline={() => setDpr(d => Math.min(maxDpr, +(d * 1.1).toFixed(2)))} flipflops={4} />
      <Scene quality={quality} />
    </Canvas>
  );
}
