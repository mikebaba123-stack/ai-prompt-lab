# Slytherin Academy

เว็บแอปบ้านสลิธีริน: แดชบอร์ด ตารางเรียน ปฏิทิน สอบ งาน ประกาศ และกิจกรรม พร้อมฉากปราสาท 3D และแจ้งเตือน Discord

## ใช้งานทันที
ไฟล์ `dist/index.html` เป็นเว็บทั้งเว็บในไฟล์เดียว ลากโฟลเดอร์ `dist` ไปวางที่ https://app.netlify.com/drop ได้เลย

## ตั้งค่าฐานข้อมูลกลาง + Discord
1. สร้างโปรเจกต์ที่ supabase.com → SQL Editor → วาง `supabase/setup.sql` → Run
2. ใส่ Project URL และ anon key ใน `src/config.js` (หรือในหน้า “เชื่อมต่อ” ของเว็บ)
3. สร้าง Discord webhook แล้วรันคำสั่ง SQL ที่หน้า “เชื่อมต่อ” แสดงไว้

## แก้ไขโค้ด
```
npm install
npm run dev     # เปิดดูระหว่างแก้
npm run build   # สร้าง dist/index.html ใหม่
```
เทคโนโลยี: React, React Three Fiber (three.js), Framer Motion, Supabase
