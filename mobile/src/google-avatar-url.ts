/** Preserve the provider URL; never attach API session credentials. */
export function googleAvatarUrl(image?: string | null): string | null {
  if (!image || image.length > 2048 || /\s/.test(image) || image.includes("#")) return null;
  try {
    const url = new URL(image);
    const host = url.hostname.toLowerCase();
    const validLabels = host.split(".").every((label) => /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/.test(label));
    if (url.protocol !== "https:" || url.username || url.password || url.hash ||
        (url.port && url.port !== "443") ||
        !validLabels || !(host === "googleusercontent.com" || host.endsWith(".googleusercontent.com"))) return null;
    return image;
  } catch {
    return null;
  }
}
