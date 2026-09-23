const escape = (value: string) =>
  value.replace(
    /[&<>"']/g,
    (char) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        char
      ]!,
  );
export function authorizePage(input: {
  email: string;
  requestId: string;
  csrf: string;
  nonce: string;
}) {
  const callback = `/mobile/authorize?requestId=${encodeURIComponent(input.requestId)}`;
  return `<!doctype html><html lang="es"><head><meta name="viewport" content="width=device-width,initial-scale=1"><title>Conectar Mi Saluteca</title><style nonce="${escape(input.nonce)}">
 :root{color-scheme:light}*{box-sizing:border-box}body{margin:0;background:#F5F7FA;color:#2F416A;font-family:Inter,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;line-height:1.5;min-height:100svh;display:grid;place-items:center;padding:24px}main{width:100%;max-width:440px}.brand{font-size:24px;font-weight:700;margin:0 0 24px}.consent-card{background:#fff;border:1px solid #E2E8F0;border-radius:20px;padding:28px;box-shadow:0 8px 28px #2F416A0D}.eyebrow{color:#43599E;font-weight:600;font-size:14px;margin:0}h1{font-size:28px;line-height:1.2;margin:12px 0 16px}.intro,.account,.legal{color:#4A5568}.account{background:#F5F7FA;padding:16px;border-radius:12px;overflow-wrap:anywhere}.account strong{display:block;color:#2F416A}button{width:100%;min-height:48px;border:0;border-radius:12px;background:#43599E;color:#fff;font:inherit;font-weight:600;padding:12px 16px;cursor:pointer}a{color:#43599E;text-underline-offset:3px}.switch{display:block;text-align:center;padding:14px 8px;min-height:44px}.legal{font-size:14px;margin:12px 0 0}button:focus-visible,a:focus-visible{outline:3px solid #2F416A;outline-offset:4px}@media(prefers-reduced-motion:reduce){*{scroll-behavior:auto}}@media(max-width:360px){body{padding:16px}.consent-card{padding:20px}h1{font-size:24px}}
 </style></head><body><main><p class="brand">Mi Saluteca</p><section class="consent-card" aria-labelledby="title"><p class="eyebrow">Conexión segura con Google</p><h1 id="title">Conectar Mi Saluteca</h1><p class="intro">Autorizá el acceso a tu cuenta para consultar tus estudios desde la app iOS.</p><p class="account"><strong>Continuar como</strong>${escape(input.email)}</p><form method="post"><input type="hidden" name="requestId" value="${escape(input.requestId)}"><input type="hidden" name="csrf" value="${escape(input.csrf)}"><button type="submit">Volver a la App</button></form><a class="switch" href="/mobile/sign-in?callbackUrl=${encodeURIComponent(callback)}">Usar otra cuenta Google</a><p class="legal">Consultá nuestros <a href="/terminos">Términos y condiciones</a> y la <a href="/privacidad">Política de privacidad</a>.</p></section></main></body></html>`;
}
