// แจ้งเตือน Discord เมื่อ slytherin/schedule.json เปลี่ยน
// ใช้: node scripts/notify-discord.mjs <ไฟล์เก่า> <ไฟล์ใหม่>
// ต้องตั้ง env DISCORD_WEBHOOK_URL (ไม่ตั้ง = พิมพ์ข้อความออกมาเฉยๆ ใช้ทดสอบ)
// ตั้ง DISCORD_ROLE_ID ได้ถ้าต้องการแท็กยศ เช่น @Slytherin
import { readFileSync, existsSync } from "node:fs";

const [oldPath, newPath] = process.argv.slice(2);
const load = (p) => (p && existsSync(p) ? JSON.parse(readFileSync(p, "utf8")) : { years: {} });
const before = load(oldPath);
const after = load(newPath);

const DAY_TH = { mon: "วันจันทร์", tue: "วันอังคาร", wed: "วันพุธ", thu: "วันพฤหัสบดี", fri: "วันศุกร์", sat: "วันเสาร์", sun: "วันอาทิตย์" };
const line = (c) => `${c.time} ${c.subject}${c.room ? ` (${c.room})` : ""}`;

const embeds = [];
const years = [...new Set([...Object.keys(before.years || {}), ...Object.keys(after.years || {})])].sort();
for (const y of years) {
  const a = before.years?.[y] || {};
  const b = after.years?.[y] || {};
  const fields = [];
  for (const d of Object.keys(DAY_TH)) {
    const oldSet = new Set((a[d] || []).map(line));
    const newSet = new Set((b[d] || []).map(line));
    const added = [...newSet].filter((l) => !oldSet.has(l));
    const removed = [...oldSet].filter((l) => !newSet.has(l));
    if (!added.length && !removed.length) continue;
    const value = [...added.map((l) => `➕ ${l}`), ...removed.map((l) => `➖ ~~${l}~~`)].join("\n");
    fields.push({ name: DAY_TH[d], value: value.slice(0, 1024) });
  }
  if (fields.length) {
    embeds.push({
      title: `🐍 ตารางเรียนอัปเดต · ชั้นปี ${y}`,
      color: 0x1fa86b,
      fields: fields.slice(0, 25),
    });
  }
}

// ประกาศใหม่ใน updates[] ก็ส่งด้วย
const oldUpdates = new Set((before.updates || []).map((u) => JSON.stringify(u)));
const newNotes = (after.updates || []).filter((u) => !oldUpdates.has(JSON.stringify(u)));
if (newNotes.length) {
  embeds.unshift({
    title: "📜 ประกาศจากบ้านสลิธีริน",
    color: 0xd7dee0,
    description: newNotes.map((u) => `**${(u.years || []).join(", ")}** — ${u.text}`).join("\n").slice(0, 4000),
  });
}

if (!embeds.length) {
  console.log("ไม่มีการเปลี่ยนแปลงตารางเรียน ไม่ส่งแจ้งเตือน");
  process.exit(0);
}

const site = process.env.SITE_URL;
if (site) embeds[embeds.length - 1].url = site;
const role = process.env.DISCORD_ROLE_ID;
const webhook = process.env.DISCORD_WEBHOOK_URL;

// Discord รับได้สูงสุด 10 embeds ต่อข้อความ
for (let i = 0; i < embeds.length; i += 10) {
  const payload = {
    username: "Slytherin Timetable",
    content: i === 0 && role ? `<@&${role}> ตารางเรียนมีการเปลี่ยนแปลง!` : undefined,
    allowed_mentions: role ? { roles: [role] } : { parse: [] },
    embeds: embeds.slice(i, i + 10),
  };
  if (!webhook) {
    console.log(JSON.stringify(payload, null, 2));
    continue;
  }
  const res = await fetch(webhook, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
  if (!res.ok) {
    console.error(`ส่ง Discord ไม่สำเร็จ: ${res.status} ${await res.text()}`);
    process.exit(1);
  }
}
console.log(webhook ? `ส่งแจ้งเตือน ${embeds.length} รายการไป Discord แล้ว` : "ทดสอบ (ไม่มี DISCORD_WEBHOOK_URL): ไม่ได้ส่งจริง");
