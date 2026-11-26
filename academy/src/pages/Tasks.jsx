import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, Empty } from "../components/ui.jsx";
import { openEditor } from "../components/forms.jsx";
import { useApp, toggleDone } from "../lib/store.js";
import { useData, useNow } from "../lib/hooks.js";
import { at, span, parseYmd, fmtDate, fmtDur, yearsTxt } from "../lib/time.js";

export function Tasks() {
  const d = useData(), now = useNow(30000), done = useApp(s => s.done), [showDone, setShowDone] = useState(false);
  const course = id => d.all.courses.find(c => c.id === id);
  const exams = [...d.exams].sort((a, b) => (a.date + a.start_time).localeCompare(b.date + b.start_time));
  const upcoming = exams.filter(e => span(parseYmd(e.date), e.start_time, e.end_time)[1] >= now);
  const tasks = [...d.assignments].map(a => ({ ...a, dueAt: at(parseYmd(a.due_date), a.due_time || "23:59") })).sort((a, b) => a.dueAt - b.dueAt).filter(a => showDone || !done[a.id]);
  return (
    <div className="page">
      <header className="page-head"><div><div className="eyebrow">Exams &amp; Assignments</div><h1>สอบ &amp; งาน</h1><p className="muted">สถานะ “ส่งแล้ว” บันทึกเฉพาะในเครื่องของคุณ</p></div></header>
      <div className="two">
        <Card eyebrow="Examinations" title={`การสอบที่กำลังจะมาถึง (${upcoming.length})`} action={<button className="btn primary sm" onClick={() => openEditor("exams", null, d.year ? { years: [d.year] } : {})}>＋ เพิ่มการสอบ</button>}>
          <ul className="rows">{upcoming.map(e => { const [s] = span(parseYmd(e.date), e.start_time, e.end_time); const c = course(e.course_id); return (
            <motion.li key={e.id} layout onClick={() => openEditor("exams", e)} style={{ "--c": c?.color || "#B89B62" }}>
              <div className="ev-date"><b>{parseYmd(e.date).getDate()}</b>{parseYmd(e.date).toLocaleDateString("th-TH", { month: "short" })}</div>
              <div className="grow"><b>{e.title}</b><div className="muted small">{fmtDate(e.date, { weekday: "long" })} {e.start_time}–{e.end_time}{e.room && " · " + e.room} · {yearsTxt(e.years)}</div>{e.note && <div className="small note">{e.note}</div>}</div>
              <span className="chip gold">อีก {fmtDur(s - now).split(":")[0]} ชม.</span>
            </motion.li>); })}
            {!upcoming.length && <Empty>ยังไม่มีกำหนดสอบ</Empty>}</ul>
        </Card>
        <Card eyebrow="Assignments" title="งานที่ได้รับมอบหมาย" action={<div className="row"><label className="check small"><input type="checkbox" checked={showDone} onChange={e => setShowDone(e.target.checked)} /> แสดงงานที่ส่งแล้ว</label><button className="btn primary sm" onClick={() => openEditor("assignments", null, d.year ? { years: [d.year] } : {})}>＋ เพิ่มงาน</button></div>}>
          <ul className="rows"><AnimatePresence initial={false}>{tasks.map(a => { const late = !done[a.id] && a.dueAt < now, c = course(a.course_id); return (
            <motion.li key={a.id} layout initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className={(done[a.id] ? "is-done" : "") + (late ? " late" : "")} style={{ "--c": c?.color || "#C0C6C8" }}>
              <button className={"tick" + (done[a.id] ? " on" : "")} onClick={() => toggleDone(a.id)} aria-label={done[a.id] ? "ทำเครื่องหมายว่ายังไม่ส่ง" : "ทำเครื่องหมายว่าส่งแล้ว"}>{done[a.id] ? "✓" : ""}</button>
              <div className="grow" onClick={() => openEditor("assignments", a)}><b>{a.title}</b><div className="muted small">{c?.name || "ไม่ระบุวิชา"} · ส่ง {fmtDate(a.due_date)} {a.due_time}</div></div>
              <span className={"chip" + (late ? " danger" : "")}>{done[a.id] ? "ส่งแล้ว" : late ? "เลยกำหนด" : "อีก " + fmtDur(a.dueAt - now).replace(/:\d\d$/, "")}</span>
            </motion.li>); })}</AnimatePresence>
            {!tasks.length && <Empty>ไม่มีงานค้าง 🐍</Empty>}</ul>
        </Card>
      </div>
    </div>
  );
}

export function Board() {
  const d = useData(), now = useNow(60000);
  const anns = [...d.announcements].sort((a, b) => (b.pinned - a.pinned) || (b.created_at || "").localeCompare(a.created_at || ""));
  const evs = [...d.events].sort((a, b) => (a.date + a.start_time).localeCompare(b.date + b.start_time));
  return (
    <div className="page">
      <header className="page-head"><div><div className="eyebrow">House Board</div><h1>ประกาศ &amp; กิจกรรม</h1></div></header>
      <div className="two">
        <Card eyebrow="Announcements" title="ประกาศจากบ้าน" action={<button className="btn primary sm" onClick={() => openEditor("announcements")}>＋ ประกาศ</button>}>
          <ul className="feed">{anns.map(a => (
            <li key={a.id} onClick={() => openEditor("announcements", a)}><div className="feed-title">{a.pinned && <span className="pin">◆</span>}{a.title}</div><p>{a.body}</p>
              <span className="muted small">{a.created_by} · {a.created_at ? new Date(a.created_at).toLocaleString("th-TH", { dateStyle: "medium", timeStyle: "short" }) : ""} · {yearsTxt(a.years)}</span></li>))}
            {!anns.length && <Empty>ยังไม่มีประกาศ</Empty>}</ul>
        </Card>
        <Card eyebrow="Events" title="กิจกรรมทั้งหมด" action={<button className="btn primary sm" onClick={() => openEditor("events")}>＋ กิจกรรม</button>}>
          <ul className="events">{evs.map(e => { const dt = parseYmd(e.date), past = span(dt, e.start_time, e.end_time)[1] < now; return (
            <li key={e.id} className={past ? "past" : ""} onClick={() => openEditor("events", e)}>
              <div className="ev-date"><b>{dt.getDate()}</b>{dt.toLocaleDateString("th-TH", { month: "short" })}</div>
              <div className="grow"><div className="feed-title">{e.title}</div><span className="muted small">{fmtDate(e.date, { weekday: "long" })} {e.start_time}–{e.end_time}{e.place && " · " + e.place} · {yearsTxt(e.years)}</span>{e.description && <p className="small">{e.description}</p>}</div>
              <span className="chip">{past ? "ผ่านไปแล้ว" : e.category}</span></li>); })}
            {!evs.length && <Empty>ยังไม่มีกิจกรรม</Empty>}</ul>
        </Card>
      </div>
    </div>
  );
}
