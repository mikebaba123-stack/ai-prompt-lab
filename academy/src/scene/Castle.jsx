import React, { useMemo, useRef, useEffect } from "react";
import * as THREE from "three";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { MeshReflectorMaterial, Sparkles, Environment, Lightformer } from "@react-three/drei";
import { EffectComposer, Bloom, Vignette } from "@react-three/postprocessing";

/* ---------------- procedural textures ---------------- */
function canvasTex(w, h, draw, repeat) {
  const c = document.createElement("canvas"); c.width = w; c.height = h; draw(c.getContext("2d"), w, h);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
  if (repeat) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(...repeat); }
  return t;
}
const rnd = (a, b) => a + Math.random() * (b - a);
function marble(x, w, h) {
  x.fillStyle = "#0a0e0c"; x.fillRect(0, 0, w, h);
  for (let i = 0; i < 60; i++) { const g = x.createRadialGradient(rnd(0, w), rnd(0, h), 0, rnd(0, w), rnd(0, h), rnd(40, 180)); g.addColorStop(0, "rgba(30,44,38,.35)"); g.addColorStop(1, "rgba(0,0,0,0)"); x.fillStyle = g; x.fillRect(0, 0, w, h); }
  for (let i = 0; i < 46; i++) {
    const gold = i % 11 === 0;
    x.strokeStyle = gold ? `rgba(184,155,98,${rnd(.15, .35)})` : `rgba(192,198,200,${rnd(.04, .2)})`; x.lineWidth = rnd(.6, gold ? 1.6 : 2.4);
    x.beginPath(); let px = rnd(0, w), py = rnd(0, h); x.moveTo(px, py);
    for (let k = 0; k < 5; k++) { const nx = px + rnd(-220, 220), ny = py + rnd(-160, 160); x.quadraticCurveTo(px + rnd(-90, 90), py + rnd(-90, 90), nx, ny); px = nx; py = ny; }
    x.stroke();
  }
}
function stainedGlass(x, w, h) {
  x.fillStyle = "#020604"; x.fillRect(0, 0, w, h);
  const cols = 7, rows = 11, cw = w / cols, ch = h / rows, P = [];
  for (let r = 0; r <= rows; r++) { P[r] = []; for (let c = 0; c <= cols; c++) P[r][c] = [c * cw + (c && c < cols ? rnd(-cw * .3, cw * .3) : 0), r * ch + (r && r < rows ? rnd(-ch * .3, ch * .3) : 0)]; }
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
    const q = [P[r][c], P[r][c + 1], P[r + 1][c + 1], P[r + 1][c]];
    const l = rnd(14, 42), hue = rnd(146, 168);
    const g = x.createLinearGradient(q[0][0], q[0][1], q[2][0], q[2][1]);
    g.addColorStop(0, `hsl(${hue},75%,${l + 10}%)`); g.addColorStop(1, `hsl(${hue + 6},80%,${l - 6}%)`);
    x.fillStyle = Math.random() < .06 ? `hsl(42,45%,${rnd(40, 55)}%)` : g;
    x.beginPath(); q.forEach(([a, b], i) => (i ? x.lineTo(a, b) : x.moveTo(a, b))); x.closePath(); x.fill();
    x.strokeStyle = "#020604"; x.lineWidth = 5; x.stroke();
  }
  // serpent emblem in the centre light
  x.lineCap = "round"; x.strokeStyle = "rgba(225,235,232,.92)"; x.lineWidth = w * .045;
  x.beginPath(); x.moveTo(w * .66, h * .36); x.bezierCurveTo(w * .3, h * .26, w * .22, h * .46, w * .5, h * .52); x.bezierCurveTo(w * .8, h * .58, w * .72, h * .78, w * .36, h * .72); x.stroke();
  x.fillStyle = "rgba(225,235,232,.95)"; x.beginPath(); x.ellipse(w * .69, h * .355, w * .05, w * .03, -.3, 0, 7); x.fill();
  // rose window ring
  x.strokeStyle = "rgba(184,155,98,.8)"; x.lineWidth = 6; x.beginPath(); x.arc(w / 2, h * .17, w * .28, 0, 7); x.stroke();
  for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2; x.beginPath(); x.moveTo(w / 2, h * .17); x.lineTo(w / 2 + Math.cos(a) * w * .28, h * .17 + Math.sin(a) * w * .28); x.stroke(); }
}
function soft(x, w, h) { const g = x.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2); g.addColorStop(0, "rgba(255,255,255,.9)"); g.addColorStop(1, "rgba(255,255,255,0)"); x.fillStyle = g; x.fillRect(0, 0, w, h); }
function shaft(x, w, h) {
  const g = x.createLinearGradient(0, 0, 0, h); g.addColorStop(0, "rgba(255,255,255,.85)"); g.addColorStop(1, "rgba(255,255,255,0)"); x.fillStyle = g; x.fillRect(0, 0, w, h);
  x.globalCompositeOperation = "destination-in"; const k = x.createLinearGradient(0, 0, w, 0); k.addColorStop(0, "rgba(0,0,0,0)"); k.addColorStop(.5, "#000"); k.addColorStop(1, "rgba(0,0,0,0)"); x.fillStyle = k; x.fillRect(0, 0, w, h);
}
function scales(x, w, h) {
  x.fillStyle = "#9aa3a5"; x.fillRect(0, 0, w, h);
  for (let r = -1; r < 9; r++) for (let c = -1; c < 9; c++) {
    const cx = c * 32 + (r % 2 ? 16 : 0), cy = r * 32;
    const g = x.createRadialGradient(cx, cy + 4, 2, cx, cy + 8, 22); g.addColorStop(0, "#f4f8f8"); g.addColorStop(.6, "#b8c0c2"); g.addColorStop(1, "#3c4446");
    x.fillStyle = g; x.beginPath(); x.arc(cx, cy, 18, 0, Math.PI); x.fill();
  }
}

