# ใบส่งงาน — GE931-1 · ฝึกใช้ Prompt ในแง่ต่าง ๆ

**ผู้จัดทำ:** G · **Keyword:** ปัญญาประดิษฐ์ (AI) · **กำหนดส่ง:** 13 กันยายน 2569 23:59

## ลิงก์ที่ใช้ส่ง (เปิดได้ทันที)

| สิ่งที่ส่ง | ลิงก์ |
|---|---|
| **เว็บไซต์งาน** (ตัวหลัก — มีครบ 6 แง่ × 5 ขั้น) | https://mikebaba123-stack.github.io/ai-prompt-lab/ |
| **สไลด์สรุป 30 หน้า** (6 แง่ × 5 ขั้น = 30 หน้าพอดี) | https://mikebaba123-stack.github.io/ai-prompt-lab/slides.html |
| **ผลงานต่อยอด — Nival** (โบนัส) | https://mikebaba123-stack.github.io/ai-prompt-lab/nival/ |
| **ซอร์สโค้ดบน GitHub** | https://github.com/mikebaba123-stack/ai-prompt-lab |

> **คะแนนโบนัส:** เว็บไซต์บน GitHub Pages มีผลงานแง่ที่ 1–5 ฝังอยู่ครบและต่อเนื่องเป็นเรื่องเดียวกัน (ภาพ AI → กราฟ → ไดอะแกรม → บทความ → สไลด์ → เว็บไซต์)

---

## ตารางตรวจงาน 6 แง่ × 5 ขั้น (30 ข้อ)

ทุกแง่ทำครบ 5 ขั้นตามโจทย์: พรอมป์แรก (zero-shot) → ผลลัพธ์ → พรอมป์ใหม่ (few-shot) → ผลลัพธ์ → บทสะท้อน

### แง่ที่ 1 · สร้างรูปด้วย AI (Canva) — [ดูในเว็บ](https://mikebaba123-stack.github.io/ai-prompt-lab/#exp-01) · [สไลด์ 2–6](https://mikebaba123-stack.github.io/ai-prompt-lab/slides.html#p2)

| ขั้น | สิ่งที่ส่ง | อยู่ที่ไหน |
|---|---|---|
| 1 | พรอมป์แรก `สร้างรูปเกี่ยวกับปัญญาประดิษฐ์` | เว็บ #exp-01 / `assets/prompts/prompts-all.md` |
| 2 | ผลลัพธ์ที่ 1 — หุ่นยนต์ทั่วไป ไม่ตรงคอนเซ็ปต์ | `assets/img/01-image-zero-shot.svg` |
| 3 | พรอมป์ใหม่ (few-shot) — ประธาน + สไตล์ + โทนสี + แสง + สัดส่วน + negative | เว็บ #exp-01 |
| 4 | ผลลัพธ์ที่ 2 — ภาพตรงคอนเซ็ปต์ + แกลเลอรีภาพ AI 5 ภาพ + ดีไซน์บน Canva | `assets/img/01-image-few-shot.svg` |
| 5 | บทสะท้อน — บรรยายภาพเหมือนสั่งช่างภาพ | เว็บ #exp-01 |

### แง่ที่ 2 · กราฟความสัมพันธ์ทางคณิตศาสตร์ (Desmos) — [ดูในเว็บ](https://mikebaba123-stack.github.io/ai-prompt-lab/#exp-02) · [สไลด์ 7–11](https://mikebaba123-stack.github.io/ai-prompt-lab/slides.html#p7)

| ขั้น | สิ่งที่ส่ง | อยู่ที่ไหน |
|---|---|---|
| 1 | พรอมป์แรก `วาดกราฟของ AI ใน Desmos` | เว็บ #exp-02 |
| 2 | ผลลัพธ์ที่ 1 — ไม่มีสมการให้วาด | เว็บ #exp-02 |
| 3 | พรอมป์ใหม่ — ระบุ 3 ฟังก์ชันกระตุ้น + ช่วงแกน + สี + คำอธิบาย | เว็บ #exp-02 |
| 4 | ผลลัพธ์ที่ 2 — กราฟ sigmoid/tanh/ReLU + **กราฟ Desmos โต้ตอบในหน้าเว็บ** | `assets/desmos/activation-functions.txt`, `assets/img/02-activation-graph.svg` |
| 5 | บทสะท้อน — ต้องแปลงแนวคิดเป็นความสัมพันธ์ที่วาดได้ | เว็บ #exp-02 |

