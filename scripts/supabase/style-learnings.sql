-- ScriptStudio: あらきりらしさメモ（推敲差分からの文体学習データ）テーブル
-- 追記型：更新のたびに1行 insert し、created_at が最新の行を現行メモとして使う
-- Supabase SQL Editor で実行してください

create table if not exists style_learnings (
  id            uuid primary key default gen_random_uuid(),
  content       text not null,
  summary       text not null,
  author_name   text not null,
  episode_title text,
  diff_stats    jsonb,
  created_at    timestamptz not null default now()
);

create index if not exists style_learnings_created_idx
  on style_learnings (created_at desc);
