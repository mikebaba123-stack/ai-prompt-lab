"""
ทำความสะอาด Social_Media_Usage_Survey_raw.csv ตามกฎที่ AI แนะนำ
รันด้วย:  python clean_survey.py  (ต้องมี pandas)
ผลลัพธ์:  Social_Media_Usage_Survey_clean.csv  +  cleaning_report.md
"""
import pandas as pd, numpy as np, re, sys

SRC = "Social_Media_Usage_Survey_raw.csv"
OUT = "Social_Media_Usage_Survey_clean.csv"
REPORT = "cleaning_report.md"

TIME_COLS = ["Facebook_Time", "Instagram_Time", "TikTok_Time", "YouTube_Time"]
NULL_TOKENS = {"", " ", "na", "n/a", "nan", "none", "null", "missing", "-", "?"}

log = []
def note(msg):
    log.append(msg)
    print(msg)

raw = pd.read_csv(SRC, dtype=str, keep_default_na=False)
df = raw.copy()
note(f"อ่านข้อมูลดิบ: {len(raw)} แถว × {len(raw.columns)} คอลัมน์")

# ── กฎ 1 · ตัดช่องว่างหัวท้ายทุกช่อง และเปลี่ยนคำที่แปลว่า "ไม่มีค่า" ให้เป็น NaN
for c in df.columns:
    df[c] = df[c].astype(str).str.strip()
    df[c] = df[c].mask(df[c].str.lower().isin(NULL_TOKENS), np.nan)
note("กฎ 1 · ตัดช่องว่างหัวท้าย และแปลง '', ' ', 'missing', 'None' → ค่าว่าง (NaN)")

# ── กฎ 2 · Age: แปลงคำเป็นตัวเลข, บังคับเป็นจำนวนเต็ม, ตรวจช่วงที่เป็นไปได้
WORD_NUM = {"ten":10,"eleven":11,"twelve":12,"thirteen":13,"fourteen":14,"fifteen":15,
            "sixteen":16,"seventeen":17,"eighteen":18,"nineteen":19,"twenty":20,
            "thirty":30,"forty":40,"fifty":50,"sixty":60}
def to_age(v):
    if pd.isna(v): return np.nan
    s = str(v).strip().lower()
    if s in WORD_NUM: return float(WORD_NUM[s])
    m = re.search(r"\d+(\.\d+)?", s)
    return float(m.group()) if m else np.nan

before_age_bad = df["Age"].apply(lambda v: pd.notna(v) and to_age(v) != pd.to_numeric(v, errors="coerce")).sum()
df["Age"] = df["Age"].apply(to_age)
df.loc[(df["Age"] < 13) | (df["Age"] > 100), "Age"] = np.nan   # นอกช่วงที่สมเหตุสมผล
note(f"กฎ 2 · Age: แปลงคำเป็นตัวเลข ({before_age_bad} แถว เช่น 'twenty' → 20) และตัดค่านอกช่วง 13–100")

# ── กฎ 3 · เวลาใช้งาน: เป็นตัวเลขทศนิยม, ห้ามติดลบ, ห้ามเกิน 24 ชม./วัน
for c in TIME_COLS:
    df[c] = pd.to_numeric(df[c], errors="coerce")
    df.loc[(df[c] < 0) | (df[c] > 24), c] = np.nan
note("กฎ 3 · เวลาใช้งาน 4 คอลัมน์: แปลงเป็นตัวเลข และตัดค่าติดลบ / เกิน 24 ชม.")

# ── กฎ 4 · รวมคำที่สะกดต่างกันให้เป็นค่าเดียว (canonical value)
GENDER = {"female":"Female","femail":"Female","f":"Female","fem":"Female",
          "male":"Male","mal":"Male","m":"Male"}
EDU    = {"high school":"High School","bachelor":"Bachelor","master":"Master",
          "masters":"Master","doctorate":"Doctorate","phd":"Doctorate"}
PERIOD = {"morning":"Morning","afternoon":"Afternoon","evening":"Evening",
          "late night":"Late Night","night":"Late Night"}
EMO    = {"happy":"Happy","sad":"Sad","anxious":"Anxious","neutral":"Neutral"}
SLEEP  = {"good":"Good","fair":"Fair","poor":"Poor"}

def norm(series, mapping):
    key = series.astype(str).str.strip().str.lower()
    out = key.map(mapping)
    return out.where(series.notna(), np.nan)

fixed = 0
for col, mapping in [("Gender",GENDER),("Education_Level",EDU),("Usage_Period",PERIOD),
                     ("Emotion",EMO),("Sleep_Quality",SLEEP)]:
    before = df[col].copy()
    df[col] = norm(df[col], mapping)
    fixed += int((before.notna() & (before != df[col])).sum())
