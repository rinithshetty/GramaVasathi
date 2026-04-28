import { Router, type IRouter } from "express";
import { and, eq, gte, ilike, or, sql } from "drizzle-orm";
import { db, homestaysTable, bookingsTable } from "@workspace/db";
import {
  ListHomestaysQueryParams,
  ListHomestaysResponse,
  GetHomestayParams,
  GetHomestayResponse,
  GetHomestayAvailabilityParams,
  GetHomestayAvailabilityResponse,
} from "@workspace/api-zod";
import { computeScore } from "../lib/checklist";

const router: IRouter = Router();

router.get("/homestays", async (req, res): Promise<void> => {
  const parsed = ListHomestaysQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { region, q } = parsed.data;

  const filters = [];
  if (region && region.length > 0) {
    filters.push(eq(homestaysTable.region, region));
  }
  if (q && q.length > 0) {
    const needle = `%${q}%`;
    filters.push(
      or(
        ilike(homestaysTable.name, needle),
        ilike(homestaysTable.village, needle),
        ilike(homestaysTable.host, needle),
        ilike(homestaysTable.region, needle),
      )!,
    );
  }

  const rows = await db
    .select()
    .from(homestaysTable)
    .where(filters.length > 0 ? and(...filters) : undefined)
    .orderBy(homestaysTable.id);

  res.json(ListHomestaysResponse.parse(rows));
});

router.get("/homestays/:id", async (req, res): Promise<void> => {
  const params = GetHomestayParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [row] = await db
    .select()
    .from(homestaysTable)
    .where(eq(homestaysTable.id, params.data.id));

  if (!row) {
    res.status(404).json({ error: "Homestay not found" });
    return;
  }

  // Compute readiness score from latest checklist (or 0)
  const checklistRows = await db.execute(
    sql`SELECT items FROM checklists WHERE homestay_id = ${params.data.id}`,
  );
  const items =
    (checklistRows.rows[0]?.items as
      | { key: string; checked: boolean }[]
      | undefined) ?? [];
  const readinessScore = computeScore(items);

  res.json(
    GetHomestayResponse.parse({
      ...row,
      readinessScore,
    }),
  );
});

router.get(
  "/homestays/:id/availability",
  async (req, res): Promise<void> => {
    const params = GetHomestayAvailabilityParams.safeParse(req.params);
    if (!params.success) {
      res.status(400).json({ error: params.error.message });
      return;
    }

    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    const rows = await db
      .select({ checkInDate: bookingsTable.checkInDate })
      .from(bookingsTable)
      .where(
        and(
          eq(bookingsTable.homestayId, params.data.id),
          gte(bookingsTable.checkInDate, today.toISOString().slice(0, 10)),
        ),
      );

    const bookedDates = Array.from(
      new Set(rows.map((r) => r.checkInDate)),
    ).sort();

    res.json(
      GetHomestayAvailabilityResponse.parse({ bookedDates }),
    );
  },
);

export default router;
