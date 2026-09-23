import { createProof } from "../src/proof";
import { createHash } from "node:crypto";
test("S256 challenge matches a known SHA256 vector of the private verifier", async () => {
  const entropy = jest
    .fn()
    .mockResolvedValueOnce(new Uint8Array(32).fill(3))
    .mockResolvedValueOnce(new Uint8Array(32).fill(4));
  const proof = await createProof(entropy, async (value) =>
    createHash("sha256").update(value).digest("base64"),
  );
  expect(proof.verifier).toBe("03".repeat(32));
  expect(proof.state).toBe("04".repeat(32));
  expect(proof.challenge).toBe("g6U43wcEb0QwMD-vCenGkzMGtef0FXtcDNw10W8PkDM");
});
test("invalid entropy fails closed before calculating a challenge", async () => {
  const digest = jest.fn();
  await expect(
    createProof(async () => new Uint8Array(8), digest),
  ).rejects.toThrow("entropy");
  expect(digest).not.toHaveBeenCalled();
});
test("public state is generated independently from the private verifier", async () => {
  const entropy = jest
    .fn()
    .mockResolvedValueOnce(new Uint8Array(32).fill(1))
    .mockResolvedValueOnce(new Uint8Array(32).fill(2));
  const digest = jest.fn(
    async () => "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=",
  );
  const proof = await createProof(entropy, digest);
  expect(entropy).toHaveBeenCalledTimes(2);
  expect(proof.state).not.toBe(proof.verifier);
  expect(digest).toHaveBeenCalledWith(proof.verifier);
  expect(proof.challenge).toBe("AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA");
});