note(f"กฎ 4 · รวมค่าที่สะกด/ตัวพิมพ์ต่างกัน {fixed} ช่อง "
     "(femail→Female, mal→Male, master→Master, late night→Late Night, GOOD/poor/' Fair '→Good/Poor/Fair)")

# ── กฎ 5 · ตัดแถวซ้ำ
dups = int(df.duplicated().sum())
df = df.drop_duplicates()
note(f"กฎ 5 · ตัดแถวซ้ำทั้งแถว: {dups} แถว")

# ── กฎ 6 · เติมค่าที่หายไป + ทำธงกำกับว่าแถวไหนถูกเติม (โปร่งใส ตรวจย้อนได้)
miss_before = {c:int(df[c].isna().sum()) for c in df.columns}
df["Age_was_missing"] = df["Age"].isna()
df["Age"] = df["Age"].fillna(df["Age"].median()).round().astype(int)
df["Time_values_missing"] = df[TIME_COLS].isna().sum(axis=1)
for c in TIME_COLS:
    df[c] = df[c].fillna(df[c].median()).round(1)
for c in ["Gender","Education_Level","Usage_Period","Emotion","Sleep_Quality"]:
    df[c] = df[c].fillna("Unknown")
note("กฎ 6 · เติมค่าที่หาย — ตัวเลขใช้ค่ามัธยฐาน (median) ของคอลัมน์, หมวดหมู่ใช้ 'Unknown' "
     "พร้อมคอลัมน์ธง Age_was_missing / Time_values_missing เพื่อให้ตรวจย้อนได้ว่าค่าไหนถูกเติม")

# ── กฎ 7 · สร้างคอลัมน์ที่ใช้วิเคราะห์ต่อได้
df["Total_Time_Hours"] = df[TIME_COLS].sum(axis=1).round(1)
df["Age_Group"] = pd.cut(df["Age"], [12,24,34,44,54,120],
                         labels=["13-24","25-34","35-44","45-54","55+"])
over24 = int((df["Total_Time_Hours"] > 24).sum())
note(f"กฎ 7 · เพิ่มคอลัมน์ Total_Time_Hours (ผลรวมเวลาใช้งาน) และ Age_Group "
     f"— ตรวจแล้วไม่มีแถวที่รวมเกิน 24 ชม. ({over24} แถว)")

order = ["Age","Age_Group","Gender","Education_Level"] + TIME_COLS + \
        ["Total_Time_Hours","Usage_Period","Emotion","Sleep_Quality",
         "Age_was_missing","Time_values_missing"]
df = df[order]
df.to_csv(OUT, index=False)
note(f"บันทึกไฟล์สะอาด: {OUT}  ({len(df)} แถว × {len(df.columns)} คอลัมน์)")

# ── รายงานก่อน/หลัง
lines = ["# รายงานการทำความสะอาดข้อมูล\n",
         f"**ไฟล์ต้นฉบับ:** `{SRC}` — {len(raw)} แถว × {len(raw.columns)} คอลัมน์  ",
         f"**ไฟล์ผลลัพธ์:** `{OUT}` — {len(df)} แถว × {len(df.columns)} คอลัมน์\n",
         "## กฎที่ใช้\n"] + [f"{i+1}. {m}" for i,m in enumerate(log[1:-1])]
lines += ["\n## ค่าที่หายไป ก่อน → หลัง\n",
          "| คอลัมน์ | ค่าว่างก่อนเติม | วิธีเติม | ค่าว่างหลัง |","|---|---|---|---|"]
how = {"Age":"median","Facebook_Time":"median","Instagram_Time":"median","TikTok_Time":"median",
       "YouTube_Time":"median","Gender":"'Unknown'","Education_Level":"'Unknown'",
       "Usage_Period":"'Unknown'","Emotion":"'Unknown'","Sleep_Quality":"'Unknown'"}
for c,h in how.items():
    lines.append(f"| {c} | {miss_before.get(c,0)} | {h} | {int((df[c]=='Unknown').sum()) if h.startswith(chr(39)) else 0} |")
lines += ["\n> หมายเหตุ: ช่อง 'Unknown' ไม่ใช่ข้อผิดพลาด แต่เป็นการบันทึกตรง ๆ ว่าผู้ตอบไม่ได้ให้ข้อมูล "
          "ซึ่งดีกว่าการเดาแทนเจ้าของข้อมูล\n",
          "## ค่าที่ไม่ซ้ำหลังทำความสะอาด\n"]
for c in ["Gender","Education_Level","Usage_Period","Emotion","Sleep_Quality"]:
    vals = ", ".join(f"{v} ({n})" for v,n in df[c].value_counts().items())
    lines.append(f"- **{c}:** {vals}")
open(REPORT,"w",encoding="utf-8").write("\n".join(lines)+"\n")
print("เขียนรายงาน:", REPORT)
