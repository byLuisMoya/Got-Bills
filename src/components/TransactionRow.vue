<template>
  <ion-item-sliding ref="sliding">
    <ion-item button detail="false" lines="none" class="row" @click="$emit('edit', tx)">
      <CategoryBadge :icon="category.icon" :color="color" slot="start" />
      <ion-label>
        <h3 class="row__title">{{ category.name }}</h3>
        <p v-if="tx.note" class="row__note">{{ tx.note }}</p>
      </ion-label>
      <span slot="end" class="row__amount num" :class="tx.type === 'income' ? 'amount-in' : 'amount-out'">
        {{ tx.type === 'income' ? '+' : '−' }}{{ amountText }}
      </span>
    </ion-item>
    <ion-item-options side="end">
      <ion-item-option color="danger" @click="remove">
        <ion-icon slot="icon-only" :icon="trashOutline" />
      </ion-item-option>
    </ion-item-options>
  </ion-item-sliding>
</template>

<script setup>
import { ref, computed } from 'vue'
import {
  IonItem, IonItemSliding, IonItemOptions, IonItemOption, IonLabel, IonIcon
} from '@ionic/vue'
import { trashOutline } from 'ionicons/icons'
import CategoryBadge from './CategoryBadge.vue'
import { categoryOf, catColor, money } from '@/store/useStore'

const props = defineProps({ tx: { type: Object, required: true } })
const emit = defineEmits(['edit', 'remove'])

const sliding = ref(null)
const category = computed(() => categoryOf(props.tx))
const color = computed(() => catColor(category.value))
const amountText = computed(() => money(props.tx.amount))

const remove = async () => {
  await sliding.value?.$el.close()
  emit('remove', props.tx)
}
</script>

<style scoped>
.row {
  --padding-start: 0;
  --inner-padding-end: 0;
  --min-height: 60px;
  --background: transparent;
}
.row__title {
  font-size: 15px !important;
  font-weight: 500;
  color: var(--gb-text);
  margin: 0;
}
.row__note {
  font-size: 12.5px !important;
  color: var(--gb-text-faint);
  margin: 2px 0 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.row__amount { font-size: 15px; font-weight: 600; }
</style>
