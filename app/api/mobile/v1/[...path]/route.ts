import { mobileApiRuntime } from "@/src/mobile-server/runtime";
import { mobileHttp } from "@/src/mobile-server/http";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
async function handle(request: Request) {
  try {
    return await mobileHttp(request, await mobileApiRuntime());
  } catch {
    return Response.json(
      {
        error: {
          code: "SERVICE_UNAVAILABLE",
          message: "El servicio móvil no está configurado.",
        },
      },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }
}
export const GET = handle;
export const POST = handle;
export const PATCH = handle;
export const DELETE = handle;
