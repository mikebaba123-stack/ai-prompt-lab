import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, Empty } from "../components/ui.jsx";
import { openEditor } from "../components/forms.jsx";
import { useApp, toggleDone } from "../lib/store.js";
import { useData, useNow } from "../lib/hooks.js";
import { at, span, parseYmd, fmtDate, fmtDur, yearsTxt } from "../lib/time.js";

/* one header + filter tabs shared by the four list pages */
function Head({ eyebrow, title, sub, tabs, tab, setTab, add }) {
  return (
    <header className="page-head">
      <div><div className="eyebrow">{eyebrow}</div><h1>{title}</h1><p className="muted">{sub}</p></div>
      <div className="row">
        {tabs && <div className="seg" role="tablist">{tabs.map(([k, l]) => <button key={k} role="tab" aria-selected={tab === k} className={tab === k ? "on" : ""} onClick={() => setTab(k)}>{l}</button>)}</div>}
        {add}
      </div>
    </header>
  );
}
const ExamDate = ({ date }) => { const d = parseYmd(date); return <div className="ev-date"><b>{d.getDate()}</b>{d.toLocaleDateString("th-TH", { month: "short" })}</div>; };

export function Exams() {
  const d = useData(), now = useNow(30000), [tab, setTab] = useState("up");
  const course = id => d.all.courses.find(c => c.id === id);
  const all = [...d.exams].sort((a, b) => (a.date + a.start_time).localeCompare(b.date + b.start_time));
  const isUp = e => span(parseYmd(e.date), e.start_time, e.end_time)[1] >= now;
  const up = all.filter(isUp), past = all.filter(e => !isUp(e)).reverse(), list = tab === "up" ? up : past;
  return (
    <div className="page">
      <Head eyebrow="Examinations" title="การสอบ" sub={`กำลังจะมาถึง ${up.length} รายการ · สอบไปแล้ว ${past.length} รายการ`}
        tabs={[["up", "กำลังจะมาถึง"], ["past", "สอบไปแล้ว"]]} tab={tab} setTab={setTab}
        add={<button className="btn primary" onClick={() => openEditor("exams", null, d.year ? { years: [d.year] } : {})}>＋ เพิ่มการสอบ</button>} />
      <Card>
        <ul className="rows">{list.map(e => { const [s] = span(parseYmd(e.date), e.start_time, e.end_time), c = course(e.course_id); return (
          <motion.li key={e.id} layout onClick={() => openEditor("exams", e)} style={{ "--c": c?.color || "#B89B62" }}>
            <ExamDate date={e.date} />
            <div className="grow"><b>{e.title}</b><div className="muted small">{c ? c.name + " · " : ""}{fmtDate(e.date, { weekday: "long" })} {e.start_time}–{e.end_time}{e.room && " · " + e.room} · {yearsTxt(e.years)}</div>{e.note && <div className="small note">{e.note}</div>}</div>
            <span className={"chip" + (tab === "up" ? " gold" : "")}>{tab === "up" ? (s <= now ? "กำลังสอบ" : "อีก " + fmtDur(s - now).replace(/:\d\d:\d\d$/, " ชม.")) : "สอบแล้ว"}</span>
          </motion.li>); })}
          {!list.length && <Empty>{tab === "up" ? "ยังไม่มีกำหนดสอบ" : "ยังไม่มีการสอบที่ผ่านไป"}</Empty>}</ul>
      </Card>
    </div>
  );
}

