import { test } from "node:test";
import assert from "node:assert/strict";
import { authorizePage } from "../../src/mobile-server/authorize-presentation.ts";
test("production consent keeps POST fields, account switch, legal links and locally styled responsive card", () => {
  const page = authorizePage({
    email: "test@example.invalid",
    requestId: "r&1",
    csrf: 'c"1',
    nonce: "testnonce",
  });
  assert.match(page, /<form method="post">/);
  assert.match(page, /name="requestId" value="r&amp;1"/);
  assert.match(page, /name="csrf" value="c&quot;1"/);
  assert.match(page, /<style nonce="testnonce">/);
  assert.match(page, /class="consent-card"/);
  assert.match(page, /<button type="submit">Volver a la App<\/button>/);
  assert.ok(!page.includes("Autorizar la app iOS"));
  assert.match(page, /href="\/terminos"/);
  assert.match(page, /href="\/privacidad"/);
  assert.match(page, /Usar otra cuenta Google/);
});
test("account and hidden values cannot inject markup; callback remains encoded", () => {
  const page = authorizePage({
    email: "<script>alert(1)</script>",
    requestId: '" onfocus="evil',
    csrf: "<img>",
    nonce: '"bad',
  });
  assert.ok(!page.includes("<script>"));
  assert.ok(!page.includes('value="<img>"'));
  assert.match(page, /&lt;script&gt;/);
  assert.match(page, /nonce="&quot;bad"/);
  assert.ok(
    page.includes(
      encodeURIComponent(
        "/mobile/authorize?requestId=" + encodeURIComponent('" onfocus="evil'),
      ),
    ),
  );
});
