import React, { Suspense, lazy, useEffect, useState } from "react";
import { motion, AnimatePresence, MotionConfig } from "framer-motion";
import { LayoutDashboard, CalendarDays, CalendarRange, ScrollText, Bell, Settings2, Menu, X, ShieldCheck, MessageCircle, Eye, Check } from "lucide-react";
import { boot, useApp, setProfile, setFx, getState } from "./lib/store.js";
import { Crest, Toast, ConfirmHost } from "./components/ui.jsx";
import { EditorHost } from "./components/forms.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import Schedule from "./pages/Schedule.jsx";
import Calendar from "./pages/Calendar.jsx";
import { Tasks, Board } from "./pages/Tasks.jsx";
import Connect from "./pages/Connect.jsx";
import roomUrl from "./assets/common-room.webp";

const CommonRoom = lazy(() => import("./scene/CommonRoom.jsx"));
const ROUTES = [
  ["dashboard", "ภาพรวม", LayoutDashboard, Dashboard], ["schedule", "ตารางเรียน", CalendarDays, Schedule], ["calendar", "ปฏิทิน", CalendarRange, Calendar],
  ["tasks", "สอบ & งาน", ScrollText, Tasks], ["board", "ประกาศ & กิจกรรม", Bell, Board], ["connect", "เชื่อมต่อ", Settings2, Connect]
];
const routeOf = () => { const h = location.hash.slice(1); return ROUTES.some(r => r[0] === h) ? h : "dashboard"; };
function webgl() { try { const c = document.createElement("canvas"); return !!(c.getContext("webgl2") || c.getContext("webgl")); } catch (e) { return false; } }
const RUNES = [["ᛉ", "7%", "16%", 0, 9], ["ᛋ", "29%", "73%", 1.6, 11], ["ᚨ", "54%", "24%", 3.2, 10], ["ᛏ", "78%", "63%", 2.1, 12], ["ᚱ", "91%", "18%", 4, 9.5], ["ᛇ", "67%", "88%", 1, 13]];

function Atmosphere() {
  return (
    <div className="atmos" aria-hidden="true">
      {RUNES.map(([g, l, t, d, dur]) => (
        <motion.span key={g + l} className="rune" style={{ left: l, top: t }} animate={{ y: [0, -28, 0], opacity: [.03, .14, .03], rotate: [0, 8, 0] }} transition={{ duration: dur, delay: d, repeat: Infinity, ease: "easeInOut" }}>{g}</motion.span>
      ))}
      <div className="orb" style={{ left: "18%", top: "28%" }} /><div className="orb" style={{ right: "12%", top: "58%", animationDelay: "-3s" }} />
    </div>
  );
}

function DiscordHall() {
  const mode = useApp(s => s.mode), discord = useApp(s => s.discord);
  const ok = mode === "supabase" && discord;
  return (
    <a href="#connect" className="hall">
      <div className="hall-t"><MessageCircle size={14} /> Discord Hall</div>
      <div className={"hall-s" + (ok ? " ok" : "")}><span className="dot" />{ok ? "เชื่อมต่อแล้ว · แจ้งเตือนอัตโนมัติ" : mode === "supabase" ? "ยังไม่ได้ใส่ webhook" : "โหมดสาธิต · ยังไม่เชื่อมต่อ"}</div>
    </a>
  );
}

