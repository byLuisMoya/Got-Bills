// Persistencia local. Todo vive en el localStorage del WebView: sin servidor,
// sin cuentas y sin red. El volumen de una contabilidad personal (unos pocos
// miles de movimientos) cabe de sobra y el acceso sincrono simplifica la app.

import { SLOT_COUNT } from '@/theme/palette'

const KEY = 'gotbills.v1'
const SCHEMA = 1

export const DEFAULT_SETTINGS = {
  currency: 'EUR',
  locale: 'es-ES',
  theme: 'auto',      // auto | light | dark
  monthStartDay: 1,   // dia en que empieza tu mes (1..28), p.ej. el de la nomina
  hideAmounts: false
}

const seedCategories = () => [
  { id: 'c_casa',    name: 'Vivienda',     type: 'expense', slot: 0, icon: 'home',            budget: null },
  { id: 'c_transp',  name: 'Transporte',   type: 'expense', slot: 1, icon: 'car-sport',       budget: null },
  { id: 'c_super',   name: 'Supermercado', type: 'expense', slot: 2, icon: 'cart',            budget: null },
  { id: 'c_sumin',   name: 'Suministros',  type: 'expense', slot: 3, icon: 'flash',           budget: null },
  { id: 'c_comida',  name: 'Restaurantes', type: 'expense', slot: 4, icon: 'restaurant',      budget: null },
  { id: 'c_compras', name: 'Compras',      type: 'expense', slot: 5, icon: 'bag-handle',      budget: null },
  { id: 'c_ocio',    name: 'Ocio',         type: 'expense', slot: 6, icon: 'game-controller', budget: null },
  { id: 'c_salud',   name: 'Salud',        type: 'expense', slot: 7, icon: 'medkit',          budget: null },
  { id: 'c_nomina',  name: 'Nómina',       type: 'income',  slot: 5, icon: 'briefcase',       budget: null },
  { id: 'c_extra',   name: 'Ingreso extra',type: 'income',  slot: 2, icon: 'sparkles',        budget: null },
  { id: 'c_devol',   name: 'Devoluciones', type: 'income',  slot: 0, icon: 'return-down-back',budget: null }
]

const emptyState = () => ({
  schema: SCHEMA,
  transactions: [],
  categories: seedCategories(),
  settings: { ...DEFAULT_SETTINGS }
})

export function load () {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return emptyState()
    const data = JSON.parse(raw)
    return migrate(data)
  } catch (err) {
    console.error('[got-bills] no se pudo leer el almacenamiento local', err)
    return emptyState()
  }
}

export function save (state) {
  try {
    localStorage.setItem(KEY, JSON.stringify({
      schema: SCHEMA,
      transactions: state.transactions,
      categories: state.categories,
      settings: state.settings
    }))
    return true
  } catch (err) {
    console.error('[got-bills] no se pudo guardar', err)
    return false
  }
}

/** Deja cualquier volcado antiguo o parcial en la forma que espera la app. */
function migrate (data) {
  const base = emptyState()
  return {
    schema: SCHEMA,
    transactions: Array.isArray(data.transactions) ? data.transactions.map(normalizeTx).filter(Boolean) : [],
    categories: Array.isArray(data.categories) && data.categories.length
      ? data.categories.map((c, i) => normalizeCategory(c, i)).filter(Boolean)
      : base.categories,
    settings: normalizeSettings(base.settings, data.settings)
  }
}

function normalizeSettings (base, incoming = {}) {
  const s = { ...base, ...incoming }
  // `firstDayOfMonth` es el nombre que tenia el ajuste antes de usarse.
  const raw = incoming.monthStartDay ?? incoming.firstDayOfMonth ?? base.monthStartDay
  s.monthStartDay = Math.min(28, Math.max(1, Math.round(Number(raw) || 1)))
  delete s.firstDayOfMonth
  return s
}

function normalizeTx (t) {
  if (!t || t.amount == null) return null
  return {
    id: t.id || uid('t'),
    type: t.type === 'income' ? 'income' : 'expense',
    amount: Math.abs(Math.round(Number(t.amount) || 0)), // centimos, siempre positivo
    categoryId: t.categoryId || null,
    date: /^\d{4}-\d{2}-\d{2}$/.test(t.date) ? t.date : new Date().toISOString().slice(0, 10),
    note: String(t.note || ''),
    createdAt: t.createdAt || Date.now()
  }
}

function normalizeCategory (c, index = 0) {
  if (!c || !c.name) return null
  const slot = Number.isInteger(c.slot) ? c.slot : index
  return {
    id: c.id || uid('c'),
    name: String(c.name),
    type: c.type === 'income' ? 'income' : 'expense',
    slot: ((slot % SLOT_COUNT) + SLOT_COUNT) % SLOT_COUNT,
    icon: c.icon || 'pricetag',
    budget: Number.isFinite(c.budget) && c.budget > 0 ? Math.round(c.budget) : null,
    archived: !!c.archived
  }
}

export const uid = (prefix = 'id') =>
  `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`

/** Copia de seguridad legible: el usuario debe poder abrir el JSON y entenderlo. */
export function exportJSON (state) {
  return JSON.stringify({
    app: 'got-bills',
    schema: SCHEMA,
    exportedAt: new Date().toISOString(),
    settings: state.settings,
    categories: state.categories,
    transactions: state.transactions
  }, null, 2)
}

export function parseImport (text) {
  const data = JSON.parse(text)
  if (!data || !Array.isArray(data.transactions)) {
    throw new Error('El archivo no tiene movimientos de Got Bills.')
  }
  return migrate(data)
}
