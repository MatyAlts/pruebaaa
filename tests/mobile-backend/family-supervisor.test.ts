import { test } from "node:test";
import assert from "node:assert/strict";
import { supervise } from "../../scripts/start-mobile-backend.mjs";
test("supervisor terminates both children and preserves web failure", async () => {
  const service = supervise({
    web: ["-e", "setTimeout(()=>process.exit(7),100)"],
    worker: ["-e", "setInterval(()=>{},1000)"],
    stdio: "ignore",
  });
  assert.equal(await service.done, 7);
  await assert.rejects(async () => process.kill(service.worker.pid!, 0));
});
test("requested termination forwards SIGTERM and joins both processes", async () => {
  const service = supervise({
    web: ["-e", "setInterval(()=>{},1000)"],
    worker: ["-e", "setInterval(()=>{},1000)"],
    stdio: "ignore",
  });
  await new Promise((r) => setTimeout(r, 200));
  service.stop();
  assert.equal(await service.done, 0);
  await assert.rejects(async () => process.kill(service.web.pid!, 0));
  await assert.rejects(async () => process.kill(service.worker.pid!, 0));
});
test("supervised web child advertises internal upload recovery only with its joined worker", async () => {
  const service = supervise({
    web: [
      "-e",
      "console.log(process.env.MOBILE_UPLOAD_SUPERVISED);setTimeout(()=>process.exit(0),30)",
    ],
    worker: ["-e", "setInterval(()=>{},1000)"],
    stdio: "pipe",
  });
  let output = "";
  service.web.stdout!.on("data", (chunk) => (output += chunk));
  assert.equal(await service.done, 0);
  assert.equal(output.trim(), "true");
});
