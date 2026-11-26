import React, { useState } from "react";
import { Modal, YearsPick, ask } from "./ui.jsx";
import { save, remove, useApp, setProfile } from "../lib/store.js";
import { CONFIG } from "../config.js";
import { DAYS, nm, H0, pad } from "../lib/time.js";

export const COLORS = ["#2fbf7f", "#7aa7c7", "#b89b62", "#9b8cd9", "#5d8ee8", "#c9785a", "#7cbf3f", "#d46aa6", "#c0c6c8", "#3fbfbf"];
const ALL = [1, 2, 3, 4, 5, 6, 7];

export const SCHEMA = {
  courses: {
    one: "รายวิชา", icon: "📜",
    fields: [
      { k: "name", label: "ชื่อวิชา", req: true }, { k: "code", label: "รหัสวิชา", ph: "เช่น POT-301" },
      { k: "years", label: "ชั้นปีที่เรียน", type: "years", req: true, full: true },
      { k: "teacher", label: "อาจารย์ผู้สอน" }, { k: "room", label: "ห้องเรียน" },
      { k: "sessions", label: "วันและเวลาเรียน", type: "sessions", req: true, full: true },
      { k: "color", label: "สีประจำวิชา", type: "color", full: true },
      { k: "description", label: "รายละเอียดรายวิชา", type: "textarea", full: true }
    ],
    blank: () => ({ name: "", code: "", years: [], teacher: "", room: "", color: COLORS[0], description: "", sessions: [{ day: 1, start: CONFIG.periods[0][0], end: CONFIG.periods[0][1] }] })
  },
  exams: {
    one: "การสอบ", icon: "⚗️",
    fields: [
      { k: "title", label: "ชื่อการสอบ", req: true, full: true }, { k: "course_id", label: "รายวิชา", type: "course" },
      { k: "room", label: "ห้องสอบ" }, { k: "years", label: "ชั้นปี", type: "years", req: true, full: true },
      { k: "date", label: "วันที่สอบ", type: "date", req: true }, { k: "start_time", label: "เวลาเริ่ม", type: "time", req: true },
      { k: "end_time", label: "เวลาสิ้นสุด", type: "time", req: true }, { k: "note", label: "หมายเหตุ", type: "textarea", full: true }
    ],
    blank: () => ({ title: "", course_id: null, room: "", years: [], date: "", start_time: "18:00", end_time: "20:00", note: "" })
  },
  assignments: {
    one: "งาน", icon: "🪶",
    fields: [
      { k: "title", label: "ชื่องาน", req: true, full: true }, { k: "course_id", label: "รายวิชา", type: "course" },
      { k: "years", label: "ชั้นปี", type: "years", req: true, full: true },
      { k: "due_date", label: "กำหนดส่ง", type: "date", req: true }, { k: "due_time", label: "เวลา", type: "time" },
      { k: "description", label: "รายละเอียด", type: "textarea", full: true }
    ],
    blank: () => ({ title: "", course_id: null, years: [], due_date: "", due_time: "23:59", description: "" })
  },
  announcements: {
    one: "ประกาศ", icon: "📯",
    fields: [
      { k: "title", label: "หัวข้อ", req: true, full: true }, { k: "body", label: "ข้อความ", type: "textarea", req: true, full: true },
      { k: "years", label: "ถึงชั้นปี", type: "years", req: true, full: true }, { k: "pinned", label: "ปักหมุดไว้บนสุด", type: "check", full: true }
    ],
    blank: () => ({ title: "", body: "", years: ALL, pinned: false })
  },
  events: {
    one: "กิจกรรม", icon: "🕯️",
    fields: [
      { k: "title", label: "ชื่อกิจกรรม", req: true, full: true }, { k: "category", label: "ประเภท", type: "select", options: ["สังสรรค์", "วิชาการ", "กีฬา", "พิธีการ", "ประชุมบ้าน", "อื่น ๆ"] },
      { k: "place", label: "สถานที่" }, { k: "years", label: "ชั้นปี", type: "years", req: true, full: true },
      { k: "date", label: "วันที่", type: "date", req: true }, { k: "start_time", label: "เวลาเริ่ม", type: "time", req: true },
      { k: "end_time", label: "เวลาสิ้นสุด", type: "time", req: true }, { k: "description", label: "รายละเอียด", type: "textarea", full: true }
    ],
    blank: () => ({ title: "", category: "สังสรรค์", place: "", years: ALL, date: "", start_time: "19:00", end_time: "21:00", description: "" })
  }
};

