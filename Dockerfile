# ScriptStudio 本番イメージ（NAS の docker compose が app/ を build context に使用。
# RakurakuKairan / ShiftLenS の Dockerfile と同型）
#
# standalone 出力は使わない。ランタイムの process.cwd() を /app に保ち、
# outputs/ .plan-history/ .script-history/ config/ へのファイル I/O を無改修で動かすため。
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
    TZ=Asia/Tokyo
WORKDIR /app
COPY --from=build /app ./
EXPOSE 3500
CMD ["./node_modules/.bin/next", "start", "-p", "3500"]