/* ---------------- geometry helpers ---------------- */
function archShape(w, h) {
  const s = new THREE.Shape(), hs = h - w * .85;
  s.moveTo(-w / 2, 0); s.lineTo(-w / 2, hs); s.quadraticCurveTo(-w / 2, hs + w * .55, 0, h); s.quadraticCurveTo(w / 2, hs + w * .55, w / 2, hs); s.lineTo(w / 2, 0); s.closePath();
  return s;
}
function archGeometry(w, h) {
  const g = new THREE.ShapeGeometry(archShape(w, h), 24), p = g.attributes.position, uv = g.attributes.uv;
  for (let i = 0; i < p.count; i++) uv.setXY(i, p.getX(i) / w + .5, p.getY(i) / h);
  return g;
}
function tube(curve, seg, rad, radius) {
  const fr = curve.computeFrenetFrames(seg, false), pos = [], nor = [], uv = [], idx = [];
  for (let i = 0; i <= seg; i++) {
    const u = i / seg, P = curve.getPointAt(u), N = fr.normals[i], B = fr.binormals[i], r = radius(u);
    for (let j = 0; j <= rad; j++) {
      const v = j / rad * Math.PI * 2, s = Math.sin(v), c = -Math.cos(v);
      const n = [c * N.x + s * B.x, c * N.y + s * B.y, c * N.z + s * B.z];
      pos.push(P.x + r * n[0], P.y + r * n[1], P.z + r * n[2]); nor.push(...n); uv.push(u * 36, j / rad * 2);
    }
  }
  for (let i = 0; i < seg; i++) for (let j = 0; j < rad; j++) { const a = i * (rad + 1) + j, b = a + rad + 1; idx.push(a, b, a + 1, b, b + 1, a + 1); }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute("normal", new THREE.Float32BufferAttribute(nor, 3)); g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx);
  return g;
}

