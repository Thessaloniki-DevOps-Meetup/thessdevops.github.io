// Fills [data-fire-days] and [data-fire-count] elements.
// Days: whole calendar days from today (local) to data-date; 0 on the day itself.
// Count: fetched from the talks Worker (GET /count). Both fall back to the "—" in the markup.
export function initFire(root: HTMLElement) {
  const { date, countUrl } = root.dataset;

  if (date) {
    const now = new Date();
    const today = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
    const [y, m, d] = date.split('-').map(Number);
    const days = Math.round((Date.UTC(y, m - 1, d) - today) / 86400000);
    if (days >= 0) root.querySelectorAll('[data-fire-days]').forEach((el) => (el.textContent = String(days)));
  }

  if (countUrl) {
    fetch(countUrl)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((j) => {
        if (typeof j.count === 'number') {
          root.querySelectorAll('[data-fire-count]').forEach((el) => (el.textContent = String(j.count)));
        }
      })
      .catch(() => {});
  }
}
