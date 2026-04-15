// Minimal RFC 4180-ish CSV parser. Handles quoted fields, escaped quotes, CRLF.
export function parseCsv(text) {
  const rows = [];
  let field = '';
  let row = [];
  let inQuotes = false;
  let i = 0;

  while (i < text.length) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"' && text[i + 1] === '"') { field += '"'; i += 2; continue; }
      if (c === '"') { inQuotes = false; i++; continue; }
      field += c; i++; continue;
    }
    if (c === '"') { inQuotes = true; i++; continue; }
    if (c === ',') { row.push(field); field = ''; i++; continue; }
    if (c === '\r' && text[i + 1] === '\n') { row.push(field); rows.push(row); field = ''; row = []; i += 2; continue; }
    if (c === '\n' || c === '\r') { row.push(field); rows.push(row); field = ''; row = []; i++; continue; }
    field += c; i++;
  }
  if (field.length > 0 || row.length > 0) { row.push(field); rows.push(row); }

  const nonEmpty = rows.filter(r => r.length > 1 || (r.length === 1 && r[0] !== ''));
  if (nonEmpty.length === 0) return { headers: [], rows: [] };

  const [headers, ...dataRows] = nonEmpty;
  return {
    headers,
    rows: dataRows.map(r => Object.fromEntries(headers.map((h, idx) => [h, r[idx] ?? '']))),
  };
}
