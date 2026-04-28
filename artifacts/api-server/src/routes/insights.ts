import { Router, type IRouter } from "express";
import { desc, eq, sql } from "drizzle-orm";
import {
  db,
  homestaysTable,
  bookingsTable,
  checklistsTable,
} from "@workspace/db";
import {
  GetInsightsSummaryResponse,
  GetRecentBookingsQueryParams,
  GetRecentBookingsResponse,
  GetTopHomestaysQueryParams,
  GetTopHomestaysResponse,
} from "@workspace/api-zod";
import { nightsBetween } from "../lib/dates";

const router: IRouter = Router();

router.get("/insights/summary", async (_req, res): Promise<void> => {
  const [{ totalHomestays }] = await db
    .select({ totalHomestays: sql<number>`count(*)::int` })
    .from(homestaysTable);

  const [{ totalVillages }] = await db
    .select({
      totalVillages: sql<number>`count(distinct ${homestaysTable.village})::int`,
    })
    .from(homestaysTable);

  const [{ totalBookings }] = await db
    .select({ totalBookings: sql<number>`count(*)::int` })
    .from(bookingsTable);

  const [{ averageReadiness }] = await db
    .select({
      averageReadiness: sql<number>`coalesce(round(avg(${checklistsTable.score}))::int, 0)`,
    })
    .from(checklistsTable);

  const topRegionsRows = await db
    .select({
      region: homestaysTable.region,
      count: sql<number>`count(*)::int`,
    })
    .from(homestaysTable)
    .groupBy(homestaysTable.region)
    .orderBy(sql`count(*) desc`)
    .limit(5);

  res.json(
    GetInsightsSummaryResponse.parse({
      totalHomestays,
      totalVillages,
      totalBookings,
      averageReadiness,
      topRegions: topRegionsRows,
    }),
  );
});

router.get("/insights/recent-bookings", async (req, res): Promise<void> => {
  const parsed = GetRecentBookingsQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const limit = parsed.data.limit ?? 8;

  const rows = await db
    .select({
      id: bookingsTable.id,
      guestName: bookingsTable.guestName,
      checkInDate: bookingsTable.checkInDate,
      checkOutDate: bookingsTable.checkOutDate,
      createdAt: bookingsTable.createdAt,
      homestayId: bookingsTable.homestayId,
      homestayName: homestaysTable.name,
      village: homestaysTable.village,
    })
    .from(bookingsTable)
    .innerJoin(homestaysTable, eq(homestaysTable.id, bookingsTable.homestayId))
    .orderBy(desc(bookingsTable.createdAt))
    .limit(limit);

  res.json(
    GetRecentBookingsResponse.parse(
      rows.map((r) => ({
        id: r.id,
        guestName: r.guestName,
        checkInDate: r.checkInDate,
        checkOutDate: r.checkOutDate,
        nights: nightsBetween(r.checkInDate, r.checkOutDate),
        createdAt: r.createdAt.toISOString(),
        homestayId: r.homestayId,
        homestayName: r.homestayName,
        village: r.village,
      })),
    ),
  );
});

router.get("/insights/top-homestays", async (req, res): Promise<void> => {
  const parsed = GetTopHomestaysQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const limit = parsed.data.limit ?? 5;

  const rows = await db
    .select({
      id: homestaysTable.id,
      name: homestaysTable.name,
      village: homestaysTable.village,
      region: homestaysTable.region,
      readinessScore: checklistsTable.score,
      imageUrl: homestaysTable.imageUrl,
    })
    .from(homestaysTable)
    .innerJoin(
      checklistsTable,
      eq(checklistsTable.homestayId, homestaysTable.id),
    )
    .orderBy(desc(checklistsTable.score), desc(homestaysTable.rating))
    .limit(limit);

  res.json(GetTopHomestaysResponse.parse(rows));
});

export default router;
