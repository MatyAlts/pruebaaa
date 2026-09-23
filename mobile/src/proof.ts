export async function createProof(
  entropy: () => Promise<Uint8Array>,
  digest: (verifier: string) => Promise<string>,
) {
  const hex = (bytes: Uint8Array) => {
    if (bytes.length !== 32) throw new Error("Invalid PKCE entropy");
    return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join(
      "",
    );
  };
  const verifier = hex(await entropy());
  const state = hex(await entropy());
  const challenge = (await digest(verifier))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
  return { verifier, state, challenge };
}
