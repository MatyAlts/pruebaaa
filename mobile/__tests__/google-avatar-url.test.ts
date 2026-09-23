import { googleAvatarUrl } from "../src/google-avatar-url";

test("keeps the exact Google HTTPS image URL without adding parameters", () => {
  const url = "https://lh3.googleusercontent.com/avatar=s96-c";
  expect(googleAvatarUrl(url)).toBe(url);
});

test("rejects an HTTP Google image instead of initiating an insecure download", () => {
  expect(googleAvatarUrl("http://lh3.googleusercontent.com/avatar")).toBeNull();
});

test.each([
  null, undefined, "", "not a URL", "file:///avatar", "data:image/png;base64,abc",
  "https://evil.invalid/avatar", "https://evilgoogleusercontent.com/avatar",
  "https://googleusercontent.com.evil.invalid/avatar",
  "https://user:secret@lh3.googleusercontent.com/avatar",
  "https://lh3.googleusercontent.com:444/avatar", "https://lh3.googleusercontent.com/avatar#fragment",
  "https://lh3.googleusercontent.com/" + "x".repeat(2048),
])("rejects absent or disallowed provider input %s", (url) => {
  expect(googleAvatarUrl(url)).toBeNull();
});

test.each([
  "https://googleusercontent.com/avatar",
  "https://lh3.googleusercontent.com:443/avatar?size=96",
])("accepts the permitted base host or standard HTTPS port unchanged", (url) => {
  expect(googleAvatarUrl(url)).toBe(url);
});

test.each([
  "https://lh3.googleusercontent.com/avatar#",
  "https://foo..googleusercontent.com/avatar",
  " https://lh3.googleusercontent.com/avatar",
  "https://lh3.googleusercontent.com/a\nb",
])("rejects malformed URLs or any fragment marker", (url) => {
  expect(googleAvatarUrl(url)).toBeNull();
});