/* ---------------- scene parts ---------------- */
function Hall({ high }) {
  const marbleFloor = useMemo(() => canvasTex(1024, 1024, marble, [6, 6]), []);
  const marbleStone = useMemo(() => canvasTex(512, 512, marble, [1, 3]), []);
  const glass = useMemo(() => canvasTex(512, 768, stainedGlass), []);
  const glassSide = useMemo(() => canvasTex(512, 768, stainedGlass), []);
  const bigArch = useMemo(() => archGeometry(5.2, 9.5), []), bigFrame = useMemo(() => archGeometry(6.2, 10.6), []);
  const sideArch = useMemo(() => archGeometry(1.7, 4.2), []), sideFrame = useMemo(() => archGeometry(2.2, 4.8), []);
  const zs = [-12, -8.5, -5, -1.5, 2];
  const stone = <meshStandardMaterial map={marbleStone} color="#5a6660" roughness={.28} metalness={.35} />;
  return (
    <group>
      <mesh rotation-x={-Math.PI / 2} position={[0, 0, -4]}>
        <planeGeometry args={[40, 40]} />
        {high
          ? <MeshReflectorMaterial map={marbleFloor} blur={[300, 80]} resolution={512} mixBlur={1} mixStrength={18} roughness={.9} depthScale={1} minDepthThreshold={.4} maxDepthThreshold={1.4} color="#7c8a84" metalness={.5} mirror={0} />
          : <meshStandardMaterial map={marbleFloor} color="#7c8a84" roughness={.35} metalness={.4} />}
      </mesh>
      {/* back wall + great window */}
      <mesh position={[0, 6, -15.2]}><planeGeometry args={[40, 14]} /><meshStandardMaterial map={marbleStone} color="#2b3430" roughness={.6} /></mesh>
      <mesh geometry={bigFrame} position={[0, 0, -15.1]}><meshStandardMaterial color="#1b2420" metalness={.6} roughness={.3} /></mesh>
      <mesh geometry={bigArch} position={[0, .5, -15]}>
        <meshStandardMaterial map={glass} emissiveMap={glass} emissive="#ffffff" emissiveIntensity={1.35} toneMapped={false} />
      </mesh>
      {/* side walls with lancet windows */}
      {[-1, 1].map(sd => (
        <group key={sd}>
          <mesh position={[sd * 7.2, 6, -5]} rotation-y={-sd * Math.PI / 2}><planeGeometry args={[24, 12]} /><meshStandardMaterial map={marbleStone} color="#222b27" roughness={.6} /></mesh>
          {[-10.25, -6.75, -3.25, .25].map(z => (
            <group key={z} position={[sd * 7.15, 1.4, z]} rotation-y={-sd * Math.PI / 2}>
              <mesh geometry={sideFrame} position={[0, -.3, -.02]}><meshStandardMaterial color="#1b2420" metalness={.6} roughness={.3} /></mesh>
              <mesh geometry={sideArch}><meshStandardMaterial map={glassSide} emissiveMap={glassSide} emissive="#ffffff" emissiveIntensity={.9} toneMapped={false} /></mesh>
            </group>
          ))}
        </group>
      ))}
      {/* pillars + pointed arches overhead */}
      {[-1, 1].map(sd => zs.map(z => (
        <group key={sd + ":" + z} position={[sd * 4.6, 0, z]}>
          <mesh position={[0, .25, 0]}><boxGeometry args={[1.1, .5, 1.1]} />{stone}</mesh>
          <mesh position={[0, 4.75, 0]}><cylinderGeometry args={[.34, .4, 8.5, 20]} />{stone}</mesh>
          <mesh position={[0, 9.1, 0]}><boxGeometry args={[1, .4, 1]} />{stone}</mesh>
          <mesh position={[0, 9.4, 0]}><torusGeometry args={[.42, .05, 8, 24]} /><meshStandardMaterial color="#b89b62" metalness={1} roughness={.3} /></mesh>
        </group>
      )))}
      {zs.slice(0, -1).map((z, i) => [-1, 1].map(sd => (
        <mesh key={i + ":" + sd} position={[sd * 4.6, 9.3, z + 1.75]} rotation-y={Math.PI / 2}>
          <torusGeometry args={[1.75, .14, 8, 32, Math.PI]} />{stone}
        </mesh>
      )))}
    </group>
  );
}

function Shafts() {
  const tex = useMemo(() => canvasTex(128, 256, shaft), []), ref = useRef();
  const list = useMemo(() => [...Array(5)].map((_, i) => ({ x: -2.2 + i * 1.1, w: rnd(.8, 1.6), r: rnd(-.12, .12), p: rnd(0, 6) })), []);
  useFrame(({ clock }) => ref.current.children.forEach((m, i) => { m.material.opacity = .05 + .05 * (1 + Math.sin(clock.elapsedTime * .35 + list[i].p)) / 2; }));
  return (
    <group ref={ref} position={[0, 8.5, -14]} rotation-x={.55}>
      {list.map((s, i) => (
        <mesh key={i} position={[s.x, -6, 0]} rotation-z={s.r}>
          <planeGeometry args={[s.w, 14]} />
          <meshBasicMaterial map={tex} color="#5dffb0" transparent opacity={.08} blending={THREE.AdditiveBlending} depthWrite={false} side={THREE.DoubleSide} />
        </mesh>
      ))}
    </group>
  );
}

function Mist() {
  const tex = useMemo(() => canvasTex(256, 256, soft), []), ref = useRef();
  const list = useMemo(() => [...Array(9)].map(() => ({ x: rnd(-6, 6), z: rnd(-13, 3), s: rnd(5, 10), v: rnd(.02, .06), r: rnd(0, 6) })), []);
  useFrame((_, dt) => ref.current.children.forEach((m, i) => { m.rotation.z += list[i].v * dt; m.position.x += Math.sin(m.rotation.z) * dt * .05; }));
  return (
    <group ref={ref}>
      {list.map((m, i) => (
        <mesh key={i} position={[m.x, .35 + (i % 3) * .2, m.z]} rotation={[-Math.PI / 2, 0, m.r]}>
          <planeGeometry args={[m.s, m.s]} />
          <meshBasicMaterial map={tex} color="#9fd8bf" transparent opacity={.13} depthWrite={false} />
        </mesh>
      ))}
    </group>
  );
}