### แง่ที่ 3 · ไดอะแกรมจาก Mermaid — [ดูในเว็บ](https://mikebaba123-stack.github.io/ai-prompt-lab/#exp-03) · [สไลด์ 12–16](https://mikebaba123-stack.github.io/ai-prompt-lab/slides.html#p12)

| ขั้น | สิ่งที่ส่ง | อยู่ที่ไหน |
|---|---|---|
| 1 | พรอมป์แรก `ทำ flowchart เกี่ยวกับ AI ให้หน่อย` | เว็บ #exp-03 |
| 2 | ผลลัพธ์ที่ 1 — ผัง 3 node ที่ใช้อธิบายอะไรไม่ได้ | `assets/mermaid/03-zero-shot.mmd` |
| 3 | พรอมป์ใหม่ — ขั้นตอน + จุดตัดสินใจ + ลูปวนปรับปรุง + ภาษาไทย | เว็บ #exp-03 |
| 4 | ผลลัพธ์ที่ 2 — วงจรพัฒนาโมเดล ML (เรนเดอร์สดในหน้า + เปิดใน mermaid.live ได้) | `assets/mermaid/03-few-shot.mmd` |
| 5 | บทสะท้อน — diagram-as-code ต้องมีโครงในหัวก่อน | เว็บ #exp-03 |

### แง่ที่ 4 · บทความจาก LaTeX (Overleaf) — [ดูในเว็บ](https://mikebaba123-stack.github.io/ai-prompt-lab/#exp-04) · [สไลด์ 17–21](https://mikebaba123-stack.github.io/ai-prompt-lab/slides.html#p17)

| ขั้น | สิ่งที่ส่ง | อยู่ที่ไหน |
|---|---|---|
| 1 | พรอมป์แรก `เขียนบทความ LaTeX เรื่อง AI` | เว็บ #exp-04 |
| 2 | ผลลัพธ์ที่ 1 — โครงเปล่า 3 บรรทัด ภาษาไทยพัง | เว็บ #exp-04 |
| 3 | พรอมป์ใหม่ — abstract + 3 หัวข้อ + สมการเลขที่ + ฟอนต์ไทย + บรรณานุกรม + XeLaTeX | เว็บ #exp-04 |
| 4 | ผลลัพธ์ที่ 2 — ไฟล์ `.tex` คอมไพล์บน Overleaf ได้ (มีปุ่ม "เปิดใน Overleaf") | `ai_article.tex` |
| 5 | บทสะท้อน — ต้องระบุสภาพแวดล้อมที่จะคอมไพล์ด้วย | เว็บ #exp-04 |

### แง่ที่ 5 · สไลด์สรุปด้วย NotebookLM — [ดูในเว็บ](https://mikebaba123-stack.github.io/ai-prompt-lab/#exp-05) · [สไลด์ 22–26](https://mikebaba123-stack.github.io/ai-prompt-lab/slides.html#p22)

| ขั้น | สิ่งที่ส่ง | อยู่ที่ไหน |
|---|---|---|
| 1 | พรอมป์แรก `สรุปเรื่อง AI เป็นสไลด์` | เว็บ #exp-05 |
| 2 | ผลลัพธ์ที่ 1 — bullet กองรวม ไม่รู้ผู้ฟัง | เว็บ #exp-05 |
| 3 | พรอมป์ใหม่ — ผู้ฟัง + จำนวนสไลด์ + เวลา + โครงต่อสไลด์ + ลำดับเรื่อง | เว็บ #exp-05 |
| 4 | ผลลัพธ์ที่ 2 — เด็ค 6 สไลด์ + โน้ตผู้พูด (เปิดดูในหน้าเว็บได้) | `assets/notebooklm/slide-outline.md` |
| 5 | บทสะท้อน — สไลด์ออกแบบรอบผู้ฟัง ไม่ใช่รอบเนื้อหา | เว็บ #exp-05 |

> เอกสารต้นทางสำหรับอัปโหลดเข้า NotebookLM: `assets/notebooklm/source-ai-intro.md`

