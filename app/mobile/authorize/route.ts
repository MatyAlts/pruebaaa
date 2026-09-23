import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/src/lib/auth/config";
import { mobileRuntime } from "@/src/mobile-server/runtime";
import { boundedText } from "@/src/mobile-server/http";
import { randomBytes } from "node:crypto";
import { authorizePage } from "@/src/mobile-server/authorize-presentation";
export const dynamic = "force-dynamic";
const escape = (value: string) =>
  value.replace(
    /[&<>"']/g,
    (char) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        char
      ]!,
  );
export async function GET(request: NextRequest) {
  const requestId = request.nextUrl.searchParams.get("requestId") ?? "";
  const session = await getServerSession(authOptions);
  if (!session?.user?.userId) {
    const callback = `/mobile/authorize?requestId=${encodeURIComponent(requestId)}`;
    const publicOrigin = process.env.NEXTAUTH_URL ?? request.nextUrl.origin;
    return NextResponse.redirect(
      new URL(
        "/mobile/sign-in?callbackUrl=" + encodeURIComponent(callback),
        publicOrigin,
      ),
    );
  }
  try {
    const csrf = await mobileRuntime().auth.bindBrowser(requestId);
    const nonce = randomBytes(18).toString("base64");
    const response = new NextResponse(
      authorizePage({
        email: session.user.email ?? "usuario",
        requestId,
        csrf,
        nonce,
      }),
      {
        headers: {
          "Content-Type": "text/html;charset=utf-8",
          "Cache-Control": "no-store",
          "Content-Security-Policy": `default-src 'none'; style-src 'nonce-${nonce}'; form-action 'self'; frame-ancestors 'none'; base-uri 'none'`,
          "Referrer-Policy": "no-referrer",
        },
      },
    );
    response.cookies.set("__Host-mobile-csrf", csrf, {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      path: "/",
      maxAge: 300,
    });
    return response;
  } catch {
    return new NextResponse("Intento vencido. Volvé a iniciar desde la app.", {
      status: 400,
      headers: { "Cache-Control": "no-store" },
    });
  }
}
export async function POST(request: NextRequest) {
  const runtime = mobileRuntime();
  const requestOrigin = request.headers.get("origin");
  const expectedOrigin = new URL(process.env.MOBILE_ORIGIN!).origin;
  if (
    requestOrigin &&
    requestOrigin !== "null" &&
    requestOrigin !== expectedOrigin
  )
    return new NextResponse("Origen no permitido", { status: 403 });
  const session = await getServerSession(authOptions);
  if (!session?.user?.userId)
    return new NextResponse("Sesión requerida", { status: 401 });
  let text: string;
  try {
    text = await boundedText(request);
  } catch {
    return new NextResponse("Solicitud demasiado grande", { status: 413 });
  }
  const form = new URLSearchParams(text);
  try {
    const callback = await runtime.auth.approve(
      form.get("requestId") ?? "",
      session.user.userId,
      form.get("csrf") ?? "",
      request.cookies.get("__Host-mobile-csrf")?.value ?? "",
    );
    const response = new NextResponse(
      `<!doctype html><html lang="es"><meta name="viewport" content="width=device-width,initial-scale=1"><meta http-equiv="refresh" content="0;url=${escape(callback)}"><title>Volviendo a Mi Saluteca</title><body><p>Volviendo a la app...</p><p><a href="${escape(callback)}">Continuar en Mi Saluteca</a></p></body></html>`,
      {
        status: 200,
        headers: {
          "Content-Type": "text/html;charset=utf-8",
          "Cache-Control": "no-store",
          "Content-Security-Policy":
            "default-src 'none'; form-action 'none'; frame-ancestors 'none'; base-uri 'none'",
          "Referrer-Policy": "no-referrer",
        },
      },
    );
    response.cookies.delete("__Host-mobile-csrf");
    return response;
  } catch {
    return new NextResponse(
      "No se pudo autorizar. Volvé a intentar desde la app.",
      { status: 400, headers: { "Cache-Control": "no-store" } },
    );
  }
}
