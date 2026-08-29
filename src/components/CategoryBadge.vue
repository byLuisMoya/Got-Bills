<template>
  <span class="cat-icon" :style="{ background: tint }">
    <ion-icon :icon="iconFor(icon)" :style="{ color }" />
  </span>
</template>

<script setup>
import { computed } from 'vue'
import { IonIcon } from '@ionic/vue'
import { iconFor } from '@/utils/icons'

const props = defineProps({
  icon: { type: String, default: 'pricetag' },
  color: { type: String, default: '#818cf8' }
})

// Fondo tenue del propio color: identifica sin gritar y sin pintar texto en color.
const tint = computed(() => `${props.color}22`)
</script>
