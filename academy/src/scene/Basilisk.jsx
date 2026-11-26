import React, { useMemo, useRef, useEffect } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";

/* =====================================================================
   The Basilisk — a ~17 m serpent that slithers a looping path around the
   hall's central plinth. The body is a tube deformed entirely on the GPU:
   every ring follows exactly the path the head has already travelled,
   which gives true lateral undulation. Head, spikes and fangs are placed
   on the CPU with the same maths, so everything stays in lockstep.
   ===================================================================== */
export const SNAKE = { L: 17, R: .5, SPEED: 1.15, K: 3.35 };
const sm = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };

/* ---------- path + body maths (mirrored in GLSL below) ---------- */
const base = th => [2.8 * Math.sin(th) + .35 * Math.sin(2 * th), -7 + 3.3 * Math.cos(th)];
function pathXZ(th) {
  const a = base(th), b1 = base(th + .01), b0 = base(th - .01), dx = b1[0] - b0[0], dz = b1[1] - b0[1], l = Math.hypot(dx, dz) || 1, w = .42 * Math.sin(13 * th);
  return [a[0] - (dz / l) * w, a[1] + (dx / l) * w];
}
const radius = u => SNAKE.R * (.1 + .9 * sm(0, .38, u)) * (1 - .16 * sm(.88, .97, u));
function center(u, t, rear, out = new THREE.Vector3()) {
  const th = (t * SNAKE.SPEED - (1 - u) * SNAKE.L) / SNAKE.K, [x, z] = pathXZ(th);
  const lift = rear * Math.pow(sm(.76, 1, u), 2) * 2.7 + Math.sin(t * 1.3) * .08 * sm(.85, 1, u);
  return out.set(x, radius(u) * .9 + lift, z);
}
const GLSL = /* glsl */`
uniform float uTime; uniform float uRear;
const float L = ${SNAKE.L.toFixed(2)}; const float R = ${SNAKE.R.toFixed(2)}; const float SPEED = ${SNAKE.SPEED.toFixed(3)}; const float K = ${SNAKE.K.toFixed(3)};
vec2 sBase(float th){ return vec2(2.8*sin(th)+.35*sin(2.0*th), -7.0+3.3*cos(th)); }
vec2 sPath(float th){ vec2 a=sBase(th); vec2 d=sBase(th+.01)-sBase(th-.01); vec2 n=normalize(vec2(-d.y,d.x)); return a+n*.42*sin(13.0*th); }
float sRad(float u){ return R*(.1+.9*smoothstep(0.0,.38,u))*(1.0-.16*smoothstep(.88,.97,u)); }
vec3 sCenter(float u){
  float th=(uTime*SPEED-(1.0-u)*L)/K; vec2 p=sPath(th);
  float lift=uRear*pow(smoothstep(.76,1.0,u),2.0)*2.7+sin(uTime*1.3)*.08*smoothstep(.85,1.0,u);
  return vec3(p.x, sRad(u)*.9+lift, p.y);
}
void sFrame(float u, float v, out vec3 pos, out vec3 nor){
  vec3 C=sCenter(u); vec3 T=normalize(sCenter(min(u+.004,1.0))-sCenter(max(u-.004,0.0)));
  vec3 B=normalize(cross(T,vec3(0.0,1.0,0.0))); vec3 N=cross(B,T);
  float r=sRad(u); float a=v*6.2831853; float c=cos(a), s=sin(a);
  float flat_=s<0.0?.78:.95;                      // flatter belly, rounder back
  pos=C+B*c*r*1.12+N*s*r*flat_;
  nor=normalize(B*c/1.12+N*s/flat_);
}`;
function patch(shader, uniforms) {
  Object.assign(shader.uniforms, uniforms);
  shader.vertexShader = shader.vertexShader
    .replace("#include <common>", "#include <common>\n" + GLSL)
    .replace("#include <beginnormal_vertex>", "vec3 sPos; vec3 sNor; sFrame(position.x, position.y, sPos, sNor);\nvec3 objectNormal = sNor;\n#ifdef USE_TANGENT\nvec3 objectTangent = vec3(1.0,0.0,0.0);\n#endif")
    .replace("#include <begin_vertex>", "vec3 transformed = sPos;");
}
function patchDepth(shader, uniforms) {
  Object.assign(shader.uniforms, uniforms);
  shader.vertexShader = shader.vertexShader
    .replace("#include <common>", "#include <common>\n" + GLSL)
    .replace("#include <begin_vertex>", "vec3 sPos; vec3 sNor; sFrame(position.x, position.y, sPos, sNor); vec3 transformed = sPos;");
}

