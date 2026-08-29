<template>
  <ion-page>
    <ion-header class="ion-no-border">
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button default-href="/ajustes" text="Ajustes" />
        </ion-buttons>
        <ion-title>Categorías</ion-title>
        <ion-buttons slot="end">
          <ion-button @click="openNew">
            <ion-icon slot="icon-only" :icon="addOutline" />
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content>
      <div class="page">
        <section v-for="group in groups" :key="group.type" class="card card--flush">
          <h2 class="card__title" style="padding: 0 18px 8px">{{ group.title }}</h2>
          <div style="padding: 0 18px">
            <button
              v-for="c in group.items"
              :key="c.id"
              class="cat"
              @click="openEdit(c)"
            >
              <CategoryBadge :icon="c.icon" :color="catColor(c)" />
              <span class="cat__body">
                <span class="cat__name">{{ c.name }}</span>
                <span class="cat__meta num">
                  {{ c.budget ? `Presupuesto ${money(c.budget)}` : 'Sin presupuesto' }}
                  · {{ usage[c.id] || 0 }} mov.
                </span>
              </span>
              <ion-icon :icon="chevronForward" class="cat__chev" />
            </button>
          </div>
        </section>
      </div>
    </ion-content>

    <ion-modal :is-open="editor.open" @did-dismiss="closeEditor">
      <ion-header class="ion-no-border">
        <ion-toolbar>
          <ion-buttons slot="start"><ion-button @click="closeEditor">Cancelar</ion-button></ion-buttons>
          <ion-title>{{ editor.id ? 'Editar categoría' : 'Nueva categoría' }}</ion-title>
          <ion-buttons slot="end">
            <ion-button :strong="true" :disabled="!editor.name.trim()" @click="save">Guardar</ion-button>
          </ion-buttons>
        </ion-toolbar>
      </ion-header>
      <ion-content>
        <div class="editor">
          <div class="preview">
            <CategoryBadge :icon="editor.icon" :color="previewColor" />
            <input v-model="editor.name" class="preview__name" placeholder="Nombre" maxlength="24" />
          </div>

          <div class="types">
            <button
              v-for="t in TYPES"
              :key="t.value"
              class="chip"
              :class="{ 'chip--on': editor.type === t.value }"
              :disabled="!!editor.id"
              @click="editor.type = t.value"
            >{{ t.label }}</button>
          </div>
          <p v-if="editor.id" class="hint">
            El tipo no se puede cambiar: los movimientos ya apuntados dejarían de cuadrar.
          </p>

          <p class="section-title">Color</p>
          <div class="swatches">
            <button
              v-for="(s, i) in SLOTS"
              :key="s.key"
              class="swatch"
              :class="{ 'swatch--on': editor.slot === i }"
              :style="{ background: slotColor(i, lightMode) }"
              :aria-label="s.name"
              @click="editor.slot = i"
            >
              <ion-icon v-if="editor.slot === i" :icon="checkmark" />
            </button>
          </div>

          <p class="section-title">Icono</p>
          <div class="icons">
            <button
              v-for="key in ICON_KEYS"
              :key="key"
              class="icons__item"
              :class="{ 'icons__item--on': editor.icon === key }"
              @click="editor.icon = key"
            >
              <ion-icon :icon="iconFor(key)" />
            </button>
          </div>

          <template v-if="editor.type === 'expense'">
            <p class="section-title">Presupuesto mensual</p>
            <div class="budget">
              <input
                v-model="editor.budgetText"
                class="budget__input"
                type="text"
                inputmode="decimal"
                placeholder="Sin límite"
              />
              <span class="budget__cur">{{ currencySymbol }}</span>
            </div>
            <p class="hint">Déjalo vacío si no quieres avisos de presupuesto.</p>
          </template>

          <ion-button
            v-if="editor.id"
            expand="block"
            fill="clear"
            color="danger"
            class="delete"
            @click="askDelete"
          >
            <ion-icon slot="start" :icon="trashOutline" />
            Eliminar categoría
          </ion-button>
        </div>
      </ion-content>
    </ion-modal>
  </ion-page>
</template>

<script setup>
import { reactive, computed } from 'vue'
import {
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, IonButton,
  IonBackButton, IonIcon, IonModal, alertController
} from '@ionic/vue'
import { addOutline, chevronForward, trashOutline, checkmark } from 'ionicons/icons'
import CategoryBadge from '@/components/CategoryBadge.vue'
import { ICON_KEYS, iconFor } from '@/utils/icons'
import { SLOTS, slotColor, nextFreeSlot, lightMode as lightRef } from '@/theme/palette'
import {
  state, money, catColor, addCategory, updateCategory, removeCategory
} from '@/store/useStore'
import { toCents, fromCents } from '@/utils/format'

const TYPES = [
  { value: 'expense', label: 'Gasto' },
  { value: 'income', label: 'Ingreso' }
]

const lightMode = computed(() => lightRef.value)

const editor = reactive({
  open: false, id: null, name: '', type: 'expense', slot: 0, icon: 'pricetag', budgetText: ''
})

const groups = computed(() => [
  { type: 'expense', title: 'Gastos', items: state.categories.filter((c) => c.type === 'expense') },
  { type: 'income', title: 'Ingresos', items: state.categories.filter((c) => c.type === 'income') }
].filter((g) => g.items.length))

