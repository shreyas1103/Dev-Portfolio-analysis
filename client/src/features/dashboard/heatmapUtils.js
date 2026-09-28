function formatDateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getLocalDateKey(event) {
  const timestamp = event.rawTimestamp ?? event.date;
  return formatDateKey(new Date(timestamp));
}

function groupEventsByLocalDay(events) {
  const counts = new Map();
  for (const event of events) {
    const key = getLocalDateKey(event);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return counts;
}

export { formatDateKey, getLocalDateKey, groupEventsByLocalDay };