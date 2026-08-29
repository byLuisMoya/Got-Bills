<template>
  <ion-page>
    <ion-header class="ion-no-border">
      <ion-toolbar>
        <MonthSwitcher v-model="month" />
      </ion-toolbar>
      <ion-toolbar>
        <ion-searchbar
          v-model="query"
          placeholder="Buscar por nota o categoría"
          :debounce="150"
          class="search"
        />
      </ion-toolbar>
      <div class="hscroll filters">
        <button
          v-for="f in FILTERS"
          :key="f.value"
          class="chip"
          :class="{ 'chip--on': filter === f.value }"
          @click="filter = f.value"
        >{{ f.label }}</button>
      </div>
    </ion-header>

    <ion-content>
      <div class="page">
        <section class="card totals">
          <div>
            <span class="totals__key">Ingresos</span>
            <strong class="totals__val num amount-in">{{ money(visibleTotals.income) }}</strong>
          </div>
          <div>
            <span class="totals__key">Gastos</span>
            <strong class="totals__val num amount-out">{{ money(visibleTotals.expense) }}</strong>
          </div>
          <div>
            <span class="totals__key">{{ visibleTotals.count }} movimientos</span>
            <strong class="totals__val num">{{ money(visibleTotals.balance, { sign: true }) }}</strong>
          </div>
        </section>

        <template v-if="groups.length">
          <section v-for="g in groups" :key="g.date" class="card card--flush day">
            <header class="day__head">
              <span class="day__label">{{ dayLabel(g.date) }}</span>
              <span class="day__sum num" :class="g.net >= 0 ? 'amount-in' : 'amount-out'">
                {{ money(g.net, { sign: true }) }}
              </span>
            </header>
            <div class="day__rows">
              <TransactionRow
                v-for="tx in g.items"
                :key="tx.id"
                :tx="tx"
                @edit="openEdit"
                @remove="confirmRemove"
              />
            </div>
          </section>
        </template>

        <section v-else class="card empty">
          <ion-icon :icon="searchOutline" />
          <p>
            <strong>Sin resultados</strong>
            {{ query ? 'Prueba con otra búsqueda.' : 'No hay movimientos en este mes con ese filtro.' }}
          </p>
        </section>
      </div>

      <AddFab />
    </ion-content>
  </ion-page>
</template>

<script setup>
import { ref, computed } from 'vue'
import {
  IonPage, IonHeader, IonToolbar, IonContent, IonSearchbar, IonIcon, alertController
} from '@ionic/vue'
import AddFab from '@/components/AddFab.vue'
import { searchOutline } from 'ionicons/icons'
import MonthSwitcher from '@/components/MonthSwitcher.vue'
import TransactionRow from '@/components/TransactionRow.vue'
import { money, transactionsOfMonth, totals, categoryOf, removeTransaction } from '@/store/useStore'
import { openEdit } from '@/store/sheet'
import { currentMonthKey, dayLabel } from '@/utils/dates'

const FILTERS = [
  { value: 'all', label: 'Todo' },
  { value: 'expense', label: 'Gastos' },
  { value: 'income', label: 'Ingresos' }
]

const month = ref(currentMonthKey())
const filter = ref('all')
const query = ref('')

const visible = computed(() => {
  const q = query.value.trim().toLowerCase()
  return transactionsOfMonth(month.value).filter((t) => {
    if (filter.value !== 'all' && t.type !== filter.value) return false
    if (!q) return true
    return t.note.toLowerCase().includes(q) || categoryOf(t).name.toLowerCase().includes(q)
  })
})

const visibleTotals = computed(() => totals(visible.value))

/** Agrupado por dia, con el neto del dia: asi se ve de un vistazo un mal jueves. */
const groups = computed(() => {
  const map = new Map()
  for (const tx of visible.value) {
    if (!map.has(tx.date)) map.set(tx.date, { date: tx.date, items: [], net: 0 })
    const g = map.get(tx.date)
    g.items.push(tx)
    g.net += tx.type === 'income' ? tx.amount : -tx.amount
  }
  return [...map.values()]
})

const confirmRemove = async (tx) => {
  const alert = await alertController.create({
    header: '¿Eliminar el movimiento?',
    buttons: [
      { text: 'Cancelar', role: 'cancel' },
      { text: 'Eliminar', role: 'destructive', handler: () => removeTransaction(tx.id) }
    ]
  })
  await alert.present()
}
</script>

<style scoped>
.search {
  --background: var(--gb-surface);
  --color: var(--gb-text);
  --placeholder-color: var(--gb-text-faint);
  --icon-color: var(--gb-text-faint);
  --border-radius: 14px;
  --box-shadow: none;
  padding: 0 12px 8px;
}
.filters { padding-bottom: 10px; }
.chip {
  border: 1px solid var(--gb-line);
  background: var(--gb-surface);
  color: var(--gb-text-dim);
  border-radius: 999px;
  padding: 7px 15px;
  font-size: 13px;
  font-weight: 500;
  white-space: nowrap;
}
.chip--on { border-color: var(--gb-accent); color: var(--gb-text); background: color-mix(in srgb, var(--gb-accent) 14%, transparent); }

.totals { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; }
.totals > div { display: flex; flex-direction: column; gap: 3px; }
.totals__key { font-size: 11.5px; color: var(--gb-text-faint); }
.totals__val { font-size: 15px; font-weight: 600; }

.day__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 18px 8px;
}
.day__label {
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.07em;
  color: var(--gb-text-faint);
}
.day__sum { font-size: 13px; font-weight: 600; }
.day__rows { padding: 0 18px; }
</style>
