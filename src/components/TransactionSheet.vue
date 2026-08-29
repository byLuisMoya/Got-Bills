<template>
  <ion-modal :is-open="open" @did-dismiss="close" @did-present="focusAmount">
    <ion-header class="ion-no-border">
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-button aria-label="Cancelar" @click="close">
            <ion-icon slot="icon-only" :icon="closeOutline" />
          </ion-button>
        </ion-buttons>
        <ion-title>{{ editing ? 'Editar movimiento' : 'Nuevo movimiento' }}</ion-title>
        <ion-buttons slot="end">
          <ion-button :strong="true" :disabled="!canSave" @click="submit">Guardar</ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content>
      <div class="sheet">
        <!-- Tipo: decide el signo y la lista de categorias, asi que va primero. -->
        <div class="types">
          <button
            v-for="t in TYPES"
            :key="t.value"
            class="types__btn"
            :class="{ 'types__btn--on': form.type === t.value, [`types__btn--${t.value}`]: form.type === t.value }"
            @click="setType(t.value)"
          >
            <ion-icon :icon="t.icon" />
            {{ t.label }}
          </button>
        </div>

        <div class="amount" :class="form.type === 'income' ? 'amount--in' : 'amount--out'">
          <span class="amount__sign">{{ form.type === 'income' ? '+' : '−' }}</span>
          <input
            ref="amountEl"
            v-model="form.amountText"
            class="amount__input"
            type="text"
            inputmode="decimal"
            placeholder="0,00"
            enterkeyhint="done"
            :size="inputSize"
            @input="sanitize"
          />
          <span class="amount__cur">{{ currencySymbol }}</span>
        </div>

        <p class="section-title">Categoría</p>
        <div class="cats">
          <button
            v-for="c in categories"
            :key="c.id"
            class="cats__item"
            :class="{ 'cats__item--on': form.categoryId === c.id }"
            :style="form.categoryId === c.id ? { borderColor: catColor(c), background: catColor(c) + '1f' } : null"
            @click="form.categoryId = c.id"
          >
            <ion-icon :icon="iconFor(c.icon)" :style="{ color: catColor(c) }" />
            <span>{{ c.name }}</span>
          </button>
          <button class="cats__item cats__item--ghost" @click="goCategories">
            <ion-icon :icon="addOutline" />
            <span>Gestionar</span>
          </button>
        </div>

        <p class="section-title">Fecha</p>
        <div class="dates">
          <button
            v-for="q in quickDates"
            :key="q.value"
            class="chip"
            :class="{ 'chip--on': form.date === q.value }"
            @click="form.date = q.value"
          >{{ q.label }}</button>
          <button class="chip" :class="{ 'chip--on': isCustomDate }" @click="pickerOpen = true">
            <ion-icon :icon="calendarOutline" />
            {{ isCustomDate ? dayLabel(form.date) : 'Otra' }}
          </button>
        </div>

        <p class="section-title">Nota</p>
        <input
          v-model="form.note"
          class="note"
          type="text"
          maxlength="80"
          placeholder="Opcional — p. ej. «cena con Marta»"
        />

        <ion-button
          v-if="editing"
          expand="block"
          fill="clear"
          color="danger"
          class="delete"
          @click="askDelete"
        >
          <ion-icon slot="start" :icon="trashOutline" />
          Eliminar movimiento
        </ion-button>
      </div>
    </ion-content>

    <ion-modal :is-open="pickerOpen" class="date-modal" @did-dismiss="pickerOpen = false">
      <ion-datetime
        presentation="date"
        locale="es-ES"
        :value="form.date"
        :max="today"
        :first-day-of-week="1"
        show-default-buttons
        done-text="Listo"
        cancel-text="Cancelar"
        @ion-change="onDatePicked"
      />
    </ion-modal>
  </ion-modal>
</template>

<script setup>
import { ref, reactive, computed, watch, nextTick } from 'vue'
import {
  IonModal, IonHeader, IonToolbar, IonTitle, IonButtons, IonButton,
  IonContent, IonIcon, IonDatetime, alertController
} from '@ionic/vue'
import {
  trendingDownOutline, trendingUpOutline, addOutline, calendarOutline,
  trashOutline, closeOutline
} from 'ionicons/icons'
import { useRouter } from 'vue-router'
import { iconFor } from '@/utils/icons'
import { toCents, fromCents } from '@/utils/format'
import { todayISO, dayLabel, toISO } from '@/utils/dates'
import { activeCategories, catColor, state } from '@/store/useStore'

const props = defineProps({
  open: Boolean,
  transaction: { type: Object, default: null },
  defaultDate: { type: String, default: '' }
})
const emit = defineEmits(['close', 'save', 'delete'])

const TYPES = [
  { value: 'expense', label: 'Gasto', icon: trendingDownOutline },
  { value: 'income', label: 'Ingreso', icon: trendingUpOutline }
]

const router = useRouter()
const amountEl = ref(null)
const pickerOpen = ref(false)
const today = todayISO()

const form = reactive({ type: 'expense', amountText: '', categoryId: null, date: today, note: '' })

const editing = computed(() => !!props.transaction)
const categories = computed(() => activeCategories(form.type))
const canSave = computed(() => toCents(form.amountText) > 0 && !!form.categoryId)

const currencySymbol = computed(() => {
  const parts = new Intl.NumberFormat(state.settings.locale, {
    style: 'currency', currency: state.settings.currency
  }).formatToParts(0)
  return parts.find((p) => p.type === 'currency')?.value || '€'
})

