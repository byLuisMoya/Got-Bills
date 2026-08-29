<template>
  <ion-page>
    <ion-header class="ion-no-border">
      <ion-toolbar>
        <ion-title size="large">Análisis</ion-title>
      </ion-toolbar>
      <!-- Un unico filtro, arriba: manda sobre todas las graficas de la vista. -->
      <div class="hscroll ranges">
        <button
          v-for="r in RANGES"
          :key="r.value"
          class="chip"
          :class="{ 'chip--on': range === r.value }"
          @click="range = r.value"
        >{{ r.label }}</button>
      </div>
    </ion-header>

    <ion-content>
      <div class="page">
        <section class="card hero">
          <p class="hero__label">Ahorro en {{ rangeLabel }}</p>
          <strong class="hero__value" :class="net >= 0 ? 'amount-in' : 'amount-out'">
            {{ money(net, { sign: true }) }}
          </strong>
          <p class="hero__sub">
            Tasa de ahorro
            <strong :class="savingRate >= 0 ? 'amount-in' : 'amount-out'">{{ savingRateText }}</strong>
            sobre {{ money(sum.income) }} de ingresos
          </p>
        </section>

        <template v-if="hasData">
          <section class="card">
            <header class="card__head">
              <div>
                <h2 class="card__title">Ingresos y gastos</h2>
                <p class="card__sub">Por mes, en euros</p>
              </div>
            </header>
            <TrendChart :series="series" :formatter="money" :axis-formatter="axisMoney" />
          </section>

          <section class="card">
            <header class="card__head">
              <div>
                <h2 class="card__title">Ahorro acumulado</h2>
                <p class="card__sub">Suma de los balances mes a mes</p>
              </div>
            </header>
            <BalanceChart :points="cumulative" :formatter="money" :axis-formatter="axisMoney" />
          </section>

          <div class="tiles">
            <article class="card tile">
              <span class="tile__label">Gasto medio al mes</span>
              <strong class="tile__value">{{ money(avgExpense) }}</strong>
            </article>
            <article class="card tile">
              <span class="tile__label">Ingreso medio al mes</span>
              <strong class="tile__value">{{ money(avgIncome) }}</strong>
            </article>
            <article class="card tile">
              <span class="tile__label">Mejor mes</span>
              <strong class="tile__value amount-in">{{ money(best.balance, { sign: true }) }}</strong>
              <span class="tile__foot">{{ monthLabel(best.key, 'es-ES', 'short') }}</span>
            </article>
            <article class="card tile">
              <span class="tile__label">Peor mes</span>
              <strong class="tile__value amount-out">{{ money(worst.balance, { sign: true }) }}</strong>
              <span class="tile__foot">{{ monthLabel(worst.key, 'es-ES', 'short') }}</span>
            </article>
          </div>

          <section v-if="topRows.length" class="card">
            <header class="card__head">
              <div>
                <h2 class="card__title">Dónde va el dinero</h2>
                <p class="card__sub">Gasto acumulado del periodo</p>
              </div>
            </header>
            <RankedBars :rows="topRows" />
          </section>
        </template>

        <section v-else class="card empty">
          <ion-icon :icon="statsChartOutline" />
          <p>
            <strong>Todavía no hay suficiente historial</strong>
            En cuanto apuntes movimientos de un par de meses aparecerán aquí las
            tendencias y comparativas.
          </p>
        </section>
      </div>

      <AddFab />
    </ion-content>
  </ion-page>
</template>

<script setup>
import { ref, computed } from 'vue'
import AddFab from '@/components/AddFab.vue'
import { IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonIcon } from '@ionic/vue'
import { statsChartOutline } from 'ionicons/icons'
import TrendChart from '@/charts/TrendChart.vue'
import BalanceChart from '@/charts/BalanceChart.vue'
import RankedBars from '@/components/RankedBars.vue'
import { money, trend, breakdownRange, catColor } from '@/store/useStore'
import { currentMonthKey, monthLabel, lastMonths } from '@/utils/dates'
import { formatPercent } from '@/utils/format'

const RANGES = [
  { value: 3, label: '3 meses' },
  { value: 6, label: '6 meses' },
  { value: 12, label: '12 meses' }
]

const range = ref(6)
const rangeLabel = computed(() => RANGES.find((r) => r.value === range.value).label)

const series = computed(() => trend(currentMonthKey(), range.value))
const hasData = computed(() => series.value.some((s) => s.income || s.expense))

const sum = computed(() =>
  series.value.reduce(
    (acc, s) => ({ income: acc.income + s.income, expense: acc.expense + s.expense }),
    { income: 0, expense: 0 }
  )
)
const net = computed(() => sum.value.income - sum.value.expense)
const savingRate = computed(() => (sum.value.income ? net.value / sum.value.income : 0))
const savingRateText = computed(() =>
  sum.value.income ? formatPercent(savingRate.value) : '—'
)

/** Meses con actividad: promediar sobre meses vacios falsearia la media. */
const activeMonths = computed(() => series.value.filter((s) => s.income || s.expense).length || 1)
const avgExpense = computed(() => Math.round(sum.value.expense / activeMonths.value))
const avgIncome = computed(() => Math.round(sum.value.income / activeMonths.value))

const ranked = computed(() => [...series.value].sort((a, b) => b.balance - a.balance))
const best = computed(() => ranked.value[0] ?? { key: currentMonthKey(), balance: 0 })
const worst = computed(() => ranked.value.at(-1) ?? { key: currentMonthKey(), balance: 0 })

const cumulative = computed(() => {
  let acc = 0
  return series.value.map((s) => {
    acc += s.balance
    return { day: monthLabel(s.key, 'es-ES', 'short').split(' ')[0], value: acc }
  })
})

const topRows = computed(() =>
  breakdownRange(lastMonths(currentMonthKey(), range.value), 'expense')
    .slice(0, 8)
    .map((r) => ({
      key: r.category.id || 'none',
      label: r.category.name,
      color: catColor(r.category),
      ratio: r.ratio,
      valueText: money(r.total),
      pctText: formatPercent(r.ratio)
    }))
)

const axisMoney = (v) => money(Math.round(v * 100), { compact: true, force: true })
</script>

<style scoped>
.ranges { padding-bottom: 10px; }
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

.hero { padding: 22px 20px; }
.hero__label {
  margin: 0 0 2px;
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--gb-text-faint);
}
.hero__value { font-size: 40px; font-weight: 700; letter-spacing: -0.035em; line-height: 1.15; }
.hero__sub { margin: 8px 0 0; font-size: 13px; color: var(--gb-text-faint); }

.tiles { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.tile { display: flex; flex-direction: column; gap: 4px; padding: 15px 16px; }
.tile__label { font-size: 11.5px; color: var(--gb-text-faint); line-height: 1.3; }
.tile__value { font-size: 21px; font-weight: 700; letter-spacing: -0.02em; }
.tile__foot { font-size: 11.5px; color: var(--gb-text-faint); }
</style>