export function Assignments() {
  const d = useData(), now = useNow(30000), done = useApp(s => s.done), [tab, setTab] = useState("todo");
  const course = id => d.all.courses.find(c => c.id === id);
  const all = [...d.assignments].map(a => ({ ...a, dueAt: at(parseYmd(a.due_date), a.due_time || "23:59") })).sort((a, b) => a.dueAt - b.dueAt);
  const todo = all.filter(a => !done[a.id]), late = todo.filter(a => a.dueAt < now), sent = all.filter(a => done[a.id]);
  const list = tab === "todo" ? todo : tab === "done" ? sent : all;
  return (
    <div className="page">
      <Head eyebrow="Assignments" title="งาน" sub={`ยังไม่ส่ง ${todo.length} ชิ้น${late.length ? ` (เลยกำหนด ${late.length})` : ""} · ส่งแล้ว ${sent.length} ชิ้น · ติ๊ก “ส่งแล้ว” บันทึกเฉพาะในเครื่องของคุณ`}
        tabs={[["todo", "ยังไม่ส่ง"], ["done", "ส่งแล้ว"], ["all", "ทั้งหมด"]]} tab={tab} setTab={setTab}
        add={<button className="btn primary" onClick={() => openEditor("assignments", null, d.year ? { years: [d.year] } : {})}>＋ เพิ่มงาน</button>} />
      <Card>
        <ul className="rows"><AnimatePresence initial={false}>{list.map(a => { const isLate = !done[a.id] && a.dueAt < now, c = course(a.course_id); return (
          <motion.li key={a.id} layout initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className={(done[a.id] ? "is-done" : "") + (isLate ? " late" : "")} style={{ "--c": c?.color || "#C0C6C8" }}>
            <button className={"tick" + (done[a.id] ? " on" : "")} onClick={() => toggleDone(a.id)} aria-label={done[a.id] ? "ทำเครื่องหมายว่ายังไม่ส่ง" : "ทำเครื่องหมายว่าส่งแล้ว"}>{done[a.id] ? "✓" : ""}</button>
            <div className="grow" onClick={() => openEditor("assignments", a)}><b>{a.title}</b><div className="muted small">{c?.name || "ไม่ระบุวิชา"} · ส่ง {fmtDate(a.due_date)} {a.due_time}</div>{a.description && <div className="small note">{a.description}</div>}</div>
            <span className={"chip" + (isLate ? " danger" : "")}>{done[a.id] ? "ส่งแล้ว" : isLate ? "เลยกำหนด" : "อีก " + fmtDur(a.dueAt - now).replace(/:\d\d$/, "")}</span>
          </motion.li>); })}</AnimatePresence>
          {!list.length && <Empty>{tab === "todo" ? "ไม่มีงานค้าง 🐍" : "ยังไม่มีงานในหมวดนี้"}</Empty>}</ul>
      </Card>
    </div>
  );
}

export function Announcements() {
  const d = useData();
  const anns = [...d.announcements].sort((a, b) => (b.pinned - a.pinned) || (b.created_at || "").localeCompare(a.created_at || ""));
  const pinned = anns.filter(a => a.pinned).length;
  return (
    <div className="page">
      <Head eyebrow="Owl post" title="ประกาศ" sub={`ประกาศทั้งหมด ${anns.length} รายการ${pinned ? ` · ปักหมุด ${pinned}` : ""}`}
        add={<button className="btn primary" onClick={() => openEditor("announcements")}>＋ เขียนประกาศ</button>} />
      <Card>
        <ul className="feed">{anns.map(a => (
          <li key={a.id} onClick={() => openEditor("announcements", a)}><div className="feed-title">{a.pinned && <span className="pin">◆</span>}{a.title}</div><p>{a.body}</p>
            <span className="muted small">{a.created_by} · {a.created_at ? new Date(a.created_at).toLocaleString("th-TH", { dateStyle: "medium", timeStyle: "short" }) : ""} · {yearsTxt(a.years)}</span></li>))}
          {!anns.length && <Empty>ยังไม่มีประกาศ</Empty>}</ul>
      </Card>
    </div>
  );
}

export function Events() {
  const d = useData(), now = useNow(60000), [tab, setTab] = useState("up");
  const all = [...d.events].sort((a, b) => (a.date + a.start_time).localeCompare(b.date + b.start_time));
  const isPast = e => span(parseYmd(e.date), e.start_time, e.end_time)[1] < now;
  const up = all.filter(e => !isPast(e)), past = all.filter(isPast).reverse(), list = tab === "up" ? up : past;
  return (
    <div className="page">
      <Head eyebrow="House events" title="กิจกรรม" sub={`กำลังจะมาถึง ${up.length} รายการ · ผ่านไปแล้ว ${past.length} รายการ`}
        tabs={[["up", "กำลังจะมาถึง"], ["past", "ผ่านไปแล้ว"]]} tab={tab} setTab={setTab}
        add={<button className="btn primary" onClick={() => openEditor("events")}>＋ เพิ่มกิจกรรม</button>} />
      <Card>
        <ul className="events">{list.map(e => { const dt = parseYmd(e.date); return (
          <li key={e.id} className={tab === "past" ? "past" : ""} onClick={() => openEditor("events", e)}>
            <div className="ev-date"><b>{dt.getDate()}</b>{dt.toLocaleDateString("th-TH", { month: "short" })}</div>
            <div className="grow"><div className="feed-title">{e.title}</div><span className="muted small">{fmtDate(e.date, { weekday: "long" })} {e.start_time}–{e.end_time}{e.place && " · " + e.place} · {yearsTxt(e.years)}</span>{e.description && <p className="small">{e.description}</p>}</div>
            <span className="chip">{e.category}</span></li>); })}
          {!list.length && <Empty>{tab === "up" ? "ยังไม่มีกิจกรรมที่กำลังจะมาถึง" : "ยังไม่มีกิจกรรมที่ผ่านไป"}</Empty>}</ul>
      </Card>
    </div>
  );
}
