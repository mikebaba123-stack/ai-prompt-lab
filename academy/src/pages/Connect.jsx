import React, { useState } from "react";
import { Card } from "../components/ui.jsx";
import { ask } from "../components/ui.jsx";
import { useApp, connect, useDemo, resetDemo, reload, setFx, toast, LS } from "../lib/store.js";
import { CONFIG } from "../config.js";

const SQL = `insert into app_secret(key, value) values
  ('discord_webhook', 'https://discord.com/api/webhooks/…')
on conflict (key) do update set value = excluded.value;`;

export default function Connect() {
  const mode = useApp(s => s.mode), err = useApp(s => s.error), discord = useApp(s => s.discord), fx = useApp(s => s.fx);
  const saved = LS.get("sa.sb", {}) || {}, locked = !!(CONFIG.supabaseUrl && CONFIG.supabaseKey);
  const [url, setUrl] = useState(saved.url || ""), [key, setKey] = useState(saved.key || ""), [busy, setBusy] = useState(false);
  const go = async e => {
    e.preventDefault();
    const u = url.trim().replace(/\/$/, "");
    if (!/^https:\/\/.+/.test(u) || !key.trim()) return toast("กรอก Project URL และ key ให้ครบ", true);
    setBusy(true); LS.set("sa.sb", { url: u, key: key.trim() });
    toast((await connect(u, key.trim())) ? "เชื่อมต่อฐานข้อมูลกลางแล้ว" : "เชื่อมต่อไม่สำเร็จ", false); setBusy(false);
  };
  const copy = async () => { try { await navigator.clipboard.writeText(SQL); toast("คัดลอกแล้ว"); } catch (e) { toast("คัดลอกไม่ได้ ลองเลือกข้อความเอง", true); } };
  return (
    <div className="page">
      <header className="page-head"><div><div className="eyebrow">Connections</div><h1>เชื่อมต่อ</h1><p className="muted">ฐานข้อมูลกลาง การแจ้งเตือน Discord และคุณภาพภาพ 3D</p></div></header>
      <div className="two">
        <Card eyebrow="Database" title="ฐานข้อมูลกลาง (Supabase)">
          <p className={"status-line " + (mode === "supabase" || mode === "shared" ? "ok" : err ? "bad" : "")}><span className="dot" />{mode === "supabase" ? "เชื่อมต่อแล้ว · ทุกคนเห็นข้อมูลชุดเดียวกันแบบเรียลไทม์" : mode === "shared" ? "ใช้ฐานข้อมูลในเว็บ · ทุกคนที่มีลิงก์เห็นและแก้ข้อมูลชุดเดียวกัน (ไม่ต้องตั้งค่า)" : err ? "เชื่อมต่อไม่สำเร็จ: " + err : "โหมดสาธิต · ข้อมูลอยู่ในเบราว์เซอร์เครื่องนี้เท่านั้น"}</p>
          <form className="form" onSubmit={go}>
            <div className="field"><label htmlFor="sb-url">Project URL</label><input id="sb-url" type="url" value={url} disabled={locked} placeholder="https://xxxx.supabase.co" onChange={e => setUrl(e.target.value)} autoComplete="off" /></div>
            <div className="field"><label htmlFor="sb-key">anon / publishable key</label><input id="sb-key" type="password" value={key} disabled={locked} placeholder="eyJhbGciOi… หรือ sb_publishable_…" onChange={e => setKey(e.target.value)} autoComplete="off" /></div>
            {locked && <p className="muted small">ค่าเชื่อมต่อกำหนดไว้ใน config.js แล้ว ทุกคนที่เปิดเว็บใช้ฐานข้อมูลเดียวกัน</p>}
            <div className="row">
              <button className="btn primary" disabled={busy || locked}>{busy ? "กำลังเชื่อมต่อ…" : "บันทึกและเชื่อมต่อ"}</button>
              {mode === "supabase" && !locked && <button type="button" className="btn ghost" onClick={useDemo}>เลิกใช้ Supabase</button>}
            </div>
          </form>
          {mode === "demo" && (
            <div className="sub-block">
              <h4>ข้อมูลตัวอย่าง</h4>
              <p className="muted small">โหมดสาธิตเริ่มด้วยรายวิชา สอบ งาน และกิจกรรมตัวอย่าง เพื่อให้เห็นหน้าตาของระบบ</p>
              <button className="btn ghost sm" onClick={async () => { if (await ask("ล้างข้อมูลสาธิตแล้วเริ่มข้อมูลตัวอย่างใหม่?")) { resetDemo(); await reload(); toast("เริ่มข้อมูลตัวอย่างใหม่แล้ว"); } }}>เริ่มข้อมูลตัวอย่างใหม่</button>
            </div>
          )}
        </Card>
        <Card eyebrow="Discord" title="แจ้งเตือนเข้า Discord">
          <p className={"status-line " + (discord ? "ok" : "")}><span className="dot" />{mode !== "supabase" ? "ต้องเชื่อมฐานข้อมูลกลางก่อน" : discord ? "พร้อมแล้ว · ทุกการเปลี่ยนแปลงจะเด้งเข้า Discord" : "ยังไม่ได้ใส่ webhook"}</p>
          <ol className="steps">
            <li>สมัคร <a href="https://supabase.com" target="_blank" rel="noopener">supabase.com</a> → New project</li>
            <li>SQL Editor → New query → วางไฟล์ <code>academy/supabase/setup.sql</code> ทั้งไฟล์ → Run</li>
            <li>Project Settings → API คัดลอก Project URL และ anon key มาใส่ช่องด้านซ้าย หรือใส่ใน <code>src/config.js</code> แล้ว build ใหม่ เพื่อให้ทุกคนใช้ฐานเดียวกัน</li>
            <li>Discord → ห้องประกาศ → Edit Channel → Integrations → Webhooks → New Webhook → Copy Webhook URL</li>
            <li>กลับไปที่ SQL Editor รันคำสั่งนี้ (แทน URL ด้วยของคุณ):<pre>{SQL}</pre><button className="btn ghost sm" onClick={copy}>คัดลอกคำสั่ง</button></li>
          </ol>
          <p className="muted small">Webhook เก็บในตารางที่หน้าเว็บอ่านไม่ได้ คนเปิดเว็บจึงเอาไปใช้สแปมห้องไม่ได้ และการลบเป็นการซ่อน กู้คืนได้จากฐานข้อมูล</p>
        </Card>
        <Card eyebrow="Visuals" title="คุณภาพภาพ 3D">
          <div className="seg wide">{[["ultra", "4K Ultra", "ความละเอียดสูงสุด"], ["high", "สูง", "หมอกและควันเต็มรูปแบบ"], ["low", "ประหยัด", "สำหรับมือถือ"], ["off", "ปิด 3D", "ภาพนิ่ง"]].map(([k, l, s]) => (
            <button key={k} className={fx === k ? "on" : ""} onClick={() => setFx(k)}><b>{l}</b><span className="muted small">{s}</span></button>))}</div>
        </Card>
      </div>
    </div>
  );
}
