// Turns an array of flat objects into CSV text, quoting every value.
export const toCsv = (rows, columns) => {
  const quote = (value) => `"${String(value ?? "").replaceAll('"', '""')}"`;
  const header = columns.map(quote).join(",");
  const lines = rows.map((row) => columns.map((column) => quote(row[column])).join(","));
  return [header, ...lines].join("\n");
};
