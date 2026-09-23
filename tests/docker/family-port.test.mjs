import { test } from "node:test";
import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";
const docker = promisify(execFile);
const image = process.env.MOBILE_DOCKER_IMAGE || "misaluteca-family-port:checked";
async function check(env) {
  const name = "saluteca-port-test-" + randomUUID();
  try {
    await docker("docker", [
      "run",
      "-d",
      "--name",
      name,
      "-p",
      "127.0.0.1::3000",
      ...env.flatMap((value) => ["-e", value]),
      image,
    ]);
    const { stdout } = await docker("docker", ["port", name, "3000/tcp"]);
    let response;
    for (let i = 0; i < 40; i++) {
      try {
        const candidate = await fetch(
          "http://" + stdout.trim() + "/maintenance.html",
          { signal: AbortSignal.timeout(1000) },
        );
        if (candidate.status === 200) {
          response = candidate;
          break;
        }
      } catch {}
      await new Promise((r) => setTimeout(r, 100));
    }
    assert.ok(
      response,
      "Next must remain reachable at container port 3000 regardless of panel PORT override",
    );
    assert.equal(
      await response.text(),
      await readFile("public/maintenance.html", "utf8"),
    );
  } finally {
    await docker("docker", ["rm", "-f", name]).catch(() => {});
  }
}
test("EasyPanel PORT override cannot move the established container listener", async () => {
  await check(["PORT=8080", "HOSTNAME=panel-service-id"]);
});
test("confirmed EasyPanel PORT=80 still serves the existing route on container 3000", async () => {
  await check(["PORT=80", "HOSTNAME=panel-service-id"]);
});
test("default Docker environment preserves port 3000", async () => {
  await check([]);
});
test("invalid inherited PORT does not abort the fixed Next listener", async () => {
  await check(["PORT=not-a-number"]);
});
test("unreachable database keeps Next available while worker retries privately", async () => {
  await check([
    "DB_HOST=127.0.0.1",
    "DB_USER=isolated-test-user",
    "DB_NAME=isolated-unreachable",
    "DB_PORT=1",
  ]);
});
