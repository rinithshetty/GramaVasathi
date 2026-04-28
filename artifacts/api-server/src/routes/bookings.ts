import { Router, type IRouter } from "express";
import { and, desc, eq } from "drizzle-orm";
import { db, bookingsTable, homestaysTable } from "@workspace/db";
import {
  CreateBookingBody,
  ListBookingsQueryParams,
  ListBookingsResponse,
} from "@workspace/api-zod";
import { formatISODate, nightsBetween, rangesOverlap } from "../lib/dates";

const router: IRouter = Router();

function serializeBooking(
  b: typeof bookingsTable.$inferSelect,
  pricePerNight: number,
) {
  const nights = nightsBetween(b.checkInDate, b.checkOutDate);
  return {
    id: b.id,
    homestayId: b.homestayId,
    guestName: b.guestName,
    guestEmail: b.guestEmail ?? undefined,
    checkInDate: b.checkInDate,
    checkOutDate: b.checkOutDate,
    nights,
    guests: b.guests,
    totalPrice: nights * pricePerNight,
    createdAt: b.createdAt.toISOString(),
  };
}

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
    .select({
      booking: bookingsTable,
      pricePerNight: homestaysTable.pricePerNight,
    })
    .from(bookingsTable)
    .innerJoin(homestaysTable, eq(homestaysTable.id, bookingsTable.homestayId))
    .where(where)
    .orderBy(desc(bookingsTable.createdAt))
    .limit(50);

  res.json(
    ListBookingsResponse.parse(
      rows.map((r) => serializeBooking(r.booking, r.pricePerNight)),
    ),
  );
});

router.post("/bookings", async (req, res): Promise<void> => {
  const parsed = CreateBookingBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { homestayId, guestName, guestEmail, guests } = parsed.data;
  // Zod coerces format:date into Date — normalize back to ISO YYYY-MM-DD strings.
  const checkInDate = formatISODate(parsed.data.checkInDate);
  const checkOutDate = formatISODate(parsed.data.checkOutDate);

  if (checkOutDate <= checkInDate) {
    res.status(400).json({ error: "Check-out must be after check-in" });
    return;
  }

  const nights = nightsBetween(checkInDate, checkOutDate);
  if (nights < 1 || nights > 30) {
    res.status(400).json({ error: "Stay must be 1–30 nights" });
    return;
  }

  // Ensure homestay exists and capture price + capacity
  const [homestay] = await db
    .select()
    .from(homestaysTable)
    .where(eq(homestaysTable.id, homestayId));
  if (!homestay) {
    res.status(404).json({ error: "Homestay not found" });
    return;
  }
  if (guests > homestay.maxGuests) {
    res
      .status(400)
      .json({ error: `Maximum ${homestay.maxGuests} guests for this homestay` });
    return;
  }

  // Check overlap with existing bookings for this homestay
  const existing = await db
    .select({
      checkInDate: bookingsTable.checkInDate,
      checkOutDate: bookingsTable.checkOutDate,
    })
    .from(bookingsTable)
    .where(eq(bookingsTable.homestayId, homestayId));

  const conflict = existing.some((e) =>
    rangesOverlap(checkInDate, checkOutDate, e.checkInDate, e.checkOutDate),
  );
  if (conflict) {
    res
      .status(409)
      .json({ error: "Those dates overlap an existing booking" });
    return;
  }

  const [booking] = await db
    .insert(bookingsTable)
    .values({
      homestayId,
      guestName,
      guestEmail: guestEmail ?? null,
      checkInDate,
      checkOutDate,
      guests,
    })
    .returning();

  res.status(201).json(serializeBooking(booking, homestay.pricePerNight));
});

export default router;