function Candles({ count = 30 }) {
  const body = useRef(), flame = useRef(), lights = useRef();
  const data = useMemo(() => [...Array(count)].map(() => ({ x: rnd(-6, 6), y: rnd(3, 7.5), z: rnd(-13, 3), p: rnd(0, 6), h: rnd(.35, .6) })), [count]);
  const m = useMemo(() => new THREE.Object3D(), []);
  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    data.forEach((c, i) => {
      const y = c.y + Math.sin(t * .6 + c.p) * .18;
      m.position.set(c.x, y, c.z); m.rotation.set(0, 0, Math.sin(t * .4 + c.p) * .05); m.scale.set(1, c.h / .5, 1); m.updateMatrix(); body.current.setMatrixAt(i, m.matrix);
      const f = 1 + Math.sin(t * 13 + c.p * 7) * .12 + Math.sin(t * 7.3 + c.p) * .08;
      m.position.set(c.x, y + c.h / 2 + .1, c.z); m.scale.set(f, f * 1.25, f); m.updateMatrix(); flame.current.setMatrixAt(i, m.matrix);
    });
    body.current.instanceMatrix.needsUpdate = true; flame.current.instanceMatrix.needsUpdate = true;
    lights.current.children.forEach((l, i) => { const c = data[i * 7 % count]; l.position.set(c.x, c.y + Math.sin(t * .6 + c.p) * .18 + .5, c.z); l.intensity = 3 + Math.sin(t * 11 + i) * .4; });
  });
  return (
    <group>
      <instancedMesh ref={body} args={[null, null, count]}>
        <cylinderGeometry args={[.055, .06, .5, 10]} />
        <meshStandardMaterial color="#e9dfc6" emissive="#4a3a20" emissiveIntensity={.4} roughness={.6} />
      </instancedMesh>
      <instancedMesh ref={flame} args={[null, null, count]}>
        <sphereGeometry args={[.045, 10, 8]} />
        <meshBasicMaterial color={[4, 2.3, .8]} toneMapped={false} />
      </instancedMesh>
      <group ref={lights}>{[0, 1, 2, 3].map(i => <pointLight key={i} color="#ffb35a" distance={6} decay={1.6} />)}</group>
    </group>
  );
}

function Serpent() {
  const ref = useRef();
  const skin = useMemo(() => canvasTex(256, 256, scales, [1, 1]), []);
  const { geo, head, dir } = useMemo(() => {
    const pts = [];
    for (let i = 0; i <= 90; i++) { const t = i / 90, a = t * Math.PI * 5 + .4, r = 1.15 - .35 * t; pts.push(new THREE.Vector3(Math.cos(a) * r, .2 + 3.6 * t + Math.sin(t * 14) * .04, Math.sin(a) * r)); }
    pts.push(new THREE.Vector3(.35, 4.2, .8), new THREE.Vector3(.2, 4.5, 1.6));
    const c = new THREE.CatmullRomCurve3(pts), sm = (a, b, v) => { const k = Math.min(1, Math.max(0, (v - a) / (b - a))); return k * k * (3 - 2 * k); };
    return { geo: tube(c, 520, 18, u => .03 + .13 * sm(0, .45, u)), head: c.getPointAt(1), dir: c.getTangentAt(1) };
  }, []);
  const headRef = useRef(), tongue = useRef();
  useEffect(() => { headRef.current.position.copy(head).addScaledVector(dir, .1); headRef.current.lookAt(head.clone().addScaledVector(dir, 2)); }, [head, dir]);
  useFrame(({ clock }) => { const t = clock.elapsedTime; ref.current.rotation.y = Math.sin(t * .15) * .5; ref.current.position.y = Math.sin(t * .5) * .05; tongue.current.scale.y = .5 + .5 * Math.abs(Math.sin(t * 6)); });
  const mat = <meshStandardMaterial color="#c0c6c8" map={skin} bumpMap={skin} bumpScale={.6} metalness={1} roughness={.24} />;
  return (
    <group position={[0, 0, -7]}>
      {/* obsidian plinth */}
      <mesh position={[0, .6, 0]}><cylinderGeometry args={[1.25, 1.45, 1.2, 8]} /><meshStandardMaterial color="#0b100e" metalness={.7} roughness={.2} /></mesh>
      <mesh position={[0, 1.22, 0]}><torusGeometry args={[1.26, .04, 8, 48]} /><meshStandardMaterial color="#b89b62" metalness={1} roughness={.25} /></mesh>
      <mesh position={[0, 2.6, 0]}><cylinderGeometry args={[.32, .45, 2.8, 8]} /><meshStandardMaterial color="#0b100e" metalness={.7} roughness={.2} /></mesh>
      <mesh position={[0, 4.15, 0]}><octahedronGeometry args={[.42, 0]} /><meshStandardMaterial color="#0b6b45" emissive="#1fe08a" emissiveIntensity={1.6} toneMapped={false} metalness={.3} roughness={.1} /></mesh>
      <pointLight position={[0, 4.2, .4]} color="#3dffa4" intensity={6} distance={7} decay={1.5} />
      <group ref={ref} position={[0, 1.1, 0]}>
        <mesh geometry={geo}>{mat}</mesh>
        <group ref={headRef}>
          <mesh scale={[1.15, .7, 1.7]} position={[0, 0, .14]}><sphereGeometry args={[.17, 24, 16]} />{mat}</mesh>
          {[-1, 1].map(s => <mesh key={s} position={[s * .12, .07, .26]}><sphereGeometry args={[.03, 10, 8]} /><meshBasicMaterial color={[.4, 3, 1.6]} toneMapped={false} /></mesh>)}
          <mesh ref={tongue} position={[0, -.03, .5]} rotation-x={Math.PI / 2}><cylinderGeometry args={[.008, .008, .22, 5]} /><meshBasicMaterial color="#ff4d6d" /></mesh>
        </group>
      </group>
    </group>
  );
}

