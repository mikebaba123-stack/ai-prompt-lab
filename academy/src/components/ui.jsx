import React, { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence, animate } from "framer-motion";
import { useApp } from "../lib/store.js";
import slyCrest from "../assets/crest-slytherin.webp";
import academyCrest from "../assets/crest-academy.webp";

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

/* house crest (Slytherin) and school crest (all four houses), from the artwork supplied for the site */
export function Crest({ size = 44, className = "" }) {
  return <img className={"crest " + className} src={slyCrest} width={size} height={Math.round(size * 5032 / 3868)} alt="ตราบ้านสลิธีริน" draggable="false" />;
}
export function AcademyCrest({ size = 44, className = "" }) {
  return <img className={"crest academy " + className} src={academyCrest} width={size} height={Math.round(size * 5097 / 4259)} alt="ตรา Slytherin Academy" draggable="false" />;
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
