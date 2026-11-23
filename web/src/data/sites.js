export const sites = [
  { id: 1, name: "Kimironko Market East", district: "Gasabo", sector: "Kimironko", status: "available", latitude: -1.9481, longitude: 30.1192, size: "12 m²", fee: 18000, type: "Produce & groceries", terms: "Trading permitted daily, 06:00–19:00. Keep the marked walkway clear.", queue: 4, reference: "VSAT-241" },
  { id: 2, name: "Nyabugogo Transit Hub", district: "Nyarugenge", sector: "Muhima", status: "available", latitude: -1.9397, longitude: 30.0458, size: "8 m²", fee: 22000, type: "General merchandise", terms: "No cooking fuel or permanent fixtures. Daily waste removal is required.", queue: 7, reference: "VSAT-236" },
  { id: 3, name: "Kacyiru Community Row", district: "Gasabo", sector: "Kacyiru", status: "inactive", latitude: -1.9277, longitude: 30.0814, size: "6 m²", fee: 20000, type: "Food & beverages", terms: "Temporarily unavailable while drainage work is completed.", queue: 0, reference: "VSAT-229" },
  { id: 4, name: "Remera Taxi Park", district: "Gasabo", sector: "Remera", status: "allocated", latitude: -1.9602, longitude: 30.1076, size: "10 m²", fee: 24000, type: "Mixed vending", terms: "Allocated through the public queue. Decision history remains visible.", queue: 0, reference: "VSAT-218" },
  { id: 5, name: "Gikondo Commercial Lane", district: "Kicukiro", sector: "Gikondo", status: "available", latitude: -1.9894, longitude: 30.0674, size: "15 m²", fee: 16000, type: "Produce & crafts", terms: "Shared storage only. Trading permitted Monday–Saturday.", queue: 2, reference: "VSAT-247" },
  { id: 6, name: "Kicukiro Centre Arcade", district: "Kicukiro", sector: "Kicukiro", status: "inactive", latitude: -2.0032, longitude: 30.1032, size: "5 m²", fee: 19000, type: "General merchandise", terms: "Listing paused pending site verification by the administrator.", queue: 0, reference: "VSAT-221" },
  { id: 7, name: "Nyarugenge Market South", district: "Nyarugenge", sector: "Nyarugenge", status: "allocated", latitude: -1.9558, longitude: 30.0578, size: "9 m²", fee: 21000, type: "Tailoring & crafts", terms: "Allocated through the public queue. Decision history remains visible.", queue: 0, reference: "VSAT-205" }
];

export const districts = ["Gasabo", "Kicukiro", "Nyarugenge"];

export const formatRwf = (amount) => `RWF ${amount.toLocaleString("en-US")}`;
