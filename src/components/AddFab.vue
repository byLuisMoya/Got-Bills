<template>
  <!-- Va dentro de cada ion-content: como hijo directo de ion-tabs Ionic no lo pinta. -->
  <ion-fab slot="fixed" vertical="bottom" horizontal="end" class="fab">
    <ion-fab-button aria-label="Añadir movimiento" @click="add">
      <ion-icon :icon="addIcon" />
    </ion-fab-button>
  </ion-fab>
</template>

<script setup>
import { IonFab, IonFabButton, IonIcon } from '@ionic/vue'
import { add as addIcon } from 'ionicons/icons'
import { openNew } from '@/store/sheet'

const props = defineProps({ date: { type: String, default: '' } })
const add = () => openNew(props.date)
</script>

<style scoped>
.fab { margin-bottom: 68px; margin-right: 6px; }
ion-fab-button {
  --background: var(--gb-accent);
  --background-activated: var(--gb-accent);
  --color: var(--gb-on-accent);
  --box-shadow: 0 8px 22px rgba(0, 0, 0, 0.45);
}
</style>
