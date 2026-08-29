// Todas las fechas de movimientos son cadenas 'YYYY-MM-DD' (fecha local, sin zona
// horaria) para que un gasto del dia 1 no se mueva al 31 al cambiar de pais.

export const todayISO = () => toISO(new Date())

export function toISO (date) {
  const d = new Date(date)
  const p = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`
}

export const fromISO = (iso) => {
  const [y, m, d] = String(iso).split('-').map(Number)
  return new Date(y, (m || 1) - 1, d || 1)
}

/** Clave de mes 'YYYY-MM' a partir de una fecha ISO o de un Date. */
export const monthKey = (v) =>
  typeof v === 'string' ? v.slice(0, 7) : toISO(v).slice(0, 7)

export const currentMonthKey = () => monthKey(new Date())

export function addMonths (key, delta) {
  const [y, m] = key.split('-').map(Number)
  const d = new Date(y, m - 1 + delta, 1)
  return monthKey(d)
}

export function monthRange (key) {
  const [y, m] = key.split('-').map(Number)
  return { start: `${key}-01`, end: toISO(new Date(y, m, 0)) }
}

export function daysInMonth (key) {
  const [y, m] = key.split('-').map(Number)
  return new Date(y, m, 0).getDate()
}

/** Ultimos `count` meses terminando en `key` (incluido), del mas antiguo al mas reciente. */
export function lastMonths (key, count) {
  return Array.from({ length: count }, (_, i) => addMonths(key, i - count + 1))
}

const capitalize = (s) => s.charAt(0).toUpperCase() + s.slice(1)

export function monthLabel (key, locale = 'es-ES', style = 'long') {
  const [y, m] = key.split('-').map(Number)
  const d = new Date(y, m - 1, 1)
  const text = d.toLocaleDateString(locale, {
    month: style === 'short' ? 'short' : 'long',
    year: style === 'short' ? '2-digit' : 'numeric'
  })
  return capitalize(text.replace('.', ''))
}

export function dayLabel (iso, locale = 'es-ES') {
  const d = fromISO(iso)
  const today = todayISO()
  if (iso === today) return 'Hoy'
  if (iso === toISO(new Date(Date.now() - 86400000))) return 'Ayer'
  const sameYear = d.getFullYear() === new Date().getFullYear()
  return capitalize(d.toLocaleDateString(locale, {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    ...(sameYear ? {} : { year: 'numeric' })
  }).replace(/\./g, ''))
}
