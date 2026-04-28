import {
  db,
  homestaysTable,
  bookingsTable,
  checklistsTable,
} from "@workspace/db";

const DEFAULT_ITEMS = [
  { key: "clean_room", label: "Clean room" },
  { key: "drinking_water", label: "Drinking water" },
  { key: "hot_meals", label: "Hot meals available" },
  { key: "bedding_linens", label: "Bedding & linens" },
  { key: "working_bathroom", label: "Working bathroom" },
  { key: "mobile_network", label: "Mobile network" },
  { key: "first_aid", label: "First-aid kit" },
  { key: "activity_guide", label: "Local activity guide" },
];

function makeChecklist(checkedKeys: string[]) {
  const items = DEFAULT_ITEMS.map((d) => ({
    ...d,
    checked: checkedKeys.includes(d.key),
  }));
  const score = Math.round(
    (items.filter((i) => i.checked).length / items.length) * 100,
  );
  return { items, score };
}

const HOMESTAYS = [
  {
    name: "Coffee Bloom Farmstay",
    host: "Anitha & Devraj",
    village: "Madikeri",
    region: "Coorg",
    state: "Karnataka",
    pricePerNight: 2400,
    rating: 4.8,
    reviewCount: 142,
    imageUrl:
      "https://images.unsplash.com/photo-1542718610-a1d656d1884c?w=1200&q=80",
    description:
      "A working coffee plantation tucked into the hills above Madikeri. Wake to mist over the rows of arabica, walk the estate at sunrise with Devraj, and end the day with Anitha's pandi curry and akki roti by the wood stove.",
    maxGuests: 4,
    bedrooms: 2,
    activities: [
      "Plantation walk",
      "Coffee tasting",
      "Sunrise hike",
      "Home-cooked Coorgi meals",
    ],
    tags: ["Plantation", "Hills", "Cool weather"],
    checked: [
      "clean_room",
      "drinking_water",
      "hot_meals",
      "bedding_linens",
      "working_bathroom",
      "mobile_network",
      "first_aid",
      "activity_guide",
    ],
  },
  {
    name: "Saraswati Riverside Cottage",
    host: "Lalita Devi",
    village: "Mukteshwar",
    region: "Kumaon",
    state: "Uttarakhand",
    pricePerNight: 1800,
    rating: 4.7,
    reviewCount: 96,
    imageUrl:
      "https://images.unsplash.com/photo-1587381420270-3e1a5b9e6904?w=1200&q=80",
    description:
      "A two-room stone cottage above a Himalayan stream, run by Lalita Devi for over a decade. Apricot trees line the courtyard. Pine forests start at the gate.",
    maxGuests: 3,
    bedrooms: 1,
    activities: [
      "Forest walk",
      "Stargazing",
      "Pahari thali dinner",
      "Apricot picking (in season)",
    ],
    tags: ["Mountains", "River", "Quiet"],
    checked: [
      "clean_room",
      "drinking_water",
      "hot_meals",
      "bedding_linens",
      "working_bathroom",
      "first_aid",
      "activity_guide",
    ],
  },
  {
    name: "Mati Mud House",
    host: "Bharat Singh",
    village: "Khimsar",
    region: "Marwar",
    state: "Rajasthan",
    pricePerNight: 2100,
    rating: 4.6,
    reviewCount: 78,
    imageUrl:
      "https://images.unsplash.com/photo-1606298855672-3efb63017be8?w=1200&q=80",
    description:
      "Hand-built mud-and-thatch huts with frescoed interiors, on the edge of the Thar desert. Bharat's family has potted clay here for four generations.",
    maxGuests: 5,
    bedrooms: 2,
    activities: [
      "Pottery workshop",
      "Camel ride at dusk",
      "Folk music evening",
      "Dal-baati-churma dinner",
    ],
    tags: ["Desert", "Craft", "Cultural"],
    checked: [
      "clean_room",
      "drinking_water",
      "hot_meals",
      "bedding_linens",
      "working_bathroom",
      "activity_guide",
    ],
  },
  {
    name: "Backwater Toddy Tappers' Stay",
    host: "Mary & Joseph",
    village: "Maramon",
    region: "Aranmula",
    state: "Kerala",
    pricePerNight: 2700,
    rating: 4.9,
    reviewCount: 204,
    imageUrl:
      "https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?w=1200&q=80",
    description:
      "A teakwood family home five steps from the Pamba river. Joseph still climbs the family's coconut palms most mornings. Mary cooks fish moilee with the day's catch.",
    maxGuests: 4,
    bedrooms: 2,
    activities: [
      "Country boat ride",
      "Toddy tapping demo",
      "Sadya lunch",
      "Aranmula mirror workshop visit",
    ],
    tags: ["Backwater", "Coastal", "Heritage home"],
    checked: [
      "clean_room",
      "drinking_water",
      "hot_meals",
      "bedding_linens",
      "working_bathroom",
      "mobile_network",
      "first_aid",
      "activity_guide",
    ],
  },
  {
    name: "Loktak Floating Homestay",
    host: "Thoibi & Ibomcha",
    village: "Sendra",
    region: "Loktak",
    state: "Manipur",
    pricePerNight: 1600,
    rating: 4.5,
    reviewCount: 41,
    imageUrl:
      "https://images.unsplash.com/photo-1518684079-3c830dcef090?w=1200&q=80",
    description:
      "A bamboo houseboat on the phumdis of Loktak Lake. Thoibi cooks eromba over a clay stove. Ibomcha takes guests fishing at first light, when the floating islands turn gold.",
    maxGuests: 3,
    bedrooms: 1,
    activities: [
      "Phumdi boat ride",
      "Sunrise fishing",
      "Eromba cooking lesson",
      "Visit to Keibul Lamjao",
    ],
    tags: ["Lake", "Northeast", "Offbeat"],
    checked: [
      "clean_room",
      "drinking_water",
      "hot_meals",
      "bedding_linens",
      "first_aid",
    ],
  },
  {
    name: "Spiti Mud Brick Homestay",
    host: "Tenzin Dolma",
    village: "Langza",
    region: "Spiti",
    state: "Himachal Pradesh",
    pricePerNight: 1500,
    rating: 4.7,
    reviewCount: 67,
    imageUrl:
      "https://images.unsplash.com/photo-1580655653885-65763b2597d0?w=1200&q=80",
    description:
      "A whitewashed Spitian home at 4,400 metres, under the Buddha statue of Langza. Yak butter tea on arrival. Thukpa and momos for dinner. Star fields you have not imagined.",
    maxGuests: 4,
    bedrooms: 2,
    activities: [
      "Fossil hunting walk",
      "Visit to Komic monastery",
      "Stargazing",
      "Yak herding morning",
    ],
    tags: ["Himalaya", "High-altitude", "Buddhist"],
    checked: [
      "clean_room",
      "drinking_water",
      "hot_meals",
      "bedding_linens",
      "working_bathroom",
      "activity_guide",
    ],
  },
  {
    name: "Konkan Tile Roof Cottage",
    host: "Sunita Patil",
    village: "Velas",
    region: "Konkan",
    state: "Maharashtra",
    pricePerNight: 1900,
    rating: 4.6,
    reviewCount: 88,
    imageUrl:
      "https://images.unsplash.com/photo-1505881502353-a1986add3762?w=1200&q=80",
    description:
      "A red-tile-roof cottage in Velas, the village famous for its turtle festival. Mango orchards in the back, Arabian Sea ten minutes' walk away. Sunita's solkadhi is locally famous.",
    maxGuests: 4,
    bedrooms: 2,
    activities: [
      "Turtle hatchling watch (Feb–Apr)",
      "Beach walk",
      "Alphonso orchard tour",
      "Konkani thali",
    ],
    tags: ["Coastal", "Orchard", "Family-friendly"],
    checked: [
      "clean_room",
      "drinking_water",
      "hot_meals",
      "bedding_linens",
      "working_bathroom",
      "mobile_network",
      "activity_guide",
    ],
  },
  {
    name: "Majuli Bamboo Stilt House",
    host: "Bhupen & Rina",
    village: "Garamur",
    region: "Majuli",
    state: "Assam",
    pricePerNight: 1700,
    rating: 4.7,
    reviewCount: 53,
    imageUrl:
      "https://images.unsplash.com/photo-1571055107559-3e67626fa8be?w=1200&q=80",
    description:
      "On the world's largest river island. Bhupen masks in the workshop, Rina's xaak aru bhaji on the table, the Brahmaputra outside the door.",
    maxGuests: 3,
    bedrooms: 1,
    activities: [
      "Mask-making with Bhupen",
      "Satras (monastery) visit",
      "River sunset",
      "Mishing village walk",
    ],
    tags: ["River island", "Craft", "Northeast"],
    checked: [
      "clean_room",
      "drinking_water",
      "hot_meals",
      "bedding_linens",
      "first_aid",
      "activity_guide",
    ],
  },
];

