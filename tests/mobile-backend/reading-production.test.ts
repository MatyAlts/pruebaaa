import { test } from "node:test";
import assert from "node:assert/strict";
import mysql from "mysql2/promise";
import type { RowDataPacket } from "mysql2/promise";
import { MysqlStudyReading } from "../../src/mobile-server/mysql-study-reading.ts";
import { MobileStudies } from "../../src/mobile-server/studies.ts";

test(
  "summary counts complete own history, not one page",
  { skip: process.env.RUN_MOBILE_MYSQL_TESTS !== "1" },
  async () => {
    const pool = mysql.createPool({
      host: "127.0.0.1",
      port: 33316,
      user: "root",
      password: "isolated-test-password",
      database: "misaluteca_mobile_test",
    });
    try {
      assert.equal(
        (await pool.query<RowDataPacket[]>("SELECT DATABASE() AS name"))[0][0]
          .name,
        "misaluteca_mobile_test",
      );
      await pool.query("DELETE FROM estudios_archivos");
      await pool.query("DELETE FROM estudios");
      for (let id = 1; id <= 24; id++)
        await pool.query(
          "INSERT INTO estudios (id,uuid,id_usuario,id_familiar,titulo,fecha,medico,institucion,descripcion) VALUES (?,?,?,?,?,?,?,?,?)",
          [
            id,
            `s${id}`,
            id === 23 ? 18 : 17,
            id === 24 ? 3 : null,
            `Estudio ${id}`,
            "17-09-2026",
            "Dra Prueba",
            "Clínica",
            "Informe",
          ],
        );
      const reader = new MobileStudies(
        new MysqlStudyReading(pool, async (id, userId) => ({
          id,
          uuid: `s${id}`,
          userId,
          date: "17-09-2026",
          medico: "Dra Prueba",
          files: [],
          createdAt: "",
        })),
      );
      const result = await reader.summary("17");
      assert.equal(result.propiosTotal, 22);
      assert.equal(result.familiaresTotal, null);
      assert.equal(result.total, null);
      assert.equal(result.recientes.length, 5);
      assert.equal((await reader.summary("18")).propiosTotal, 1);
      assert.equal((await reader.summary("99")).propiosTotal, 0);
    } finally {
      await pool.end();
    }
  },
);

test(
  "filters search title OR description across complete SQL history and reject malformed filters",
  { skip: process.env.RUN_MOBILE_MYSQL_TESTS !== "1" },
  async () => {
    const pool = mysql.createPool({
      host: "127.0.0.1",
      port: 33316,
      user: "root",
      password: "isolated-test-password",
      database: "misaluteca_mobile_test",
    });
    try {
      await pool.query(
        "UPDATE estudios SET descripcion='hallazgo único',fecha='01-02-2025' WHERE id=1",
      );
      const reader = new MobileStudies(
        new MysqlStudyReading(pool, async (id, userId) => ({
          id,
          uuid: `s${id}`,
          userId,
          date: "17-09-2026",
          medico: "Dra Prueba",
          files: [],
          createdAt: "",
        })),
      );
      const page = await reader.list("17", {
        limit: "1",
        cursor: null,
        q: "hallazgo",
        month: "2",
        year: "2025",
        medico: "Dra Prueba",
        institution: "Clínica",
      });
      assert.deepEqual(
        page.items.map((s) => s.id),
        ["1"],
      );
      assert.deepEqual((await reader.summary("17")).filterOptions, {
        medicos: ["Dra Prueba"],
        institutions: ["Clínica"],
        years: [2026, 2025],
      });
      await assert.rejects(
        reader.list("17", { limit: null, cursor: null, month: "13" }),
      );
      assert.deepEqual(
        (
          await reader.list("17", { limit: "1", cursor: null, q: "Estudio 2" })
        ).items.map((s) => s.id),
        ["22"],
      );
      assert.equal(
        (await reader.list("18", { limit: null, cursor: null, q: "hallazgo" }))
          .items.length,
        0,
      );
    } finally {
      await pool.end();
    }
  },
);

test(
  "date mode pages ties and invalid civil dates without duplicates; fingerprint guards filters and legacy stays numeric",
  { skip: process.env.RUN_MOBILE_MYSQL_TESTS !== "1" },
  async () => {
    const pool = mysql.createPool({
      host: "127.0.0.1",
      port: 33316,
      user: "root",
      password: "isolated-test-password",
      database: "misaluteca_mobile_test",
    });
    try {
      await pool.query("DELETE FROM estudios_archivos");
      await pool.query("DELETE FROM estudios");
      for (const [id, date] of [
        [1, "17-09-2026"],
        [2, "17-09-2026"],
        [3, "01-10-2026"],
        [4, "31-02-2026"],
        [5, "invalid"],
        [6, "29-02-2024"],
      ] as const)
        await pool.query(
          "INSERT INTO estudios (id,uuid,id_usuario,fecha,medico) VALUES (?,?,?,?,?)",
          [id, `s${id}`, 17, date, "Prueba"],
        );
      const reader = new MobileStudies(
        new MysqlStudyReading(pool, async (id, userId) => ({
          id,
          uuid: `s${id}`,
          userId,
          date: "17-09-2026",
          medico: "Prueba",
          files: [],
          createdAt: "",
        })),
      );
      const ids: string[] = [];
      let cursor: string | null = null;
      do {
        const page = await reader.list("17", {
          limit: "1",
          cursor,
          sort: "study-date-desc",
        });
        ids.push(...page.items.map((s) => s.id));
        cursor = page.nextCursor;
      } while (cursor);
      assert.deepEqual(ids, ["3", "2", "1", "6", "5", "4"]);
      const first = await reader.list("17", {
        limit: "1",
        cursor: null,
        sort: "study-date-desc",
      });
      await assert.rejects(
        reader.list("17", {
          limit: "1",
          cursor: first.nextCursor,
          sort: "study-date-desc",
          q: "changed",
        }),
      );
      await assert.rejects(
        reader.list("18", {
          limit: "1",
          cursor: first.nextCursor,
          sort: "study-date-desc",
        }),
        (error) =>
          error instanceof Error && "status" in error && error.status === 400,
      );
      assert.equal(
        (await reader.list("17", { limit: "1", cursor: null })).nextCursor,
        "6",
      );
      for (const query of [
        { sort: "study-date-desc", cursor: "evil" },
        { sort: "unknown", cursor: null },
        { sort: "study-date-desc", cursor: "" },
        { sort: "study-date-desc", cursor: null, q: " ".repeat(201) },
        { sort: "study-date-desc", cursor: null, scope: "family" },
      ])
        await assert.rejects(reader.list("17", { limit: "1", ...query }));
      const none = await reader.list("17", {
        limit: "1",
        cursor: null,
        sort: "study-date-desc",
        q: "missing",
      });
      assert.deepEqual(none, { items: [], nextCursor: null });
      assert.deepEqual(
        (await reader.summary("17")).recientes.map((s) => s.id),
        ["3", "2", "1", "6", "5"],
      );
    } finally {
      await pool.end();
    }
  },
);
