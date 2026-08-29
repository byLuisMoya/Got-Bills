<template>
  <ion-page>
    <ion-header class="ion-no-border">
      <ion-toolbar>
        <MonthSwitcher v-model="month" @open="strip = !strip" />
        <ion-buttons slot="end">
          <ion-button aria-label="Mostrar u ocultar importes" @click="togglePrivacy">
            <ion-icon slot="icon-only" :icon="settings.hideAmounts ? eyeOffOutline : eyeOutline" />
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
      <div v-if="strip" class="hscroll">
        <button
          v-for="k in months"
          :key="k"
          class="mchip"
          :class="{ 'mchip--on': k === month }"
          @click="month = k; strip = false"
        >{{ monthLabel(k, 'es-ES', 'short') }}</button>
      </div>
    </ion-header>

    <ion-content>
      <div class="page">
        <!-- Cifra protagonista de la vista: el balance del mes. -->
        <section class="card hero">
          <p class="hero__label">Balance de {{ monthLabel(month).split(' ')[0].toLowerCase() }}</p>
          <strong class="hero__value" :class="totals.balance >= 0 ? 'amount-in' : 'amount-out'">
            {{ money(totals.balance, { sign: true }) }}
          </strong>
          <p v-if="deltaText" class="hero__delta">
            <span class="pill" :class="deltaClass">
              <ion-icon :icon="delta > 0 ? arrowUp : arrowDown" />
              {{ deltaText }}
            </span>
            en gastos frente a {{ monthLabel(prevMonth).split(' ')[0].toLowerCase() }}
          </p>

          <div class="split">
            <div class="split__cell">
              <span class="split__key"><i class="dot dot--in" />Ingresos</span>
              <span class="split__val num amount-in">{{ money(totals.income) }}</span>
            </div>
            <div class="split__cell">
              <span class="split__key"><i class="dot dot--out" />Gastos</span>
              <span class="split__val num amount-out">{{ money(totals.expense) }}</span>
            </div>
          </div>
        </section>

        <template v-if="totals.count">
          <section class="card">
            <header class="card__head">
              <div>
                <h2 class="card__title">Cómo va el mes</h2>
                <p class="card__sub">Saldo acumulado día a día</p>
              </div>
              <span class="pill num">{{ money(perDay) }}/día</span>
            </header>
            <BalanceChart :points="cumulative" :formatter="money" :axis-formatter="axisMoney" />
          </section>

          <section v-if="expenseTotal" class="card">
            <header class="card__head">
              <div>
                <h2 class="card__title">En qué se te va</h2>
                <p class="card__sub">{{ breakdownRows.length }} categorías este mes</p>
              </div>
            </header>
            <DonutChart
              :items="donutItems"
              center-label="Gastado"
              :center-value="money(expenseTotal, { compact: true })"
              :formatter="money"
            />
            <div class="spacer" />
            <RankedBars :rows="rankedRows" />
          </section>

          <section v-if="budgets.length" class="card">
            <header class="card__head">
              <h2 class="card__title">Presupuestos</h2>
              <ion-button fill="clear" size="small" router-link="/categorias">Editar</ion-button>
            </header>
            <div class="budgets">
              <BudgetMeter
                v-for="b in budgets"
                :key="b.category.id"
                :name="b.category.name"
                :icon="b.category.icon"
                :color="catColor(b.category)"
                :ratio="b.ratio"
                :used-text="money(b.used)"
                :limit-text="money(b.limit)"
                :left-text="money(Math.abs(b.left))"
              />
            </div>
          </section>

          <section class="card card--flush">
            <header class="card__head" style="padding: 0 18px">
              <h2 class="card__title">Últimos movimientos</h2>
              <ion-button fill="clear" size="small" router-link="/movimientos">Ver todos</ion-button>
            </header>
            <ion-list style="background: transparent">
              <div style="padding: 0 18px">
                <TransactionRow
                  v-for="tx in latest"
                  :key="tx.id"
                  :tx="tx"
                  @edit="openEdit"
                  @remove="confirmRemove"
                />
              </div>
            </ion-list>
          </section>
        </template>

        <section v-else class="card empty">
          <ion-icon :icon="walletOutline" />
          <p>
            <strong>Aún no hay nada en {{ monthLabel(month).split(' ')[0].toLowerCase() }}</strong>
            Pulsa el botón + y apunta tu primer gasto o ingreso. Todo se guarda
            solo en este móvil.
          </p>
          <ion-button class="empty__cta" @click="openNew(defaultDate)">Añadir movimiento</ion-button>
        </section>
      </div>

      <AddFab :date="defaultDate" />
    </ion-content>
  </ion-page>
</template>

