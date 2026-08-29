<template>
  <div>
    <div class="legend">
      <span class="legend__item"><i :style="{ background: colors.income }" />Ingresos</span>
      <span class="legend__item"><i :style="{ background: colors.expense }" />Gastos</span>
    </div>
    <ChartCanvas :config="config" :height="height" :aria-label="ariaLabel" />
  </div>
</template>

<script setup>
import { computed } from 'vue'
import ChartCanvas from './ChartCanvas.vue'
import { tooltipStyle, valueAxis, categoryAxis } from './setup'
import { themeColors } from '@/theme/theme'
import { lightMode } from '@/theme/palette'
import { monthLabel } from '@/utils/dates'
import { fromCents } from '@/utils/format'

const props = defineProps({
  // [{ key: 'YYYY-MM', income, expense }] en centimos
  series: { type: Array, required: true },
  height: { type: Number, default: 220 },
  formatter: { type: Function, default: (v) => String(v) },
  axisFormatter: { type: Function, default: (v) => String(v) }
})

const colors = computed(() => { lightMode.value; return themeColors() })

const ariaLabel = computed(() =>
  `Ingresos y gastos por mes: ${props.series.map((s) =>
    `${monthLabel(s.key, 'es-ES', 'short')} ingresos ${props.formatter(s.income)}, gastos ${props.formatter(s.expense)}`
  ).join('; ')}`
)

const config = computed(() => {
  const c = colors.value
  const bar = {
    borderRadius: { topLeft: 4, topRight: 4, bottomLeft: 0, bottomRight: 0 },
    borderSkipped: 'bottom',
    maxBarThickness: 22
  }
  return {
    type: 'bar',
    data: {
      labels: props.series.map((s) => monthLabel(s.key, 'es-ES', 'short').split(' ')[0]),
      datasets: [
        { label: 'Ingresos', data: props.series.map((s) => fromCents(s.income)), backgroundColor: c.income, ...bar },
        { label: 'Gastos', data: props.series.map((s) => fromCents(s.expense)), backgroundColor: c.expense, ...bar }
      ]
    },
    options: {
      // Una sola escala de euros para las dos series: nunca un segundo eje.
      scales: {
        x: { ...categoryAxis(c), stacked: false },
        y: { ...valueAxis(c, props.axisFormatter), beginAtZero: true }
      },
      // El hueco entre barras vecinas lo hace el aire de la banda, no un borde.
      categoryPercentage: 0.68,
      barPercentage: 0.78,
      interaction: { mode: 'index', intersect: false },
      plugins: {
        legend: { display: false },
        tooltip: {
          ...tooltipStyle(c),
          callbacks: {
            title: (items) => monthLabel(props.series[items[0].dataIndex].key),
            label: (ctx) => ` ${ctx.dataset.label}: ${props.formatter(Math.round(ctx.parsed.y * 100))}`
          }
        }
      }
    }
  }
})
</script>

<style scoped>
.legend {
  display: flex;
  gap: 16px;
  margin-bottom: 12px;
  font-size: 12px;
  color: var(--gb-text-dim);
}
.legend__item { display: inline-flex; align-items: center; gap: 6px; }
.legend__item i { width: 9px; height: 9px; border-radius: 3px; display: block; }
</style>
