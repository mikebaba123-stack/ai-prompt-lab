import { useSyncExternalStore } from "react";
import { CONFIG } from "../config.js";
import { addDays, schoolDay, ymd } from "./time.js";

/* ---------- safe browser storage ---------- */
export const LS = {
  get(k, d) { try { const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} },
  del(k) { try { localStorage.removeItem(k); } catch (e) {} }
};
export const uid = () => (crypto.randomUUID ? crypto.randomUUID()
  : "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, c => { const r = (Math.random() * 16) | 0; return (c === "x" ? r : (r & 3) | 8).toString(16); }));

export const KINDS = ["courses", "exams", "assignments", "announcements", "events"];
const EMPTY = { courses: [], exams: [], assignments: [], announcements: [], events: [] };

/* ---------- demo backend (this browser only) ---------- */
const demoKey = k => "sa.demo." + k;
const Demo = {
  name: "demo",
  async load() {
    if (!LS.get(demoKey("seeded"), false)) { seedDemo(); LS.set(demoKey("seeded"), true); }
    const out = {}; for (const k of KINDS) out[k] = LS.get(demoKey(k), []).filter(x => !x.deleted); return out;
  },
  async insert(kind, row) {
    const all = LS.get(demoKey(kind), []), now = new Date().toISOString();
    all.push({ ...row, id: uid(), deleted: false, created_at: now, updated_at: now }); LS.set(demoKey(kind), all);
  },
  async update(kind, id, patch) {
    const all = LS.get(demoKey(kind), []), it = all.find(x => x.id === id);
    if (it) Object.assign(it, patch, { updated_at: new Date().toISOString() }); LS.set(demoKey(kind), all);
  },
  async discordReady() { return null; },
  close() {}
};
export function resetDemo() { for (const k of KINDS) LS.del(demoKey(k)); LS.del(demoKey("seeded")); }

/* ---------- Supabase backend (shared by everyone) ---------- */
const Remote = {
  name: "supabase", db: null, chan: null,
  async init(url, key) {
    const { createClient } = await import("@supabase/supabase-js");
    this.db = createClient(url, key);
    const { error } = await this.db.from("courses").select("id").limit(1);
    if (error) throw new Error(error.code === "42P01" || /does not exist/.test(error.message) ? "ยังไม่ได้รันไฟล์ supabase/setup.sql ในโปรเจกต์นี้" : error.message);
    this.chan = this.db.channel("academy");
    for (const k of KINDS) this.chan.on("postgres_changes", { event: "*", schema: "public", table: k }, () => refreshSoon());
    this.chan.subscribe();
  },
  async load() {
    const res = await Promise.all(KINDS.map(k => this.db.from(k).select("*").eq("deleted", false).order("created_at").limit(5000)));
    const out = {}; res.forEach((r, i) => { if (r.error) throw new Error(r.error.message); out[KINDS[i]] = r.data; }); return out;
  },
  async insert(kind, row) { const { error } = await this.db.from(kind).insert(row); if (error) throw new Error(error.message); },
  async update(kind, id, patch) { const { error } = await this.db.from(kind).update(patch).eq("id", id); if (error) throw new Error(error.message); },
  async discordReady() { const { data, error } = await this.db.rpc("discord_configured"); return error ? null : !!data; },
  close() { if (this.chan) this.db.removeChannel(this.chan); this.chan = null; }
};

/* ---------- shared database built into the published page (claude.ai artifact `db`) ---------- */
const withTimeout = (p, ms, msg) => Promise.race([p, new Promise((_, no) => setTimeout(() => no(new Error(msg)), ms))]);
const Shared = {
  name: "shared", db: null, subs: [],
  async init() {
    const use = window.claude && window.claude.use;
    if (typeof use !== "function") return false;
    const db = await withTimeout(use("db"), 12000, "timeout").catch(() => null);
    if (!db) return false;
    this.db = db;
    try {
      const user = await withTimeout(use("user"), 5000, "timeout").catch(() => null);
      const can = user ? await user.can("data.write") : null;
      if (can === false) set({ readOnly: true });
    } catch (e) {}
    for (const k of KINDS) this.subs.push(this.db.collection(k).onSnapshot(() => refreshSoon(), () => {}));
    return true;
  },
  async load() {
    const res = await withTimeout(Promise.all(KINDS.map(k => this.db.collection(k).get())), 10000, "ติดต่อฐานข้อมูลไม่ได้ ลองรีเฟรชอีกครั้ง");
    const out = {};
    res.forEach((snap, i) => { out[KINDS[i]] = snap.docs.map(d => ({ ...d.data(), id: d.id })).filter(x => !x.deleted).sort((a, b) => (a.created_at || "").localeCompare(b.created_at || "")); });
    return out;
  },
  async insert(kind, row) {
    const now = new Date().toISOString(), ref = this.db.collection(kind).doc();
    await this.call(() => ref.set(JSON.parse(JSON.stringify({ ...row, deleted: false, created_at: now, updated_at: now }))));
  },
  async update(kind, id, patch) { await this.call(() => this.db.collection(kind).doc(id).update(JSON.parse(JSON.stringify({ ...patch, updated_at: new Date().toISOString() })))); },
  async call(fn) {
    try { await fn(); }
    catch (e) {
      if (e && e.code === "invalid_argument") { set({ readOnly: true }); throw new Error("บัญชีนี้ดูได้อย่างเดียว แก้ไขข้อมูลไม่ได้"); }
      if (e && e.code === "quota_exceeded") throw new Error("ฐานข้อมูลเต็ม ลบรายการเก่าที่ไม่ใช้ก่อน");
      throw new Error((e && e.message) || "บันทึกไม่สำเร็จ");
    }
  },
  async discordReady() { return null; },
  close() { this.subs.forEach(u => u()); this.subs = []; }
};

/* ---------- reactive state ---------- */
let state = {
  ready: false, mode: "demo", error: "", discord: null,
  data: EMPTY, readOnly: false,
  profile: LS.get("sa.profile", { name: "", year: 1 }),
  done: LS.get("sa.done", {}),           // assignments this viewer has submitted
  fx: LS.get("sa.fx", null),             // 3D quality: high | low | off
  toast: null
};
let backend = Demo;
const subs = new Set();
const set = patch => { state = { ...state, ...patch }; subs.forEach(f => f()); };
export const getState = () => state;
export const useApp = sel => useSyncExternalStore(f => (subs.add(f), () => subs.delete(f)), () => sel(state));

let toastTimer;
export function toast(msg, bad = false) { clearTimeout(toastTimer); set({ toast: { msg, bad, id: Date.now() } }); toastTimer = setTimeout(() => set({ toast: null }), bad ? 6000 : 3200); }

export async function reload() {
  try { set({ data: await backend.load(), ready: true }); }
  catch (e) { set({ ready: true }); toast("โหลดข้อมูลไม่สำเร็จ: " + e.message, true); }
}
let rt; function refreshSoon() { clearTimeout(rt); rt = setTimeout(reload, 300); }

export async function connect(url, key) {
  try {
    await Remote.init(url, key); backend = Remote;
    set({ mode: "supabase", error: "", discord: await Remote.discordReady() });
  } catch (e) { backend = Demo; set({ mode: "demo", error: e.message, discord: null }); }
  await reload();
  return state.mode === "supabase";
}
export async function useDemo() { Remote.close(); if (await Shared.init()) { backend = Shared; LS.del("sa.sb"); set({ mode: "shared", error: "", discord: null }); await reload(); return; } backend = Demo; LS.del("sa.sb"); set({ mode: "demo", error: "", discord: null }); await reload(); }
export async function boot() {
  const saved = LS.get("sa.sb", null);
  const url = CONFIG.supabaseUrl || saved?.url, key = CONFIG.supabaseKey || saved?.key;
  if (url && key) await connect(url, key);
  else if (await Shared.init()) { backend = Shared; set({ mode: "shared" }); await reload(); }
  else await reload();
  addEventListener("storage", e => { if (backend === Demo && e.key?.startsWith("sa.demo.")) refreshSoon(); });
}

const actor = () => state.profile.name?.trim() || "ไม่ทราบชื่อ";
export async function save(kind, row, id) {
  try {
    if (id) await backend.update(kind, id, { ...row, updated_by: actor() });
    else await backend.insert(kind, { ...row, created_by: actor(), updated_by: actor() });
    await reload();
    toast((id ? "บันทึกการแก้ไขแล้ว" : "เพิ่มแล้ว") + (backend === Remote && state.discord ? " · แจ้ง Discord แล้ว" : backend === Shared ? " · ทุกคนเห็นแล้ว" : ""));
    return true;
  } catch (e) { toast("บันทึกไม่สำเร็จ: " + e.message, true); return false; }
}
export async function remove(kind, id) {
  try { await backend.update(kind, id, { deleted: true, updated_by: actor() }); await reload(); toast("ลบแล้ว"); return true; }
  catch (e) { toast("ลบไม่สำเร็จ: " + e.message, true); return false; }
}
export function setProfile(p) { const profile = { ...state.profile, ...p }; LS.set("sa.profile", profile); set({ profile }); }
export function toggleDone(id) { const done = { ...state.done, [id]: !state.done[id] }; if (!done[id]) delete done[id]; LS.set("sa.done", done); set({ done }); }
export function setFx(fx) { LS.set("sa.fx", fx); set({ fx }); }

/* ---------- example data for demo mode ---------- */
function seedDemo() {
  const by = "ข้อมูลตัวอย่าง", now = new Date().toISOString(), today = schoolDay(), D = n => ymd(addDays(today, n));
  const base = r => ({ id: uid(), deleted: false, created_by: by, updated_by: by, created_at: now, updated_at: now, ...r });
  const courses = [
    { name: "ปรุงยาขั้นสูง", code: "POT-301", teacher: "ศ.เซเวรีน มอร์ไกรฟ์", room: "ห้องใต้ดิน 1", color: "#2fbf7f", years: [1, 2, 3], description: "สกัดน้ำยาจากพืชหายากและควบคุมความร้อนของหม้อปรุงอย่างแม่นยำ", sessions: [{ day: 1, start: "18:00", end: "19:30" }, { day: 4, start: "19:45", end: "21:15" }] },
    { name: "ป้องกันตัวจากศาสตร์มืด", code: "DADA-210", teacher: "อ.ไลแซนเดอร์ แบล็กธอร์น", room: "ห้องโถงทิศเหนือ", color: "#7aa7c7", years: [1, 2, 3, 4], description: "คาถาป้องกัน การตอบโต้ และการประเมินภัยคุกคาม", sessions: [{ day: 2, start: "18:00", end: "19:30" }, { day: 5, start: "21:30", end: "23:00" }] },
    { name: "แปลงร่าง", code: "TRF-120", teacher: "อ.อิซอลด์ เวน", room: "ห้อง 1B", color: "#b89b62", years: [1, 2], description: "การเปลี่ยนรูปวัตถุเล็กสู่สิ่งมีชีวิต", sessions: [{ day: 1, start: "19:45", end: "21:15" }, { day: 3, start: "18:00", end: "19:30" }] },
    { name: "คาถาและมนตรา", code: "CHM-110", teacher: "อ.โอไรออน เฟลล์", room: "หอคอยตะวันออก", color: "#9b8cd9", years: [1, 2, 3], description: "จังหวะการเปล่งคาถาและการควบคุมไม้กายสิทธิ์", sessions: [{ day: 2, start: "19:45", end: "21:15" }, { day: 4, start: "18:00", end: "19:30" }] },
    { name: "ดาราศาสตร์", code: "AST-150", teacher: "อ.เซเลเน่ แอชวูด", room: "หอดูดาว", color: "#5d8ee8", years: [1, 2, 3, 4, 5], description: "แผนที่ดวงดาวและการโคจรของดาวเคราะห์ เรียนกลางดึกเท่านั้น", sessions: [{ day: 3, start: "23:15", end: "00:45" }] },
    { name: "อักษรรูนโบราณ", code: "RUN-220", teacher: "อ.คาสเปียน โรว์", room: "ห้องสมุดชั้นต้องห้าม", color: "#c9785a", years: [1, 3, 5], description: "ถอดความจารึกรูนบนหินโบราณ", sessions: [{ day: 5, start: "18:00", end: "19:30" }, { day: 3, start: "19:45", end: "21:15" }] },
    { name: "สมุนไพรศาสตร์", code: "HRB-105", teacher: "อ.เมิร์ทเทิล กรีนเวล", room: "เรือนกระจก 3", color: "#7cbf3f", years: [1, 2], description: "ดูแลพืชวิเศษและเก็บเกี่ยวอย่างปลอดภัย", sessions: [{ day: 2, start: "21:30", end: "23:00" }, { day: 5, start: "19:45", end: "21:15" }] }
  ].map(base);
  const cid = n => courses.find(c => c.name === n).id;
  const exams = [
    { title: "สอบกลางภาค ปรุงยาขั้นสูง", course_id: cid("ปรุงยาขั้นสูง"), date: D(3), start_time: "18:00", end_time: "20:00", room: "ห้องใต้ดิน 1", note: "นำหม้อปรุงยาและเครื่องชั่งมาเอง", years: [1, 2, 3] },
    { title: "สอบปฏิบัติ คาถาป้องกัน", course_id: cid("ป้องกันตัวจากศาสตร์มืด"), date: D(6), start_time: "19:00", end_time: "21:00", room: "ห้องโถงทิศเหนือ", note: "", years: [1, 2, 3, 4] },
    { title: "สอบย่อย แผนที่ดวงดาว", course_id: cid("ดาราศาสตร์"), date: D(10), start_time: "23:15", end_time: "00:15", room: "หอดูดาว", note: "", years: [1, 2, 3, 4, 5] }
  ].map(base);
  const assignments = [
    { title: "รายงานคุณสมบัติรากแมนเดรก", course_id: cid("สมุนไพรศาสตร์"), due_date: D(1), due_time: "23:59", description: "ความยาว 2 หน้ากระดาษหนัง", years: [1, 2] },
    { title: "ถอดความจารึกบนแผ่นหินที่ 7", course_id: cid("อักษรรูนโบราณ"), due_date: D(4), due_time: "18:00", description: "", years: [1, 3, 5] },
    { title: "บันทึกการสังเกตดาวพฤหัส 3 คืน", course_id: cid("ดาราศาสตร์"), due_date: D(8), due_time: "23:59", description: "", years: [1, 2, 3, 4, 5] },
    { title: "ฝึกคาถาเปลี่ยนสีวัตถุ 10 ชิ้น", course_id: cid("แปลงร่าง"), due_date: D(-1), due_time: "21:00", description: "", years: [1, 2] }
  ].map(base);
  const announcements = [
    { title: "เปลี่ยนรหัสผ่านทางเข้าห้องนั่งเล่น", body: "รหัสผ่านใหม่มีผลตั้งแต่คืนนี้ ขอรหัสได้จากพรีเฟ็คของแต่ละชั้นปี ห้ามบอกบ้านอื่นเด็ดขาด", pinned: true, years: [1, 2, 3, 4, 5, 6, 7] },
    { title: "เปิดรับสมัครทีมกีฬาบ้าน", body: "คัดตัวที่สนามกีฬาสุดสัปดาห์นี้ เตรียมไม้กวาดและชุดฝึกให้พร้อม", pinned: false, years: [1, 2, 3, 4, 5, 6, 7] },
    { title: "ห้องสมุดเปิดถึงตีสองช่วงสอบ", body: "ช่วงสอบกลางภาค ห้องสมุดเปิดถึง 02:00 น. ทุกคืน", pinned: false, years: [1, 2, 3, 4, 5, 6, 7] }
  ].map(base);
  const events = [
    { title: "งานเลี้ยงใต้ทะเลสาบ", date: D(5), start_time: "19:00", end_time: "22:00", place: "ห้องนั่งเล่นสลิธีริน", category: "สังสรรค์", description: "แต่งกายโทนมรกตและเงิน", years: [1, 2, 3, 4, 5, 6, 7] },
    { title: "ติวสอบโดยรุ่นพี่ปี 7", date: D(2), start_time: "21:30", end_time: "23:00", place: "ห้องสมุด", category: "วิชาการ", description: "", years: [1, 2, 3] },
    { title: "ศึกชิงถ้วยบ้าน", date: D(12), start_time: "18:00", end_time: "20:00", place: "สนามกีฬา", category: "กีฬา", description: "", years: [1, 2, 3, 4, 5, 6, 7] }
  ].map(base);
  LS.set(demoKey("courses"), courses); LS.set(demoKey("exams"), exams); LS.set(demoKey("assignments"), assignments);
  LS.set(demoKey("announcements"), announcements); LS.set(demoKey("events"), events);
}
