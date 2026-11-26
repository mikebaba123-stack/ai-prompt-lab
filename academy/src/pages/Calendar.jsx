import React, { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, Empty } from "../components/ui.jsx";
import { openEditor } from "../components/forms.jsx";
import { useData, useNow } from "../lib/hooks.js";
import { addDays, mondayOf, ymd, occurrences, schoolDay, fmtDate, DAYS_SHORT } from "../lib/time.js";

export default function Calendar() {
  const d = useData(), now = useNow(60000), today = ymd(schoolDay(now));
  const [month, setMonth] = useState(() => { const t = schoolDay(); return new Date(t.getFullYear(), t.getMonth(), 1); });
  const [sel, setSel] = useState(today);
  const start = mondayOf(month), cells = [...Array(42)].map((_, i) => addDays(start, i));
  const byDay = useMemo(() => {
    const m = {}, put = (k, x) => (m[k] = m[k] || []).push(x);
    occurrences(d.courses, start, addDays(start, 42)).forEach(o => put(ymd(o.date), { t: "class", o }));
    d.exams.forEach(e => put(e.date, { t: "exam", e })); d.assignments.forEach(a => put(a.due_date, { t: "due", a })); d.events.forEach(e => put(e.date, { t: "event", e }));
    return m;
  }, [d, +start]);
  const list = byDay[sel] || [];
  const course = id => d.all.courses.find(c => c.id === id);
  return (
    <div className="page">
      <header className="page-head">
        <div><div className="eyebrow">Calendar</div><h1>ปฏิทิน</h1><p className="muted">คาบเรียน การสอบ กำหนดส่งงาน และกิจกรรมในที่เดียว</p></div>
        <div className="row">
          <button className="btn ghost" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))} aria-label="เดือนก่อน">‹</button>
          <h2 className="month">{month.toLocaleDateString("th-TH", { month: "long", year: "numeric" })}</h2>
          <button className="btn ghost" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))} aria-label="เดือนถัดไป">›</button>
          <button className="btn ghost" onClick={() => { const t = schoolDay(); setMonth(new Date(t.getFullYear(), t.getMonth(), 1)); setSel(today); }}>วันนี้</button>
        </div>
      </header>
      <div className="cal-wrap">
        <Card className="cal-card">
          <div className="cal">
            {DAYS_SHORT.slice(1).map(x => <div key={x} className="cal-h">{x}</div>)}
            {cells.map(c => {
              const k = ymd(c), items = byDay[k] || [], cls = items.filter(x => x.t === "class");
              return (
                <button key={k} className={"cal-c" + (c.getMonth() !== month.getMonth() ? " out" : "") + (k === today ? " today" : "") + (k === sel ? " sel" : "")} onClick={() => setSel(k)}>
                  <span className="cal-n">{c.getDate()}</span>
                  <span className="cal-dots">{cls.slice(0, 5).map((x, i) => <i key={i} style={{ background: x.o.course.color }} />)}</span>
                  {items.filter(x => x.t !== "class").slice(0, 2).map((x, i) => <span key={i} className={"cal-tag " + x.t}>{x.t === "exam" ? "สอบ" : x.t === "due" ? "ส่งงาน" : (x.e.title)}</span>)}
                </button>
              );
            })}
          </div>
        </Card>
        <Card className="cal-side" eyebrow={fmtDate(sel, { weekday: "long" })} title={fmtDate(sel, { day: "numeric", month: "long", year: "numeric" })}
          action={<div className="row"><button className="btn ghost sm" onClick={() => openEditor("exams", null, { date: sel, years: d.year ? [d.year] : [] })}>＋ สอบ</button><button className="btn ghost sm" onClick={() => openEditor("events", null, { date: sel })}>＋ กิจกรรม</button></div>}>
          <AnimatePresence mode="wait">
            <motion.ul key={sel} className="day-list" initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }}>
              {list.map((x, i) => x.t === "class"
                ? <li key={i} style={{ "--c": x.o.course.color }} onClick={() => openEditor("courses", x.o.course)}><span className="tm">{x.o.session.start}–{x.o.session.end}</span><b>{x.o.course.name}</b><span className="muted small">{x.o.course.room} · {x.o.course.teacher}</span></li>
                : x.t === "exam" ? <li key={i} className="exam" onClick={() => openEditor("exams", x.e)}><span className="tm">{x.e.start_time}–{x.e.end_time}</span><b>⚗ {x.e.title}</b><span className="muted small">{x.e.room}</span></li>
                : x.t === "due" ? <li key={i} className="due" onClick={() => openEditor("assignments", x.a)}><span className="tm">ส่งภายใน {x.a.due_time || "23:59"}</span><b>🪶 {x.a.title}</b><span className="muted small">{course(x.a.course_id)?.name}</span></li>
                : <li key={i} className="event" onClick={() => openEditor("events", x.e)}><span className="tm">{x.e.start_time}–{x.e.end_time}</span><b>🕯 {x.e.title}</b><span className="muted small">{x.e.place}</span></li>)}
              {!list.length && <Empty>วันนี้ว่าง ไม่มีคาบเรียนหรือกำหนดการ</Empty>}
            </motion.ul>
          </AnimatePresence>
        </Card>
      </div>
    </div>
  );
}