### แง่ที่ 6 · เว็บไซต์บน GitHub — [ดูในเว็บ](https://mikebaba123-stack.github.io/ai-prompt-lab/#exp-06) · [สไลด์ 27–31](https://mikebaba123-stack.github.io/ai-prompt-lab/slides.html#p27)

| ขั้น | สิ่งที่ส่ง | อยู่ที่ไหน |
|---|---|---|
| 1 | พรอมป์แรก `ทำเว็บเกี่ยวกับ AI` | เว็บ #exp-06 |
| 2 | ผลลัพธ์ที่ 1 — หน้า HTML เปล่า deploy ไม่ได้ | เว็บ #exp-06 |
| 3 | พรอมป์ใหม่ — รวมผลงาน 6 แง่ + โครง 5 ขั้น + ธีม + ฝังสื่อ + responsive + ปลายทาง | เว็บ #exp-06 |
| 4 | ผลลัพธ์ที่ 2 — **เว็บไซต์นี้** บน GitHub Pages | `index.html` |
| 5 | บทสะท้อน — งานปลายทางซับซ้อนต้องระบุครบ 4 ด้าน | เว็บ #exp-06 |

---

## บทสะท้อนภาพรวม (5 หลักการ)

1. **ให้บริบท (Context)** — บอกว่าใครใช้ ใช้ทำอะไร ในสถานการณ์ไหน
2. **เจาะจง (Specificity)** — ระบุประธาน ตัวแปร สไตล์ ขั้นตอน แทนคำกว้าง ๆ อย่าง "เกี่ยวกับ AI"
3. **กำหนดรูปแบบผลลัพธ์ (Format)** — 6 สไลด์, flowchart แนวตั้ง, สมการเลขที่, ไฟล์ .tex
4. **ยกตัวอย่าง + ข้อจำกัด** — ใส่ตัวอย่างและ "สิ่งที่ไม่ต้องการ" (negative prompt)
5. **ทำซ้ำและปรับ (Iterate)** — พรอมป์แรกคือจุดเริ่ม few-shot คือผลของการวนปรับ

→ ดูฉบับเต็มที่ [สรุปภาพรวมในเว็บ](https://mikebaba123-stack.github.io/ai-prompt-lab/#reflection) และ [หน้าสรุปของสไลด์](https://mikebaba123-stack.github.io/ai-prompt-lab/slides.html#p32)

---

## ไฟล์ทั้งหมดในโปรเจกต์

```
index.html                              เว็บหลัก 6 แง่ × 5 ขั้น
slides.html                             เด็คสไลด์ 30 หน้า (กด P บันทึกเป็น PDF)
nival/index.html                        ผลงานต่อยอด Nival (โบนัส)
ai_article.tex                          บทความ LaTeX (แง่ที่ 4)
assets/img/01-image-zero-shot.svg       ภาพผลลัพธ์ zero-shot (แง่ที่ 1)
assets/img/01-image-few-shot.svg        ภาพผลลัพธ์ few-shot (แง่ที่ 1)
assets/img/02-activation-graph.svg      กราฟฟังก์ชันกระตุ้น (แง่ที่ 2)
assets/desmos/activation-functions.txt  นิพจน์ + ช่วงแกนสำหรับ Desmos
assets/mermaid/03-zero-shot.mmd         โค้ด Mermaid ผลลัพธ์แรก
assets/mermaid/03-few-shot.mmd          โค้ด Mermaid ผลลัพธ์ใหม่
assets/notebooklm/source-ai-intro.md    เอกสารต้นทางสำหรับ NotebookLM
assets/notebooklm/slide-outline.md      โครง 6 สไลด์ + โน้ตผู้พูด
assets/prompts/prompts-all.md           คลังพรอมป์ทั้ง 12 อัน (6 แง่ × 2)
```

## วิธีทำ PDF ของสไลด์ (ถ้าอาจารย์ขอไฟล์)

เปิด `slides.html` → กดปุ่ม **"พิมพ์ / บันทึก PDF"** (หรือกดปุ่ม **P**) → เลือก **Save as PDF** → แนวนอน A4 → ได้ไฟล์ 32 หน้า (ปก + 30 หน้าเนื้อหา + สรุป)
