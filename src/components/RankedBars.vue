<template>
  <!-- Gemela en tabla del donut: aqui todo valor es texto legible, sin depender
       ni del color ni del tooltip. -->
  <ul class="ranked">
    <li v-for="row in rows" :key="row.key" class="ranked__row" @click="$emit('pick', row)">
      <span class="ranked__dot" :style="{ background: row.color }" />
      <span class="ranked__name">{{ row.label }}</span>
      <span class="ranked__value num">{{ row.valueText }}</span>
      <span class="ranked__track">
        <span class="ranked__fill" :style="{ width: pct(row.ratio), background: row.color }" />
      </span>
      <span class="ranked__pct num">{{ row.pctText }}</span>
    </li>
  </ul>
</template>

<script setup>
defineProps({
  // [{ key, label, color, ratio (0..1), valueText, pctText }]
  rows: { type: Array, required: true }
})
defineEmits(['pick'])

// Un hilo visible aunque la categoria sea residual.
const pct = (r) => `${Math.max(2, Math.min(100, (r || 0) * 100)).toFixed(1)}%`
</script>

<style scoped>
.ranked { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 14px; }
.ranked__row {
  display: grid;
  grid-template-columns: 10px 1fr auto;
  grid-template-areas: 'dot name value' '. track pct';
  align-items: center;
  column-gap: 10px;
  row-gap: 6px;
}
.ranked__dot { grid-area: dot; width: 10px; height: 10px; border-radius: 3px; }
.ranked__name {
  grid-area: name;
  font-size: 14px;
  font-weight: 500;
  color: var(--gb-text);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.ranked__value { grid-area: value; font-size: 14px; font-weight: 600; color: var(--gb-text); }
.ranked__track {
  grid-area: track;
  height: 6px;
  border-radius: 999px;
  background: var(--gb-surface-2);
  overflow: hidden;
}
.ranked__fill { display: block; height: 100%; border-radius: 999px; }
.ranked__pct { grid-area: pct; font-size: 12px; color: var(--gb-text-faint); }
</style>
