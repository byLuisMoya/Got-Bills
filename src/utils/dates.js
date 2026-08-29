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

/* ------------------------------------------------------------------ */
/* Periodos: el "mes" del usuario, que no tiene por que empezar el dia 1 */
/* ------------------------------------------------------------------ */

/*
 * Si cobras el 25, tu mes util va del 25 al 24. Un periodo se sigue
 * identificando con una clave 'YYYY-MM' para que toda la aritmetica de meses
 * (anterior, siguiente, ultimos 12) siga valiendo; lo unico que cambia es que
 * fechas caen dentro y con que nombre se etiqueta.
 *
 * Nombre del periodo: el del mes que aporta mas dias. Con corte el 25, el
 * tramo 25-ago -> 24-sep tiene 24 dias de septiembre, asi que es "Septiembre";
 * con corte el 5, el tramo 5-ago -> 4-sep tiene 27 de agosto y es "Agosto".
 * En la cabecera se muestra ademas el rango exacto, para que nunca haya duda.
 */

/** Dia de corte valido: 1..28, para que exista tambien en febrero. */
export const clampStartDay = (d) => Math.min(28, Math.max(1, Math.round(Number(d) || 1)))

/** A que periodo pertenece una fecha ISO. */
export function periodKeyOf (iso, startDay = 1) {
  const cut = clampStartDay(startDay)
  if (cut === 1) return String(iso).slice(0, 7)
  const day = Number(String(iso).slice(8, 10))
  const month = String(iso).slice(0, 7)
  const startMonth = day >= cut ? month : addMonths(month, -1)
  return cut <= 15 ? startMonth : addMonths(startMonth, 1)
}

export const currentPeriodKey = (startDay = 1) => periodKeyOf(todayISO(), startDay)

/** Primer y ultimo dia (ISO, ambos incluidos) del periodo. */
export function periodRange (key, startDay = 1) {
  const cut = clampStartDay(startDay)
  if (cut === 1) return monthRange(key)
  const startMonth = cut <= 15 ? key : addMonths(key, -1)
  const [ey, em] = addMonths(startMonth, 1).split('-').map(Number)
  return {
    start: `${startMonth}-${String(cut).padStart(2, '0')}`,
    end: toISO(new Date(ey, em - 1, cut - 1))
  }
}

export function daysInPeriod (key, startDay = 1) {
  const cut = clampStartDay(startDay)
  if (cut === 1) return daysInMonth(key)
  const { start, end } = periodRange(key, cut)
  // Redondeo por si el tramo cruza un cambio de hora (dias de 23 o 25 horas).
  return Math.round((fromISO(end) - fromISO(start)) / 86400000) + 1
}

/** «25 ago – 24 sep», para acompañar al nombre del mes cuando el corte no es el dia 1. */
export function periodRangeLabel (key, startDay = 1, locale = 'es-ES') {
  const { start, end } = periodRange(key, startDay)
  const short = (iso) =>
    fromISO(iso).toLocaleDateString(locale, { day: 'numeric', month: 'short' }).replace(/\./g, '')
  return `${short(start)} – ${short(end)}`
}

export const shortDayLabel = (iso, locale = 'es-ES') =>
  fromISO(iso).toLocaleDateString(locale, { day: 'numeric', month: 'short' }).replace(/\./g, '')

export const longDayLabel = (iso, locale = 'es-ES') =>
  capitalize(fromISO(iso).toLocaleDateString(locale, { day: 'numeric', month: 'long' }))
