"""
รวมข้อมูลจาก 2 แหล่งขึ้นไป (CSV/Excel) ตามกฎที่กำหนดไว้ใน 03_merge_rules.md

ใช้งาน:
    python merge_sources.py ไฟล์ที่1.csv ไฟล์ที่2.csv [--how concat|join] [--key คอลัมน์ร่วม]

ผลลัพธ์:
    source_profile.md     สรุปโครงสร้างไฟล์ต้นฉบับทุกไฟล์ (ใช้ส่งเป็น "ต้นฉบับของ data")
    merged_dataset.csv    ข้อมูลที่รวมและทำความสะอาดแล้ว
    merge_report.md       รายงานว่าจับคู่คอลัมน์อย่างไร แถวก่อน/หลัง และอะไรที่ทิ้งไป
"""
import sys, re, argparse
import pandas as pd, numpy as np

NULL_TOKENS = {"", " ", "na", "n/a", "nan", "none", "null", "missing", "-", "?", "unknown"}

# ── พจนานุกรมจับคู่ชื่อคอลัมน์ที่มักเขียนต่างกันระหว่างชุดข้อมูล ────────────
CANON = {
    "age":            ["age", "อายุ", "respondent_age", "user_age"],
    "gender":         ["gender", "sex", "เพศ"],
    "education":      ["education", "education_level", "edu", "academic_level", "degree"],
    "country":        ["country", "nation", "ประเทศ"],
    "platform":       ["platform", "app", "social_media", "most_used_platform", "most_used_app"],
    "daily_hours":    ["daily_hours", "avg_daily_usage_hours", "usage_hours", "time_spent",
                       "total_time_hours", "daily_usage", "screen_time"],
    "sleep":          ["sleep", "sleep_quality", "sleep_hours", "sleep_hours_per_night"],
    "emotion":        ["emotion", "mood", "mental_health_score", "feeling"],
    "usage_period":   ["usage_period", "time_of_day", "peak_time"],
}
def canon_name(col):
    """จับคู่ชื่อคอลัมน์แบบตรงตัวเท่านั้น — กัน Age กับ Age_Group ถูกยุบเป็นคอลัมน์เดียวกัน"""
    k = re.sub(r"[^a-z0-9]+", "_", str(col).strip().lower()).strip("_")
    for canon, variants in CANON.items():
        if k in variants:
            return canon
    return k

def unique_columns(cols):
    """ถ้าจับคู่แล้วชื่อชนกัน ให้เติมเลขต่อท้ายแทนที่จะทับกัน"""
    seen, out = {}, []
    for c in cols:
        if c in seen:
            seen[c] += 1
            out.append(f"{c}_{seen[c]}")
        else:
            seen[c] = 0
            out.append(c)
    return out

def load(path):
    if str(path).lower().endswith((".xlsx", ".xls")):
        return pd.read_excel(path, dtype=str)
    return pd.read_csv(path, dtype=str, keep_default_na=False)

def profile(path, df):
    lines = [f"### `{path}`", "",
             f"- จำนวนแถว: **{len(df)}** · จำนวนคอลัมน์: **{len(df.columns)}**", "",
             "| คอลัมน์ต้นฉบับ | ชื่อหลังจับคู่ | ตัวอย่างค่า (3 ค่าแรกที่ไม่ว่าง) | ค่าว่าง |",
             "|---|---|---|---|"]
    for c in df.columns:
        vals = [v for v in df[c].astype(str).str.strip() if v.lower() not in NULL_TOKENS][:3]
        empty = int(df[c].astype(str).str.strip().str.lower().isin(NULL_TOKENS).sum())
        lines.append(f"| `{c}` | `{canon_name(c)}` | {', '.join(vals) or '—'} | {empty} |")
    lines += ["", "ตัวอย่าง 5 แถวแรก:", "", "```", df.head(5).to_string(index=False), "```", ""]
    return "\n".join(lines)

