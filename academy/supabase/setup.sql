-- =====================================================================
--  Slytherin Academy · ตั้งค่าฐานข้อมูล Supabase
--  วิธีใช้: Supabase → SQL Editor → New query → วางทั้งไฟล์ → Run (รันซ้ำได้ ข้อมูลไม่หาย)
--
--  • ตาราง courses, exams, assignments, announcements, events + change_log (ประวัติ)
--  • ประวัติบันทึกโดยฐานข้อมูลเอง (trigger) ปลอมจากหน้าเว็บไม่ได้
--  • ทุกการเพิ่ม/แก้ไข/ลบ ทุกชั้นปี → แจ้งเตือนเข้า Discord อัตโนมัติ (ผ่าน pg_net)
--  • Discord webhook เก็บในตาราง app_secret ที่หน้าเว็บอ่านไม่ได้
--
--  ตั้ง Discord (หลังรันไฟล์นี้) — แทน URL แล้วรัน:
--    insert into app_secret(key, value) values ('discord_webhook', 'https://discord.com/api/webhooks/xxxx/yyyy')
--    on conflict (key) do update set value = excluded.value;
--  แท็กยศ (ไม่บังคับ):
--    insert into app_secret(key, value) values ('discord_role_id', '123456789012345678')
--    on conflict (key) do update set value = excluded.value;
-- =====================================================================

create extension if not exists pg_net;

