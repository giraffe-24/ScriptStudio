import os from "os";

/** 台本更新者表示名（ローカル Studio 用） */
export function getStudioUserName(): string {
  return process.env.STUDIO_USER_NAME?.trim() || os.userInfo().username || "unknown";
}
