-- ContentStudio — 初期スキーマ
-- SPEC docs/SPEC.md § 6 に準拠

-- スライドテンプレート（先に作成：他テーブルが参照する）
create table if not exists slide_templates (
  id          uuid primary key default gen_random_uuid(),
  label       text not null,
  category    text not null check (category in ('title', 'diagram', 'content', 'claim')),
  image_url   text,
  created_at  timestamptz default now()
);

-- エピソード
create table if not exists episodes (
  id          uuid primary key default gen_random_uuid(),
  slug        text not null,
  number      int not null,
  title       text not null,
  status      text not null default 'draft' check (status in ('draft', 'review', 'done')),
  created_at  timestamptz default now(),
  unique (number)
);

-- セクション
create table if not exists sections (
  id          uuid primary key default gen_random_uuid(),
  episode_id  uuid not null references episodes(id) on delete cascade,
  name        text not null,
  "order"     int not null,
  created_at  timestamptz default now()
);

-- 段落
create table if not exists paragraphs (
  id           uuid primary key default gen_random_uuid(),
  section_id   uuid not null references sections(id) on delete cascade,
  episode_id   uuid not null references episodes(id) on delete cascade,
  content      text not null default '',
  slide_memo   text not null default '',
  template_id  uuid references slide_templates(id) on delete set null,
  "order"      int not null,
  created_at   timestamptz default now(),
  updated_at   timestamptz default now()
);

-- スナップショット（記録単位）
create table if not exists snapshots (
  id           uuid primary key default gen_random_uuid(),
  episode_id   uuid not null references episodes(id) on delete cascade,
  author_name  text not null,
  summary      text not null,
  created_at   timestamptz default now()
);

-- スナップショット内の段落データ（記録時点のコピー）
create table if not exists snapshot_paragraphs (
  id            uuid primary key default gen_random_uuid(),
  snapshot_id   uuid not null references snapshots(id) on delete cascade,
  paragraph_id  uuid not null references paragraphs(id) on delete cascade,
  section_id    uuid not null references sections(id) on delete cascade,
  content       text not null,
  "order"       int not null
);

-- updated_at 自動更新トリガー
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create or replace trigger paragraphs_updated_at
  before update on paragraphs
  for each row execute function update_updated_at();

-- RLS（開発中は無効。本番前に有効化）
alter table episodes          enable row level security;
alter table sections          enable row level security;
alter table paragraphs        enable row level security;
alter table snapshots         enable row level security;
alter table snapshot_paragraphs enable row level security;
alter table slide_templates   enable row level security;

-- 開発用ポリシー（anon/authenticated 全許可）
create policy "dev_all_episodes"           on episodes            for all using (true) with check (true);
create policy "dev_all_sections"           on sections            for all using (true) with check (true);
create policy "dev_all_paragraphs"         on paragraphs          for all using (true) with check (true);
create policy "dev_all_snapshots"          on snapshots           for all using (true) with check (true);
create policy "dev_all_snapshot_paragraphs" on snapshot_paragraphs for all using (true) with check (true);
create policy "dev_all_slide_templates"    on slide_templates     for all using (true) with check (true);