<script setup>
import { ref, computed } from 'vue'
import {
  IonPage, IonHeader, IonToolbar, IonContent, IonButton, IonButtons,
  IonIcon, IonList, alertController
} from '@ionic/vue'
import AddFab from '@/components/AddFab.vue'
import {
  eyeOutline, eyeOffOutline, walletOutline, arrowUp, arrowDown
} from 'ionicons/icons'
import MonthSwitcher from '@/components/MonthSwitcher.vue'
import RankedBars from '@/components/RankedBars.vue'
import BudgetMeter from '@/components/BudgetMeter.vue'
import TransactionRow from '@/components/TransactionRow.vue'
import DonutChart from '@/charts/DonutChart.vue'
import BalanceChart from '@/charts/BalanceChart.vue'
import { OTHER_COLOR, lightMode } from '@/theme/palette'
import {
  state, money, catColor, monthTotals, breakdown, dailyCumulative,
  budgetStatus, transactionsOfMonth, monthsWithData, removeTransaction
} from '@/store/useStore'
import { openNew, openEdit } from '@/store/sheet'
import {
  currentMonthKey, monthLabel, addMonths, monthRange, todayISO, monthKey
} from '@/utils/dates'
import { formatPercent, fromCents } from '@/utils/format'

const month = ref(currentMonthKey())
const strip = ref(false)
const settings = state.settings

const months = computed(() => [...monthsWithData.value].reverse())
const prevMonth = computed(() => addMonths(month.value, -1))
const totals = computed(() => monthTotals(month.value))
const prevTotals = computed(() => monthTotals(prevMonth.value))
const breakdownRows = computed(() => breakdown(month.value, 'expense'))
const expenseTotal = computed(() => totals.value.expense)
const cumulative = computed(() => dailyCumulative(month.value))
const budgets = computed(() => budgetStatus(month.value))
const latest = computed(() => transactionsOfMonth(month.value).slice(0, 5))

/** Al añadir desde un mes pasado, la fecha por defecto es de ese mes. */
const defaultDate = computed(() =>
  month.value === currentMonthKey() ? todayISO() : monthRange(month.value).start
)

const perDay = computed(() => {
  const days = cumulative.value.length || 1
  return Math.round(totals.value.expense / days)
})

const delta = computed(() => {
  const prev = prevTotals.value.expense
  if (!prev) return null
  return (totals.value.expense - prev) / prev
})
const deltaText = computed(() => (delta.value === null ? '' : formatPercent(Math.abs(delta.value))))
// Gastar mas es "malo": la flecha hacia arriba va en rojo, no en verde.
const deltaClass = computed(() => (delta.value > 0 ? 'pill--up' : 'pill--down'))

/** Donut: como mucho 6 porciones; el resto se agrupa en "Otros" en gris. */
const donutItems = computed(() => {
  const rows = breakdownRows.value
  const head = rows.slice(0, 5)
  const tail = rows.slice(5)
  const items = head.map((r) => ({
    label: r.category.name,
    value: fromCents(r.total),
    color: catColor(r.category)
  }))
  if (tail.length) {
    items.push({
      label: `Otros (${tail.length})`,
      value: fromCents(tail.reduce((a, r) => a + r.total, 0)),
      color: OTHER_COLOR(lightMode.value)
    })
  }
  return items
})

const rankedRows = computed(() =>
  breakdownRows.value.map((r) => ({
    key: r.category.id || 'none',
    label: r.category.name,
    color: catColor(r.category),
    ratio: r.ratio,
    valueText: money(r.total),
    pctText: formatPercent(r.ratio)
  }))
)

const axisMoney = (v) => money(Math.round(v * 100), { compact: true, force: true })

const togglePrivacy = () => { settings.hideAmounts = !settings.hideAmounts }

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
.hero { display: flex; flex-direction: column; gap: 4px; padding: 22px 20px; }
.hero__label {
  margin: 0;
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--gb-text-faint);
}
/* Cifra protagonista: figuras proporcionales (nada de tabular-nums aqui). */
.hero__value { font-size: 40px; font-weight: 700; letter-spacing: -0.035em; line-height: 1.15; }
.hero__delta {
  margin: 6px 0 0;
  font-size: 12.5px;
  color: var(--gb-text-faint);
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}
.hero__delta ion-icon { font-size: 12px; }

.split { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-top: 18px; }
.split__cell {
  background: var(--gb-surface-2);
  border-radius: var(--gb-radius-sm);
  padding: 12px 14px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.split__key { display: inline-flex; align-items: center; gap: 6px; font-size: 12px; color: var(--gb-text-dim); }
.split__val { font-size: 17px; font-weight: 600; }
.dot { width: 8px; height: 8px; border-radius: 3px; display: block; }
.dot--in { background: var(--gb-income); }
.dot--out { background: var(--gb-expense); }

.spacer { height: 18px; }
.budgets { display: flex; flex-direction: column; gap: 18px; }
.empty__cta { margin-top: 14px; }

.mchip {
  border: 1px solid var(--gb-line);
  background: var(--gb-surface);
  color: var(--gb-text-dim);
  border-radius: 999px;
  padding: 7px 13px;
  font-size: 13px;
  font-weight: 500;
  white-space: nowrap;
}
.mchip--on { border-color: var(--gb-accent); color: var(--gb-text); background: color-mix(in srgb, var(--gb-accent) 14%, transparent); }
</style>
