import React, { useMemo, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { DAYS, DAYS_SHORT, H0, nm, pad, isoDow, schoolDay } from "../lib/time.js";
import { useNow } from "../lib/hooks.js";

function lanes(evs) {
  evs.sort((x, y) => x.a - y.a || y.b - x.b);
  let cl = [], end = -1;
  const flush = () => { const L = []; for (const e of cl) { let i = L.findIndex(t => t <= e.a); if (i < 0) { i = L.length; L.push(0); } L[i] = e.b; e.lane = i; } cl.forEach(e => (e.n = L.length)); cl = []; };
  for (const e of evs) { if (cl.length && e.a >= end) flush(); cl.push(e); end = Math.max(end, e.b); }
  if (cl.length) flush(); return evs;
}

export default function WeekGrid({ courses, compact, onPick }) {
  const now = useNow(30000), HP = compact ? 30 : 54, today = isoDow(schoolDay(now));
  const sessions = useMemo(() => courses.flatMap(c => (c.sessions || []).map(s => ({ c, s, day: +s.day, a: nm(s.start), b: Math.max(nm(s.end), nm(s.start) + 15) }))), [courses]);
  // visible hour range: fit the data, fall back to the evening block
  const lo = sessions.length ? Math.floor(Math.min(...sessions.map(x => x.a)) / 60) : 12;
  const hi = sessions.length ? Math.ceil(Math.max(...sessions.map(x => x.b)) / 60) : 20;
  const hours = Array.from({ length: hi - lo }, (_, i) => lo + i);
  const nowM = nm(pad(now.getHours()) + ":" + pad(now.getMinutes()));
  const scroller = useRef();
  useEffect(() => { if (scroller.current && compact) scroller.current.scrollLeft = 0; }, [compact]);
  return (
    <div className={"week" + (compact ? " compact" : "")} ref={scroller}>
      <div className="week-grid" style={{ "--hp": HP + "px", gridTemplateRows: `auto ${hours.length * HP}px` }}>
        <div className="wk-corner" />
        {DAYS.slice(1).map((d, i) => <div key={d} className={"wk-day" + (i + 1 === today ? " today" : "")}>{compact ? DAYS_SHORT[i + 1] : d}</div>)}
        <div className="wk-hours">{hours.map(h => <div key={h}>{pad((h + H0) % 24)}:00</div>)}</div>
        {[1, 2, 3, 4, 5, 6, 7].map(day => {
          const evs = lanes(sessions.filter(x => x.day === day).map(x => ({ ...x })));
          return (
            <div key={day} className={"wk-col" + (day === today ? " today" : "")}>
              {evs.map((x, i) => (
                <motion.button key={x.c.id + i} className="wk-ev" onClick={() => onPick?.(x.c)} title={`${x.c.name} ${x.s.start}–${x.s.end}`}
                  initial={{ opacity: 0, scale: .9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: .02 * i + day * .03 }}
                  style={{ "--c": x.c.color || "#2fbf7f", top: ((x.a - lo * 60) / 60) * HP, height: Math.max(((x.b - x.a) / 60) * HP - 3, 18), left: `calc(${(x.lane / x.n) * 100}% + 2px)`, width: `calc(${100 / x.n}% - 4px)` }}>
                  <b>{x.c.name}</b>{!compact && <span>{x.s.start}–{x.s.end}</span>}{!compact && x.c.room && <span>⌖ {x.c.room}</span>}
                </motion.button>
              ))}
              {day === today && nowM >= lo * 60 && nowM <= hi * 60 && <div className="wk-now" style={{ top: ((nowM - lo * 60) / 60) * HP }} />}
            </div>
          );
        })}
      </div>
    </div>
  );
}
