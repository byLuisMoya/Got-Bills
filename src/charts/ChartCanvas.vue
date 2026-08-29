<template>
  <div class="chart" :style="{ height: height + 'px' }">
    <canvas ref="el" role="img" :aria-label="ariaLabel" />
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, watch, nextTick } from 'vue'
import { Chart } from './setup'

const props = defineProps({
  config: { type: Object, required: true },
  height: { type: Number, default: 200 },
  ariaLabel: { type: String, default: '' }
})

const el = ref(null)
let chart = null

const build = () => {
  if (chart) { chart.destroy(); chart = null }
  if (el.value) chart = new Chart(el.value, props.config)
}

onMounted(async () => { await nextTick(); build() })
onBeforeUnmount(() => { chart?.destroy(); chart = null })

// Se reconstruye entera en vez de mutar el objeto: los cambios aqui son de
// mes o de tema (poco frecuentes) y reconstruir evita estados a medias.
watch(() => props.config, build, { deep: true })
</script>

<style scoped>
.chart { position: relative; width: 100%; }
canvas { display: block; width: 100% !important; }
</style>
