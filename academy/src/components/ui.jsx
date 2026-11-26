import React, { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence, animate } from "framer-motion";
import { useApp } from "../lib/store.js";

export function Card({ title, eyebrow, action, children, className = "", delay = 0, ...rest }) {
  return (
    <motion.section className={"card " + className} initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }}
      transition={{ duration: .6, delay, ease: [.2, .7, .2, 1] }} {...rest}>
      <span className="card-hair" aria-hidden="true" />
      {(title || action) && (
        <header className="card-head">
          <div>{eyebrow && <div className="eyebrow">{eyebrow}</div>}{title && <h3>{title}</h3>}</div>
          {action}
        </header>
      )}
      {children}
    </motion.section>
  );
}

/* the house crest: an emerald shield, bevelled silver rim, gold inlay and a coiled silver serpent */
let crestN = 0;
export function Crest({ size = 44, className = "" }) {
  const id = React.useMemo(() => "cr" + (++crestN), []);
  const S = `M134 70 C108 54 66 62 70 92 C74 120 130 112 132 140 C134 172 88 182 66 162 C56 153 58 141 68 138`;
  return (
    <svg className={"crest " + className} width={size} height={size * 1.15} viewBox="0 0 200 230" role="img" aria-label="ตรา Slytherin Academy">
      <defs>
        <linearGradient id={id + "s"} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#ffffff" /><stop offset=".35" stopColor="#aab4b6" /><stop offset=".6" stopColor="#f4f7f7" /><stop offset="1" stopColor="#6f7a7c" /></linearGradient>
        <linearGradient id={id + "e"} x1=".2" y1="0" x2=".8" y2="1"><stop offset="0" stopColor="#14a273" /><stop offset=".45" stopColor="#0a5a3f" /><stop offset="1" stopColor="#021a11" /></linearGradient>
        <linearGradient id={id + "g"} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#f1dca6" /><stop offset="1" stopColor="#9c7f45" /></linearGradient>
        <radialGradient id={id + "l"} cx=".35" cy=".2" r=".7"><stop offset="0" stopColor="#ffffff" stopOpacity=".28" /><stop offset="1" stopColor="#ffffff" stopOpacity="0" /></radialGradient>
        <pattern id={id + "k"} width="7" height="6" patternUnits="userSpaceOnUse"><path d="M0 3 Q3.5 -1 7 3 Q3.5 7 0 3Z" fill="none" stroke="#5f6b6d" strokeWidth=".7" opacity=".55" /></pattern>
        <filter id={id + "f"} x="-20%" y="-20%" width="140%" height="140%"><feDropShadow dx="0" dy="3" stdDeviation="3" floodColor="#000" floodOpacity=".55" /></filter>
      </defs>
      {/* shield: dark bevel, silver rim, emerald field, gold inlay */}
      <path d="M100 4 L190 27 C190 122 162 182 100 227 C38 182 10 122 10 27 Z" fill="#1a2224" />
      <path d="M100 8 L186 30 C186 120 159 178 100 222 C41 178 14 120 14 30 Z" fill={`url(#${id}e)`} stroke={`url(#${id}s)`} strokeWidth="6" />
      <path d="M100 22 L172 41 C170 116 147 164 100 202 C53 164 30 116 28 41 Z" fill="none" stroke={`url(#${id}g)`} strokeOpacity=".75" strokeWidth="1.6" />
      <path d="M100 8 L186 30 C186 70 180 100 170 126 C120 80 60 70 14 60 L14 30 Z" fill={`url(#${id}l)`} />
      <path d="M62 48 H138" stroke={`url(#${id}g)`} strokeWidth="2" strokeLinecap="round" />
      <path d="M100 34 l7 9 -7 9 -7 -9 z" fill={`url(#${id}g)`} stroke="#5b4a26" strokeWidth=".8" />
      {/* serpent: shadow, dark outline, silver body, scales, highlight */}
      <g filter={`url(#${id}f)`}>
        <path d={S} fill="none" stroke="#1d2426" strokeWidth="17" strokeLinecap="round" />
        <path d={S} fill="none" stroke={`url(#${id}s)`} strokeWidth="12" strokeLinecap="round" />
        <path d={S} fill="none" stroke={`url(#${id}k)`} strokeWidth="12" strokeLinecap="round" />
        <path d={S} fill="none" stroke="#ffffff" strokeOpacity=".55" strokeWidth="2.5" strokeLinecap="round" transform="translate(-2 -3)" />
        <path d="M124 63 C136 56 155 60 158 72 C152 82 137 80 129 75 Z" fill={`url(#${id}s)`} stroke="#1d2426" strokeWidth="2.5" strokeLinejoin="round" />
        <path d="M137 64 C143 62 150 64 152 68" fill="none" stroke="#1d2426" strokeWidth="1.4" strokeLinecap="round" />
      </g>
      <circle cx="146" cy="69" r="3" fill="#3dffa4" /><circle cx="146" cy="69" r="6" fill="#3dffa4" opacity=".25" />
      <path d="M158 72 l11 2 m-11 -2 l9 6" stroke="#d64b5f" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

export function Modal({ open, onClose, title, children, wide }) {
  useEffect(() => {
    if (!open) return;
    const k = e => e.key === "Escape" && onClose();
    addEventListener("keydown", k); return () => removeEventListener("keydown", k);
  }, [open, onClose]);
  return (
    <AnimatePresence>
      {open && (
        <motion.div className="overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onMouseDown={e => e.target === e.currentTarget && onClose()}>
          <motion.div className={"modal card" + (wide ? " wide" : "")} role="dialog" aria-modal="true" aria-label={title}
            initial={{ opacity: 0, y: 30, scale: .96 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 20, scale: .97 }} transition={{ type: "spring", stiffness: 260, damping: 26 }}>
            <header className="card-head"><h3>{title}</h3><button className="icon-btn" onClick={onClose} aria-label="ปิด">✕</button></header>
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* promise-based confirm, rendered inside the page */
let askFn = null;
export const ask = msg => (askFn ? askFn(msg) : Promise.resolve(false));
export function ConfirmHost() {
  const [q, setQ] = useState(null);
  askFn = msg => new Promise(res => setQ({ msg, res }));
  const done = v => { q.res(v); setQ(null); };
  return (
    <Modal open={!!q} onClose={() => done(false)} title="ยืนยัน">
      <p className="confirm-msg">{q?.msg}</p>
      <div className="row end"><button className="btn ghost" onClick={() => done(false)}>ไม่ใช่</button><button className="btn danger" onClick={() => done(true)}>ยืนยัน</button></div>
    </Modal>
  );
}

export function Toast() {
  const t = useApp(s => s.toast);
  return (
    <div className="toast-wrap" aria-live="polite">
      <AnimatePresence>{t && <motion.div key={t.id} className={"toast" + (t.bad ? " bad" : "")} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }}>{t.msg}</motion.div>}</AnimatePresence>
    </div>
  );
}

export function CountUp({ value }) {
  const ref = useRef(), prev = useRef(0);
  useEffect(() => {
    const c = animate(prev.current, value, { duration: 1.2, ease: [.2, .7, .2, 1], onUpdate: v => { if (ref.current) ref.current.textContent = Math.round(v); } });
    prev.current = value; return () => c.stop();
  }, [value]);
  return <span ref={ref}>0</span>;
}

export function YearsPick({ value, onChange }) {
  const all = value.length === 7;
  const tog = y => onChange(value.includes(y) ? value.filter(v => v !== y) : [...value, y].sort((a, b) => a - b));
  return (
    <div className="years-pick" role="group" aria-label="ชั้นปี">
      {[1, 2, 3, 4, 5, 6, 7].map(y => <button type="button" key={y} className={value.includes(y) ? "on" : ""} onClick={() => tog(y)} aria-pressed={value.includes(y)}>{y}</button>)}
      <button type="button" className={"all" + (all ? " on" : "")} onClick={() => onChange(all ? [] : [1, 2, 3, 4, 5, 6, 7])}>ทุกปี</button>
    </div>
  );
}

export const Empty = ({ children }) => <div className="empty">{children}</div>;