const PRESETS = {
  dashboard: [[1.2, 2.4, 6.5], [0, 3, -8]], schedule: [[-2.4, 2.8, 4.5], [1, 3.4, -9]], calendar: [[2.6, 3.2, 5], [-1, 3.6, -9]],
  tasks: [[-1.5, 1.9, 3.5], [0, 2.8, -8]], board: [[2, 2.2, 3], [-.5, 3.2, -9]], connect: [[0, 4.2, 7.5], [0, 3.2, -10]]
};
function Rig({ route }) {
  const { camera, pointer } = useThree(), look = useRef(new THREE.Vector3(0, 3, -8)), tmp = useMemo(() => new THREE.Vector3(), []);
  useFrame(({ clock }, dt) => {
    const [p, l] = PRESETS[route] || PRESETS.dashboard, t = clock.elapsedTime, k = 1 - Math.pow(.02, dt);
    tmp.set(p[0] + Math.sin(t * .07) * .6 + pointer.x * .5, p[1] + Math.sin(t * .11) * .15 + pointer.y * .25, p[2]);
    camera.position.lerp(tmp, k * .5);
    look.current.lerp(tmp.set(l[0], l[1], l[2]), k * .5);
    camera.lookAt(look.current);
  });
  return null;
}

export default function Castle({ route, fx }) {
  const high = fx === "high";
  return (
    <Canvas className="scene" dpr={high ? [1, 1.75] : 1} gl={{ antialias: !high, powerPreference: "high-performance" }} camera={{ position: [1.2, 2.4, 7], fov: 52, near: .1, far: 80 }}>
      <color attach="background" args={["#050907"]} />
      <fogExp2 attach="fog" args={["#06120d", .055]} />
      <ambientLight intensity={.18} />
      <hemisphereLight args={["#5dffb0", "#050907", .25]} />
      <directionalLight position={[0, 8, -14]} intensity={1.2} color="#7dffc0" />
      <Environment resolution={128} frames={1}>
        <Lightformer intensity={3} color="#2bff9c" position={[0, 5, -10]} scale={[10, 8, 1]} />
        <Lightformer intensity={2} color="#ffd6a0" position={[5, 6, 4]} scale={[4, 4, 1]} />
        <Lightformer intensity={1.5} color="#c0c6c8" position={[-6, 3, 2]} rotation-y={Math.PI / 2} scale={[6, 3, 1]} />
      </Environment>
      <Hall high={high} />
      <Shafts />
      <Mist />
      <Serpent />
      <Candles count={high ? 34 : 18} />
      <Sparkles count={high ? 140 : 60} scale={[14, 9, 18]} position={[0, 4, -5]} size={2.2} speed={.25} opacity={.55} color="#9dffd0" />
      <Rig route={route} />
      {high && (
        <EffectComposer multisampling={0}>
          <Bloom mipmapBlur intensity={.9} luminanceThreshold={.85} luminanceSmoothing={.2} />
          <Vignette darkness={.75} offset={.25} />
        </EffectComposer>
      )}
    </Canvas>
  );
}
