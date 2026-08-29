<template>
  <ChartCanvas :config="config" :height="height" :aria-label="ariaLabel" />
</template>

<script setup>
import { computed } from 'vue'
import ChartCanvas from './ChartCanvas.vue'
import { tooltipStyle, valueAxis, categoryAxis } from './setup'
import { themeColors } from '@/theme/theme'
import { lightMode } from '@/theme/palette'
import { fromCents } from '@/utils/format'

const props = defineProps({
  // [{ label, tooltip, value }] — saldo acumulado en centimos
  points: { type: Array, required: true },
  height: { type: Number, default: 170 },
  formatter: { type: Function, default: (v) => String(v) },
  axisFormatter: { type: Function, default: (v) => String(v) }
})

const positive = computed(() => (props.points.at(-1)?.value ?? 0) >= 0)

const ariaLabel = computed(() =>
  `Saldo acumulado del mes, dia a dia. Cierre: ${props.formatter(props.points.at(-1)?.value ?? 0)}`
)

const config = computed(() => {
  lightMode.value
  const c = themeColors()
  const hue = positive.value ? c.income : c.expense
  const last = props.points.length - 1
  return {
    type: 'line',
    data: {
      labels: props.points.map((p) => p.label),
      datasets: [{
        data: props.points.map((p) => fromCents(p.value)),
        borderColor: hue,
        borderWidth: 2,
        borderJoinStyle: 'round',
        borderCapStyle: 'round',
        tension: 0.28,
        fill: 'origin',
        backgroundColor: hue + '1a', // lavado ~10%, nunca un bloque saturado
        // Un solo punto marcado, el del final: el resto los cuenta el tooltip.
        pointRadius: (ctx) => (ctx.dataIndex === last ? 4.5 : 0),
        pointBackgroundColor: hue,
        pointBorderColor: c.surface,
        pointBorderWidth: 2,   // anillo del color de la superficie
        pointHoverRadius: 5,
        pointHitRadius: 18     // area de acierto comoda con el dedo
      }]
    },
    options: {
      scales: {
        x: { ...categoryAxis(c), ticks: { ...categoryAxis(c).ticks, maxTicksLimit: 6 } },
        y: { ...valueAxis(c, props.axisFormatter), grace: '8%' }
      },
      interaction: { mode: 'index', intersect: false },
      plugins: {
        legend: { display: false }, // serie unica: el titulo ya dice que es
        tooltip: {
          ...tooltipStyle(c),
          callbacks: {
            title: (items) => props.points[items[0].dataIndex]?.tooltip ?? items[0].label,
            label: (ctx) => ` Saldo: ${props.formatter(Math.round(ctx.parsed.y * 100))}`
          }
        }
      }
    }
  }
})
</script>