def clean(df):
    out = df.copy()
    out.columns = unique_columns([canon_name(c) for c in out.columns])
    for c in out.columns:                                   # กฎ 1 · ช่องว่าง + ค่าว่างมาตรฐานเดียว
        out[c] = out[c].astype(str).str.strip()
        out[c] = out[c].mask(out[c].str.lower().isin(NULL_TOKENS), np.nan)
    for c in out.columns:                                   # กฎ 2 · คอลัมน์ที่ควรเป็นตัวเลข
        if re.search(r"age|hour|time|score|count|year", c):
            num = pd.to_numeric(out[c], errors="coerce")
            if num.notna().mean() > .5:
                out[c] = num
    if "gender" in out:                                     # กฎ 3 · รวมค่าหมวดหมู่
        g = out["gender"].astype(str).str.strip().str.lower()
        out["gender"] = g.map({"female":"Female","femail":"Female","f":"Female","woman":"Female",
                               "male":"Male","mal":"Male","m":"Male","man":"Male"}).where(out["gender"].notna())
    for c in out.columns:                                   # กฎ 4 · ข้อความอื่น → Title Case
        if out[c].dtype == object:
            out[c] = out[c].astype(str).str.strip().str.title().replace({"Nan": np.nan})
    return out.drop_duplicates()                            # กฎ 5 · ตัดแถวซ้ำ

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("files", nargs="+")
    ap.add_argument("--how", default="concat", choices=["concat", "join"])
    ap.add_argument("--key", default=None, help="คอลัมน์ร่วมสำหรับ --how join")
    a = ap.parse_args()

    raws, cleans, prof = [], [], ["# ต้นฉบับของข้อมูล (source profile)\n"]
    for f in a.files:
        df = load(f); raws.append((f, df))
        prof.append(profile(f, df))
        c = clean(df); c["source_file"] = f.split("/")[-1]
        cleans.append(c)
    open("source_profile.md", "w", encoding="utf-8").write("\n".join(prof))

    if a.how == "join":
        if not a.key: sys.exit("โหมด join ต้องระบุ --key")
        merged = cleans[0]
        for c in cleans[1:]:
            merged = merged.merge(c, on=a.key, how="outer", suffixes=("", "_2"))
    else:
        merged = pd.concat(cleans, ignore_index=True, sort=False)

    merged = merged.drop_duplicates()
    merged.to_csv("merged_dataset.csv", index=False)

    shared = set(cleans[0].columns)
    for c in cleans[1:]: shared &= set(c.columns)
    shared -= {"source_file"}
    rep = ["# รายงานการรวมข้อมูล\n",
           f"**วิธีรวม:** `{a.how}`" + (f" บนคอลัมน์ `{a.key}`" if a.key else " (ต่อแถว + จับคู่ชื่อคอลัมน์ให้เป็นมาตรฐานเดียว)"), "",
           "| ไฟล์ | แถวต้นฉบับ | แถวหลังทำความสะอาด | คอลัมน์ |", "|---|---|---|---|"]
    for (f, raw), c in zip(raws, cleans):
        rep.append(f"| `{f.split('/')[-1]}` | {len(raw)} | {len(c)} | {len(c.columns)-1} |")
    rep += ["", f"**ผลรวม:** {len(merged)} แถว × {len(merged.columns)} คอลัมน์", "",
            f"**คอลัมน์ที่ทั้งสองแหล่งมีร่วมกัน ({len(shared)}):** " + (", ".join(f"`{s}`" for s in sorted(shared)) or "—"), "",
            "**คอลัมน์ที่มีเฉพาะบางแหล่ง** (แถวของอีกแหล่งจะเป็นค่าว่าง ซึ่งถูกต้อง ไม่ใช่ข้อผิดพลาด):"]
    for (f, _), c in zip(raws, cleans):
        only = sorted(set(c.columns) - shared - {"source_file"})
        rep.append(f"- `{f.split('/')[-1]}`: " + (", ".join(f"`{o}`" for o in only) or "—"))
    rep += ["", "**ค่าว่างในไฟล์ผลลัพธ์ (ต่อคอลัมน์):**", "", "| คอลัมน์ | ค่าว่าง | % |", "|---|---|---|"]
    for c in merged.columns:
        n = int(merged[c].isna().sum())
        rep.append(f"| `{c}` | {n} | {n/len(merged)*100:.1f}% |")
    open("merge_report.md", "w", encoding="utf-8").write("\n".join(rep) + "\n")

    print("เขียนแล้ว: source_profile.md, merged_dataset.csv, merge_report.md")
    print(f"รวมได้ {len(merged)} แถว × {len(merged.columns)} คอลัมน์ | คอลัมน์ร่วม: {sorted(shared)}")

if __name__ == "__main__":
    main()
