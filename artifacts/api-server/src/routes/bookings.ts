import { Router, type IRouter } from "express";
import { and, desc, eq } from "drizzle-orm";
import { db, bookingsTable, homestaysTable } from "@workspace/db";
import {
  CreateBookingBody,
  ListBookingsQueryParams,
  ListBookingsResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/bookings", async (req, res): Promise<void> => {
  const parsed = ListBookingsQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const where = parsed.data.homestayId
    ? eq(bookingsTable.homestayId, parsed.data.homestayId)
    : undefined;

  const rows = await db
    .select()
    .from(bookingsTable)
    .where(where)
    .orderBy(desc(bookingsTable.createdAt))
    .limit(50);

  res.json(ListBookingsResponse.parse(rows));
});

router.post("/bookings", async (req, res): Promise<void> => {
  const parsed = CreateBookingBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { homestayId, guestName, guestEmail, checkInDate, guests } = parsed.data;

  // Ensure homestay exists
  const [homestay] = await db
    .select({ id: homestaysTable.id })
    .from(homestaysTable)
    .where(eq(homestaysTable.id, homestayId));

  if (!homestay) {
    res.status(404).json({ error: "Homestay not found" });
    return;
  }

  // Ensure date not already taken
  const [existing] = await db
    .select({ id: bookingsTable.id })
    .from(bookingsTable)
    .where(
      and(
        eq(bookingsTable.homestayId, homestayId),
        eq(bookingsTable.checkInDate, checkInDate),
      ),
    );

  if (existing) {
    res.status(409).json({ error: "That date is already booked" });
    return;
  }

  const [booking] = await db
    .insert(bookingsTable)
    .values({
      homestayId,
      guestName,
      guestEmail: guestEmail ?? null,
      checkInDate,
      guests,
    })
    .returning();

  res.status(201).json({
    id: booking.id,
    homestayId: booking.homestayId,
    guestName: booking.guestName,
    guestEmail: booking.guestEmail ?? undefined,
    checkInDate: booking.checkInDate,
    guests: booking.guests,
    createdAt: booking.createdAt.toISOString(),
  });
});

export default router;
