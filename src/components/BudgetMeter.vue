<template>
  <div class="meter">
    <div class="meter__head">
      <span class="meter__name">
        <ion-icon :icon="icon" :style="{ color }" />
        {{ name }}
      </span>
      <span class="meter__state num" :class="stateClass">{{ stateText }}</span>
    </div>
    <div class="meter__track">
      <div class="meter__fill" :style="{ width: width, background: fillColor }" />
    </div>
    <p class="meter__foot num">{{ usedText }} de {{ limitText }}</p>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { IonIcon } from '@ionic/vue'

const props = defineProps({
  name: String,
  icon: String,
  color: String,
  ratio: Number,     // gastado / limite
  usedText: String,
  limitText: String,
  leftText: String
})

const width = computed(() => `${Math.min(100, Math.max(0, props.ratio * 100))}%`)

// El relleno lleva la severidad; el texto la nombra, para no fiarlo al color.
const level = computed(() => (props.ratio >= 1 ? 'over' : props.ratio >= 0.85 ? 'near' : 'ok'))
const fillColor = computed(() => ({
  ok: 'var(--gb-accent)',
  near: 'var(--gb-warn)',
  over: 'var(--gb-expense)'
}[level.value]))
const stateClass = computed(() => `meter__state--${level.value}`)
const stateText = computed(() =>
  level.value === 'over' ? `Excedido ${props.leftText}` : `Quedan ${props.leftText}`
)
</script>

<style scoped>
.meter { display: flex; flex-direction: column; gap: 8px; }
.meter__head { display: flex; align-items: center; justify-content: space-between; gap: 10px; }
.meter__name {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 600;
  color: var(--gb-text);
}
.meter__name ion-icon { font-size: 17px; }
.meter__state { font-size: 12px; font-weight: 600; color: var(--gb-text-dim); }
.meter__state--near { color: var(--gb-warn); }
.meter__state--over { color: var(--gb-expense); }
.meter__track { height: 8px; border-radius: 999px; background: var(--gb-surface-2); overflow: hidden; }
.meter__fill { height: 100%; border-radius: 999px; transition: width 0.35s ease; }
.meter__foot { margin: 0; font-size: 12px; color: var(--gb-text-faint); }
</style>
