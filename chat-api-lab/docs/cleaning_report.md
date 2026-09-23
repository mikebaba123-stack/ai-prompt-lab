# รายงานการทำความสะอาดข้อมูล

**ไฟล์ต้นฉบับ:** `Social_Media_Usage_Survey_raw.csv` — 150 แถว × 10 คอลัมน์  
**ไฟล์ผลลัพธ์:** `Social_Media_Usage_Survey_clean.csv` — 150 แถว × 14 คอลัมน์

## กฎที่ใช้

1. กฎ 1 · ตัดช่องว่างหัวท้าย และแปลง '', ' ', 'missing', 'None' → ค่าว่าง (NaN)
2. กฎ 2 · Age: แปลงคำเป็นตัวเลข (5 ค่า เช่น 'twenty' → 20) และตัดค่านอกช่วง 13–100
3. กฎ 3 · เวลาใช้งาน 4 คอลัมน์: แปลงเป็นตัวเลข และตัดค่าติดลบ / เกิน 24 ชม.
4. กฎ 4 · รวมค่าที่สะกด/ตัวพิมพ์ต่างกัน 126 ช่อง (femail→Female, mal→Male, master→Master, late night→Late Night, GOOD/poor/' Fair '→Good/Poor/Fair)
5. กฎ 5 · ตัดแถวซ้ำทั้งแถว: 0 แถว
6. กฎ 6 · เติมค่าที่หาย — ตัวเลขใช้ค่ามัธยฐาน (median) ของคอลัมน์, หมวดหมู่ใช้ 'Unknown' พร้อมคอลัมน์ธง Age_was_missing / Time_values_missing เพื่อให้ตรวจย้อนได้ว่าค่าไหนถูกเติม
7. กฎ 7 · เพิ่มคอลัมน์ Total_Time_Hours (ผลรวมเวลาใช้งาน) และ Age_Group — ตรวจแล้วไม่มีแถวที่รวมเกิน 24 ชม. (0 แถว)

## ค่าที่หายไป ก่อน → หลัง

| คอลัมน์ | ค่าว่างก่อนเติม | วิธีเติม | ค่าว่างหลัง |
|---|---|---|---|
| Age | 2 | median | 0 |
| Facebook_Time | 2 | median | 0 |
| Instagram_Time | 6 | median | 0 |
| TikTok_Time | 8 | median | 0 |
| YouTube_Time | 6 | median | 0 |
| Gender | 12 | 'Unknown' | 12 |
| Education_Level | 5 | 'Unknown' | 5 |
| Usage_Period | 22 | 'Unknown' | 22 |
| Emotion | 36 | 'Unknown' | 36 |
| Sleep_Quality | 24 | 'Unknown' | 24 |

> หมายเหตุ: ช่อง 'Unknown' ไม่ใช่ข้อผิดพลาด แต่เป็นการบันทึกตรง ๆ ว่าผู้ตอบไม่ได้ให้ข้อมูล ซึ่งดีกว่าการเดาแทนเจ้าของข้อมูล

## ค่าที่ไม่ซ้ำหลังทำความสะอาด

- **Gender:** Female (76), Male (62), Unknown (12)
- **Education_Level:** Bachelor (64), High School (51), Master (22), Doctorate (8), Unknown (5)
- **Usage_Period:** Late Night (44), Morning (31), Afternoon (28), Evening (25), Unknown (22)
- **Emotion:** Unknown (36), Sad (33), Neutral (30), Happy (27), Anxious (24)
- **Sleep_Quality:** Good (68), Poor (29), Fair (29), Unknown (24)
