import React, { useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Canvas, useFrame } from "@react-three/fiber";
import { BookOpen, GraduationCap, Clock3, Sparkles, MapPin, WandSparkles, MessageCircle, ArrowRight } from "lucide-react";
import { Card, CountUp, Empty, Crest } from "../components/ui.jsx";
import WeekGrid from "../components/WeekGrid.jsx";
import { openEditor } from "../components/forms.jsx";
import { useApp, setProfile } from "../lib/store.js";
import { useData, useNow } from "../lib/hooks.js";
import { CONFIG } from "../config.js";
import { nextClass, fmtDur, fmtDate, span, parseYmd, at, pad, yearsTxt } from "../lib/time.js";

/* the silver serpent knot that hovers in the hero */
function SerpentArtifact() {
  const knot = useRef(), ring = useRef();
  useFrame((s, d) => {
    knot.current.rotation.y += d * .14; knot.current.rotation.x = Math.sin(s.clock.elapsedTime * .35) * .12;
    ring.current.rotation.z -= d * .08;
  });
  return (
    <group rotation={[.18, 0, -.12]}>
      <mesh ref={knot} scale={1.25}><torusKnotGeometry args={[1.12, .105, 220, 20, 2, 3]} /><meshStandardMaterial color="#b9c5c5" metalness={.94} roughness={.2} /></mesh>
      <mesh ref={ring} rotation={[1.2, .2, 0]} scale={1.45}><torusGeometry args={[1.22, .015, 8, 140]} /><meshBasicMaterial color="#9bf8d3" transparent opacity={.34} /></mesh>
      <pointLight color="#4ff5ba" intensity={8} distance={5} position={[1, 1, 1]} />
    </group>
  );
}

function MagicClock({ now }) {
  const sec = now.getSeconds() + now.getMilliseconds() / 1000, a = (sec / 60) * Math.PI * 2 - Math.PI / 2;
  return (
    <div className="clock">
      <svg viewBox="0 0 200 200" className="clock-ring" aria-hidden="true">
        <defs><radialGradient id="clk" cx=".5" cy=".5" r=".5"><stop offset="0" stopColor="#0f2a20" /><stop offset="1" stopColor="#060c09" /></radialGradient></defs>
        <circle cx="100" cy="100" r="92" fill="url(#clk)" stroke="#8aa89a" strokeOpacity=".3" strokeWidth="1" />
        <circle cx="100" cy="100" r="84" fill="none" stroke="#b89b62" strokeOpacity=".35" strokeDasharray="1 5" />
        <g className="clock-runes">{[..."ᚠᚢᚦᚨᚱᚲᚷᚹᚺᚾᛁᛃ"].map((r, i) => { const t = (i / 12) * Math.PI * 2 - Math.PI / 2; return <text key={i} x={100 + Math.cos(t) * 73} y={104 + Math.sin(t) * 73} textAnchor="middle" fontSize="10" fill="#8aa89a" fillOpacity=".55">{r}</text>; })}</g>
        {[...Array(60)].map((_, i) => { const t = (i / 60) * Math.PI * 2, r1 = i % 5 ? 88 : 85; return <line key={i} x1={100 + Math.cos(t) * r1} y1={100 + Math.sin(t) * r1} x2={100 + Math.cos(t) * 91} y2={100 + Math.sin(t) * 91} stroke="#c0c6c8" strokeOpacity={i % 5 ? .18 : .55} />; })}
        <circle cx={100 + Math.cos(a) * 92} cy={100 + Math.sin(a) * 92} r="3.5" fill="#a5f0d1" className="clock-orb" />
      </svg>
      <div className="clock-face">
        <div className="clock-time">{pad(now.getHours())}<i>:</i>{pad(now.getMinutes())}<small>{pad(now.getSeconds())}</small></div>
        <div className="clock-date">{now.toLocaleDateString("th-TH", { weekday: "long", day: "numeric", month: "long" })}</div>
      </div>
    </div>
  );
}

