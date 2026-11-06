import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 開発サーバの入口（Tailscale のホスト名・LAN の IP など）は /local（portmgr）が決め、
  // 環境変数 LOCAL_DEV_ORIGINS で渡してくる。ここにホスト名を書かない。
  // （名前や IP が変わっても直さなくてよく、環境変数が無い環境・ビルド時は空＝Next.js の既定のまま）
  allowedDevOrigins: (process.env.LOCAL_DEV_ORIGINS ?? "").split(",").filter(Boolean),
  // 開発時に左下へ出る Next.js の「N」開発インジケータを非表示にする
  // （アカウント表示（UserMenu）と重なるため）。
  devIndicators: false,
  // 本番イメージは standalone 出力（server.js と必要な node_modules だけ）で動かす（Dockerfile）。
  // 辿る起点をこのリポに固定し、server.js が .next/standalone の直下に出るようにする
  output: "standalone",
  outputFileTracingRoot: path.join(__dirname),
};

export default nextConfig;
