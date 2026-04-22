export function addDays(date, days) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

export function fmtDate(d) {
  if (!d) return "—";
  const date = d instanceof Date ? d : new Date(d);
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export function fmtShortDate(d) {
  if (!d) return "—";
  const date = d instanceof Date ? d : new Date(d);
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function fmtMoney(n) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n || 0);
}

export function daysFromNow(d) {
  if (!d) return null;
  return Math.ceil((new Date(d) - new Date()) / 86400000);
}

export function countdownLabel(d) {
  const diff = daysFromNow(d);
  if (diff === null) return "—";
  if (diff < 0) return `${Math.abs(diff)}d ago`;
  if (diff === 0) return "TODAY";
  return `in ${diff}d`;
}

export function countdownClass(d) {
  const diff = daysFromNow(d);
  if (diff === null) return "";
  if (diff < 0) return "past";
  if (diff <= 7) return "soon";
  return "future";
}
