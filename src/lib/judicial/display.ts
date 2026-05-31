export function formatearRadicado(raw: string): string {
  if (raw.length !== 23) return raw

  return [
    raw.slice(0, 2),
    raw.slice(2, 5),
    raw.slice(5, 7),
    raw.slice(7, 10),
    raw.slice(10, 12),
    raw.slice(12, 16),
    raw.slice(16, 21),
    raw.slice(21, 23),
  ].join("-")
}

export function formatFechaJudicial(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso

  return d.toLocaleDateString("es-CO", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  })
}
