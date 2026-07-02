# Supabase キープアライブ設定

Supabase の**無料プランは約7日間 DB アクティビティが無いと自動で一時停止**する（[公式](https://supabase.com/docs/guides/platform/free-project-pausing)）。
本番の保存先が寝てしまうと「保存に失敗（通信に失敗）」になるため、Vercel Cron で 1 日 1 回
`/api/keep-alive` を叩き、Supabase に本物の DB クエリを送って起こしておく。

> ⚠️ これは **予防策**。すでに一時停止/削除済みのプロジェクトは復活しない。
> - 一時停止から **90 日以内**なら Supabase ダッシュボードから復元できる。
> - それを過ぎている／削除済みなら**新規プロジェクトを作成**し、Vercel の
>   `SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY` を張り替える。
> - **恒久的に止めない保証が要るなら Pro プラン**（無料枠は本質的に一時停止対象）。

## 手順

### 1. キープアライブ用テーブルを作成（Supabase SQL Editor で一度だけ）

`storage` 呼び出しでも代替できるが、Supabase が測るのは *DB* アクティビティなので、
確実な「ユーザークエリ」を発生させる専用テーブルを置く。

```sql
create table if not exists public.keepalive (
  id int primary key,
  last_ping timestamptz not null default now()
);
insert into public.keepalive (id, last_ping)
values (1, now())
on conflict (id) do nothing;
```

RLS は張らなくてよい（アプリは `service_role` キーで接続し RLS をバイパスするため）。
テーブル未作成でも動くが、その場合は Storage 呼び出しがキープアライブ信号になる。

### 2. CRON_SECRET を Vercel に設定

Vercel → Project → Settings → Environment Variables に追加:

```
CRON_SECRET = <ランダムな長い文字列>
```

Vercel Cron はこの値を `Authorization: Bearer <CRON_SECRET>` として自動送信する。
`/api/keep-alive` はこれを検証し、外部からの無認可アクセスを弾く（未設定でも動くが本番では設定推奨）。

### 3. デプロイ

`vercel.json` の `crons` 設定（`0 6 * * *` = 毎日 06:00 UTC / 15:00 JST）で自動実行される。
Hobby プランは **1 日 1 回まで**なので日次で設定している（7 日の一時停止までに 7 回の余裕）。

## 動作確認

- 手動: `curl -H "Authorization: Bearer <CRON_SECRET>" https://<本番>/api/keep-alive`
  → `{"ok":true,"signals":{"db":true,"storage":true}}` なら成功。
- 実行履歴: Vercel → Project → Cron Jobs で最終実行と結果を確認できる。
- 診断: `/api/health` で保存先（Supabase）の到達状況をいつでも確認できる。