/* ---------- 4K scale textures (colour + normal from a height field) ---------- */
function scaleMaps(W, H) {
  const col = document.createElement("canvas"), hei = document.createElement("canvas");
  col.width = hei.width = W; col.height = hei.height = H;
  const c = col.getContext("2d"), h = hei.getContext("2d");
  c.fillStyle = "#0b1410"; c.fillRect(0, 0, W, H); h.fillStyle = "#000"; h.fillRect(0, 0, W, H);
  const rows = 46, sh = H / rows, sw = sh * 1.05, belly0 = H * .62, belly1 = H * .88;
  let seed = 7; const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  for (let r = -1; r <= rows + 1; r++) {
    const cy = r * sh, v = cy / H;
    if (cy > belly0 - sh && cy < belly1 + sh) continue;
    const dorsal = Math.exp(-Math.pow((v - .25) / .09, 2));            // v=.25 is the spine
    for (let k = -1; k <= W / sw + 1; k++) {
      const cx = k * sw + (r % 2 ? sw / 2 : 0);
      // menacing rhombic blotches along the back + flank bands
      const blotch = Math.max(0, Math.sin(cx / W * Math.PI * 2 * 9 + Math.sin(v * 7) * 1.4)) * (.35 + dorsal * .65);
      const L = 9 + 13 * (1 - blotch) * (1 - dorsal * .55) + rnd() * 6;
      const hue = 128 + rnd() * 22 + blotch * 12;
      c.fillStyle = `hsl(${hue},${30 + rnd() * 18}%,${L}%)`;
      const path = ctx => { ctx.beginPath(); ctx.moveTo(cx - sw * .58, cy); ctx.quadraticCurveTo(cx - sw * .2, cy - sh * .72, cx + sw * .46, cy - sh * .08); ctx.lineTo(cx + sw * .62, cy); ctx.lineTo(cx + sw * .46, cy + sh * .08); ctx.quadraticCurveTo(cx - sw * .2, cy + sh * .72, cx - sw * .58, cy); ctx.closePath(); };
      path(c); c.fill();
      c.strokeStyle = "rgba(0,0,0,.55)"; c.lineWidth = Math.max(1, sh * .06); c.stroke();
      // rim light on each scale edge (wet look)
      c.strokeStyle = `rgba(180,220,170,${.05 + rnd() * .08})`; c.lineWidth = Math.max(1, sh * .035); c.beginPath(); c.moveTo(cx - sw * .5, cy - sh * .05); c.quadraticCurveTo(cx - sw * .15, cy - sh * .62, cx + sw * .44, cy - sh * .1); c.stroke();
      // height: domed scale with a raised keel
      const g = h.createRadialGradient(cx + sw * .1, cy, 0, cx, cy, sw * .62); g.addColorStop(0, "#fff"); g.addColorStop(.55, "#9a9a9a"); g.addColorStop(1, "#000");
      h.fillStyle = g; path(h); h.fill();
      h.strokeStyle = "rgba(255,255,255,.8)"; h.lineWidth = Math.max(1, sh * .05); h.beginPath(); h.moveTo(cx - sw * .4, cy); h.lineTo(cx + sw * .5, cy); h.stroke();
    }
  }
  // ventral scutes (transverse belly plates)
  const pw = sw * 1.25;
  for (let x = 0; x < W + pw; x += pw) {
    const gc = c.createLinearGradient(x, 0, x + pw, 0); gc.addColorStop(0, "#3d3a22"); gc.addColorStop(.25, "#9b9160"); gc.addColorStop(.8, "#7d754b"); gc.addColorStop(1, "#2e2b18");
    c.fillStyle = gc; c.fillRect(x, belly0, pw - 2, belly1 - belly0);
    const gh = h.createLinearGradient(x, 0, x + pw, 0); gh.addColorStop(0, "#111"); gh.addColorStop(.3, "#ddd"); gh.addColorStop(1, "#222");
    h.fillStyle = gh; h.fillRect(x, belly0, pw - 2, belly1 - belly0);
  }
  const fade = c.createLinearGradient(0, belly0 - sh * 1.5, 0, belly0 + sh * .5); fade.addColorStop(0, "rgba(11,20,16,0)"); fade.addColorStop(1, "rgba(11,20,16,.0)"); c.fillStyle = fade;

  // Sobel -> tangent-space normal map
  const src = h.getImageData(0, 0, W, H).data, nm = c.createImageData(W, H), d = nm.data, S = 2.2;
  const at = (x, y) => src[(((y + H) % H) * W + ((x + W) % W)) * 4];
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const dx = (at(x + 1, y) - at(x - 1, y)) / 255 * S, dy = (at(x, y + 1) - at(x, y - 1)) / 255 * S, l = Math.hypot(dx, dy, 1), i = (y * W + x) * 4;
    d[i] = (-dx / l * .5 + .5) * 255; d[i + 1] = (dy / l * .5 + .5) * 255; d[i + 2] = (1 / l * .5 + .5) * 255; d[i + 3] = 255;
  }
  const nc = document.createElement("canvas"); nc.width = W; nc.height = H; nc.getContext("2d").putImageData(nm, 0, 0);
  const mk = (cv, srgb) => { const t = new THREE.CanvasTexture(cv); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 16; if (srgb) t.colorSpace = THREE.SRGBColorSpace; return t; };
  return { map: mk(col, true), normalMap: mk(nc, false) };
}
function eyeTexture() {
  const cv = document.createElement("canvas"); cv.width = cv.height = 512; const x = cv.getContext("2d");
  const g = x.createRadialGradient(256, 256, 10, 256, 256, 256); g.addColorStop(0, "#fff6b0"); g.addColorStop(.35, "#ffd23a"); g.addColorStop(.75, "#e08a00"); g.addColorStop(1, "#4a2400");
  x.fillStyle = g; x.fillRect(0, 0, 512, 512);
  x.strokeStyle = "rgba(120,50,0,.35)"; x.lineWidth = 2;
  for (let i = 0; i < 90; i++) { const a = Math.random() * Math.PI * 2; x.beginPath(); x.moveTo(256 + Math.cos(a) * 60, 256 + Math.sin(a) * 60); x.lineTo(256 + Math.cos(a) * 250, 256 + Math.sin(a) * 250); x.stroke(); }
  x.fillStyle = "#050200"; x.beginPath(); x.ellipse(256, 256, 34, 205, 0, 0, Math.PI * 2); x.fill();
  const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; return t;
}

