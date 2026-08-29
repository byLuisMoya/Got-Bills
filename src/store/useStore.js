import { reactive, computed, watch } from 'vue'
import { load, save, uid } from './db'
import { monthKey, currentMonthKey, lastMonths, daysInMonth, todayISO } from '@/utils/dates'
import { formatMoney } from '@/utils/format'
import { slotColor, nextFreeSlot, OTHER_COLOR, lightMode } from '@/theme/palette'

const state = reactive(load())

// Guardado automatico: cualquier mutacion del estado acaba en disco sin que
// cada pantalla tenga que acordarse de persistir.
watch(state, () => save(state), { deep: true, flush: 'post' })

/* ------------------------------------------------------------------ */
/* Selectores                                                          */
/* ------------------------------------------------------------------ */

export const categoriesById = computed(() =>
  Object.fromEntries(state.categories.map((c) => [c.id, c]))
)

const UNCATEGORIZED = { id: null, name: 'Sin categoría', slot: -1, icon: 'help-circle', type: 'expense' }

/** Resuelve el hueco de paleta de una categoria al hex del tema activo. */
export const catColor = (cat) =>
  !cat || cat.slot < 0 ? OTHER_COLOR(lightMode.value) : slotColor(cat.slot, lightMode.value)

export const categoryOf = (tx) => categoriesById.value[tx.categoryId] || UNCATEGORIZED

export const activeCategories = (type) =>
  state.categories.filter((c) => !c.archived && (!type || c.type === type))

/** Movimientos ordenados de mas reciente a mas antiguo. */
export const sortedTransactions = computed(() =>
  [...state.transactions].sort((a, b) =>
    b.date.localeCompare(a.date) || (b.createdAt || 0) - (a.createdAt || 0)
  )
)

export const transactionsOfMonth = (key) =>
  sortedTransactions.value.filter((t) => monthKey(t.date) === key)

export function totals (list) {
  let income = 0
  let expense = 0
  for (const t of list) {
    if (t.type === 'income') income += t.amount
    else expense += t.amount
  }
  return { income, expense, balance: income - expense, count: list.length }
}

export const monthTotals = (key) => totals(transactionsOfMonth(key))

/** Reparto por categoria de un mes, ya ordenado de mayor a menor gasto. */
export function breakdown (key, type = 'expense') {
  const list = transactionsOfMonth(key).filter((t) => t.type === type)
  const sum = list.reduce((acc, t) => acc + t.amount, 0)
  const groups = new Map()
  for (const t of list) {
    const cat = categoryOf(t)
    const prev = groups.get(cat.id) || { category: cat, total: 0, count: 0 }
    prev.total += t.amount
    prev.count += 1
    groups.set(cat.id, prev)
  }
  return [...groups.values()]
    .map((g) => ({ ...g, ratio: sum ? g.total / sum : 0 }))
    .sort((a, b) => b.total - a.total)
}

/** Reparto por categoria de un rango de meses (pestaña de analisis). */
export function breakdownRange (keys, type = 'expense') {
  const set = new Set(keys)
  const list = state.transactions.filter((t) => t.type === type && set.has(monthKey(t.date)))
  const sum = list.reduce((acc, t) => acc + t.amount, 0)
  const groups = new Map()
  for (const t of list) {
    const cat = categoryOf(t)
    const prev = groups.get(cat.id) || { category: cat, total: 0, count: 0 }
    prev.total += t.amount
    prev.count += 1
    groups.set(cat.id, prev)
  }
  return [...groups.values()]
    .map((g) => ({ ...g, ratio: sum ? g.total / sum : 0 }))
    .sort((a, b) => b.total - a.total)
}

/** Serie de los ultimos `count` meses para las graficas de evolucion. */
export function trend (endKey, count = 12) {
  const keys = lastMonths(endKey, count)
  const buckets = Object.fromEntries(keys.map((k) => [k, { key: k, income: 0, expense: 0 }]))
  for (const t of state.transactions) {
    const b = buckets[monthKey(t.date)]
    if (!b) continue
    if (t.type === 'income') b.income += t.amount
    else b.expense += t.amount
  }
  return keys.map((k) => ({ ...buckets[k], balance: buckets[k].income - buckets[k].expense }))
}

