# ห้องทดลองพรอมป์ AI — GE931-1

เว็บไซต์สรุปการฝึกเขียน Prompt ใน 6 เครื่องมือ ผ่านหัวข้อ **ปัญญาประดิษฐ์ (AI)**
แต่ละแง่แสดง 5 ขั้น: พรอมป์แรก (zero-shot) → ผลลัพธ์ → พรอมป์ใหม่ (few-shot) → ผลลัพธ์ → บทสะท้อน

## ไฟล์ในโปรเจกต์
- `index.html` — เว็บไซต์ทั้งหมด (ไฟล์เดียวจบ พร้อม deploy)
- `ai_article.tex` — บทความ LaTeX สำหรับแง่ที่ 4 (คอมไพล์ด้วย XeLaTeX บน Overleaf)

## วิธีนำขึ้น GitHub Pages
1. สร้าง repository ใหม่ (Public) เช่น `ai-prompt-lab`
2. อัปโหลด `index.html` เข้าไปใน repo แล้ว Commit
3. ไปที่ **Settings → Pages** → Branch: `main`, Folder: `/ (root)` → Save
4. รอ 1–2 นาที จะได้ลิงก์ `https://<username>.github.io/ai-prompt-lab/`

## 6 แง่ที่ทำ
1. สร้างรูปด้วย AI (Canva)
2. กราฟความสัมพันธ์ทางคณิตศาสตร์ (Desmos)
3. ไดอะแกรมจาก Mermaid
4. บทความจาก LaTeX (Overleaf)
5. สไลด์สรุปด้วย NotebookLM
6. เว็บไซต์บน GitHub (หน้านี้เอง)

จัดทำโดย G · ปีการศึกษา 2569 เทอม 1
