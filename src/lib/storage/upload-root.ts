import { resolve } from "node:path";

/** Absolute volumes remain absolute; relative storage roots start at cwd. */
export function uploadRoot(configured = process.env.DIRECTORY_UPLOADS) {
  return resolve(configured || "./uploads");
}
