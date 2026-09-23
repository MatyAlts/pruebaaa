"use client";
import { signIn } from "next-auth/react";
import { useEffect } from "react";
export default function MobileSignIn() {
  useEffect(() => {
    const candidate = new URLSearchParams(window.location.search).get(
      "callbackUrl",
    );
    const callbackUrl = candidate?.startsWith("/mobile/authorize?requestId=")
      ? candidate
      : "/";
    void signIn("google", { callbackUrl });
  }, []);
  return (
    <main>
      <h1>Mi Saluteca</h1>
      <p>Abriendo Google para autorizar la app…</p>
    </main>
  );
}
