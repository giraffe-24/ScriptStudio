-- ScriptStudio: 企画書バージョン（スナップショット）テーブル
-- Supabase SQL Editor で実行してください（本番のみ必要。ローカルは .plan-history/ を使用）
-- content には企画書（plan.json）の JSON 文字列を保存します。

create table if not exists plan_snapshots (
  id             uuid primary key default gen_random_uuid(),
  episode_number int not null,
  episode_slug   text not null,
  author_name    text not null,
  summary        text not null,
  content        text not null,
  created_at     timestamptz not null default now()
);

create index if not exists plan_snapshots_episode_idx
  on plan_snapshots (episode_number, episode_slug, created_at desc);
