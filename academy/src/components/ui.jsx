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

/* the house crest: a gold serpent coiled on an obsidian shield */
export function Crest({ size = 44, className = "" }) {
  return (
    <svg className={"crest " + className} width={size} height={size * 54 / 48} viewBox="0 0 48 54" role="img" aria-label="ตรา Slytherin Academy">
      <defs><linearGradient id="cr-g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#e3cd96" /><stop offset="1" stopColor="#a68850" /></linearGradient></defs>
      <path d="M24 2 43 9v16c0 13-8.3 22.2-19 27C13.3 47.2 5 38 5 25V9L24 2Z" fill="#07130f" stroke="#bfc8c9" strokeWidth="1.5" />
      <path d="M24 6.5 39.5 12v13c0 10.6-6.6 18.3-15.5 22.4C15.1 43.3 8.5 35.6 8.5 25V12L24 6.5Z" fill="none" stroke="#b89b62" strokeOpacity=".25" strokeWidth=".6" />
      <path d="M30.5 13c-7-2.8-12 1-11 5.4.7 3.1 5.6 3.4 6.7 6.4 1.2 3.4-2.1 5.6-5.4 5.1-3.4-.5-5.7 1.7-4.4 5.2 1.3 3.6 6.8 5 10.8 2.9 5.7-3 7.2-9.7 3.4-14.4-2.2-2.8-5.3-3.2-5.2-5.1.1-1.3 2.1-2.1 5.1-.7" fill="none" stroke="url(#cr-g)" strokeLinecap="round" strokeWidth="2" />
      <circle cx="31.3" cy="12.8" r="1.4" fill="#57d7a6" />
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
