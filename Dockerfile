# ScriptStudio 本番イメージ（NAS の docker compose が app/ を build context に使用。
# RakurakuKairan / ShiftLenS の Dockerfile と同型）
#
# 2026-10-23: 実行の段は Next の standalone 出力だけにした（server.js と必要な node_modules・
# .next/static・config）。node_modules を丸ごと載せない。
# server.js は起動時に自分の置き場所（/app）へ移るので、process.cwd() は今までどおり /app のまま。
# outputs/ .plan-history/ .script-history/ config/ へのファイル I/O は無改修で動く
# （outputs と履歴は compose が /app の下へマウントする）。
FROM node:22-bookworm-slim AS build
WORKDIR /app
RUN npm install -g pnpm@11
# pnpm-workspace.yaml は allowBuilds（ネイティブ依存の postinstall 許可）の設定を持つ。
# これを含めないと unrs-resolver 等がリンクされず、実行時に middleware が落ちる。
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile
COPY . .
RUN pnpm build

FROM node:22-bookworm-slim
ENV NODE_ENV=production \
    TZ=Asia/Tokyo \
    PORT=3500 \
    HOSTNAME=0.0.0.0
WORKDIR /app
COPY --from=build /app/.next/standalone ./
COPY --from=build /app/.next/static ./.next/static
# config/ は process.cwd() からの動的なパスで読むため、standalone の追跡に載らない。ここで明示的に載せる
# （voice-learnings.md などの一部は、NAS では compose がこの上にマウントする）
COPY --from=build /app/config ./config
EXPOSE 3500
CMD ["node", "server.js"]
