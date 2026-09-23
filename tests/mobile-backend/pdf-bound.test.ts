import { test } from "node:test";
import assert from "node:assert/strict";
import { readBoundedPdf } from "../../src/mobile-server/studies.ts";
test("short reads accumulate until EOF without padding the document", async () => {
  const chunks = [Buffer.from("%PDF-"), Buffer.from("1.7"), Buffer.alloc(0)];
  const bytes = await readBoundedPdf({
    read: async (buffer: Buffer, offset: number) => {
      const chunk = chunks.shift()!;
      chunk.copy(buffer, offset);
      return { bytesRead: chunk.length };
    },
  });
  assert.equal(bytes.toString(), "%PDF-1.7");
});
test("growing PDF input reads at most the allowed bytes plus one", async () => {
  let allocated = 0;
  let calls = 0;
  await assert.rejects(
    readBoundedPdf({
      read: async (buffer: Buffer, offset: number, length: number) => {
        allocated = buffer.byteLength;
        calls++;
        buffer.fill(1, offset, offset + length);
        return { bytesRead: length };
      },
    }),
    { code: "FILE_TOO_LARGE" },
  );
  assert.equal(allocated, 10 * 1024 * 1024 + 1);
  assert.equal(calls, 1);
});