/** Cuantos movimientos usa cada categoria: avisa antes de borrar una viva. */
const usage = computed(() => {
  const counts = {}
  for (const t of state.transactions) counts[t.categoryId] = (counts[t.categoryId] || 0) + 1
  return counts
})

const previewColor = computed(() => slotColor(editor.slot, lightMode.value))

const currencySymbol = computed(() => {
  const parts = new Intl.NumberFormat(state.settings.locale, {
    style: 'currency', currency: state.settings.currency
  }).formatToParts(0)
  return parts.find((p) => p.type === 'currency')?.value || '€'
})

const openNew = () => {
  Object.assign(editor, {
    open: true,
    id: null,
    name: '',
    type: 'expense',
    slot: nextFreeSlot(state.categories.filter((c) => c.type === 'expense')),
    icon: 'pricetag',
    budgetText: ''
  })
}

const openEdit = (c) => {
  Object.assign(editor, {
    open: true,
    id: c.id,
    name: c.name,
    type: c.type,
    slot: c.slot,
    icon: c.icon,
    budgetText: c.budget ? String(fromCents(c.budget)).replace('.', ',') : ''
  })
}

const closeEditor = () => { editor.open = false }

const save = () => {
  const budget = toCents(editor.budgetText)
  const data = {
    name: editor.name.trim(),
    type: editor.type,
    slot: editor.slot,
    icon: editor.icon,
    budget: editor.type === 'expense' && budget > 0 ? budget : null
  }
  if (editor.id) updateCategory(editor.id, data)
  else addCategory(data)
  closeEditor()
}

const askDelete = async () => {
  const used = usage.value[editor.id] || 0
  const alert = await alertController.create({
    header: '¿Eliminar la categoría?',
    message: used
      ? `Hay ${used} movimientos con esta categoría. No se borrarán: pasarán a «Sin categoría».`
      : 'No hay movimientos usándola.',
    buttons: [
      { text: 'Cancelar', role: 'cancel' },
      {
        text: 'Eliminar',
        role: 'destructive',
        handler: () => { removeCategory(editor.id); closeEditor() }
      }
    ]
  })
  await alert.present()
}
</script>

<style scoped>
.cat {
  display: flex;
  align-items: center;
  gap: 13px;
  width: 100%;
  padding: 10px 0;
  border: 0;
  background: transparent;
  text-align: left;
}
.cat__body { flex: 1; display: flex; flex-direction: column; gap: 2px; min-width: 0; }
.cat__name { font-size: 15px; font-weight: 500; color: var(--gb-text); }
.cat__meta { font-size: 12px; color: var(--gb-text-faint); }
.cat__chev { color: var(--gb-text-faint); font-size: 16px; }

.editor { padding: 14px 18px 40px; display: flex; flex-direction: column; gap: 10px; }
.preview { display: flex; align-items: center; gap: 14px; margin-bottom: 8px; }
.preview__name {
  flex: 1;
  border: 0;
  border-bottom: 1px solid var(--gb-line-strong);
  background: transparent;
  color: var(--gb-text);
  font-size: 20px;
  font-weight: 600;
  font-family: inherit;
  padding: 8px 2px;
  outline: none;
}
.preview__name::placeholder { color: var(--gb-text-faint); }

.types { display: flex; gap: 8px; }
.chip {
  border: 1px solid var(--gb-line);
  background: var(--gb-surface);
  color: var(--gb-text-dim);
  border-radius: 999px;
  padding: 8px 16px;
  font-size: 13.5px;
  font-weight: 500;
}
.chip--on { border-color: var(--gb-accent); color: var(--gb-text); background: color-mix(in srgb, var(--gb-accent) 14%, transparent); }
.chip:disabled { opacity: 0.45; }

.swatches { display: flex; flex-wrap: wrap; gap: 10px; }
.swatch {
  width: 36px;
  height: 36px;
  border-radius: 12px;
  border: 2px solid transparent;
  display: grid;
  place-items: center;
  color: #fff;
  font-size: 16px;
}
.swatch--on { border-color: var(--gb-text); }

.icons {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(46px, 1fr));
  gap: 8px;
  max-height: 210px;
  overflow-y: auto;
  padding: 2px;
}
.icons__item {
  aspect-ratio: 1;
  border-radius: 12px;
  border: 1px solid var(--gb-line);
  background: var(--gb-surface);
  color: var(--gb-text-dim);
  display: grid;
  place-items: center;
  font-size: 19px;
}
.icons__item--on { border-color: var(--gb-accent); color: var(--gb-text); background: color-mix(in srgb, var(--gb-accent) 16%, transparent); }

.budget { display: flex; align-items: center; gap: 8px; }
.budget__input {
  flex: 1;
  padding: 13px 15px;
  border-radius: 14px;
  border: 1px solid var(--gb-line);
  background: var(--gb-surface);
  color: var(--gb-text);
  font-size: 16px;
  font-family: inherit;
  outline: none;
}
.budget__cur { font-size: 16px; color: var(--gb-text-dim); }

.hint { margin: 2px 0 0; font-size: 12px; color: var(--gb-text-faint); line-height: 1.45; }
.delete { margin-top: 22px; --padding-start: 0; }
</style>
