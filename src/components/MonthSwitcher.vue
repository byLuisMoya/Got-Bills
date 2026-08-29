<template>
  <div class="switcher">
    <button class="switcher__nav" aria-label="Periodo anterior" @click="shift(-1)">
      <ion-icon :icon="chevronBack" />
    </button>
    <button class="switcher__current" @click="$emit('open')">
      <span class="switcher__month">{{ label }}</span>
      <!-- Con corte distinto del dia 1 el nombre del mes no basta: se muestra
           siempre el tramo exacto que se esta viendo. -->
      <span v-if="rangeLabel" class="switcher__range">{{ rangeLabel }}</span>
      <ion-icon :icon="chevronDown" class="switcher__caret" />
    </button>
    <button
      class="switcher__nav"
      aria-label="Periodo siguiente"
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
import { addMonths, monthLabel } from '@/utils/dates'
import { currentPeriod, usesCalendarMonth, rangeLabelOf } from '@/store/useStore'

const props = defineProps({ modelValue: { type: String, required: true } })
const emit = defineEmits(['update:modelValue', 'open'])

const label = computed(() => monthLabel(props.modelValue))
const rangeLabel = computed(() => (usesCalendarMonth.value ? '' : rangeLabelOf(props.modelValue)))
// No se navega al futuro: solo confunde ver periodos vacios por delante.
const atLatest = computed(() => props.modelValue >= currentPeriod.value)

const shift = (d) => {
  const next = addMonths(props.modelValue, d)
  if (d > 0 && next > currentPeriod.value) return
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
  display: grid;
  grid-template-columns: 1fr auto;
  grid-template-areas: 'month caret' 'range range';
  align-items: center;
  gap: 0 6px;
  border: 0;
  background: transparent;
  color: var(--gb-text);
  padding: 4px 8px;
  border-radius: 12px;
  min-width: 160px;
  justify-items: center;
}
.switcher__month {
  grid-area: month;
  font-size: 17px;
  font-weight: 600;
  letter-spacing: -0.01em;
}
.switcher__range {
  grid-area: range;
  font-size: 11.5px;
  color: var(--gb-text-faint);
  margin-top: -1px;
}
.switcher__caret { grid-area: caret; font-size: 14px; color: var(--gb-text-faint); }
</style>