create table if not exists courses (
  id          uuid primary key default gen_random_uuid(),
  name        text not null check (char_length(name) between 1 and 120),
  code        text not null default '' check (char_length(code) <= 40),
  teacher     text not null default '' check (char_length(teacher) <= 120),
  room        text not null default '' check (char_length(room) <= 120),
  color       text not null default '#2fbf7f' check (color ~ '^#[0-9a-fA-F]{6}$'),
  description text not null default '' check (char_length(description) <= 1000),
  sessions    jsonb not null default '[]'::jsonb check (jsonb_typeof(sessions) = 'array'),
  years       int[] not null check (cardinality(years) > 0 and years <@ array[1,2,3,4,5,6,7]),
  deleted     boolean not null default false,
  created_by  text not null default '' check (char_length(created_by) <= 60),
  updated_by  text not null default '' check (char_length(updated_by) <= 60),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create table if not exists exams (
  id          uuid primary key default gen_random_uuid(),
  title       text not null check (char_length(title) between 1 and 120),
  course_id   uuid references courses(id),
  date        date not null,
  start_time  text not null check (start_time ~ '^\d{2}:\d{2}$'),
  end_time    text not null check (end_time ~ '^\d{2}:\d{2}$'),
  room        text not null default '' check (char_length(room) <= 120),
  note        text not null default '' check (char_length(note) <= 1000),
  years       int[] not null check (cardinality(years) > 0 and years <@ array[1,2,3,4,5,6,7]),
  deleted     boolean not null default false,
  created_by  text not null default '' check (char_length(created_by) <= 60),
  updated_by  text not null default '' check (char_length(updated_by) <= 60),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create table if not exists assignments (
  id          uuid primary key default gen_random_uuid(),
  title       text not null check (char_length(title) between 1 and 120),
  course_id   uuid references courses(id),
  due_date    date not null,
  due_time    text not null default '23:59' check (due_time ~ '^\d{2}:\d{2}$'),
  description text not null default '' check (char_length(description) <= 1000),
  years       int[] not null check (cardinality(years) > 0 and years <@ array[1,2,3,4,5,6,7]),
  deleted     boolean not null default false,
  created_by  text not null default '' check (char_length(created_by) <= 60),
  updated_by  text not null default '' check (char_length(updated_by) <= 60),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create table if not exists announcements (
  id          uuid primary key default gen_random_uuid(),
  title       text not null check (char_length(title) between 1 and 120),
  body        text not null check (char_length(body) between 1 and 1000),
  pinned      boolean not null default false,
  years       int[] not null check (cardinality(years) > 0 and years <@ array[1,2,3,4,5,6,7]),
  deleted     boolean not null default false,
  created_by  text not null default '' check (char_length(created_by) <= 60),
  updated_by  text not null default '' check (char_length(updated_by) <= 60),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create table if not exists events (
  id          uuid primary key default gen_random_uuid(),
  title       text not null check (char_length(title) between 1 and 120),
  category    text not null default '' check (char_length(category) <= 60),
  place       text not null default '' check (char_length(place) <= 120),
  date        date not null,
  start_time  text not null check (start_time ~ '^\d{2}:\d{2}$'),
  end_time    text not null check (end_time ~ '^\d{2}:\d{2}$'),
  description text not null default '' check (char_length(description) <= 1000),
  years       int[] not null check (cardinality(years) > 0 and years <@ array[1,2,3,4,5,6,7]),
  deleted     boolean not null default false,
  created_by  text not null default '' check (char_length(created_by) <= 60),
  updated_by  text not null default '' check (char_length(updated_by) <= 60),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create table if not exists change_log (
  id       bigint generated always as identity primary key,
  at       timestamptz not null default now(),
  action   text not null,              -- add | edit | delete | restore
  kind     text not null,              -- table name
  item_id  uuid not null,
  years    int[] not null,
  actor    text not null,
  item     jsonb not null,
  changes  jsonb not null default '{}'::jsonb
);
create table if not exists app_secret (key text primary key, value text not null);
create index if not exists change_log_at_idx on change_log (at desc);

-- ---------- updated_at ----------
create or replace function touch_updated_at() returns trigger language plpgsql as $$
begin new.updated_at := now(); return new; end $$;

-- ---------- history ----------
create or replace function log_change() returns trigger
language plpgsql security definer set search_path = public as $$
declare n jsonb := to_jsonb(new); o jsonb; act text; actor text; diff jsonb := '{}'::jsonb; k text;
begin
  if tg_op = 'INSERT' then act := 'add'; actor := n->>'created_by';
  else
    o := to_jsonb(old); actor := n->>'updated_by';
    if not (o->>'deleted')::boolean and (n->>'deleted')::boolean then act := 'delete';
    elsif (o->>'deleted')::boolean and not (n->>'deleted')::boolean then act := 'restore';
    else
      act := 'edit';
      for k in select jsonb_object_keys(n) loop
        if k not in ('id','created_at','updated_at','created_by','updated_by','deleted') and (o->k) is distinct from (n->k) then
          diff := diff || jsonb_build_object(k, jsonb_build_array(o->k, n->k));
        end if;
      end loop;
      if diff = '{}'::jsonb then return new; end if;
    end if;
  end if;
  insert into change_log (action, kind, item_id, years, actor, item, changes)
  values (act, tg_table_name, new.id, new.years, coalesce(nullif(btrim(actor), ''), 'ไม่ทราบชื่อ'), n, diff);
  return new;
end $$;

do $$
declare t text;
begin
  foreach t in array array['courses','exams','assignments','announcements','events'] loop
    execute format('drop trigger if exists %I on %I', t || '_touch', t);
    execute format('create trigger %I before update on %I for each row execute function touch_updated_at()', t || '_touch', t);
    execute format('drop trigger if exists %I on %I', t || '_log', t);
    execute format('create trigger %I after insert or update on %I for each row execute function log_change()', t || '_log', t);
    execute format('alter table %I enable row level security', t);
    execute format('drop policy if exists "read" on %I', t);
    execute format('drop policy if exists "add" on %I', t);
    execute format('drop policy if exists "edit" on %I', t);
    execute format('create policy "read" on %I for select to anon, authenticated using (true)', t);
    execute format('create policy "add" on %I for insert to anon, authenticated with check (not deleted)', t);
    execute format('create policy "edit" on %I for update to anon, authenticated using (true) with check (true)', t);
    execute format('revoke delete on %I from anon, authenticated', t);
  end loop;
end $$;

-- ---------- Discord ----------
create or replace function discord_text(v jsonb, k text) returns text language sql immutable as $$
  select case
    when v is null or v = 'null'::jsonb then '–'
    when k = 'sessions' then coalesce((select string_agg(
        (array['จ.','อ.','พ.','พฤ.','ศ.','ส.','อา.'])[(s->>'day')::int] || ' ' || (s->>'start') || '–' || (s->>'end'), ', ')
        from jsonb_array_elements(v) s), '–')
    when k = 'years' then 'ปี ' || (select string_agg(x, ', ') from jsonb_array_elements_text(v) x)
    when k = 'pinned' then case when v::text = 'true' then 'ปักหมุด' else 'ไม่ปักหมุด' end
    when jsonb_typeof(v) = 'string' then coalesce(nullif(v #>> '{}', ''), '–')
    else v::text end
$$;

create or replace function notify_discord() returns trigger
language plpgsql security definer set search_path = public, extensions as $$
declare
  url text; role text; it jsonb := new.item; k text; chg text := '';
  kinds jsonb := '{"courses":["📜","รายวิชา"],"exams":["⚗️","การสอบ"],"assignments":["🪶","งาน"],"announcements":["📯","ประกาศ"],"events":["🕯️","กิจกรรม"]}';
  labels jsonb := '{"name":"ชื่อวิชา","code":"รหัสวิชา","teacher":"อาจารย์","room":"ห้อง","color":"สี","description":"รายละเอียด","sessions":"วันเวลาเรียน","years":"ชั้นปี","title":"ชื่อ","course_id":"รายวิชา","date":"วันที่","start_time":"เวลาเริ่ม","end_time":"เวลาสิ้นสุด","note":"หมายเหตุ","due_date":"กำหนดส่ง","due_time":"เวลาส่ง","body":"ข้อความ","pinned":"ปักหมุด","category":"ประเภท","place":"สถานที่"}';
  fields jsonb; d date; days text[] := array['จันทร์','อังคาร','พุธ','พฤหัสบดี','ศุกร์','เสาร์','อาทิตย์'];
  verb text := case new.action when 'add' then 'เพิ่ม' when 'edit' then 'แก้ไข' when 'delete' then 'ลบ' else 'กู้คืน' end;
begin
  select value into url from app_secret where key = 'discord_webhook';
  if url is null or url !~ '^https://(discord|discordapp)\.com/api/webhooks/' then return new; end if;
  select value into role from app_secret where key = 'discord_role_id';

  fields := jsonb_build_array(jsonb_build_object('name', 'ชั้นปี', 'value', 'ปี ' || array_to_string(new.years, ', '), 'inline', true));
  if new.kind = 'courses' then
    fields := fields || jsonb_build_object('name', 'วันเวลาเรียน', 'value', discord_text(it->'sessions', 'sessions'), 'inline', true);
    if coalesce(it->>'room','') <> '' then fields := fields || jsonb_build_object('name', 'ห้อง', 'value', it->>'room', 'inline', true); end if;
    if coalesce(it->>'teacher','') <> '' then fields := fields || jsonb_build_object('name', 'อาจารย์', 'value', it->>'teacher', 'inline', true); end if;
  elsif new.kind in ('exams','events') then
    d := (it->>'date')::date;
    fields := fields || jsonb_build_object('name', 'วัน', 'value', days[extract(isodow from d)::int] || ' ' || to_char(d, 'DD/MM/') || (extract(year from d)::int + 543), 'inline', true)
                     || jsonb_build_object('name', 'เวลา', 'value', (it->>'start_time') || '–' || (it->>'end_time') || ' น.', 'inline', true);
    if coalesce(it->>'room', it->>'place', '') <> '' then fields := fields || jsonb_build_object('name', 'สถานที่', 'value', coalesce(nullif(it->>'room',''), it->>'place'), 'inline', true); end if;
  elsif new.kind = 'assignments' then
    d := (it->>'due_date')::date;
    fields := fields || jsonb_build_object('name', 'กำหนดส่ง', 'value', days[extract(isodow from d)::int] || ' ' || to_char(d, 'DD/MM/') || (extract(year from d)::int + 543) || ' ' || (it->>'due_time') || ' น.', 'inline', true);
  elsif new.kind = 'announcements' and new.action = 'add' then
    fields := fields || jsonb_build_object('name', 'ข้อความ', 'value', left(it->>'body', 1000));
  end if;
  if new.changes <> '{}'::jsonb then
    for k in select jsonb_object_keys(new.changes) loop
      if k = 'color' then continue; end if;
      chg := chg || '• ' || coalesce(labels->>k, k) || ': ' || left(discord_text(new.changes->k->0, k), 120) || ' → ' || left(discord_text(new.changes->k->1, k), 120) || E'\n';
    end loop;
    if chg <> '' then fields := fields || jsonb_build_object('name', 'สิ่งที่เปลี่ยน', 'value', left(chg, 1000)); end if;
  end if;

  perform net.http_post(
    url := url,
    body := jsonb_build_object(
      'username', 'Slytherin Academy',
      'content', case when role ~ '^\d+$' then '<@&' || role || '>' else null end,
      'allowed_mentions', jsonb_build_object('roles', case when role ~ '^\d+$' then jsonb_build_array(role) else '[]'::jsonb end),
      'embeds', jsonb_build_array(jsonb_build_object(
        'title', left((kinds->new.kind->>0) || ' ' || verb || (kinds->new.kind->>1) || ' · ' || coalesce(it->>'name', it->>'title'), 250),
        'color', case new.action when 'add' then 2074731 when 'edit' then 12109256 when 'delete' then 14708858 else 12098402 end,
        'fields', fields,
        'footer', jsonb_build_object('text', 'โดย ' || new.actor),
        'timestamp', to_char(new.at at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"')))),
    headers := '{"Content-Type": "application/json"}'::jsonb);
  return new;
end $$;

drop trigger if exists change_log_discord on change_log;
create trigger change_log_discord after insert on change_log for each row execute function notify_discord();

-- the page asks this to show "Discord connected" without ever seeing the webhook
create or replace function discord_configured() returns boolean
language sql security definer set search_path = public stable as $$
  select exists (select 1 from app_secret where key = 'discord_webhook' and value ~ '^https://(discord|discordapp)\.com/api/webhooks/')
$$;
grant execute on function discord_configured() to anon, authenticated;

alter table change_log enable row level security;
alter table app_secret enable row level security;
drop policy if exists "read log" on change_log;
create policy "read log" on change_log for select to anon, authenticated using (true);
revoke all on app_secret from anon, authenticated;
revoke insert, update, delete on change_log from anon, authenticated;

-- ---------- realtime ----------
do $$
declare t text;
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    foreach t in array array['courses','exams','assignments','announcements','events'] loop
      if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and tablename = t) then
        execute format('alter publication supabase_realtime add table %I', t);
      end if;
    end loop;
  end if;
end $$;