function NextRitual({ courses, now }) {
  const n = useMemo(() => nextClass(courses, now), [courses, Math.floor(now / 30000)]); // eslint-disable-line
  if (!n) return <Empty>ยังไม่มีคาบเรียนในสองสัปดาห์นี้<button className="btn ghost sm" onClick={() => openEditor("courses")}>＋ เพิ่มรายวิชา</button></Empty>;
  const running = n.start <= now, pct = running ? ((now - n.start) / (n.end - n.start)) * 100 : 0;
  return (
    <div className="ritual" style={{ "--c": n.course.color }}>
      <div className="begins"><span>{running ? "Ends in" : "Begins in"}</span><b>{fmtDur((running ? n.end : n.start) - now).replace(/:/g, " : ")}</b></div>
      <button className="ritual-row" onClick={() => openEditor("courses", n.course)}>
        <div className="date-block"><span>{n.date.toLocaleDateString("en-GB", { weekday: "short" })}</span><b>{n.date.getDate()}</b></div>
        <div className="grow">
          <div className="code">{n.course.code || "COURSE"}{running && <em> · กำลังเรียน</em>}</div>
          <h4>{n.course.name}</h4>
          <p>{[n.course.teacher, n.course.room].filter(Boolean).join(" · ")}</p>
        </div>
        <div className="ritual-time"><b>{n.session.start}</b><span>ถึง {n.session.end}</span></div>
      </button>
      {running && <div className="bar"><motion.span initial={{ width: 0 }} animate={{ width: pct + "%" }} /></div>}
    </div>
  );
}

function StatCard({ icon: Icon, value, label, note, href, alert, delay }) {
  return (
    <motion.a href={href} className={"card stat" + (alert ? " alert" : "")} initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay }} whileHover={{ y: -3 }}>
      <span className="card-hair" aria-hidden="true" />
      <div className="stat-top"><span className="stat-ico"><Icon size={17} strokeWidth={1.6} /></span><span className="stat-note">{note}</span></div>
      <div className="stat-num"><CountUp value={value} /></div>
      <div className="stat-label">{label}</div>
    </motion.a>
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
      <div className="dc-row"><span className="stat-ico"><MessageCircle size={17} strokeWidth={1.6} /></span>
        <div><div className="dc-state"><span className="dot" />{st[1]}</div><p className="muted small">{err || st[2]}</p></div></div>
      <div className="row">
        <a className="btn ghost sm" href="#connect">ตั้งค่าการเชื่อมต่อ</a>
        {/^https:\/\//.test(CONFIG.discordInviteUrl) && <a className="btn discord sm" href={CONFIG.discordInviteUrl} target="_blank" rel="noopener">เข้าห้อง Discord</a>}
      </div>
    </div>
  );
}

const ago = iso => {
  if (!iso) return ""; const m = Math.round((Date.now() - new Date(iso)) / 60000);
  return m < 1 ? "เมื่อสักครู่" : m < 60 ? m + " นาทีที่แล้ว" : m < 1440 ? Math.round(m / 60) + " ชั่วโมงที่แล้ว" : m < 2880 ? "เมื่อวาน" : new Date(iso).toLocaleDateString("th-TH", { day: "numeric", month: "short" });
};
const EV_COLORS = { "สังสรรค์": "#b89b62", "วิชาการ": "#927eaf", "กีฬา": "#52c696", "พิธีการ": "#c9a968", "ประชุมบ้าน": "#6fa8c9" };

