import React, { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Card, Crest, CountUp, Empty } from "../components/ui.jsx";
import WeekGrid from "../components/WeekGrid.jsx";
import { openEditor } from "../components/forms.jsx";
import { useApp, setProfile } from "../lib/store.js";
import { useData, useNow } from "../lib/hooks.js";
import { CONFIG } from "../config.js";
import { nextClass, fmtDur, fmtDate, span, parseYmd, at, pad, schoolDay, ymd, yearsTxt } from "../lib/time.js";

function MagicClock({ now }) {
  const sec = now.getSeconds() + now.getMilliseconds() / 1000, a = (sec / 60) * Math.PI * 2 - Math.PI / 2;
  const runes = "ᚠᚢᚦᚨᚱᚲᚷᚹᚺᚾᛁᛃ";
  return (
    <div className="clock">
      <svg viewBox="0 0 200 200" className="clock-ring" aria-hidden="true">
        <defs><radialGradient id="clk" cx=".5" cy=".5" r=".5"><stop offset="0" stopColor="#0d3b2c" /><stop offset="1" stopColor="#050a08" /></radialGradient></defs>
        <circle cx="100" cy="100" r="92" fill="url(#clk)" stroke="#C0C6C8" strokeOpacity=".5" strokeWidth="1.5" />
        <circle cx="100" cy="100" r="84" fill="none" stroke="#B89B62" strokeOpacity=".45" strokeDasharray="1 5" />
        <g className="clock-runes">{[...runes].map((r, i) => { const t = (i / 12) * Math.PI * 2 - Math.PI / 2; return <text key={i} x={100 + Math.cos(t) * 74} y={104 + Math.sin(t) * 74} textAnchor="middle" fontSize="11" fill="#C0C6C8" fillOpacity=".7">{r}</text>; })}</g>
        {[...Array(60)].map((_, i) => { const t = (i / 60) * Math.PI * 2; const r1 = i % 5 ? 88 : 85; return <line key={i} x1={100 + Math.cos(t) * r1} y1={100 + Math.sin(t) * r1} x2={100 + Math.cos(t) * 91} y2={100 + Math.sin(t) * 91} stroke="#C0C6C8" strokeOpacity={i % 5 ? .3 : .8} />; })}
        <circle cx={100 + Math.cos(a) * 92} cy={100 + Math.sin(a) * 92} r="4" fill="#5dffb0" className="clock-orb" />
      </svg>
      <div className="clock-face">
        <div className="clock-time">{pad(now.getHours())}<i>:</i>{pad(now.getMinutes())}<small>{pad(now.getSeconds())}</small></div>
        <div className="clock-date">{now.toLocaleDateString("th-TH", { weekday: "long", day: "numeric", month: "long" })}</div>
      </div>
    </div>
  );
}

function Countdown({ courses, now }) {
  const n = useMemo(() => nextClass(courses, now), [courses, Math.floor(now / 30000)]); // eslint-disable-line
  if (!n) return <Empty>ยังไม่มีคาบเรียนในสองสัปดาห์นี้<br /><button className="btn ghost sm" onClick={() => openEditor("courses")}>＋ เพิ่มรายวิชา</button></Empty>;
  const running = n.start <= now, total = n.end - n.start, pct = running ? ((now - n.start) / total) * 100 : 0;
  return (
    <div className="countdown" style={{ "--c": n.course.color }}>
      <div className="cd-label">{running ? "กำลังเรียนอยู่ · เหลือเวลา" : "คาบถัดไปจะเริ่มใน"}</div>
      <div className="cd-time">{fmtDur((running ? n.end : n.start) - now)}</div>
      <div className="cd-course"><i />{n.course.name}</div>
      <div className="cd-meta">{n.start.toDateString() === now.toDateString() ? "วันนี้" : fmtDate(n.date, { weekday: "long" })} {n.session.start}–{n.session.end}{n.course.room && " · " + n.course.room}{n.course.teacher && " · " + n.course.teacher}</div>
      {running && <div className="bar"><motion.span initial={{ width: 0 }} animate={{ width: pct + "%" }} /></div>}
    </div>
  );
}

