import React, { useState } from "react";
import { motion } from "framer-motion";
import { Card, Empty } from "../components/ui.jsx";
import WeekGrid from "../components/WeekGrid.jsx";
import { openEditor } from "../components/forms.jsx";
import { useData } from "../lib/hooks.js";
import { DAYS_SHORT, nm, yearsTxt } from "../lib/time.js";

export default function Schedule() {
  const d = useData(), [view, setView] = useState("week");
  const hours = d.courses.reduce((s, c) => s + (c.sessions || []).reduce((t, x) => t + (nm(x.end) - nm(x.start)) / 60, 0), 0);
  return (
    <div className="page">
      <header className="page-head">
        <div><div className="eyebrow">Class Schedule</div><h1>ตารางเรียน</h1>
          <p className="muted">{d.courses.length} รายวิชา · {hours % 1 ? hours.toFixed(1) : hours} ชั่วโมงต่อสัปดาห์ · {d.year ? "ชั้นปีที่ " + d.year : "ทุกชั้นปี"}</p></div>
        <div className="row">
          <div className="seg" role="tablist">{[["week", "รายสัปดาห์"], ["list", "รายวิชาทั้งหมด"]].map(([k, l]) => <button key={k} role="tab" aria-selected={view === k} className={view === k ? "on" : ""} onClick={() => setView(k)}>{l}</button>)}</div>
          <button className="btn primary" onClick={() => openEditor("courses", null, d.year ? { years: [d.year] } : {})}>＋ เพิ่มรายวิชา</button>
        </div>
      </header>
      {view === "week" ? (
        <Card className="tall" eyebrow="Weekly View" title="ตารางรายสัปดาห์" action={<span className="muted small">กดที่คาบเพื่อแก้ไขรายวิชา</span>}>
          {d.courses.length ? <WeekGrid courses={d.courses} onPick={c => openEditor("courses", c)} /> : <Empty>ยังไม่มีรายวิชา กด “เพิ่มรายวิชา” เพื่อเริ่ม</Empty>}
        </Card>
      ) : (
        <div className="course-grid">
          {d.courses.map((c, i) => (
            <motion.article key={c.id} className="card course" style={{ "--c": c.color }} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * .05 }} whileHover={{ y: -4 }}>
              <div className="course-top"><span className="code">{c.code || "—"}</span><button className="btn ghost sm" onClick={() => openEditor("courses", c)}>แก้ไข</button></div>
              <h3>{c.name}</h3>
              <dl><dt>อาจารย์</dt><dd>{c.teacher || "—"}</dd><dt>ห้อง</dt><dd>{c.room || "—"}</dd><dt>ชั้นปี</dt><dd>{yearsTxt(c.years)}</dd></dl>
              <div className="slots">{(c.sessions || []).map((s, j) => <span key={j} className="chip">{DAYS_SHORT[s.day]} {s.start}–{s.end}</span>)}</div>
              {c.description && <p className="muted small">{c.description}</p>}
            </motion.article>
          ))}
          {!d.courses.length && <Empty>ยังไม่มีรายวิชา</Empty>}
        </div>
      )}
    </div>
  );
}
