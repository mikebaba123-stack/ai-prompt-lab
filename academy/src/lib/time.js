import { CONFIG } from "../config.js";

export const H0 = CONFIG.dayStartHour;
export const DAYS = ["", "จันทร์", "อังคาร", "พุธ", "พฤหัสบดี", "ศุกร์", "เสาร์", "อาทิตย์"]; // ISO 1..7
export const DAYS_SHORT = ["", "จ.", "อ.", "พ.", "พฤ.", "ศ.", "ส.", "อา."];
export const pad = n => String(n).padStart(2, "0");
export const ymd = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
export const parseYmd = s => { const [y, m, d] = s.split("-").map(Number); return new Date(y, m - 1, d); };
export const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
export const isoDow = d => ((d.getDay() + 6) % 7) + 1;
export const mondayOf = d => { const x = new Date(d.getFullYear(), d.getMonth(), d.getDate()); return addDays(x, -((x.getDay() + 6) % 7)); };
/** minutes since the timetable's day start (06:00 = 0), so 01:00 follows 23:00 of the same night */
export const nm = t => { const [h, m] = t.split(":").map(Number); let x = h * 60 + m - H0 * 60; if (x < 0) x += 1440; return x; };
/** the timetable date that a moment belongs to (before 06:00 counts as the previous night) */
export const schoolDay = (now = new Date()) => { const d = now.getHours() < H0 ? addDays(now, -1) : new Date(now); d.setHours(0, 0, 0, 0); return d; };
export const at = (date, hhmm) => { const d = new Date(date); const [h, m] = hhmm.split(":").map(Number); d.setHours(h, m, 0, 0); if (h < H0) d.setDate(d.getDate() + 1); return d; };
export const span = (date, start, end) => { const s = at(date, start); return [s, new Date(s.getTime() + (nm(end) - nm(start)) * 60000)]; };
export const fmtDate = (d, o = { weekday: "short", day: "numeric", month: "short" }) => (typeof d === "string" ? parseYmd(d) : d).toLocaleDateString("th-TH", o);
export const fmtDur = ms => {
  let s = Math.max(0, Math.floor(ms / 1000)); const d = Math.floor(s / 86400); s %= 86400;
  return (d ? d + " วัน " : "") + [Math.floor(s / 3600), Math.floor((s % 3600) / 60), s % 60].map(pad).join(":");
};
export const yearsTxt = ys => (!ys || ys.length === 7 ? "ทุกชั้นปี" : "ปี " + [...ys].sort((a, b) => a - b).join(", "));

/** every concrete class meeting in [from, to) */
export function occurrences(courses, from, to) {
  const out = [];
  for (let d = new Date(from); d < to; d = addDays(d, 1)) {
    const dow = isoDow(d);
    for (const c of courses) for (const s of c.sessions || []) {
      if (+s.day !== dow) continue;
      const [a, b] = span(d, s.start, s.end);
      out.push({ course: c, session: s, date: new Date(d), start: a, end: b });
    }
  }
  return out.sort((x, y) => x.start - y.start);
}
/** the class that is running now, or the next one within two weeks */
export function nextClass(courses, now = new Date()) {
  const occ = occurrences(courses, addDays(schoolDay(now), -1), addDays(schoolDay(now), 15));
  return occ.find(o => o.start <= now && now < o.end) || occ.find(o => o.start > now) || null;
}