function validate(kind, v) {
  for (const f of SCHEMA[kind].fields) {
    if (!f.req) continue;
    const x = v[f.k];
    if (f.type === "years" ? !x?.length : f.type === "sessions" ? !x?.length : !String(x ?? "").trim()) return `กรุณากรอก “${f.label}”`;
  }
  const bad = (a, b) => a && b && nm(b) <= nm(a);
  if (bad(v.start_time, v.end_time)) return `เวลาสิ้นสุดต้องอยู่หลังเวลาเริ่ม (หนึ่งวันของตารางคือ ${pad(H0)}:00 ถึง ${pad(H0)}:00 ของวันถัดไป)`;
  for (const s of v.sessions || []) if (!s.start || !s.end || bad(s.start, s.end)) return `คาบวัน${DAYS[s.day]}: เวลาสิ้นสุดต้องอยู่หลังเวลาเริ่ม`;
  return "";
}

function Sessions({ value, onChange }) {
  const upd = (i, p) => onChange(value.map((s, j) => (j === i ? { ...s, ...p } : s)));
  return (
    <div className="sessions">
      {value.map((s, i) => (
        <div className="session" key={i}>
          <select value={s.day} onChange={e => upd(i, { day: +e.target.value })} aria-label="วันเรียน">{DAYS.slice(1).map((d, j) => <option key={j} value={j + 1}>{d}</option>)}</select>
          <select value="" onChange={e => { if (e.target.value) { const [a, b] = e.target.value.split("|"); upd(i, { start: a, end: b }); } }} aria-label="ช่วงเวลาด่วน">
            <option value="">คาบ…</option>{CONFIG.periods.map(([a, b], j) => <option key={j} value={a + "|" + b}>คาบ {j + 1} · {a}–{b}</option>)}
          </select>
          <input type="time" value={s.start} onChange={e => upd(i, { start: e.target.value })} aria-label="เวลาเริ่ม" />
          <span className="muted">ถึง</span>
          <input type="time" value={s.end} onChange={e => upd(i, { end: e.target.value })} aria-label="เวลาสิ้นสุด" />
          <button type="button" className="icon-btn" onClick={() => onChange(value.filter((_, j) => j !== i))} aria-label="ลบคาบนี้" disabled={value.length === 1}>✕</button>
        </div>
      ))}
      <button type="button" className="btn ghost sm" onClick={() => onChange([...value, { ...value[value.length - 1], day: (value[value.length - 1].day % 7) + 1 }])}>＋ เพิ่มวันเรียน</button>
    </div>
  );
}

