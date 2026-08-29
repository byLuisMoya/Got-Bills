// Los importes se guardan SIEMPRE en centimos (enteros) para no arrastrar
// errores de coma flotante al sumar cientos de movimientos.

export const toCents = (value) => {
  if (typeof value === 'number') return Math.round(value * 100)
  const clean = String(value ?? '').replace(/\s/g, '').replace(',', '.').replace(/[^\d.-]/g, '')
  const n = parseFloat(clean)
  return Number.isFinite(n) ? Math.round(n * 100) : 0
}

export const fromCents = (cents) => (cents || 0) / 100

export function formatMoney (cents, { currency = 'EUR', locale = 'es-ES', sign = false, compact = false } = {}) {
  const value = fromCents(cents)
  const opts = {
    style: 'currency',
    currency,
    minimumFractionDigits: compact ? 0 : 2,
    maximumFractionDigits: compact ? 0 : 2
  }
  if (compact && Math.abs(value) >= 10000) {
    opts.notation = 'compact'
    opts.maximumFractionDigits = 1
  }
  const out = new Intl.NumberFormat(locale, opts).format(value)
  return sign && cents > 0 ? `+${out}` : out
}

export function formatNumber (value, locale = 'es-ES', digits = 0) {
  return new Intl.NumberFormat(locale, {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits
  }).format(value)
}

export function formatPercent (ratio, locale = 'es-ES') {
  if (!Number.isFinite(ratio)) return '—'
  return new Intl.NumberFormat(locale, {
    style: 'percent',
    maximumFractionDigits: ratio !== 0 && Math.abs(ratio) < 0.1 ? 1 : 0
  }).format(ratio)
}
