-- =====================================================================
--  บ้านสลิธีริน · ตั้งค่าฐานข้อมูล Supabase
--  วิธีใช้: Supabase → SQL Editor → New query → วางทั้งไฟล์ → Run
--  รันซ้ำได้ (ไม่ลบข้อมูลเดิม)
--
--  ทำอะไรบ้าง
--   • ตาราง classes (วิชาเรียน), activities (กิจกรรม), change_log (ประวัติ)
--   • ประวัติการแก้ไขถูกบันทึกโดยฐานข้อมูลเอง (trigger) ปลอมไม่ได้จากหน้าเว็บ
--   • ทุกการเพิ่ม/แก้ไข/ยกเลิก/ลบ ของทุกชั้นปี → ส่งข้อความเข้า Discord อัตโนมัติ
--   • Discord webhook เก็บในตาราง app_secret ที่หน้าเว็บอ่านไม่ได้
--
--  ตั้ง Discord (ทำหลังรันไฟล์นี้) — แก้ URL แล้วรันใน SQL Editor:
--    insert into app_secret(key, value) values
--      ('discord_webhook', 'https://discord.com/api/webhooks/xxxx/yyyy')
--    on conflict (key) do update set value = excluded.value;
--  (ไม่บังคับ) แท็กยศเวลาแจ้งเตือน:
--    insert into app_secret(key, value) values ('discord_role_id', '123456789012345678')
--    on conflict (key) do update set value = excluded.value;
-- =====================================================================

create extension if not exists pg_net;