const quickDates = computed(() => [
  { label: 'Hoy', value: today },
  { label: 'Ayer', value: toISO(new Date(Date.now() - 86400000)) }
])
const isCustomDate = computed(() => !quickDates.value.some((q) => q.value === form.date))

// El input crece con lo tecleado para que el simbolo de moneda quede pegado a
// la cifra en vez de irse al borde de la pantalla.
const inputSize = computed(() => Math.max(4, Math.min(12, form.amountText.length || 4)))

// Solo digitos y un separador decimal: evita que un pegado raro guarde NaN.
const sanitize = () => {
  form.amountText = form.amountText
    .replace(/[^\d.,]/g, '')
    .replace(/[.,]/g, (m, i, s) => (s.indexOf(m) === i ? ',' : ''))
    .slice(0, 12)
}

const setType = (type) => {
  if (form.type === type) return
  form.type = type
  // La categoria pertenece a un tipo: al cambiar de tipo deja de ser valida.
  form.categoryId = categories.value[0]?.id ?? null
}

watch(() => props.open, (open) => {
  if (!open) return
  const tx = props.transaction
  form.type = tx?.type || 'expense'
  form.amountText = tx ? String(fromCents(tx.amount)).replace('.', ',') : ''
  form.date = tx?.date || props.defaultDate || today
  form.note = tx?.note || ''
  form.categoryId = tx?.categoryId || activeCategories(form.type)[0]?.id || null
})

const focusAmount = async () => {
  if (editing.value) return
  await nextTick()
  amountEl.value?.focus()
}

const onDatePicked = (ev) => {
  const v = ev.detail.value
  if (v) form.date = String(v).slice(0, 10)
}

const close = () => emit('close')

const submit = () => {
  if (!canSave.value) return
  emit('save', {
    type: form.type,
    amount: toCents(form.amountText),
    categoryId: form.categoryId,
    date: form.date,
    note: form.note.trim()
  })
}

const askDelete = async () => {
  const alert = await alertController.create({
    header: '¿Eliminar el movimiento?',
    message: 'Esta acción no se puede deshacer.',
    buttons: [
      { text: 'Cancelar', role: 'cancel' },
      { text: 'Eliminar', role: 'destructive', handler: () => emit('delete', props.transaction) }
    ]
  })
  await alert.present()
}

const goCategories = () => {
  emit('close')
  router.push('/categorias')
}
</script>

<style scoped>
.sheet { padding: 8px 18px 40px; display: flex; flex-direction: column; gap: 10px; }

.types { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 6px; }
.types__btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 12px;
  border-radius: 14px;
  border: 1px solid var(--gb-line);
  background: var(--gb-surface);
  color: var(--gb-text-dim);
  font-size: 14px;
  font-weight: 600;
}
.types__btn ion-icon { font-size: 17px; }
.types__btn--expense { border-color: var(--gb-expense); background: var(--gb-expense-soft); color: var(--gb-expense); }
.types__btn--income { border-color: var(--gb-income); background: var(--gb-income-soft); color: var(--gb-income); }

.amount {
  display: flex;
  align-items: baseline;
  justify-content: center;
  gap: 4px;
  padding: 18px 12px 22px;
}
.amount__sign { font-size: 30px; font-weight: 600; opacity: 0.7; }
.amount__input {
  width: auto;
  min-width: 0;
  border: 0;
  background: transparent;
  outline: none;
  text-align: center;
  font-size: 46px;
  font-weight: 700;
  letter-spacing: -0.035em;
  color: inherit;
  font-family: inherit;
}
.amount__input::placeholder { color: var(--gb-text-faint); opacity: 0.5; }
.amount__cur { font-size: 26px; font-weight: 600; opacity: 0.7; }
.amount--in { color: var(--gb-income); }
.amount--out { color: var(--gb-expense); }

.cats { display: flex; flex-wrap: wrap; gap: 8px; }
.cats__item {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  padding: 9px 13px;
  border-radius: 999px;
  border: 1px solid var(--gb-line);
  background: var(--gb-surface);
  color: var(--gb-text-dim);
  font-size: 13.5px;
  font-weight: 500;
}
.cats__item ion-icon { font-size: 16px; }
.cats__item--on { color: var(--gb-text); font-weight: 600; }
.cats__item--ghost { border-style: dashed; color: var(--gb-text-faint); }

.dates { display: flex; flex-wrap: wrap; gap: 8px; }
.chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 9px 14px;
  border-radius: 999px;
  border: 1px solid var(--gb-line);
  background: var(--gb-surface);
  color: var(--gb-text-dim);
  font-size: 13.5px;
  font-weight: 500;
}
.chip--on { border-color: var(--gb-accent); background: color-mix(in srgb, var(--gb-accent) 14%, transparent); color: var(--gb-text); }

.note {
  width: 100%;
  padding: 13px 15px;
  border-radius: 14px;
  border: 1px solid var(--gb-line);
  background: var(--gb-surface);
  color: var(--gb-text);
  font-size: 14.5px;
  font-family: inherit;
  outline: none;
}
.note::placeholder { color: var(--gb-text-faint); }

.delete { margin-top: 18px; --padding-start: 0; }
</style>

<style>
.date-modal { --width: 340px; --height: 420px; --border-radius: 20px; }
</style>