export function ItemForm({ kind, item, onClose, defaults }) {
  const S = SCHEMA[kind], courses = useApp(s => s.data.courses), name = useApp(s => s.profile.name);
  const [v, setV] = useState(() => ({ ...S.blank(), ...defaults, ...(item || {}) }));
  const [who, setWho] = useState(name || "");
  const [err, setErr] = useState(""), [busy, setBusy] = useState(false);
  const set = (k, x) => setV(o => ({ ...o, [k]: x }));
  const submit = async e => {
    e.preventDefault();
    const msg = validate(kind, v) || (!who.trim() ? "กรุณาใส่ชื่อผู้บันทึก" : "");
    if (msg) return setErr(msg);
    setProfile({ name: who.trim() }); setBusy(true);
    const row = {}; S.fields.forEach(f => (row[f.k] = f.type === "course" ? v[f.k] || null : v[f.k]));
    if (await save(kind, row, item?.id)) onClose(); setBusy(false);
  };
  const del = async () => { if (await ask(`ลบ “${item.name || item.title}”?`)) { setProfile({ name: who.trim() || name }); if (await remove(kind, item.id)) onClose(); } };
  return (
    <form className="form" onSubmit={submit} noValidate>
      <div className="fgrid">
        {S.fields.map(f => (
          <div className={"field" + (f.full ? " full" : "")} key={f.k}>
            {f.type !== "check" && <label htmlFor={"f-" + f.k}>{f.label}{f.req && <b className="req"> *</b>}</label>}
            {f.type === "years" ? <YearsPick value={v.years} onChange={x => set("years", x)} />
              : f.type === "sessions" ? <Sessions value={v.sessions} onChange={x => set("sessions", x)} />
              : f.type === "textarea" ? <textarea id={"f-" + f.k} value={v[f.k] || ""} maxLength={1000} onChange={e => set(f.k, e.target.value)} />
              : f.type === "color" ? <div className="swatches">{COLORS.map(c => <button type="button" key={c} className={v.color === c ? "on" : ""} style={{ background: c }} onClick={() => set("color", c)} aria-label={"สี " + c} />)}</div>
              : f.type === "course" ? <select id={"f-" + f.k} value={v[f.k] || ""} onChange={e => { const c = courses.find(x => x.id === e.target.value); setV(o => ({ ...o, course_id: e.target.value || null, years: !o.years.length && c ? c.years : o.years })); }}><option value="">— ไม่ระบุ —</option>{courses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select>
              : f.type === "select" ? <select id={"f-" + f.k} value={v[f.k]} onChange={e => set(f.k, e.target.value)}>{f.options.map(o => <option key={o}>{o}</option>)}</select>
              : f.type === "check" ? <label className="check"><input type="checkbox" id={"f-" + f.k} checked={!!v[f.k]} onChange={e => set(f.k, e.target.checked)} /> {f.label}</label>
              : <input id={"f-" + f.k} type={f.type || "text"} value={v[f.k] || ""} maxLength={120} placeholder={f.ph} onChange={e => set(f.k, e.target.value)} />}
          </div>
        ))}
        <div className="field full"><label htmlFor="f-who">ชื่อผู้บันทึก<b className="req"> *</b> <span className="muted">(แสดงในประวัติและ Discord)</span></label><input id="f-who" value={who} maxLength={60} onChange={e => setWho(e.target.value)} /></div>
      </div>
      {err && <p className="err" role="alert">{err}</p>}
      <div className="row end">
        {item && <button type="button" className="btn danger" onClick={del} style={{ marginRight: "auto" }}>ลบ</button>}
        <button type="button" className="btn ghost" onClick={onClose}>ยกเลิก</button>
        <button className="btn primary" disabled={busy}>{busy ? "กำลังบันทึก…" : item ? "บันทึกการแก้ไข" : "เพิ่ม" + S.one}</button>
      </div>
    </form>
  );
}

/* one modal host for every editor in the app */
let openFn = null;
export const openEditor = (kind, item, defaults) => openFn && openFn({ kind, item, defaults });
export function EditorHost() {
  const [st, setSt] = useState(null);
  openFn = setSt;
  const S = st && SCHEMA[st.kind];
  return (
    <Modal open={!!st} onClose={() => setSt(null)} title={st ? `${S.icon} ${st.item ? "แก้ไข" : "เพิ่ม"}${S.one}` : ""} wide>
      {st && <ItemForm key={(st.item?.id || "new") + st.kind} kind={st.kind} item={st.item} defaults={st.defaults} onClose={() => setSt(null)} />}
    </Modal>
  );
}