/* ---------- sculpted head ---------- */
function deform(geo, fn) {
  const p = geo.attributes.position, v = new THREE.Vector3();
  for (let i = 0; i < p.count; i++) { v.fromBufferAttribute(p, i); fn(v); p.setXYZ(i, v.x, v.y, v.z); }
  geo.computeVertexNormals(); return geo;
}
/* one deformation shared by the mesh and by everything mounted on it (eyes, fangs, horns) */
function skullDeform(v) {
  v.z *= 1.95; const f = sm(-.5, 1.95, v.z), side = Math.abs(v.x);
  v.x *= .86 * (1 - .5 * f) * (v.z < -.3 ? 1.08 : 1);                              // wedge: wide jaw, narrow snout
  v.y *= v.y > 0 ? .6 * (1 - .45 * f) : .36 * (1 - .3 * f);                          // low flat crown, flat underside
  if (v.y > 0) v.y -= .1 * Math.pow(Math.abs(v.x), 2) * (1 - f);                     // angular cheek planes
  if (v.y > 0) {
    v.y += .2 * Math.exp(-(Math.pow(side - .42, 2) / .012 + Math.pow(v.z - .55, 2) / .12)); // heavy brow ridges over the eyes
    v.x += Math.sign(v.x) * .06 * Math.exp(-(Math.pow(v.z - .55, 2) / .08)) * sm(.05, .3, v.y); // brows overhang sideways
    v.y -= .06 * Math.exp(-(v.x * v.x) / .03) * sm(-.2, 1.2, v.z);                       // groove between the brows
  }
  v.x += Math.sign(v.x) * .14 * Math.exp(-Math.pow(v.z + .8, 2) / .14) * (v.y < .15 ? 1 : .5); // jaw muscles
  return v;
}
const onSkull = (x, y, z, out = 1) => skullDeform(new THREE.Vector3(x, y, z).normalize().multiplyScalar(out));
function skullGeo() { return deform(new THREE.SphereGeometry(1, 128, 96), skullDeform); }
function jawGeo() {
  return deform(new THREE.SphereGeometry(1, 96, 64), v => {
    v.z *= 1.5; const f = sm(-.4, 1.5, v.z);
    v.x *= (.94 - .46 * f) * (v.z < -.3 ? 1.12 : 1); v.y *= (v.y > 0 ? .08 : .36) * (1 - .3 * f);
  }).translate(0, 0, .9);
}