export default function App() {
  const [cinema, setCinema] = useState(false), [menu, setMenu] = useState(false), [route, setRoute] = useState(routeOf);
  const ready = useApp(s => s.ready), fx = useApp(s => s.fx), profile = useApp(s => s.profile), anns = useApp(s => s.data.announcements.length);
  useEffect(() => {
    boot();
    if (!getState().fx) setFx(!webgl() ? "off" : matchMedia("(pointer:coarse)").matches || innerWidth < 900 ? "low" : (devicePixelRatio || 1) * screen.width >= 2560 ? "ultra" : "high");
    const k = e => e.key === "Escape" && setCinema(false);
    const f = () => { setRoute(routeOf()); setMenu(false); window.scrollTo({ top: 0 }); };
    addEventListener("keydown", k); addEventListener("hashchange", f);
    return () => { removeEventListener("keydown", k); removeEventListener("hashchange", f); };
  }, []);
  const Page = ROUTES.find(r => r[0] === route)[3];
  const initials = (profile.name || "ผู้สืบทอด").trim().split(/\s+/).map(w => [...w][0]).slice(0, 2).join("").toUpperCase();
  return (
    <MotionConfig reducedMotion="user">
      <div className="backdrop" aria-hidden="true" style={{ backgroundImage: `url(${roomUrl})` }}>
        {fx && fx !== "off" && webgl() && <Suspense fallback={null}><CommonRoom fx={fx} /></Suspense>}
        <div className={"veil" + (cinema ? " off" : "")} />
      </div>
      {!cinema && <Atmosphere />}

      <div className={"shell" + (cinema ? " hidden" : "")}>
        <aside className={"side" + (menu ? " open" : "")}>
          <div className="brand-row">
            <a className="brand" href="#dashboard"><Crest size={34} /><span><b>SLYTHERIN</b><small>Academy</small></span></a>
            <button className="icon-btn only-m" onClick={() => setMenu(false)} aria-label="ปิดเมนู"><X size={16} /></button>
          </div>
          <div className="ornament"><span>✦</span></div>
          <p className="side-kicker">Academy portal</p>
          <nav aria-label="เมนูหลัก">{ROUTES.map(([k, l, Icon]) => (
            <a key={k} href={"#" + k} className={route === k ? "on" : ""} aria-current={route === k ? "page" : undefined}>
              {route === k && <motion.span layoutId="nav-glow" className="nav-glow" transition={{ type: "spring", stiffness: 380, damping: 32 }} />}
              <Icon size={17} strokeWidth={1.5} /><span>{l}</span>
              {k === "board" && anns > 0 && <em className="badge">{anns}</em>}
            </a>))}
          </nav>
          <div className="side-foot">
            <DiscordHall />
            <div className="me">
              <div className="avatar">{initials}</div>
              <div className="me-t"><p>{profile.name || "ผู้สืบทอด"}</p>
                <select aria-label="ชั้นปีของฉัน" value={profile.year} onChange={e => setProfile({ year: +e.target.value })}>{[1, 2, 3, 4, 5, 6, 7].map(y => <option key={y} value={y}>Slytherin · ชั้นปีที่ {y}</option>)}<option value={0}>Slytherin · ทุกชั้นปี</option></select>
              </div>
            </div>
          </div>
        </aside>
        {menu && <div className="scrim" onClick={() => setMenu(false)} />}

        <main className="main">
          <header className="topbar">
            <button className="icon-btn only-m" onClick={() => setMenu(true)} aria-label="เปิดเมนู"><Menu size={18} /></button>
            <div className="top-l"><ShieldCheck size={14} /> Slytherin house · secured portal</div>
            <div className="top-r">
              {fx !== "off" && <button className="btn ghost sm" onClick={() => setCinema(true)}><Eye size={14} /> ชมห้องนั่งเล่น</button>}
              <a href="#board" className="icon-btn bell" aria-label="ประกาศ"><Bell size={15} />{anns > 0 && <i />}</a>
            </div>
          </header>
          <div className="content">
            <AnimatePresence mode="wait">
              <motion.div key={route} initial={{ opacity: 0, y: 14, filter: "blur(6px)" }} animate={{ opacity: 1, y: 0, filter: "blur(0px)" }} exit={{ opacity: 0, y: -8, filter: "blur(4px)" }} transition={{ duration: .45, ease: [.2, .7, .2, 1] }}>
                {ready ? <Page /> : <div className="loading"><Crest size={64} /><span>กำลังเปิดประตูห้องนั่งเล่น…</span></div>}
              </motion.div>
            </AnimatePresence>
            <footer className="foot"><span>© 2569 Slytherin Academy · The Serpent's Legacy</span><span><Check size={10} /> Magical wards active</span></footer>
          </div>
        </main>
      </div>

      <AnimatePresence>{cinema && (
        <motion.div className="cinema" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: .8 }}>
          <div className="cinema-title"><div className="eyebrow">The Common Room</div><h2>ห้องนั่งเล่นใต้ทะเลสาบ</h2><p>แสงเทียน หมอก และเงาน้ำจากทะเลสาบดำ · ขยับเมาส์เพื่อมองรอบ ๆ</p></div>
          <button className="btn primary" onClick={() => setCinema(false)}>กลับสู่แดชบอร์ด (Esc)</button>
        </motion.div>)}
      </AnimatePresence>
      <EditorHost /><ConfirmHost /><Toast />
    </MotionConfig>
  );
}
