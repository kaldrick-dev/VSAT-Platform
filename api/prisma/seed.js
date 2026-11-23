// Fills a local database with demo users and the sites shown in the web app.
import bcrypt from "bcryptjs";
import { prisma } from "../src/lib/prisma.js";

const sites = [
  ["VSAT-241", "Kimironko Market East", "Gasabo", "Kimironko", "Produce & groceries", "12 m²", 18000, -1.9481, 30.1192, "available", "Trading permitted daily, 06:00–19:00. Keep the marked walkway clear."],
  ["VSAT-236", "Nyabugogo Transit Hub", "Nyarugenge", "Muhima", "General merchandise", "8 m²", 22000, -1.9397, 30.0458, "available", "No cooking fuel or permanent fixtures. Daily waste removal is required."],
  ["VSAT-229", "Kacyiru Community Row", "Gasabo", "Kacyiru", "Food & beverages", "6 m²", 20000, -1.9277, 30.0814, "inactive", "Temporarily unavailable while drainage work is completed."],
  ["VSAT-218", "Remera Taxi Park", "Gasabo", "Remera", "Mixed vending", "10 m²", 24000, -1.9602, 30.1076, "allocated", "Allocated through the public queue. Decision history remains visible."],
  ["VSAT-247", "Gikondo Commercial Lane", "Kicukiro", "Gikondo", "Produce & crafts", "15 m²", 16000, -1.9894, 30.0674, "available", "Shared storage only. Trading permitted Monday–Saturday."],
  ["VSAT-221", "Kicukiro Centre Arcade", "Kicukiro", "Kicukiro", "General merchandise", "5 m²", 19000, -2.0032, 30.1032, "inactive", "Listing paused pending site verification by the administrator."],
  ["VSAT-205", "Nyarugenge Market South", "Nyarugenge", "Nyarugenge", "Tailoring & crafts", "9 m²", 21000, -1.9558, 30.0578, "allocated", "Allocated through the public queue. Decision history remains visible."]
];

const passwordHash = await bcrypt.hash("password123", 12);

for (const [fullName, email, role] of [["Demo Admin", "admin@example.com", "admin"], ["Demo Vendor", "vendor@example.com", "vendor"]]) {
  await prisma.user.upsert({ where: { email }, update: {}, create: { fullName, email, role, passwordHash } });
}

for (const [reference, name, district, sector, type, size, fee, latitude, longitude, status, terms] of sites) {
  const data = { reference, name, district, sector, type, size, fee, latitude, longitude, status, terms };
  await prisma.site.upsert({ where: { reference }, update: data, create: data });
}

console.log("Seeded 2 users and", sites.length, "sites");
await prisma.$disconnect();
