import { test } from "node:test";
import assert from "node:assert/strict";
import { validateUploadFields } from "../../src/mobile-server/upload-validation.ts";
import { quotaDay } from "../../src/mobile-server/mysql-study-upload.ts";
test("civil leap day and trimmed web metadata normalize without timezone conversion", () => {
  assert.deepEqual(
    validateUploadFields({ date: "29-02-2024", title: "  ", patient: "self" }),
    {
      date: "29-02-2024",
      title: "Estudio médico",
      institution: null,
      medico: null,
      conclusion: null,
      description: null,
      patient: "self",
      familyUuid: null,
    },
  );
});
test("quota day matches existing local server clock minus three hours including configured TZ", () => {
  const old = process.env.TZ;
  try {
    process.env.TZ = "UTC";
    assert.equal(quotaDay(Date.UTC(2026, 8, 18, 5)), "18-09-2026");
    process.env.TZ = "America/Argentina/Buenos_Aires";
    assert.equal(quotaDay(Date.UTC(2026, 8, 18, 5)), "17-09-2026");
  } finally {
    if (old === undefined) delete process.env.TZ;
    else process.env.TZ = old;
  }
});
test("invalid civil dates, foreign patient shape and every unicode web field boundary", () => {
  for (const date of ["29-02-2023", "31-04-2026", "00-01-2026", "2026-09-18"])
    assert.throws(
      () => validateUploadFields({ date, patient: "self" }),
      /INVALID_DATE/,
    );
  assert.equal(
    validateUploadFields({
      date: "18-09-2026",
      patient: "self",
      title: "😀".repeat(400),
    }).title,
    "😀".repeat(400),
  );
  for (const [key, limit] of Object.entries({
    title: 400,
    institution: 400,
    medico: 400,
    conclusion: 10000,
    description: 2000,
  })) {
    assert.equal(
      validateUploadFields({
        date: "18-09-2026",
        patient: "self",
        [key]: "a".repeat(limit),
      })[key as "title"],
      "a".repeat(limit),
    );
    assert.throws(
      () =>
        validateUploadFields({
          date: "18-09-2026",
          patient: "self",
          [key]: "a".repeat(limit + 1),
        }),
      /INVALID_FIELDS/,
    );
  }
  assert.throws(
    () =>
      validateUploadFields({
        date: "18-09-2026",
        patient: "self",
        familyUuid: "foreign",
      }),
    /INVALID_PATIENT/,
  );
  assert.throws(
    () =>
      validateUploadFields({ date: "18-09-2026", patient: "self", owner: "1" }),
    /INVALID_FIELDS/,
  );
  assert.equal(
    validateUploadFields({
      date: "18-09-2026",
      patient: "family",
      familyUuid: "566a932f-4ff0-40b8-921d-3891128c0d44",
    }).familyUuid,
    "566a932f-4ff0-40b8-921d-3891128c0d44",
  );
});
