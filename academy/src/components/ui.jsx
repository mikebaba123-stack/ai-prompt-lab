import React, { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence, animate } from "framer-motion";
import { useApp } from "../lib/store.js";

/* silver filigree corners: what makes a card look engraved */
const Corner = ({ style }) => (
  <svg className="corner" style={style} viewBox="0 0 40 40" aria-hidden="true">
    <path d="M2 34 V12 Q2 2 12 2 H34" />
    <path d="M7 30 V14 Q7 7 14 7 H30" opacity=".45" />
    <path d="M12 20 q2 -8 10 -9" />
    <path d="M13 13 l3 3 -3 3 -3 -3 z" className="gem" />
  </svg>
);
export function Card({ title, eyebrow, action, children, className = "", delay = 0, ...rest }) {
  return (
    <motion.section className={"card " + className} initial={{ opacity: 0, y: 24, filter: "blur(6px)" }} animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      transition={{ duration: .7, delay, ease: [.2, .7, .2, 1] }} {...rest}>
      <Corner style={{ top: 6, left: 6 }} /><Corner style={{ top: 6, right: 6, transform: "scaleX(-1)" }} />
      <Corner style={{ bottom: 6, left: 6, transform: "scaleY(-1)" }} /><Corner style={{ bottom: 6, right: 6, transform: "scale(-1,-1)" }} />
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

export function Crest({ size = 56, className = "" }) {
  return (
    <svg className={"crest " + className} width={size} height={size * 1.15} viewBox="0 0 200 230" aria-label="ตรา Slytherin Academy" role="img">
      <defs>
        <linearGradient id="cr-silver" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#ffffff" /><stop offset=".45" stopColor="#a9b2b4" /><stop offset=".7" stopColor="#eef2f3" /><stop offset="1" stopColor="#7d8789" /></linearGradient>
        <linearGradient id="cr-em" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#0d7a55" /><stop offset="1" stopColor="#03251a" /></linearGradient>
        <linearGradient id="cr-gold" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#e3cd96" /><stop offset="1" stopColor="#8c7342" /></linearGradient>
      </defs>
      <path d="M100 8 L184 30 C184 120 158 178 100 222 C42 178 16 120 16 30 Z" fill="url(#cr-em)" stroke="url(#cr-silver)" strokeWidth="6" />
      <path d="M100 22 L170 40 C168 116 146 164 100 202 C54 164 32 116 30 40 Z" fill="none" stroke="#B89B62" strokeOpacity=".55" strokeWidth="1.4" />
      <path d="M58 54 H142" stroke="url(#cr-gold)" strokeWidth="2" />
      <path d="M100 40 l6 8 -6 8 -6 -8 z" fill="url(#cr-gold)" />
      <path d="M132 76 C106 62 70 72 74 98 C78 122 128 116 130 142 C132 170 90 178 70 160 C62 152 64 142 72 140" fill="none" stroke="#2a3133" strokeWidth="15" strokeLinecap="round" />
      <path d="M132 76 C106 62 70 72 74 98 C78 122 128 116 130 142 C132 170 90 178 70 160 C62 152 64 142 72 140" fill="none" stroke="url(#cr-silver)" strokeWidth="10" strokeLinecap="round" />
      <path d="M124 70 C134 64 150 68 152 78 C146 86 134 84 128 80 Z" fill="url(#cr-silver)" stroke="#2a3133" strokeWidth="2" />
      <circle cx="141" cy="74" r="2.4" fill="#3dffa4" />
      <path d="M152 78 l9 1 m-9 -1 l8 5" stroke="#d64b5f" strokeWidth="1.6" strokeLinecap="round" />
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
