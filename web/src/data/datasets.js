// Titles for the open datasets. The rows come from the API (GET /public/:key).
export const DATASETS = [
  {
    key: "spaces",
    title: "Vending space registry",
    description: "Every listed vending space: location, size, monthly fee, permitted trade, terms and whether it is open."
  },
  {
    key: "activity",
    title: "Space activity log",
    description: "Dated record of spaces being allocated or revoked. Entries are permanent and never edited or deleted."
  },
  {
    key: "flags",
    title: "Flag log",
    description: "Allocations that were questioned, with the category, the date raised and the current status."
  }
];
