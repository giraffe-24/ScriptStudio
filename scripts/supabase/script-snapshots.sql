-- ScriptStudio: 台本バージョン（スナップショット）テーブル
-- Supabase SQL Editor で実行してください

create table if not exists script_snapshots (
  id             uuid primary key default gen_random_uuid(),
  episode_number int not null,
  episode_slug   text not null,
  author_name    text not null,
  summary        text not null,
  content        text not null,
  diff_stats     jsonb,
  created_at     timestamptz not null default now()
);

create index if not exists script_snapshots_episode_idx
  on script_snapshots (episode_number, episode_slug, created_at desc);
