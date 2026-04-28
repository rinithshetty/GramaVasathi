import {
  pgTable,
  serial,
  text,
  integer,
  real,
  timestamp,
  jsonb,
  date,
  index,
} from "drizzle-orm/pg-core";

export const homestaysTable = pgTable("homestays", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  host: text("host").notNull(),
  village: text("village").notNull(),
  region: text("region").notNull(),
  state: text("state").notNull(),
  pricePerNight: integer("price_per_night").notNull(),
  rating: real("rating").notNull(),
  reviewCount: integer("review_count").notNull(),
  imageUrl: text("image_url").notNull(),
  description: text("description").notNull(),
  maxGuests: integer("max_guests").notNull(),
  bedrooms: integer("bedrooms").notNull(),
  activities: jsonb("activities").$type<string[]>().notNull().default([]),
  tags: jsonb("tags").$type<string[]>().notNull().default([]),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const bookingsTable = pgTable(
  "bookings",
  {
    id: serial("id").primaryKey(),
    homestayId: integer("homestay_id")
      .notNull()
      .references(() => homestaysTable.id, { onDelete: "cascade" }),
    guestName: text("guest_name").notNull(),
    guestEmail: text("guest_email"),
    checkInDate: date("check_in_date").notNull(),
    guests: integer("guests").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("bookings_homestay_idx").on(t.homestayId),
    index("bookings_check_in_idx").on(t.checkInDate),
  ],
);

export type ChecklistItemRow = { key: string; label: string; checked: boolean };

export const checklistsTable = pgTable("checklists", {
  homestayId: integer("homestay_id")
    .primaryKey()
    .references(() => homestaysTable.id, { onDelete: "cascade" }),
  items: jsonb("items").$type<ChecklistItemRow[]>().notNull().default([]),
  score: integer("score").notNull().default(0),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export type Homestay = typeof homestaysTable.$inferSelect;
export type Booking = typeof bookingsTable.$inferSelect;
export type Checklist = typeof checklistsTable.$inferSelect;
