import { AsyncLocalStorage } from "node:async_hooks";

/**
 * リクエスト単位で「操作者（ログイン中のユーザー名）」を運ぶコンテキスト。
 * API ルートの入口で runWithActor(username, fn) を呼ぶと、
 * その処理から呼ばれる深いレイヤ（episode-files-store の Git ミラー等）でも
 * getActor() で操作者を取得でき、コミットの author に反映できる。
 */
const actorStore = new AsyncLocalStorage<string>();

export function runWithActor<T>(actor: string | null | undefined, fn: () => T): T {
  const name = actor?.trim();
  if (!name) return fn();
  return actorStore.run(name, fn);
}

/** 現在のリクエストの操作者名（未設定なら null）。 */
export function getActor(): string | null {
  return actorStore.getStore() ?? null;
}
