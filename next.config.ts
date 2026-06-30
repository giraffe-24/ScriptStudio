import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 開発時、スマホ実機など LAN 経由（別オリジン）から dev リソース（/_next/*, HMR）を
  // 取得できるよう許可する。これが無いとクライアント JS がハイドレーションされず、
  // フォームがネイティブ送信にフォールバックしてログインできない / 画面が真っ白になる。
  // 本番ビルドには影響しない。
  allowedDevOrigins: ["192.168.0.128"],
  // 開発時に左下へ出る Next.js の「N」開発インジケータを非表示にする
  // （アカウント表示（UserMenu）と重なるため）。
  devIndicators: false,
};

export default nextConfig;