-- ---------- ตาราง ----------
create table if not exists classes (
  id          uuid primary key default gen_random_uuid(),
  years       int[] not null check (cardinality(years) > 0 and years <@ array[1,2,3,4,5,6,7]),
  date        date not null,
  start_time  text not null check (start_time ~ '^\d{2}:\d{2}$'),
  end_time    text not null check (end_time ~ '^\d{2}:\d{2}$'),
  subject     text not null check (char_length(subject) between 1 and 120),
  teacher     text not null default '' check (char_length(teacher) <= 120),
  location    text not null default '' check (char_length(location) <= 120),
  note        text not null default '' check (char_length(note) <= 1000),
  cancelled   boolean not null default false,
  deleted     boolean not null default false,
  series_id   uuid,
  created_by  text not null default '' check (char_length(created_by) <= 60),
  updated_by  text not null default '' check (char_length(updated_by) <= 60),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create table if not exists activities (
  id          uuid primary key default gen_random_uuid(),
  years       int[] not null check (cardinality(years) > 0 and years <@ array[1,2,3,4,5,6,7]),
  date        date not null,
  start_time  text not null check (start_time ~ '^\d{2}:\d{2}$'),
  end_time    text not null check (end_time ~ '^\d{2}:\d{2}$'),
  title       text not null check (char_length(title) between 1 and 120),
  category    text not null default '' check (char_length(category) <= 60),
  organizer   text not null default '' check (char_length(organizer) <= 120),
  location    text not null default '' check (char_length(location) <= 120),
  note        text not null default '' check (char_length(note) <= 1000),
  cancelled   boolean not null default false,
  deleted     boolean not null default false,
  series_id   uuid,
  created_by  text not null default '' check (char_length(created_by) <= 60),
  updated_by  text not null default '' check (char_length(updated_by) <= 60),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create table if not exists change_log (
  id       bigint generated always as identity primary key,
  at       timestamptz not null default now(),
  action   text not null,          -- add | edit | cancel | restore | delete
  kind     text not null,          -- classes | activities
  item_id  uuid not null,
  years    int[] not null,
  actor    text not null,
  item     jsonb not null,         -- สภาพรายการหลังเปลี่ยน
  changes  jsonb not null default '{}'::jsonb  -- { field: [ก่อน, หลัง] }
);

create table if not exists app_secret (
  key   text primary key,
  value text not null
);

create index if not exists classes_date_idx on classes (date) where not deleted;
create index if not exists activities_date_idx on activities (date) where not deleted;
create index if not exists change_log_at_idx on change_log (at desc);

-- ---------- updated_at อัตโนมัติ ----------
create or replace function touch_updated_at() returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end $$;

drop trigger if exists classes_touch on classes;
create trigger classes_touch before update on classes for each row execute function touch_updated_at();
drop trigger if exists activities_touch on activities;
create trigger activities_touch before update on activities for each row execute function touch_updated_at();

-- ---------- บันทึกประวัติ ----------
create or replace function log_change() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  n jsonb := to_jsonb(new);
  o jsonb;
  act text;
  actor text;
  diff jsonb := '{}'::jsonb;
  k text;
begin
  if tg_op = 'INSERT' then
    act := 'add';
    actor := n->>'created_by';
  else
    o := to_jsonb(old);
    actor := n->>'updated_by';
    if not (o->>'deleted')::boolean and (n->>'deleted')::boolean then
      act := 'delete';
    elsif (o->>'deleted')::boolean and not (n->>'deleted')::boolean then
      act := 'restore';
    elsif (o->>'cancelled')::boolean <> (n->>'cancelled')::boolean then
      act := case when (n->>'cancelled')::boolean then 'cancel' else 'restore' end;
    else
      act := 'edit';
      for k in select jsonb_object_keys(n) loop
        if k not in ('id','series_id','created_at','updated_at','created_by','updated_by','cancelled','deleted')
           and (o->k) is distinct from (n->k) then
          diff := diff || jsonb_build_object(k, jsonb_build_array(o->k, n->k));
        end if;
      end loop;
      if diff = '{}'::jsonb then
        return new;  -- ไม่มีอะไรเปลี่ยนจริง ไม่ต้องบันทึก
      end if;
    end if;
  end if;

  insert into change_log (action, kind, item_id, years, actor, item, changes)
  values (act, tg_table_name, new.id, new.years,
          coalesce(nullif(btrim(actor), ''), 'ไม่ทราบชื่อ'), n, diff);
  return new;
end $$;

drop trigger if exists classes_log on classes;
create trigger classes_log after insert or update on classes for each row execute function log_change();
drop trigger if exists activities_log on activities;
create trigger activities_log after insert or update on activities for each row execute function log_change();

-- ---------- ส่ง Discord ----------
create or replace function notify_discord() returns trigger
language plpgsql security definer set search_path = public, extensions as $$
declare
  url    text;
  role   text;
  it     jsonb := new.item;
  d      date  := (new.item->>'date')::date;
  days   text[] := array['จันทร์','อังคาร','พุธ','พฤหัสบดี','ศุกร์','เสาร์','อาทิตย์'];
  labels jsonb := '{"subject":"วิชา","title":"ชื่อกิจกรรม","date":"วันที่","start_time":"เวลาเริ่ม","end_time":"เวลาสิ้นสุด","teacher":"อาจารย์","organizer":"ผู้จัด","location":"สถานที่","note":"หมายเหตุ","years":"ชั้นปี","category":"ประเภท"}';
  ttl    text;
  color  int;
  fields jsonb;
  chg    text := '';
  k      text;
  person text;
begin
  select value into url from app_secret where key = 'discord_webhook';
  if url is null or url !~ '^https://(discord|discordapp)\.com/api/webhooks/' then
    return new;
  end if;
  select value into role from app_secret where key = 'discord_role_id';

  ttl := case new.action
           when 'add' then '➕ เพิ่ม' when 'edit' then '✏️ แก้ไข' when 'cancel' then '🚫 ยกเลิก'
           when 'delete' then '🗑️ ลบ' else '↩️ คืนสถานะ' end
         || case new.kind when 'classes' then 'วิชา' else 'กิจกรรม' end
         || ' · ' || coalesce(it->>'subject', it->>'title');
  color := case new.action
             when 'add' then 2074731 when 'edit' then 14147296 when 'cancel' then 15105570
             when 'delete' then 15548997 else 5793266 end;

  fields := jsonb_build_array(
    jsonb_build_object('name', 'ชั้นปี', 'value', 'ปี ' || array_to_string(new.years, ', '), 'inline', true),
    jsonb_build_object('name', 'วัน', 'value',
      days[extract(isodow from d)::int] || ' ' || to_char(d, 'DD/MM/') || (extract(year from d)::int + 543), 'inline', true),
    jsonb_build_object('name', 'เวลา', 'value', (it->>'start_time') || '–' || (it->>'end_time') || ' น.', 'inline', true)
  );
  if coalesce(it->>'location', '') <> '' then
    fields := fields || jsonb_build_object('name', 'สถานที่', 'value', it->>'location', 'inline', true);
  end if;
  person := coalesce(nullif(it->>'teacher', ''), nullif(it->>'organizer', ''));
  if person is not null then
    fields := fields || jsonb_build_object('name', case new.kind when 'classes' then 'อาจารย์' else 'ผู้จัด' end, 'value', person, 'inline', true);
  end if;
  if new.changes <> '{}'::jsonb then
    for k in select jsonb_object_keys(new.changes) loop
      chg := chg || '• ' || coalesce(labels->>k, k) || ': '
             || coalesce(nullif(new.changes->k->>0, ''), '–') || ' → '
             || coalesce(nullif(new.changes->k->>1, ''), '–') || E'\n';
    end loop;
    fields := fields || jsonb_build_object('name', 'สิ่งที่เปลี่ยน', 'value', left(chg, 1000));
  end if;
  if new.action in ('add', 'cancel') and coalesce(it->>'note', '') <> '' then
    fields := fields || jsonb_build_object('name', 'หมายเหตุ', 'value', left(it->>'note', 1000));
  end if;

  perform net.http_post(
    url := url,
    body := jsonb_build_object(
      'username', 'Slytherin Timetable',
      'content', case when role ~ '^\d+$' then '<@&' || role || '>' else null end,
      'allowed_mentions', jsonb_build_object('roles', case when role ~ '^\d+$' then jsonb_build_array(role) else '[]'::jsonb end),
      'embeds', jsonb_build_array(jsonb_build_object(
        'title', left(ttl, 250),
        'color', color,
        'fields', fields,
        'footer', jsonb_build_object('text', 'โดย ' || new.actor),
        'timestamp', to_char(new.at at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"')
      ))
    ),
    headers := '{"Content-Type": "application/json"}'::jsonb
  );
  return new;
end $$;

drop trigger if exists change_log_discord on change_log;
create trigger change_log_discord after insert on change_log for each row execute function notify_discord();

-- ---------- สิทธิ์ (Row Level Security) ----------
-- ทุกคนที่เปิดเว็บ: อ่าน/เพิ่ม/แก้ได้ (การ "ลบ" คือ deleted = true จึงกู้คืนได้เสมอ)
-- ลบจริงไม่ได้ · ประวัติอ่านได้อย่างเดียว · app_secret อ่านไม่ได้เลย
alter table classes    enable row level security;
alter table activities enable row level security;
alter table change_log enable row level security;
alter table app_secret enable row level security;

drop policy if exists "read classes"    on classes;
drop policy if exists "add classes"     on classes;
drop policy if exists "edit classes"    on classes;
create policy "read classes" on classes for select to anon, authenticated using (true);
create policy "add classes"  on classes for insert to anon, authenticated with check (not deleted);
create policy "edit classes" on classes for update to anon, authenticated using (true) with check (true);

drop policy if exists "read activities" on activities;
drop policy if exists "add activities"  on activities;
drop policy if exists "edit activities" on activities;
create policy "read activities" on activities for select to anon, authenticated using (true);
create policy "add activities"  on activities for insert to anon, authenticated with check (not deleted);
create policy "edit activities" on activities for update to anon, authenticated using (true) with check (true);

drop policy if exists "read log" on change_log;
create policy "read log" on change_log for select to anon, authenticated using (true);

revoke all on app_secret from anon, authenticated;
revoke delete on classes, activities, change_log from anon, authenticated;
revoke insert, update on change_log from anon, authenticated;

-- ---------- Realtime: หน้าเว็บอัปเดตทันทีเมื่อมีคนแก้ ----------
do $$
declare t text;
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    foreach t in array array['classes','activities','change_log'] loop
      if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and tablename = t) then
        execute format('alter publication supabase_realtime add table %I', t);
      end if;
    end loop;
  end if;
end $$;