function DiscordStatus() {
  const mode = useApp(s => s.mode), discord = useApp(s => s.discord), err = useApp(s => s.error);
  const st = mode !== "supabase" ? ["idle", "โหมดสาธิต", "ยังไม่ได้เชื่อมฐานข้อมูลกลาง การแจ้งเตือนจึงยังไม่ทำงาน"]
    : discord ? ["ok", "เชื่อมต่อแล้ว", "ทุกการเพิ่ม แก้ไข หรือลบ จะส่งเข้าห้อง Discord ของบ้านทันที"]
    : discord === false ? ["warn", "ยังไม่ได้ตั้ง Webhook", "ฐานข้อมูลพร้อมแล้ว เหลือใส่ Discord webhook อีกขั้นเดียว"]
    : ["warn", "ตรวจสอบสถานะไม่ได้", "อัปเดตไฟล์ setup.sql เวอร์ชันล่าสุดในฐานข้อมูล"];
  return (
    <div className={"discord st-" + st[0]}>
      <div className="dc-row">
        <svg viewBox="0 0 24 24" width="34" height="34" aria-hidden="true"><path fill="currentColor" d="M20.3 4.4A19.6 19.6 0 0 0 15.4 3l-.6 1.3a18 18 0 0 0-5.6 0L8.6 3a19.6 19.6 0 0 0-4.9 1.4C.6 9 0 13.6.3 18.1A19.8 19.8 0 0 0 6.3 21l1.3-2a12.8 12.8 0 0 1-2-1l.5-.4a14 14 0 0 0 11.8 0l.5.4-2 1 1.3 2a19.7 19.7 0 0 0 6-2.9c.5-5.2-.8-9.7-3.4-13.7ZM8.5 15.3c-1.2 0-2.1-1-2.1-2.3s.9-2.3 2.1-2.3 2.1 1 2.1 2.3-.9 2.3-2.1 2.3Zm7 0c-1.2 0-2.1-1-2.1-2.3s.9-2.3 2.1-2.3 2.1 1 2.1 2.3-.9 2.3-2.1 2.3Z" /></svg>
        <div><div className="dc-state"><span className="dot" />{st[1]}</div><p className="muted">{err || st[2]}</p></div>
      </div>
      <div className="row">
        <a className="btn ghost sm" href="#connect">ตั้งค่าการเชื่อมต่อ</a>
        {/^https:\/\//.test(CONFIG.discordInviteUrl) && <a className="btn discord sm" href={CONFIG.discordInviteUrl} target="_blank" rel="noopener">เข้าห้อง Discord</a>}
      </div>
    </div>
  );
}

export default function Dashboard() {
  const now = useNow(1000), d = useData(), profile = useApp(s => s.profile), done = useApp(s => s.done), mode = useApp(s => s.mode);
  const [nameDraft, setNameDraft] = useState("");
  const upcomingExams = d.exams.filter(e => span(parseYmd(e.date), e.start_time, e.end_time)[1] >= now).sort((a, b) => (a.date + a.start_time).localeCompare(b.date + b.start_time));
  const pending = d.assignments.filter(a => !done[a.id]), overdue = pending.filter(a => at(parseYmd(a.due_date), a.due_time || "23:59") < now);
  const anns = [...d.announcements].sort((a, b) => (b.pinned - a.pinned) || (b.created_at || "").localeCompare(a.created_at || "")).slice(0, 4);
  const evs = d.events.filter(e => span(parseYmd(e.date), e.start_time, e.end_time)[1] >= now).sort((a, b) => (a.date + a.start_time).localeCompare(b.date + b.start_time)).slice(0, 4);
  const hour = now.getHours(), greet = hour < 5 ? "ราตรีสวัสดิ์" : hour < 12 ? "อรุณสวัสดิ์" : hour < 18 ? "สวัสดียามบ่าย" : "สวัสดียามค่ำ";
  return (
    <div className="page dash">
      <section className="hero">
        <motion.div className="hero-crest" initial={{ opacity: 0, scale: .8, rotateY: -40 }} animate={{ opacity: 1, scale: 1, rotateY: 0 }} transition={{ duration: 1.4, ease: [.2, .7, .2, 1] }}><Crest size={92} /></motion.div>
        <div>
          <motion.div className="eyebrow" initial={{ opacity: 0, letterSpacing: ".8em" }} animate={{ opacity: 1, letterSpacing: ".42em" }} transition={{ duration: 1.6 }}>The Serpent's Legacy</motion.div>
          <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1, delay: .2 }}>{greet}, {profile.name ? <em>{profile.name}</em> : <em>ผู้สืบทอด</em>}</motion.h1>
          {profile.name
            ? <motion.p className="lede" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: .5, duration: 1 }}>ความทะเยอทะยานไม่ได้รอโอกาส มันสร้างโอกาสขึ้นมาเอง วันนี้คุณมี {d.courses.length} รายวิชาในตาราง และงานค้าง {pending.length} ชิ้น</motion.p>
            : <form className="name-set" onSubmit={e => { e.preventDefault(); if (nameDraft.trim()) setProfile({ name: nameDraft.trim() }); }}>
                <label htmlFor="nm" className="muted">บอกชื่อของคุณ เพื่อให้ปราสาทจำได้</label>
                <div className="row"><input id="nm" value={nameDraft} maxLength={60} onChange={e => setNameDraft(e.target.value)} placeholder="ชื่อของคุณ" /><button className="btn primary sm">บันทึก</button></div>
              </form>}
          {mode === "demo" && <span className="chip gold">โหมดสาธิต · กำลังแสดงข้อมูลตัวอย่าง</span>}
        </div>
      </section>

      <div className="dash-grid">
        <Card eyebrow="Academic Year" title={`ปีการศึกษา ${CONFIG.academicYear}`} className="c-year" delay={.05}>
          <div className="year-big">{profile.year ? <>ชั้นปีที่ <b>{profile.year}</b></> : <b>ทุกชั้นปี</b>}</div>
          <p className="muted">{CONFIG.term} · {fmtDate(now, { day: "numeric", month: "long", year: "numeric" })}</p>
          <div className="year-dots">{[1, 2, 3, 4, 5, 6, 7].map(y => <button key={y} className={y === profile.year ? "on" : ""} onClick={() => setProfile({ year: y })} aria-label={"ชั้นปีที่ " + y}>{y}</button>)}</div>
        </Card>
        <Card eyebrow="Magic Clock" className="c-clock" delay={.1}><MagicClock now={now} /></Card>
        <Card eyebrow="Countdown" title="คาบเรียนถัดไป" className="c-count" delay={.15}><Countdown courses={d.courses} now={now} /></Card>

        <div className="stats">
          {[["รายวิชา", d.courses.length, "#schedule", "ที่ลงทะเบียนในชั้นปีนี้"], ["การสอบที่กำลังจะมาถึง", upcomingExams.length, "#tasks", upcomingExams[0] ? "ถัดไป " + fmtDate(upcomingExams[0].date) : "ยังไม่มีกำหนดสอบ"], ["งานที่ยังไม่ส่ง", pending.length, "#tasks", overdue.length ? `เลยกำหนด ${overdue.length} ชิ้น` : "ไม่มีงานเลยกำหนด"]].map(([l, v, h, s], i) => (
            <motion.a key={l} href={h} className={"card stat" + (i === 2 && overdue.length ? " alert" : "")} initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: .2 + i * .08 }} whileHover={{ y: -4 }}>
              <span className="stat-label">{l}</span><span className="stat-num"><CountUp value={v} /></span><span className="muted">{s}</span>
            </motion.a>
          ))}
        </div>

        <Card eyebrow="Weekly Schedule" title="ตารางเรียนประจำสัปดาห์" className="c-week" delay={.3} action={<a className="btn ghost sm" href="#schedule">ดูเต็ม →</a>}>
          {d.courses.length ? <WeekGrid courses={d.courses} compact onPick={c => openEditor("courses", c)} /> : <Empty>ยังไม่มีรายวิชา</Empty>}
        </Card>
        <Card eyebrow="Announcements" title="ประกาศล่าสุด" className="c-ann" delay={.35} action={<button className="btn ghost sm" onClick={() => openEditor("announcements")}>＋ ประกาศ</button>}>
          <ul className="feed">{anns.map(a => (
            <li key={a.id} onClick={() => openEditor("announcements", a)}>
              <div className="feed-title">{a.pinned && <span className="pin" title="ปักหมุด">◆</span>}{a.title}</div>
              <p>{a.body}</p><span className="muted small">{a.created_by} · {a.created_at ? new Date(a.created_at).toLocaleDateString("th-TH", { day: "numeric", month: "short" }) : ""} · {yearsTxt(a.years)}</span>
            </li>))}
            {!anns.length && <Empty>ยังไม่มีประกาศ</Empty>}</ul>
        </Card>
        <Card eyebrow="Upcoming Events" title="กิจกรรมที่กำลังจะมาถึง" className="c-ev" delay={.4} action={<a className="btn ghost sm" href="#board">ทั้งหมด →</a>}>
          <ul className="events">{evs.map(e => { const dt = parseYmd(e.date); return (
            <li key={e.id} onClick={() => openEditor("events", e)}>
              <div className="ev-date"><b>{dt.getDate()}</b>{dt.toLocaleDateString("th-TH", { month: "short" })}</div>
              <div><div className="feed-title">{e.title}</div><span className="muted small">{fmtDate(e.date, { weekday: "long" })} {e.start_time}–{e.end_time}{e.place && " · " + e.place}</span></div>
              <span className="chip">{e.category}</span>
            </li>); })}
            {!evs.length && <Empty>ยังไม่มีกิจกรรม</Empty>}</ul>
        </Card>
        <Card eyebrow="Discord" title="สถานะการเชื่อมต่อ" className="c-dc" delay={.45}><DiscordStatus /></Card>
      </div>
    </div>
  );
}
