export function renderTable(container, rows) {
  container.innerHTML = '';
  if (!rows.length) {
    container.innerHTML = '<p class="empty">No data.</p>';
    return;
  }
  const headers = Object.keys(rows[0]);
  const table = document.createElement('table');
  const thead = document.createElement('thead');
  thead.innerHTML = `<tr>${headers.map(h => `<th>${escapeHtml(h)}</th>`).join('')}</tr>`;
  const tbody = document.createElement('tbody');
  for (const row of rows) {
    const tr = document.createElement('tr');
    tr.innerHTML = headers.map(h => `<td>${escapeHtml(String(row[h] ?? ''))}</td>`).join('');
    tbody.appendChild(tr);
  }
  table.appendChild(thead);
  table.appendChild(tbody);
  container.appendChild(table);
}

function escapeHtml(s) {
  return s.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
