<template>
  <div class="switcher">
    <button class="switcher__nav" aria-label="Mes anterior" @click="shift(-1)">
      <ion-icon :icon="chevronBack" />
    </button>
    <button class="switcher__current" @click="$emit('open')">
      <span class="switcher__month">{{ label }}</span>
      <ion-icon :icon="chevronDown" class="switcher__caret" />
    </button>
    <button
      class="switcher__nav"
      aria-label="Mes siguiente"
      :disabled="atLatest"
      @click="shift(1)"
    >
      <ion-icon :icon="chevronForward" />
    </button>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { IonIcon } from '@ionic/vue'
import { chevronBack, chevronForward, chevronDown } from 'ionicons/icons'
import { addMonths, monthLabel, currentMonthKey } from '@/utils/dates'

const props = defineProps({ modelValue: { type: String, required: true } })
const emit = defineEmits(['update:modelValue', 'open'])

const label = computed(() => monthLabel(props.modelValue))
// No se navega al futuro: solo confunde ver meses vacios por delante.
const atLatest = computed(() => props.modelValue >= currentMonthKey())

const shift = (d) => {
  const next = addMonths(props.modelValue, d)
  if (d > 0 && next > currentMonthKey()) return
  emit('update:modelValue', next)
}
</script>

<style scoped>
.switcher { display: flex; align-items: center; justify-content: center; gap: 4px; }
.switcher__nav {
  width: 38px;
  height: 38px;
  border: 0;
  border-radius: 12px;
  background: transparent;
  color: var(--gb-text-dim);
  display: grid;
  place-items: center;
  font-size: 18px;
}
.switcher__nav:disabled { opacity: 0.25; }
.switcher__nav:active:not(:disabled) { background: var(--gb-surface-2); }
.switcher__current {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  border: 0;
  background: transparent;
  color: var(--gb-text);
  font-size: 17px;
  font-weight: 600;
  letter-spacing: -0.01em;
  padding: 6px 8px;
  border-radius: 12px;
  min-width: 150px;
  justify-content: center;
}
.switcher__caret { font-size: 14px; color: var(--gb-text-faint); }
</style>
