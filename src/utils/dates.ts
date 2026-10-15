export function todayIso(now = new Date()) {
  const local = new Date(now.getTime() - now.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 10);
}

export function addDaysIso(days: number, now = new Date()) {
  const d = new Date(now);
  d.setDate(d.getDate() + days);
  return todayIso(d);
}

/** "Overdue · 3 Oct", "Today", "Tomorrow", "Fri 17 Oct" or "No due date". */
export function describeDue(dueDate: string | null, now = new Date()) {
  if (!dueDate) return { label: 'No due date', overdue: false };
  const today = todayIso(now);
  if (dueDate === today) return { label: 'Due today', overdue: false };
  if (dueDate === addDaysIso(1, now)) return { label: 'Due tomorrow', overdue: false };
  const date = new Date(`${dueDate}T00:00:00`);
  const formatted = date.toLocaleDateString('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });
  return dueDate < today
    ? { label: `Overdue · ${formatted}`, overdue: true }
    : { label: `Due ${formatted}`, overdue: false };
}
