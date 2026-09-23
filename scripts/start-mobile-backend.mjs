import { spawn } from "node:child_process";
import { pathToFileURL } from "node:url";
export function supervise({
  web = [
    "node_modules/next/dist/bin/next",
    "start",
    "-H",
    "0.0.0.0",
    "-p",
    "3000",
  ],
  worker = ["scripts/mobile-cleanup-worker.mjs"],
  stdio = "inherit",
  env = process.env,
} = {}) {
  /** @type {import('node:child_process').ChildProcess[]} */
  const children = [
    spawn(process.execPath, web, {
      env: {
        ...env,
        MOBILE_CLEANUP_SUPERVISED: "true",
        MOBILE_UPLOAD_SUPERVISED: "true",
      },
      stdio,
    }),
    spawn(process.execPath, worker, { env, stdio }),
  ];
  let finishing = false,
    resolveDone,
    code = 0,
    exited = 0;
  const done = new Promise((r) => {
    resolveDone = r;
  });
  let timer;
  const stop = (exitCode = 0) => {
    if (finishing) return;
    finishing = true;
    code = exitCode;
    for (const child of children)
      if (child.exitCode === null) child.kill("SIGTERM");
    timer = setTimeout(() => {
      for (const child of children)
        if (child.exitCode === null) child.kill("SIGKILL");
    }, 5000);
    timer.unref();
  };
  for (const child of children) {
    child.on("error", () => stop(1));
    child.on("exit", (exitCode, signal) => {
      exited++;
      if (!finishing) stop(exitCode ?? (signal ? 1 : 0));
      if (exited === 2) {
        clearTimeout(timer);
        resolveDone(code);
      }
    });
  }
  return { web: children[0], worker: children[1], done, stop };
}
if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  const service = supervise();
  process.on("SIGTERM", () => service.stop());
  process.on("SIGINT", () => service.stop());
  process.exitCode = await service.done;
}
