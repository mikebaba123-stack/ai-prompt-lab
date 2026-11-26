import React, { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search, ChevronDown, ChevronsLeft, ChevronsRight, X, Plus, GraduationCap, ClipboardList, Megaphone, Upload, Download,
  Eye, Settings2, MessageCircle, Pencil, Check, CalendarPlus
} from "lucide-react";
import { Crest } from "./ui.jsx";
import { openEditor } from "./forms.jsx";
import { useApp, setProfile, save, toast, LS, KINDS, getState } from "../lib/store.js";
import { nm } from "../lib/time.js";

/* =====================================================================
   Glass sidebar: a frosted emerald menu panel joined to a lighter silver
   tool rail. Every entry is wired to the existing routes and editors.
   ===================================================================== */

/* menu tree grouped into clear sections: `to` = a route hash, `act` = an editor */
const GROUPS = [["main", "หน้าหลัก"], ["study", "การเรียน"], ["work", "งานและการสอบ"], ["house", "บ้านสลิธีริน"], ["system", "ระบบ"]];
function buildMenu(routes) {
  const r = Object.fromEntries(routes.map(([k, l, Icon, , group]) => [k, { label: l, Icon, group }]));
  const item = (k, children) => ({ id: k, label: r[k].label, Icon: r[k].Icon, group: r[k].group, to: k, children });
  return [
    item("dashboard"),
    item("schedule", [
      { id: "schedule-week", label: "ตารางรายสัปดาห์", to: "schedule" },
      { id: "schedule-add", label: "เพิ่มรายวิชา", act: ["courses"] }
    ]),
    item("calendar"),
    item("exams"), item("assignments"),
    item("announcements"), item("events"),
    item("connect")
  ];
}

const RAIL_LABEL = { dashboard: "Overview", schedule: "Schedule", calendar: "Calendar", exams: "Exams", assignments: "Assignments", announcements: "Owl post", events: "Events", connect: "Connections" };
const go = to => { if (location.hash.slice(1) !== to) location.hash = to; };

function Tip({ label, children }) {
  return <span className="sb-tip-wrap">{children}<span className="sb-tip" role="tooltip">{label}</span></span>;
}

/* export / import a JSON backup through the existing save() API */
function exportData() {
  const d = getState().data, out = {};
  for (const k of KINDS) out[k] = d[k].map(({ id, deleted, created_at, updated_at, ...rest }) => rest);
  const blob = new Blob([JSON.stringify({ app: "slytherin-academy", exported_at: new Date().toISOString(), ...out }, null, 2)], { type: "application/json" });
  const fallback = () => { const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "slytherin-academy-backup.json"; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 2000); toast("ส่งออกข้อมูลแล้ว"); };
  const use = window.claude && window.claude.use;
  if (typeof use !== "function") return fallback();
  use("downloads").then(dl => {
    if (!dl) return fallback();
    return blob.text().then(text => dl.save({ filename: "slytherin-academy-backup.json", data: text })).then(() => toast("ส่งออกข้อมูลแล้ว"), () => toast("ยกเลิกการดาวน์โหลด"));
  }).catch(fallback);
}
async function importFile(file) {
  try {
    const json = JSON.parse(await file.text()); let n = 0;
    for (const k of KINDS) for (const row of Array.isArray(json[k]) ? json[k] : []) {
      const { id, deleted, created_at, updated_at, created_by, updated_by, ...clean } = row;
      if (k !== "courses") clean.course_id = null;                   // course ids differ between databases
      if (await save(k, clean)) n++;
    }
    toast(n ? `นำเข้า ${n} รายการแล้ว` : "ไม่พบข้อมูลที่นำเข้าได้ในไฟล์นี้", !n);
  } catch (e) { toast("อ่านไฟล์ไม่ได้: ต้องเป็นไฟล์ JSON ที่ส่งออกจากเว็บนี้", true); }
}

