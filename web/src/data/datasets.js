import { flags, statusLog } from "./records.js";
import { sites } from "./sites.js";

// Downloadable open datasets. Swap `rows` for API exports (GET /exports/:key.csv) later.
export const DATASETS = [
  {
    key: "spaces",
    title: "Vending space registry",
    description: "Every listed vending space: location, size, monthly fee, permitted trade, terms and whether it is open.",
    rows: sites,
    columns: [["reference", "Reference"], ["name", "Space"], ["district", "District"], ["sector", "Sector"], ["status", "Status"], ["type", "Permitted trade"], ["size", "Size"], ["fee", "Monthly fee (RWF)"], ["latitude", "Latitude"], ["longitude", "Longitude"], ["terms", "Terms"]]
  },
  {
    key: "activity",
    title: "Space activity log",
    description: "Dated record of spaces being listed, allocated or paused. Entries are permanent and never edited or deleted.",
    rows: statusLog,
    columns: [["id", "Reference"], ["date", "Date"], ["site", "Space"], ["district", "District"], ["event", "Event"], ["note", "Note"]]
  },
  {
    key: "flags",
    title: "Flag log",
    description: "Allocations that were questioned, with the category, the date raised and how each was resolved.",
    rows: flags,
    columns: [["id", "Reference"], ["event", "Activity entry"], ["date", "Date raised"], ["category", "Category"], ["status", "Status"], ["note", "Resolution note"]]
  }
];