async function main() {
  await db.delete(bookingsTable);
  await db.delete(checklistsTable);
  await db.delete(homestaysTable);

  const inserted = await db
    .insert(homestaysTable)
    .values(
      HOMESTAYS.map((h) => ({
        name: h.name,
        host: h.host,
        village: h.village,
        region: h.region,
        state: h.state,
        pricePerNight: h.pricePerNight,
        rating: h.rating,
        reviewCount: h.reviewCount,
        imageUrl: h.imageUrl,
        description: h.description,
        maxGuests: h.maxGuests,
        bedrooms: h.bedrooms,
        activities: h.activities,
        tags: h.tags,
      })),
    )
    .returning({ id: homestaysTable.id });

  for (let i = 0; i < HOMESTAYS.length; i++) {
    const h = HOMESTAYS[i];
    const id = inserted[i].id;
    const { items, score } = makeChecklist(h.checked);
    await db.insert(checklistsTable).values({
      homestayId: id,
      items,
      score,
      updatedAt: new Date(),
    });
  }

  // A few seed bookings — recent, varied
  const today = new Date();
  function dPlus(days: number): string {
    const d = new Date(today);
    d.setUTCDate(d.getUTCDate() + days);
    return d.toISOString().slice(0, 10);
  }
  const seedBookings: {
    homestayIdx: number;
    guestName: string;
    days: number;
    nights: number;
    guests: number;
    createdAgoHrs: number;
  }[] = [
    { homestayIdx: 0, guestName: "Aarav Mehta", days: 5, nights: 3, guests: 2, createdAgoHrs: 2 },
    { homestayIdx: 3, guestName: "Sneha Kurian", days: 12, nights: 4, guests: 3, createdAgoHrs: 6 },
    { homestayIdx: 5, guestName: "Karan Bhatia", days: 21, nights: 5, guests: 2, createdAgoHrs: 18 },
    { homestayIdx: 1, guestName: "Tara D'Souza", days: 8, nights: 2, guests: 2, createdAgoHrs: 32 },
    { homestayIdx: 6, guestName: "Reema Joshi", days: 14, nights: 3, guests: 4, createdAgoHrs: 48 },
    { homestayIdx: 2, guestName: "Vikram Rao", days: 25, nights: 2, guests: 2, createdAgoHrs: 64 },
  ];

  for (const b of seedBookings) {
    const homestayId = inserted[b.homestayIdx].id;
    const created = new Date(today);
    created.setUTCHours(created.getUTCHours() - b.createdAgoHrs);
    await db.insert(bookingsTable).values({
      homestayId,
      guestName: b.guestName,
      checkInDate: dPlus(b.days),
      checkOutDate: dPlus(b.days + b.nights),
      guests: b.guests,
      createdAt: created,
    });
  }

  console.log(
    `Seeded ${inserted.length} homestays, ${seedBookings.length} bookings, ${HOMESTAYS.length} checklists.`,
  );
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
