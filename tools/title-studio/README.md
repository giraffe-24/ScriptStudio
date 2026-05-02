# タイトルスタジオ（ローカル）

Anthropic Messages API で **タイトル5案・サムネ文言3案** を JSON で取得する開発用ツールです。

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

ブラウザで http://127.0.0.1:3847/ を開き、台本または構成メモを貼って実行します。

## 環境変数

| 変数 | 必須 | 説明 |
|------|------|------|
| `ANTHROPIC_API_KEY` | はい | Anthropic の API キー |
| `ANTHROPIC_MODEL` | いいえ | 既定: `claude-3-5-sonnet-20241022` |
| `PORT` | いいえ | 既定: `3847` |

## 注意

- **localhost のみ**。`.env` をコミットしないこと。
- チャットでの `/タイトル` と併用可。