function Row({ it, depth = 0, ctx }) {
const { route, expanded, toggle, mini, badges, hl, run } = ctx;
  const hasKids = !!it.children?.length, active = it.to === route && (depth === 0 ? true : !hasKids);
  const isOpen = !!expanded[it.id];
  return (
    <li>
      <motion.button className={"sb-item" + (depth ? " sub" : "") + (active && depth === 0 ? " on" : "")} whileTap={{ scale: .97 }}
        onClick={() => { if (hasKids && !mini) { toggle(it.id); if (it.to !== route) go(it.to); } else run(it); }}
        aria-current={active && depth === 0 ? "page" : undefined} aria-expanded={hasKids ? isOpen : undefined}>
        {active && depth === 0 && <motion.span layoutId="sb-hl" className="sb-hl" transition={{ type: "spring", stiffness: 420, damping: 34 }} />}
        {depth === 0 ? <span className="sb-ico">{it.Icon && <it.Icon size={18} strokeWidth={1.6} />}</span> : <span className={"sb-twig" + (it.act ? " act" : "")}>{it.act ? <Plus size={11} /> : null}</span>}
        {!mini && <span className="sb-label">{hl(it.label)}</span>}
        {!mini && depth === 0 && badges[it.id] > 0 && <span className="sb-badge">{badges[it.id]}</span>}
        {!mini && hasKids && <motion.span className="sb-chev" animate={{ rotate: isOpen ? 0 : -90 }}><ChevronDown size={14} /></motion.span>}
        {mini && badges[it.id] > 0 && <span className="sb-pip" />}
        {mini && <span className="sb-flyout">{it.label}</span>}
      </motion.button>
      <AnimatePresence initial={false}>
        {hasKids && isOpen && !mini && (
          <motion.ul className="sb-children" initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: .28, ease: [.2, .7, .2, 1] }}>
            {it.children.map(c => <Row key={c.id} it={c} depth={1} ctx={ctx} />)}
          </motion.ul>
        )}
      </AnimatePresence>
    </li>
  );
}

