# ห้องทดลองพรอมป์ AI — GE931-1

งานฝึกเขียน **Prompt** 6 เครื่องมือ ผ่าน Keyword **ปัญญาประดิษฐ์ (AI)**
แต่ละแง่แสดง 5 ขั้นตามโจทย์: **พรอมป์แรก (zero-shot) → ผลลัพธ์ → พรอมป์ใหม่ (few-shot) → ผลลัพธ์ → บทสะท้อน**

🔗 **เว็บไซต์:** https://mikebaba123-stack.github.io/ai-prompt-lab/
🎞 **เด็คสไลด์ 30 หน้า (6 แง่ × 5 ขั้น):** https://mikebaba123-stack.github.io/ai-prompt-lab/slides.html
★ **ผลงานต่อยอด — Nival, Cyberspace Identity:** https://mikebaba123-stack.github.io/ai-prompt-lab/nival/

---

## โครงไฟล์

| ไฟล์ / โฟลเดอร์ | คืออะไร |
|---|---|
| `index.html` | เว็บไซต์หลัก — 6 แง่ × 5 ขั้น ฝัง Mermaid, MathJax, กราฟ, กราฟ Desmos โต้ตอบ, สลับธีมสว่าง/มืด |
| `slides.html` | เด็คสไลด์ 30 หน้า (แง่ละ 5 หน้า) + หน้าปก + หน้าสรุป → กด **P** เพื่อบันทึกเป็น PDF |
| `ai_article.tex` | แง่ที่ 4 — บทความ LaTeX ภาษาไทย (คอมไพล์ด้วย **XeLaTeX** บน Overleaf) |
| `assets/img/` | รูปผลลัพธ์แง่ที่ 1 (zero-shot / few-shot) และกราฟแง่ที่ 2 เป็นไฟล์ SVG |
| `assets/desmos/` | นิพจน์และช่วงแกนสำหรับวางใน Desmos |
| `assets/mermaid/` | โค้ด Mermaid ทั้งผลลัพธ์ zero-shot และ few-shot (`.mmd`) |
| `assets/notebooklm/` | เอกสารต้นทางที่อัปโหลดเข้า NotebookLM + โครง 6 สไลด์พร้อมโน้ตผู้พูด |
| `assets/prompts/prompts-all.md` | คลังพรอมป์ทั้ง 12 อัน (6 แง่ × zero/few-shot) คัดลอกไปทดลองซ้ำได้ |
| `nival/index.html` | ผลงานต่อยอด — หน้า Landing *Nival — Cyberspace Identity* ไฟล์เดียวจบ ใช้ภาพ AI ชุดเดียวกับแง่ที่ 1 มีกลไก spotlight reveal ตามเคอร์เซอร์ |
| `.github/workflows/pages.yml` | deploy ขึ้น GitHub Pages (สั่งรันเองจากแท็บ Actions) |

## 6 แง่ที่ทำ

| # | แง่ | เครื่องมือ | ผลลัพธ์ที่เปิดได้ |
|---|---|---|---|
| 1 | สร้างรูปด้วย AI | Canva / text-to-image | `assets/img/01-image-*.svg` + ดีไซน์บน Canva |
| 2 | ความสัมพันธ์ทางคณิตศาสตร์ | Desmos | กราฟ sigmoid / tanh / ReLU (ฝังแบบโต้ตอบในเว็บ) |
| 3 | ไดอะแกรมจากโค้ด | Mermaid | วงจรการพัฒนาโมเดล ML (เรนเดอร์ในเว็บ + เปิดใน mermaid.live) |
| 4 | บทความวิชาการ | Overleaf / LaTeX | `ai_article.tex` + ปุ่ม “เปิดใน Overleaf” |
| 5 | สไลด์สรุป | NotebookLM | เอกสารต้นทาง + โครง 6 สไลด์ + เด็ค `slides.html` |
| 6 | เว็บไซต์ | GitHub Pages | เว็บไซต์นี้ (รวมผลงานแง่ที่ 1–5 ไว้ต่อเนื่องกัน) |

## วิธีเปิด GitHub Pages

**แบบที่ 1 — จาก branch (ง่ายสุด)**
Settings → Pages → Source: **Deploy from a branch** → Branch `main` → `/ (root)` → Save

**แบบที่ 2 — ผ่าน GitHub Actions**
Settings → Pages → Source: **GitHub Actions** → แท็บ Actions → workflow *Deploy site to GitHub Pages* → **Run workflow**

รอ 1–2 นาที จะได้ URL `https://mikebaba123-stack.github.io/ai-prompt-lab/`

## เปิดดูในเครื่อง

```bash
python3 -m http.server 8000
# แล้วเปิด http://localhost:8000/
```

---

## ความสอดคล้องของงาน (keyword: ปัญญาประดิษฐ์)

ภาพแอนดรอยด์ที่สร้างด้วย AI เป็น "เส้นเรื่อง" ที่ร้อยงานทั้งหมดเข้าด้วยกัน

1. **แง่ที่ 1** สร้างภาพด้วย AI จากพรอมป์ few-shot → ได้ชุดภาพตัวตน 5 ภาพ + ภาพหลัก 2 รุ่น (ขาว-เงิน / เกราะดำ)
2. **แง่ที่ 2–5** อธิบายกลไกเบื้องหลัง AI ชุดเดียวกัน (กราฟฟังก์ชันกระตุ้น → วงจรพัฒนาโมเดล → บทความนิวรอนเทียม → สไลด์สรุป)
3. **แง่ที่ 6** เขียนเว็บไซต์รวมทุกอย่าง แล้วต่อยอดเป็นหน้า **Nival** ที่ใช้ภาพจากข้อ 1 เป็นพระเอก
   พร้อมกลไก *spotlight reveal* (เลื่อนเมาส์เพื่อเผยร่างเกราะดำผ่าน radial mask)

ลิงก์เดินไปกลับได้ทั้งสองทาง: หน้าหลัก → ปุ่ม “ผลงานต่อยอด Nival” · หน้า Nival → ปุ่ม “GE931-1 ↗” มุมล่างซ้าย

---

จัดทำโดย **G** · วิชา GE931-1 · ปีการศึกษา 2569 ภาคเรียนที่ 1
