<template>
  <div class="donut">
    <ChartCanvas :config="config" :height="size" :aria-label="ariaLabel" />
    <div class="donut__center">
      <span class="donut__label">{{ centerLabel }}</span>
      <strong class="donut__value">{{ centerValue }}</strong>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import ChartCanvas from './ChartCanvas.vue'
import { tooltipStyle } from './setup'
import { themeColors } from '@/theme/theme'
import { lightMode } from '@/theme/palette'

const props = defineProps({
  // [{ label, value, color }] — como mucho 6 porciones: un donut con mas
  // trozos deja de leerse de un vistazo y toca pasar a barras.
  items: { type: Array, required: true },
  centerLabel: { type: String, default: '' },
  centerValue: { type: String, default: '' },
  size: { type: Number, default: 210 },
  formatter: { type: Function, default: (v) => String(v) }
})

const ariaLabel = computed(() =>
  `Reparto: ${props.items.map((i) => `${i.label} ${props.formatter(i.value)}`).join(', ')}`
)

const config = computed(() => {
  lightMode.value // repintar al cambiar de tema
  const c = themeColors()
  return {
    type: 'doughnut',
    data: {
      labels: props.items.map((i) => i.label),
      datasets: [{
        data: props.items.map((i) => i.value),
        backgroundColor: props.items.map((i) => i.color),
        // El "borde" es del color de la superficie: es el hueco de 2px que
        // separa porciones, no un contorno dibujado sobre la marca.
        borderColor: c.surface,
        borderWidth: 3,
        borderAlign: 'inner',
        hoverOffset: 4
      }]
    },
    options: {
      cutout: '72%',
      layout: { padding: 2 },
      plugins: {
        legend: { display: false }, // la leyenda va en HTML, con importes
        tooltip: {
          ...tooltipStyle(c),
          callbacks: {
            label: (ctx) => ` ${props.formatter(ctx.parsed)}`
          }
        }
      }
    }
  }
})
</script>

<style scoped>
.donut { position: relative; }
.donut__center {
  position: absolute;
  inset: 0;
  display: grid;
  place-content: center;
  text-align: center;
  pointer-events: none;
  gap: 2px;
}
.donut__label {
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--gb-text-faint);
}
/* Cifra protagonista: figuras proporcionales, no tabulares. */
.donut__value {
  font-size: 26px;
  font-weight: 700;
  letter-spacing: -0.03em;
  color: var(--gb-text);
}
</style>
