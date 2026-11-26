/* ======================================================================
   CONFIG — แก้ตรงนี้แล้ว build ใหม่ (npm run build)
   ====================================================================== */
export const CONFIG = {
  supabaseUrl: "",          // เช่น "https://abcd1234.supabase.co" (เว้นว่าง = โหมดสาธิต หรือใส่ในหน้า "เชื่อมต่อ")
  supabaseKey: "",          // anon / publishable key
  discordServerId: "",      // Server Settings → Widget → Enable Server Widget → Server ID
  discordInviteUrl: "",     // ลิงก์เชิญเข้าเซิร์ฟเวอร์
  academicYear: "2569",
  term: "ภาคเรียนที่ 2",
  dayStartHour: 6,          // วันหนึ่งของตาราง 06:00 → 05:59 ของวันถัดไป (คาบหลังเที่ยงคืนนับเป็นคืนเดิม)
  periods: [["18:00", "19:30"], ["19:45", "21:15"], ["21:30", "23:00"], ["23:15", "00:45"], ["01:00", "02:00"]]
};