/** Saldo acumulado dia a dia dentro de un mes: la curva de "cuanto me queda". */
export function dailyCumulative (key) {
  const days = daysInMonth(key)
  const perDay = new Array(days).fill(0)
  for (const t of transactionsOfMonth(key)) {
    const d = Number(t.date.slice(8, 10)) - 1
    if (d < 0 || d >= days) continue
    perDay[d] += t.type === 'income' ? t.amount : -t.amount
  }
  const today = todayISO()
  const isCurrent = monthKey(today) === key
  const limit = isCurrent ? Number(today.slice(8, 10)) : days
  let acc = 0
  return perDay.slice(0, limit).map((v, i) => {
    acc += v
    return { day: i + 1, value: acc }
  })
}

/** Presupuestos con su consumo del mes: solo categorias que tengan limite. */
export function budgetStatus (key) {
  const spent = new Map(breakdown(key, 'expense').map((b) => [b.category.id, b.total]))
  return state.categories
    .filter((c) => c.budget && !c.archived && c.type === 'expense')
    .map((c) => {
      const used = spent.get(c.id) || 0
      return { category: c, limit: c.budget, used, ratio: used / c.budget, left: c.budget - used }
    })
    .sort((a, b) => b.ratio - a.ratio)
}

export const overallBalance = computed(() => totals(state.transactions).balance)

export const monthsWithData = computed(() => {
  const keys = new Set(state.transactions.map((t) => monthKey(t.date)))
  keys.add(currentMonthKey())
  return [...keys].sort()
})

/* ------------------------------------------------------------------ */
/* Mutaciones                                                          */
/* ------------------------------------------------------------------ */

export function addTransaction (tx) {
  const record = {
    id: uid('t'),
    createdAt: Date.now(),
    ...tx,
    amount: Math.abs(Math.round(tx.amount))
  }
  state.transactions.push(record)
  return record
}

export function updateTransaction (id, patch) {
  const tx = state.transactions.find((t) => t.id === id)
  if (!tx) return null
  Object.assign(tx, patch)
  tx.amount = Math.abs(Math.round(tx.amount))
  return tx
}

export function removeTransaction (id) {
  const i = state.transactions.findIndex((t) => t.id === id)
  if (i >= 0) return state.transactions.splice(i, 1)[0]
  return null
}

export function addCategory (data) {
  const cat = {
    id: uid('c'),
    slot: nextFreeSlot(state.categories.filter((c) => c.type === (data.type || 'expense'))),
    icon: 'pricetag',
    budget: null,
    archived: false,
    ...data
  }
  state.categories.push(cat)
  return cat
}

export function updateCategory (id, patch) {
  const cat = state.categories.find((c) => c.id === id)
  if (cat) Object.assign(cat, patch)
  return cat
}

/**
 * Borra una categoria. Los movimientos que la usaban NO se pierden: quedan
 * como "sin categoría" para que nunca desaparezca dinero del balance.
 */
export function removeCategory (id) {
  const i = state.categories.findIndex((c) => c.id === id)
  if (i < 0) return
  state.categories.splice(i, 1)
  for (const t of state.transactions) {
    if (t.categoryId === id) t.categoryId = null
  }
}

export function replaceAll (next) {
  state.transactions = next.transactions
  state.categories = next.categories
  state.settings = { ...state.settings, ...next.settings }
}

export function clearTransactions () {
  state.transactions = []
}

/* ------------------------------------------------------------------ */

/** Formateador de importes ligado a los ajustes (moneda / idioma / privacidad). */
export const money = (cents, opts = {}) => {
  if (state.settings.hideAmounts && !opts.force) return '••••'
  return formatMoney(cents, { currency: state.settings.currency, locale: state.settings.locale, ...opts })
}

export const useStore = () => state
export { state }