export default function Dashboard() {
  const now = useNow(1000), d = useData(), profile = useApp(s => s.profile), done = useApp(s => s.done), mode = useApp(s => s.mode), fx = useApp(s => s.fx);
  const [nameDraft, setNameDraft] = useState("");
  const upcomingExams = d.exams.filter(e => span(parseYmd(e.date), e.start_time, e.end_time)[1] >= now).sort((a, b) => (a.date + a.start_time).localeCompare(b.date + b.start_time));
  const pending = d.assignments.filter(a => !done[a.id]), overdue = pending.filter(a => at(parseYmd(a.due_date), a.due_time || "23:59") < now);
  const anns = [...d.announcements].sort((a, b) => (b.pinned - a.pinned) || (b.created_at || "").localeCompare(a.created_at || "")).slice(0, 4);
  const evs = d.events.filter(e => span(parseYmd(e.date), e.start_time, e.end_time)[1] >= now).sort((a, b) => (a.date + a.start_time).localeCompare(b.date + b.start_time)).slice(0, 3);
  const examDays = upcomingExams[0] ? Math.max(0, Math.ceil((parseYmd(upcomingExams[0].date) - new Date(now.getFullYear(), now.getMonth(), now.getDate())) / 864e5)) : null;
  const hour = now.getHours(), greet = hour < 5 ? "ราตรีสวัสดิ์" : hour < 12 ? "อรุณสวัสดิ์" : hour < 18 ? "สวัสดียามบ่าย" : "สวัสดียามค่ำ";
  return (
    <div className="page dash">
      <section className="hero-panel">
        <div className="hero-sheen" />
        {fx && fx !== "off" && (
          <div className="hero-3d" aria-hidden="true">
            <Canvas camera={{ position: [0, 0, 4.5], fov: 45 }} dpr={[1, 1.75]} gl={{ alpha: true, antialias: true }}>
              <ambientLight intensity={.8} /><directionalLight color="#e1eee9" position={[-3, 4, 5]} intensity={2.5} /><SerpentArtifact />
            </Canvas>
          </div>
        )}
        <motion.div className="hero-in" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .8 }}>
          <motion.div className="hero-crest" initial={{ opacity: 0, scale: .85, rotateY: -35 }} animate={{ opacity: 1, scale: 1, rotateY: 0 }} transition={{ duration: 1.2, ease: [.2, .7, .2, 1] }}><Crest size={84} /></motion.div>
          <div className="kick"><Sparkles size={12} /> The serpent's legacy</div>
          <h1>{greet},<br /><em>{profile.name || "ผู้สืบทอดแห่งสลิธีริน"}</em></h1>
          {profile.name
            ? <p className="quote">“ความยิ่งใหญ่ไม่ได้มาจากการสืบทอด แต่ถูกเรียกขึ้นจากเงามืด หลอมด้วยความทะเยอทะยาน และเป็นของผู้ที่กล้าเอื้อมคว้า”</p>
            : <form className="name-set" onSubmit={e => { e.preventDefault(); if (nameDraft.trim()) setProfile({ name: nameDraft.trim() }); }}>
                <label htmlFor="nm">บอกชื่อของคุณ เพื่อให้ห้องนั่งเล่นจดจำได้</label>
                <div className="row"><input id="nm" value={nameDraft} maxLength={60} onChange={e => setNameDraft(e.target.value)} placeholder="ชื่อของคุณ" /><button className="btn primary sm">บันทึก</button></div>
              </form>}
          <div className="hero-actions">
            <a href="#schedule" className="btn primary">เปิดตารางเรียน</a>
            <span className="ay">Academic year <strong>{CONFIG.academicYear}</strong></span>
            {mode === "demo" && <span className="chip gold">โหมดสาธิต · ข้อมูลตัวอย่าง</span>}
          </div>
        </motion.div>
      </section>

      <div className="dash-grid">
        <Card eyebrow="Academic year" title={`ปีการศึกษา ${CONFIG.academicYear}`} className="c-year" delay={.05}>
          <div className="year-big">{profile.year ? <>ชั้นปีที่ <b>{profile.year}</b></> : <b>ทุกชั้นปี</b>}</div>
          <p className="muted small">{CONFIG.term} · {fmtDate(now, { day: "numeric", month: "long", year: "numeric" })}</p>
          <div className="year-dots">{[1, 2, 3, 4, 5, 6, 7].map(y => <button key={y} className={y === profile.year ? "on" : ""} onClick={() => setProfile({ year: y })} aria-label={"ชั้นปีที่ " + y}>{y}</button>)}</div>
        </Card>
        <Card eyebrow="Magic clock" className="c-clock" delay={.1}><MagicClock now={now} /></Card>
        <Card eyebrow="Next ritual" title="ชั้นเรียนถัดไป" className="c-count" delay={.15}><NextRitual courses={d.courses} now={now} /></Card>

        <div className="stats">
          <StatCard icon={BookOpen} value={d.courses.length} label="รายวิชาที่ลงทะเบียน" note={d.year ? "Year " + d.year : "All years"} href="#schedule" delay={.2} />
          <StatCard icon={GraduationCap} value={upcomingExams.length} label="การสอบที่กำลังจะมาถึง" note={examDays == null ? "No exams" : examDays === 0 ? "Next · today" : `Next · ${examDays} days`} href="#tasks" delay={.26} />
          <StatCard icon={Clock3} value={pending.length} label="งานที่ยังไม่ส่ง" note={overdue.length ? `${overdue.length} overdue` : "All on time"} href="#tasks" alert={overdue.length > 0} delay={.32} />
        </div>

        <Card eyebrow="Arcane timetable" title="ตารางเรียนประจำสัปดาห์" className="c-week" delay={.3} action={<a className="link" href="#schedule">ดูเต็ม <ArrowRight size={12} /></a>}>
          {d.courses.length ? <WeekGrid courses={d.courses} compact onPick={c => openEditor("courses", c)} /> : <Empty>ยังไม่มีรายวิชา</Empty>}
        </Card>
        <Card eyebrow="Owl post" title="ประกาศล่าสุด" className="c-ann" delay={.35} action={<button className="link" onClick={() => openEditor("announcements")}>＋ ประกาศ</button>}>
          <ul className="owl">{anns.map((a, i) => (
            <li key={a.id} onClick={() => openEditor("announcements", a)}>
              <span className={"diamond" + (i === 0 || a.pinned ? " gold" : "")} />
              <div><p className="owl-t">{a.title}{a.pinned && <em>PINNED</em>}</p><p className="owl-b">{a.body}</p><p className="owl-m">{ago(a.created_at)} · {a.created_by} · {yearsTxt(a.years)}</p></div>
            </li>))}
            {!anns.length && <Empty>ยังไม่มีประกาศ</Empty>}</ul>
        </Card>
        <section className="c-ev">
          <div className="sec-head"><div><div className="eyebrow">Beyond the classroom</div><h3>กิจกรรมที่กำลังจะมาถึง</h3></div><a className="link" href="#board">ทั้งหมด <ArrowRight size={12} /></a></div>
          <div className="ev-grid">
            {evs.map((e, i) => { const dt = parseYmd(e.date), col = EV_COLORS[e.category] || "#52c696"; return (
              <motion.button key={e.id} className="event-card" onClick={() => openEditor("events", e)} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: .4 + i * .1 }} whileHover={{ y: -5 }}>
                <span className="ev-glow" style={{ background: col }} />
                <div className="ev-date"><b>{dt.getDate()}</b><span style={{ color: col }}>{dt.toLocaleDateString("en-GB", { month: "short" }).toUpperCase()}</span></div>
                <div className="grow"><span className="ev-tag" style={{ color: col }}>{e.category || "Event"}</span><h4>{e.title}</h4><p><MapPin size={10} /> {e.place || "—"} · {e.start_time}</p></div>
                <WandSparkles size={15} className="wand" />
              </motion.button>); })}
            {!evs.length && <div className="card"><Empty>ยังไม่มีกิจกรรม</Empty></div>}
          </div>
        </section>
        <Card eyebrow="Discord" title="สถานะการเชื่อมต่อ" className="c-dc" delay={.45}><DiscordStatus /></Card>
      </div>
    </div>
  );
}
