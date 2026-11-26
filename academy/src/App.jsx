import React, { Suspense, lazy, useEffect, useState } from "react";
import { motion, AnimatePresence, MotionConfig } from "framer-motion";
import { boot, useApp, setProfile, setFx, getState } from "./lib/store.js";
import { Crest, Toast, ConfirmHost } from "./components/ui.jsx";
import { EditorHost } from "./components/forms.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import Schedule from "./pages/Schedule.jsx";
import Calendar from "./pages/Calendar.jsx";
import { Tasks, Board } from "./pages/Tasks.jsx";
import Connect from "./pages/Connect.jsx";

const Castle = lazy(() => import("./scene/Castle.jsx"));
const ROUTES = [
  ["dashboard", "แดชบอร์ด", "◈", Dashboard], ["schedule", "ตารางเรียน", "☰", Schedule], ["calendar", "ปฏิทิน", "▦", Calendar],
  ["tasks", "สอบ & งาน", "✎", Tasks], ["board", "ประกาศ & กิจกรรม", "✦", Board], ["connect", "เชื่อมต่อ", "⚙", Connect]
];
const routeOf = () => { const h = location.hash.slice(1); return ROUTES.some(r => r[0] === h) ? h : "dashboard"; };
function webgl() { try { const c = document.createElement("canvas"); return !!(c.getContext("webgl2") || c.getContext("webgl")); } catch (e) { return false; } }

export default function App() {
  const [route, setRoute] = useState(routeOf), ready = useApp(s => s.ready), fx = useApp(s => s.fx), year = useApp(s => s.profile.year), mode = useApp(s => s.mode);
  useEffect(() => {
    boot();
    if (!getState().fx) setFx(!webgl() ? "off" : matchMedia("(pointer:coarse)").matches || innerWidth < 900 ? "low" : "high");
    const f = () => { setRoute(routeOf()); window.scrollTo({ top: 0 }); };
    addEventListener("hashchange", f); return () => removeEventListener("hashchange", f);
  }, []);
  const Page = ROUTES.find(r => r[0] === route)[3];
  return (
    <MotionConfig reducedMotion="user">
      <div className="backdrop" aria-hidden="true">
        {fx && fx !== "off" && webgl() && <Suspense fallback={null}><Castle route={route} fx={fx} /></Suspense>}
        <div className="veil" />
      </div>
      <div className="shell">
        <aside className="side">
          <a className="brand" href="#dashboard"><Crest size={40} /><span><b>Slytherin</b><small>Academy</small></span></a>
          <nav aria-label="เมนูหลัก">{ROUTES.map(([k, l, ic]) => (
            <a key={k} href={"#" + k} className={route === k ? "on" : ""} aria-current={route === k ? "page" : undefined}>
              {route === k && <motion.span layoutId="nav-glow" className="nav-glow" transition={{ type: "spring", stiffness: 380, damping: 32 }} />}
              <i>{ic}</i><span>{l}</span></a>))}
          </nav>
          <div className="side-foot">
            <label htmlFor="yr" className="muted small">ชั้นปีของฉัน</label>
            <select id="yr" value={year} onChange={e => setProfile({ year: +e.target.value })}>{[1, 2, 3, 4, 5, 6, 7].map(y => <option key={y} value={y}>ชั้นปีที่ {y}</option>)}<option value={0}>ทุกชั้นปี</option></select>
            <span className={"mode " + mode}><span className="dot" />{mode === "supabase" ? "ฐานข้อมูลกลาง" : "โหมดสาธิต"}</span>
          </div>
        </aside>
        <main className="main">
          <AnimatePresence mode="wait">
            <motion.div key={route} initial={{ opacity: 0, y: 18, filter: "blur(8px)" }} animate={{ opacity: 1, y: 0, filter: "blur(0px)" }} exit={{ opacity: 0, y: -10, filter: "blur(6px)" }} transition={{ duration: .45, ease: [.2, .7, .2, 1] }}>
              {ready ? <Page /> : <div className="loading"><Crest size={70} /><span>กำลังเปิดประตูปราสาท…</span></div>}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
      <EditorHost /><ConfirmHost /><Toast />
    </MotionConfig>
  );
}