export default function Basilisk({ quality = "high", onHead }) {
  const ultra = quality === "ultra", SEG = ultra ? 900 : 560, RAD = ultra ? 64 : 40;
  const uniforms = useMemo(() => ({ uTime: { value: 0 }, uRear: { value: 0 } }), []);
  const tex = useMemo(() => scaleMaps(ultra ? 4096 : 2048, ultra ? 2048 : 1024), [ultra]);
  const eyeTex = useMemo(eyeTexture, []);

  const bodyGeo = useMemo(() => {
    const pos = [], uv = [], idx = [];
    for (let i = 0; i <= SEG; i++) for (let j = 0; j <= RAD; j++) { const u = i / SEG, v = j / RAD; pos.push(u, v, 0); uv.push(u * SNAKE.L * .55, v); }
    for (let i = 0; i < SEG; i++) for (let j = 0; j < RAD; j++) { const a = i * (RAD + 1) + j, b = a + RAD + 1; idx.push(a, a + 1, b, b, a + 1, b + 1); }
    const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx);
    g.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 2, -7), 14);
    return g;
  }, [SEG, RAD]);

  const skin = useMemo(() => {
    const m = new THREE.MeshPhysicalMaterial({ map: tex.map, normalMap: tex.normalMap, normalScale: new THREE.Vector2(1.4, 1.4), roughness: .36, metalness: .05, clearcoat: .55, clearcoatRoughness: .32, iridescence: .4, iridescenceIOR: 1.35, sheen: .3, sheenColor: new THREE.Color("#3dffa4"), sheenRoughness: .5 });
    m.onBeforeCompile = s => patch(s, uniforms); m.customProgramCacheKey = () => "basilisk-body"; return m;
  }, [tex, uniforms]);
  const depthMat = useMemo(() => { const m = new THREE.MeshDepthMaterial({ depthPacking: THREE.RGBADepthPacking }); m.onBeforeCompile = s => patchDepth(s, uniforms); return m; }, [uniforms]);
  const headSkin = useMemo(() => { const m = new THREE.MeshPhysicalMaterial({ map: tex.map, normalMap: tex.normalMap, normalScale: new THREE.Vector2(1.1, 1.1), roughness: .34, clearcoat: .6, clearcoatRoughness: .3, iridescence: .35, iridescenceIOR: 1.35 }); m.map = tex.map.clone(); m.map.repeat.set(2.5, 1.2); m.normalMap = tex.normalMap.clone(); m.normalMap.repeat.set(2.5, 1.2); return m; }, [tex]);
  const hornMat = useMemo(() => new THREE.MeshPhysicalMaterial({ color: "#2b2a22", roughness: .45, clearcoat: .5, sheen: .4, sheenColor: new THREE.Color("#8a7d55") }), []);
  const ivory = useMemo(() => new THREE.MeshPhysicalMaterial({ color: "#e8dfc4", roughness: .25, clearcoat: 1 }), []);
  const mouthMat = useMemo(() => new THREE.MeshStandardMaterial({ color: "#2a0508", roughness: .4, emissive: "#140002" }), []);
  const eyeMat = useMemo(() => new THREE.MeshPhysicalMaterial({ map: eyeTex, emissiveMap: eyeTex, emissive: new THREE.Color(4, 3.1, 1.3), toneMapped: false, roughness: .02, clearcoat: 1 }), [eyeTex]);
  const skull = useMemo(skullGeo, []), jaw = useMemo(jawGeo, []);
  const fang = useMemo(() => deform(new THREE.ConeGeometry(.04, .42, 16, 8).translate(0, -.21, 0), v => { v.z += .25 * Math.pow(-v.y / .42, 2); }), []); // curved back
  const tooth = useMemo(() => new THREE.ConeGeometry(.022, .12, 8).translate(0, -.06, 0), []);
  const horn = useMemo(() => deform(new THREE.ConeGeometry(.09, .85, 16, 10).translate(0, .42, 0), v => { v.z -= .22 * Math.pow(v.y / .85, 2); v.x *= 1 - .1 * Math.sin(v.y * 40); }), []); // ridged, swept horn
  const spikeGeo = useMemo(() => new THREE.ConeGeometry(.1, .42, 8).translate(0, .21, 0), []);

  const mounts = useMemo(() => ({
    eyes: [-1, 1].map(s => onSkull(s * .72, .3, .62, .96)),
    fangs: [-1, 1].map(s => onSkull(s * .22, -.2, .97, .97)),
    teeth: [-1, 1].flatMap(s => [...Array(10)].map((_, i) => onSkull(s * (.9 - i * .05), -.25, .05 + i * .1, .98))),
    horns: [[.62, .55, -.55], [.55, .6, -.75], [.42, .62, -.9]].flatMap(([x, y, z], i) => [-1, 1].map(s => ({ p: onSkull(s * x, y, z, 1), s, i })))
  }), []);
  const head = useRef(), jawRef = useRef(), tongue = useRef(), spikes = useRef(), glow = useRef();
  const SPIKES = 64, tmp = useMemo(() => ({ c: new THREE.Vector3(), c2: new THREE.Vector3(), T: new THREE.Vector3(), B: new THREE.Vector3(), N: new THREE.Vector3(), q: new THREE.Quaternion(), o: new THREE.Object3D(), up: new THREE.Vector3(0, 1, 0), look: new THREE.Vector3() }), []);

  useEffect(() => () => { tex.map.dispose(); tex.normalMap.dispose(); }, [tex]);

  useFrame(({ clock }) => {
    const t = clock.elapsedTime, cyc = .5 + .5 * Math.sin(t * .33 - 1), rear = sm(.5, .9, cyc);
    uniforms.uTime.value = t; uniforms.uRear.value = rear;
    // head follows the body's leading end
    center(1, t, rear, tmp.c); center(.986, t, rear, tmp.c2); tmp.T.subVectors(tmp.c, tmp.c2).normalize();
    head.current.position.copy(tmp.c).addScaledVector(tmp.T, .25);
    tmp.look.copy(head.current.position).add(tmp.T); tmp.look.y -= rear * .35;               // when reared, glare downward
    head.current.lookAt(tmp.look);
    const open = sm(.75, .95, cyc) * (.55 + .1 * Math.sin(t * 9));                            // strike: jaws open at full rear
    jawRef.current.rotation.x = open;
    tongue.current.visible = open < .1 && Math.sin(t * 2.3) > .6;
    tongue.current.scale.z = .5 + .5 * Math.abs(Math.sin(t * 18));
    glow.current.intensity = 1.5 + rear * 4;
    onHead && onHead(head.current.position, rear);
    // dorsal spikes ride the spine
    for (let i = 0; i < SPIKES; i++) {
      const u = .16 + (i / (SPIKES - 1)) * .78, r = radius(u);
      center(u, t, rear, tmp.c); center(Math.min(1, u + .004), t, rear, tmp.c2); tmp.T.subVectors(tmp.c2, tmp.c).normalize();
      tmp.B.crossVectors(tmp.T, tmp.up).normalize(); tmp.N.crossVectors(tmp.B, tmp.T);
      tmp.o.position.copy(tmp.c).addScaledVector(tmp.N, r * .9);
      tmp.q.setFromUnitVectors(tmp.up, tmp.N.clone().addScaledVector(tmp.T, -.55).normalize()); tmp.o.quaternion.copy(tmp.q);
      const s = (r / SNAKE.R) * (1 + .35 * Math.sin(i * 1.7)); tmp.o.scale.set(s, s * (1.2 - u * .4), s); tmp.o.updateMatrix();
      spikes.current.setMatrixAt(i, tmp.o.matrix);
    }
    spikes.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <group>
      <mesh geometry={bodyGeo} material={skin} customDepthMaterial={depthMat} castShadow receiveShadow frustumCulled={false} />
      <instancedMesh ref={spikes} args={[spikeGeo, null, SPIKES]} castShadow frustumCulled={false}>
        <meshPhysicalMaterial color="#1a2a1f" roughness={.3} clearcoat={.8} />
      </instancedMesh>
      <group ref={head} scale={1.15}>
        <mesh geometry={skull} material={headSkin} castShadow />
        {/* inner mouth + lower jaw (hinged at the back of the skull) */}
        <mesh position={[0, -.14, .2]} scale={[.55, .06, 1.3]}><sphereGeometry args={[1, 48, 24]} /><primitive object={mouthMat} attach="material" /></mesh>
        <group ref={jawRef} position={[0, -.17, -.9]}>
          <mesh geometry={jaw} material={headSkin} castShadow />
          <mesh geometry={jaw} material={mouthMat} position={[0, .03, .02]} scale={[.86, .6, .94]} />
          {[-1, 1].map(sd => [...Array(9)].map((_, i) => <mesh key={sd + "" + i} geometry={tooth} material={ivory} position={[sd * (.62 - i * .045), .05, .7 + i * .11]} rotation-x={Math.PI} />))}
        </group>
        {/* fangs + teeth on the upper jaw */}
        {mounts.fangs.map((p, i) => <mesh key={"f" + i} geometry={fang} material={ivory} position={p} rotation={[-.15, Math.PI, (i ? 1 : -1) * .06]} />)}
        {mounts.teeth.map((p, i) => <mesh key={"t" + i} geometry={tooth} material={ivory} position={p} />)}
        {/* glowing slit-pupil eyes set into the skull surface */}
        {mounts.eyes.map((p, i) => (
          <group key={"e" + i} position={p} rotation={[0, (i ? 1 : -1) * 1.05, 0]}>
            <mesh scale={[1.25, .55, .6]} rotation-z={(i ? -1 : 1) * .22} material={eyeMat}><sphereGeometry args={[.13, 48, 32]} /></mesh>
          </group>
        ))}
        <pointLight ref={glow} position={[0, .5, 1.1]} color="#ffc43a" distance={7} decay={1.6} />
        {/* swept-back horns */}
        {mounts.horns.map(({ p, s, i }) => <mesh key={"h" + i + s} geometry={horn} material={hornMat} position={p} rotation={[-1.25 - i * .12, 0, s * (.55 - i * .1)]} scale={1.1 - i * .2} castShadow />)}
        {[...Array(6)].map((_, i) => <mesh key={"c" + i} geometry={spikeGeo} position={onSkull(0, 1, .2 - i * .3, .96)} rotation-x={-1} scale={1.3 - i * .12}><meshPhysicalMaterial color="#142219" roughness={.3} clearcoat={.8} /></mesh>)}
        {/* forked tongue */}
        <group ref={tongue} position={[0, -.12, 1.6]}>
          <mesh position={[0, 0, .25]} rotation-x={Math.PI / 2}><cylinderGeometry args={[.018, .022, .5, 8]} /><meshStandardMaterial color="#b0122c" roughness={.3} /></mesh>
          {[-1, 1].map(sd => <mesh key={sd} position={[sd * .05, 0, .58]} rotation={[Math.PI / 2, 0, sd * .5]}><cylinderGeometry args={[.008, .014, .2, 6]} /><meshStandardMaterial color="#b0122c" /></mesh>)}
        </group>
      </group>
    </group>
  );
}