export default function Sidebar({ routes, route, open, onClose, collapsed, onToggle, onCinema, canCinema }) {
  const data = useApp(s => s.data), readOnly = useApp(s => s.readOnly), done = useApp(s => s.done), profile = useApp(s => s.profile), mode = useApp(s => s.mode), discord = useApp(s => s.discord);
  const menu = useMemo(() => buildMenu(routes), [routes]);
  const [expanded, setExpanded] = useState(() => LS.get("sa.sb.exp", { schedule: true }));
  const [q, setQ] = useState(""), [editName, setEditName] = useState(false), [nameDraft, setNameDraft] = useState("");
  const searchRef = useRef(), fileRef = useRef();
  const year = profile.year, inYear = x => !year || (x.years || []).includes(year);
  const courses = data.courses.filter(inYear), pendingAll = data.assignments.filter(a => inYear(a) && !done[a.id]);
  const nowMs = Date.now(), upExams = data.exams.filter(e => inYear(e) && new Date(e.date + "T23:59").getTime() >= nowMs).length;
  const badges = { exams: upExams, assignments: pendingAll.length, announcements: data.announcements.filter(inYear).length };
  const totalAssign = data.assignments.filter(inYear).length, doneCount = totalAssign - pendingAll.length;
  const mini = collapsed && !open;                                  // the drawer on mobile is always full width

  useEffect(() => LS.set("sa.sb.exp", expanded), [expanded]);
  useEffect(() => {
    const k = e => { if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") { e.preventDefault(); if (mini) onToggle(); setTimeout(() => searchRef.current?.focus(), 60); } };
    addEventListener("keydown", k); return () => removeEventListener("keydown", k);
  }, [mini, onToggle]);

  // search flattens the tree into matching leaves
  const query = q.trim().toLowerCase();
  const results = useMemo(() => {
    if (!query) return null;
    const out = [];
    for (const m of menu) {
      if (m.label.toLowerCase().includes(query)) out.push({ ...m, children: undefined, path: "" });
      for (const c of m.children || []) if (c.label.toLowerCase().includes(query)) out.push({ ...c, Icon: m.Icon, path: m.label });
    }
    for (const c of courses) if ((c.name + " " + (c.code || "")).toLowerCase().includes(query)) out.push({ id: "c" + c.id, label: c.name, Icon: menu[1].Icon, act: ["courses", c], path: "รายวิชา", dot: c.color });
    return out;
  }, [query, menu, courses]);

  const run = it => {
    if (it.act) { openEditor(...it.act); if (it.act[0] === "courses" && !it.act[1]) go("schedule"); }
    else if (it.to) go(it.to);
    setQ(""); onClose();
  };
  const toggle = id => setExpanded(e => ({ ...e, [id]: !e[id] }));
  const hl = text => { if (!query) return text; const i = text.toLowerCase().indexOf(query); return i < 0 ? text : <>{text.slice(0, i)}<mark>{text.slice(i, i + query.length)}</mark>{text.slice(i + query.length)}</>; };
  const initials = (profile.name || "นักเรียนสลิธีริน").trim().split(/\s+/).map(w => [...w][0]).slice(0, 2).join("").toUpperCase();
  const linked = mode === "supabase" && discord;
  const weekly = c => (c.sessions || []).length;
  const pendingOf = id => pendingAll.filter(a => a.course_id === id).length;

  return (
    <motion.aside className={"sb" + (open ? " open" : "") + (mini ? " mini" : "")} aria-label="แถบเมนู">
      {/* ---------- main glass panel ---------- */}
      <div className="sb-main">
        <span className="sb-sheen" aria-hidden="true" />
        <header className="sb-head">
          <a className="sb-brand" href="#dashboard" onClick={onClose}><Crest size={36} />{!mini && <span><b>SLYTHERIN</b><small>Academy portal</small></span>}</a>
          <button className="sb-btn sb-collapse" onClick={onToggle} aria-label={mini ? "ขยายแถบเมนู" : "ย่อแถบเมนู"}>{mini ? <ChevronsRight size={15} /> : <ChevronsLeft size={15} />}</button>
          <button className="sb-btn sb-close" onClick={onClose} aria-label="ปิดเมนู"><X size={15} /></button>
        </header>

        {mini
          ? <button className="sb-item sb-search-mini" onClick={() => { onToggle(); setTimeout(() => searchRef.current?.focus(), 80); }} aria-label="ค้นหาเมนู"><span className="sb-ico"><Search size={17} /></span><span className="sb-flyout">ค้นหา (Ctrl K)</span></button>
          : <label className="sb-search">
              <Search size={14} />
              <input ref={searchRef} value={q} onChange={e => setQ(e.target.value)} placeholder="ค้นหาเมนูหรือรายวิชา" aria-label="ค้นหาเมนู"
                onKeyDown={e => { if (e.key === "Enter" && results?.[0]) run(results[0]); if (e.key === "Escape") setQ(""); }} />
              {q ? <button onClick={() => setQ("")} aria-label="ล้างคำค้น"><X size={12} /></button> : <kbd>⌘K</kbd>}
            </label>}

        <div className="sb-scroll">
          <AnimatePresence mode="wait" initial={false}>
            {results ? (
              <motion.ul key="res" className="sb-menu" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                <li className="sb-cap">ผลการค้นหา · {results.length}</li>
                {results.map(it => (
                  <li key={it.id}><motion.button className="sb-item" whileTap={{ scale: .97 }} onClick={() => run(it)}>
                    <span className="sb-ico">{it.dot ? <i className="sb-dot" style={{ background: it.dot }} /> : it.Icon && <it.Icon size={17} strokeWidth={1.6} />}</span>
                    <span className="sb-label">{hl(it.label)}{it.path && <small>{it.path}</small>}</span>
                  </motion.button></li>))}
                {!results.length && <li className="sb-empty">ไม่พบเมนูที่ตรงกับ “{q}”</li>}
              </motion.ul>
            ) : (
              <motion.div key="menu" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                {GROUPS.map(([g, label], gi) => {
                  const items = menu.filter(m => m.group === g);
                  return items.length ? (
                    <div className="sb-group" key={g}>
                      {mini ? (gi > 0 && <span className="sb-gsep" />) : <p className="sb-cap">{label}</p>}
                      <ul className="sb-menu">{items.map(m => <Row key={m.id} it={m} ctx={{ route, expanded, toggle, mini, badges, hl, run }} />)}</ul>
                    </div>
                  ) : null;
                })}

                {/* projects: the viewer's courses as colour-coded shortcuts */}
                <div className="sb-proj">
                  {!mini && <p className="sb-cap">รายวิชาของฉัน <button onClick={() => { openEditor("courses"); go("schedule"); onClose(); }} aria-label="เพิ่มรายวิชา"><Plus size={12} /></button></p>}
                  <ul className="sb-menu">
                    {courses.slice(0, mini ? 5 : 6).map(c => {
                      const p = pendingOf(c.id);
                      return (
                        <li key={c.id}><motion.button className="sb-item proj" whileTap={{ scale: .97 }} onClick={() => run({ act: ["courses", c] })} title={c.name}>
                          <span className="sb-ico"><i className="sb-dot" style={{ background: c.color, boxShadow: `0 0 10px ${c.color}` }} /></span>
                          {!mini && <span className="sb-label">{c.name}</span>}
                          {!mini && <span className={"sb-badge" + (p ? " warn" : " soft")} title={p ? `งานค้าง ${p} ชิ้น` : `${weekly(c)} คาบต่อสัปดาห์`}>{p || weekly(c)}</span>}
                          {mini && <span className="sb-flyout">{c.name}</span>}
                        </motion.button></li>);
                    })}
                    {!courses.length && !mini && <li className="sb-empty">ยังไม่มีรายวิชาในชั้นปีนี้</li>}
                  </ul>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* membership + profile */}
        <footer className="sb-foot">
          {!mini && (
            <div className="sb-member">
              <svg className="sb-ring" viewBox="0 0 40 40" aria-hidden="true">
                <circle cx="20" cy="20" r="16" />
                <motion.circle cx="20" cy="20" r="16" className="v" strokeDasharray="100.5" initial={{ strokeDashoffset: 100.5 }}
                  animate={{ strokeDashoffset: 100.5 * (1 - (totalAssign ? doneCount / totalAssign : 0)) }} transition={{ duration: 1.1, ease: [.2, .7, .2, 1] }} />
                <text x="20" y="23.5" textAnchor="middle">{totalAssign ? Math.round(doneCount / totalAssign * 100) : 0}%</text>
              </svg>
              <div className="sb-member-t"><b>สมาชิกบ้านสลิธีริน</b><span>ส่งงาน {doneCount}/{totalAssign} · {courses.reduce((s, c) => s + (c.sessions || []).reduce((t, x) => t + (nm(x.end) - nm(x.start)) / 60, 0), 0).toFixed(1).replace(/\.0$/, "")} ชม./สัปดาห์</span></div>
              <a href="#connect" className={"sb-up" + (linked || mode === "shared" ? " ok" : "")} onClick={onClose}>{linked ? "Discord ✓" : mode === "shared" ? (readOnly ? "ดูอย่างเดียว" : "ออนไลน์") : "เชื่อมต่อ"}</a>
            </div>
          )}
          <div className="sb-me">
            <div className="sb-avatar">{initials}<i className={linked ? "ok" : ""} /></div>
            {!mini && (editName
              ? <form className="sb-name" onSubmit={e => { e.preventDefault(); if (nameDraft.trim()) setProfile({ name: nameDraft.trim() }); setEditName(false); }}>
                  <input autoFocus value={nameDraft} maxLength={60} onChange={e => setNameDraft(e.target.value)} onBlur={() => setEditName(false)} aria-label="ชื่อของคุณ" /><button aria-label="บันทึกชื่อ" onMouseDown={e => e.preventDefault()}><Check size={13} /></button>
                </form>
              : <div className="sb-me-t">
                  <p>{profile.name || "นักเรียนสลิธีริน"} <button onClick={() => { setNameDraft(profile.name || ""); setEditName(true); }} aria-label="แก้ไขชื่อ"><Pencil size={11} /></button></p>
                  <select aria-label="ชั้นปีของฉัน" value={profile.year} onChange={e => setProfile({ year: +e.target.value })}>{[1, 2, 3, 4, 5, 6, 7].map(y => <option key={y} value={y}>ชั้นปีที่ {y}</option>)}<option value={0}>ทุกชั้นปี</option></select>
                </div>)}
          </div>
        </footer>
      </div>

      {/* ---------- light tool rail ---------- */}
      <nav className="sb-rail" aria-label="เครื่องมือลัด">
        <div className="sb-rail-g">
          {[
            ["เพิ่มรายวิชา", Plus, () => { openEditor("courses"); go("schedule"); }, true],
            ["เพิ่มการสอบ", GraduationCap, () => openEditor("exams")],
            ["เพิ่มงาน", ClipboardList, () => openEditor("assignments")],
            ["เพิ่มกิจกรรม", CalendarPlus, () => openEditor("events")],
            ["เขียนประกาศ", Megaphone, () => openEditor("announcements")]
          ].map(([l, I, f, primary]) => (
            <Tip key={l} label={l}><motion.button className={"sb-tool" + (primary ? " primary" : "")} whileHover={{ y: -2 }} whileTap={{ scale: .9 }} onClick={() => { f(); onClose(); }} aria-label={l}><I size={17} strokeWidth={1.7} /></motion.button></Tip>
          ))}
        </div>
        <span className="sb-rail-sep" />
        <div className="sb-rail-g">
          <Tip label="อัปโหลด (นำเข้า JSON)"><motion.button className="sb-tool" whileTap={{ scale: .9 }} onClick={() => fileRef.current.click()} aria-label="อัปโหลดข้อมูล"><Upload size={17} strokeWidth={1.7} /></motion.button></Tip>
          <Tip label="ดาวน์โหลดสำรองข้อมูล"><motion.button className="sb-tool" whileTap={{ scale: .9 }} onClick={exportData} aria-label="ดาวน์โหลดสำรองข้อมูล"><Download size={17} strokeWidth={1.7} /></motion.button></Tip>
          {canCinema && <Tip label="ชมห้องนั่งเล่น"><motion.button className="sb-tool" whileTap={{ scale: .9 }} onClick={() => { onClose(); onCinema(); }} aria-label="ชมห้องนั่งเล่น"><Eye size={17} strokeWidth={1.7} /></motion.button></Tip>}
          <input ref={fileRef} type="file" accept="application/json,.json" hidden onChange={e => { const f = e.target.files[0]; e.target.value = ""; if (f) importFile(f); }} />
        </div>
        <div className="sb-rail-g end">
          <span className="sb-rail-label" aria-hidden="true">{RAIL_LABEL[route] || ""}</span>
          <Tip label="เชื่อมต่อและตั้งค่า"><motion.button className={"sb-tool" + (route === "connect" ? " on" : "")} whileTap={{ scale: .9 }} onClick={() => { go("connect"); onClose(); }} aria-label="เชื่อมต่อและตั้งค่า"><Settings2 size={17} strokeWidth={1.7} /></motion.button></Tip>
        </div>
      </nav>
    </motion.aside>
  );
}
