# タイトルスタジオ（ローカル）

Anthropic Messages API で タイトル5案・サムネ文言3案 を JSON で取得する開発用ツールです。

## セットアップ

リポジトリのルートで:

```bash
cp .env.example .env
# .env に ANTHROPIC_API_KEY を貼り付ける
npm install
```

## 起動

```bash
npm run title-studio
```

ブラウザで http://127.0.0.1:3847/ を開きます。

- 一気通貫モード: テーマだけ入力 → サーバーが企画ドラフト（切り口3案のJSON）を生成し、その続けでタイトル5案・サムネ3案まで出します（`/api/pipeline`、API 2回）。
- 台本モード: 台本または構成メモを貼るとタイトルのみ生成（`/api/titles`）。

## HTTP API（要約）

### `POST /api/pipeline`

| フィールド | 必須 | 説明 |
|-----------|------|------|
| `theme` | はい | 企画テーマ |
| `scoutMode` | いいえ | `A` / `B` / `C`（未指定なら自動） |
| `planningExtraInstructions` | いいえ | 企画段階への追記 |
| `extraInstructions` | いいえ | タイトル段階への追記 |
| `model` | いいえ | モデル上書き |

200 応答には `planning`（オブジェクト）に加え、`titles`・`thumbnails`・推奨インデックス・`notes`（`/api/titles` と同一形）が含まれます。

### `POST /api/titles`

| フィールド | 必須 | 説明 |
|-----------|------|------|
| `script` | はい | 台本または構成メモ全文 |
| `extraInstructions` | いいえ | 追記 |
| `model` | いいえ | モデル上書き |

## 環境変数

| 変数 | 必須 | 説明 |
|------|------|------|
| `ANTHROPIC_API_KEY` | はい | Anthropic の API キー |
| `ANTHROPIC_MODEL` | いいえ | 既定: `claude-sonnet-4-6`（退役した 3.5 Sonnet は使わないこと） |
| `PORT` | いいえ | 既定: `3847` |

## 注意

- localhost のみ。`.env` をコミットしないこと。
- チャットでの `/タイトル` と併用可。
