const cell = (value) => `"${String(value ?? "").replaceAll('"', '""')}"`;

export function toCsv(rows, columns) {
  const header = columns.map(([, label]) => cell(label)).join(",");
  const body = rows.map((row) => columns.map(([key]) => cell(row[key])).join(","));
  return [header, ...body].join("\r\n");
}

/** Saves text as a file in the browser. Swap for a link to the API export once it exists. */
export function downloadFile(filename, text, type) {
  const url = URL.createObjectURL(new Blob([text], { type: `${type};charset=utf-8` }));
  const link = Object.assign(document.createElement("a"), { href: url, download: filename });
  document.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
