<template>
  <ion-page>
    <ion-header class="ion-no-border">
      <ion-toolbar>
        <ion-title size="large">Ajustes</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content>
      <div class="page">
        <section class="card">
          <h2 class="card__title">Apariencia</h2>
          <ion-segment v-model="settings.theme" class="seg">
            <ion-segment-button value="auto"><ion-label>Automático</ion-label></ion-segment-button>
            <ion-segment-button value="light"><ion-label>Claro</ion-label></ion-segment-button>
            <ion-segment-button value="dark"><ion-label>Oscuro</ion-label></ion-segment-button>
          </ion-segment>

          <ion-item lines="none" class="opt">
            <ion-label>
              <h3>Ocultar importes</h3>
              <p>Sustituye las cifras por puntos al abrir la app</p>
            </ion-label>
            <ion-toggle v-model="settings.hideAmounts" slot="end" />
          </ion-item>

          <ion-item lines="none" class="opt">
            <ion-label>Moneda</ion-label>
            <ion-select
              v-model="settings.currency"
              slot="end"
              interface="action-sheet"
              :interface-options="{ header: 'Moneda' }"
            >
              <ion-select-option v-for="c in CURRENCIES" :key="c.code" :value="c.code">
                {{ c.label }}
              </ion-select-option>
            </ion-select>
          </ion-item>
        </section>

        <section class="card">
          <h2 class="card__title">Tu mes</h2>
          <p class="card__sub">
            Si cobras a mitad de mes, ponlo aquí: los totales, las gráficas y los
            presupuestos se calculan sobre tu mes, no sobre el del calendario.
          </p>

          <ion-item lines="none" class="opt opt--flush">
            <ion-label>El mes empieza el día</ion-label>
            <ion-select
              v-model="settings.monthStartDay"
              slot="end"
              interface="popover"
              :interface-options="{ cssClass: 'day-popover' }"
            >
              <ion-select-option v-for="d in 28" :key="d" :value="d">{{ d }}</ion-select-option>
            </ion-select>
          </ion-item>

          <p class="period">
            <ion-icon :icon="calendarOutline" />
            <span>
              <template v-if="usesCalendarMonth">
                Mes natural, del 1 al último día.
              </template>
              <template v-else>
                Tu mes en curso va del <strong>{{ currentRange }}</strong> y se llama
                <strong>{{ currentName }}</strong>.
              </template>
            </span>
          </p>
          <p class="hint">
            Cambiarlo no toca ningún movimiento: solo cambia cómo se agrupan.
          </p>
        </section>

        <section class="card card--flush">
          <h2 class="card__title" style="padding: 0 18px">Datos</h2>
          <ion-list style="background: transparent">
            <ion-item button lines="none" router-link="/categorias" class="opt">
              <ion-icon slot="start" :icon="pricetagsOutline" />
              <ion-label>
                <h3>Categorías y presupuestos</h3>
                <p>{{ categoryCount }} categorías · {{ budgetCount }} con presupuesto</p>
              </ion-label>
              <ion-icon slot="end" :icon="chevronForward" class="chev" />
            </ion-item>

            <ion-item button lines="none" class="opt" @click="exportJson">
              <ion-icon slot="start" :icon="cloudDownloadOutline" />
              <ion-label>
                <h3>Exportar copia de seguridad</h3>
                <p>Archivo JSON con todo: se puede volver a importar</p>
              </ion-label>
            </ion-item>

            <ion-item button lines="none" class="opt" @click="exportCsv">
              <ion-icon slot="start" :icon="gridOutline" />
              <ion-label>
                <h3>Exportar a CSV</h3>
                <p>Para abrirlo en Excel o Google Sheets</p>
              </ion-label>
            </ion-item>

            <ion-item button lines="none" class="opt" @click="pickFile">
              <ion-icon slot="start" :icon="cloudUploadOutline" />
              <ion-label>
                <h3>Importar copia</h3>
                <p>Reemplaza los datos actuales por los del archivo</p>
              </ion-label>
            </ion-item>

            <ion-item button lines="none" class="opt opt--danger" @click="askWipe">
              <ion-icon slot="start" :icon="trashOutline" color="danger" />
              <ion-label>
                <h3>Borrar todos los movimientos</h3>
                <p>Las categorías se mantienen</p>
              </ion-label>
            </ion-item>
          </ion-list>
        </section>

        <section class="card about">
          <h2 class="card__title">Got Bills {{ version }}</h2>
          <p>
            Tus movimientos se guardan únicamente en este dispositivo. La app no
            tiene servidor, ni cuentas, ni permiso de internet: si la desinstalas
            sin exportar antes, los datos se van con ella.
          </p>
          <p class="about__stats num">
            {{ txCount }} movimientos guardados · {{ months }} meses con datos
          </p>
        </section>
      </div>

      <input
        ref="fileEl"
        type="file"
        accept="application/json,.json"
        hidden
        @change="importJson"
      />
    </ion-content>
  </ion-page>
</template>

<script setup>
import { ref, computed } from 'vue'
import {
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonList, IonItem,
  IonLabel, IonIcon, IonToggle, IonSegment, IonSegmentButton, IonSelect,
  IonSelectOption, alertController, toastController
} from '@ionic/vue'
import {
  pricetagsOutline, cloudDownloadOutline, cloudUploadOutline, trashOutline,
  gridOutline, chevronForward, calendarOutline
} from 'ionicons/icons'
import {
  state, categoriesById, monthsWithData, clearTransactions, replaceAll,
  currentPeriod, usesCalendarMonth, rangeLabelOf
} from '@/store/useStore'
import { monthLabel } from '@/utils/dates'
import { exportJSON, parseImport } from '@/store/db'
import { saveAndShare, backupName, toCSV, readFile } from '@/utils/backup'

const CURRENCIES = [
  { code: 'EUR', label: 'Euro (€)' },
  { code: 'USD', label: 'Dólar (US$)' },
  { code: 'GBP', label: 'Libra (£)' },
  { code: 'MXN', label: 'Peso mexicano' },
  { code: 'ARS', label: 'Peso argentino' },
  { code: 'COP', label: 'Peso colombiano' },
  { code: 'CLP', label: 'Peso chileno' },
  { code: 'BRL', label: 'Real brasileño' },
  { code: 'CHF', label: 'Franco suizo' }
]

const version = __APP_VERSION__
const settings = state.settings
const fileEl = ref(null)

const txCount = computed(() => state.transactions.length)
const categoryCount = computed(() => state.categories.length)
const budgetCount = computed(() => state.categories.filter((c) => c.budget).length)
const months = computed(() => monthsWithData.value.length)
const currentRange = computed(() => rangeLabelOf(currentPeriod.value))
const currentName = computed(() => monthLabel(currentPeriod.value).toLowerCase())

const toast = async (message, color = 'success') => {
  const t = await toastController.create({ message, duration: 2600, color, position: 'bottom' })
  await t.present()
}

const exportJson = async () => {
  try {
    const res = await saveAndShare(backupName('json'), exportJSON(state), 'application/json')
    await toast(res.shared ? 'Copia exportada' : `Guardado en ${res.path}`)
  } catch (err) {
    await toast(`No se pudo exportar: ${err.message}`, 'danger')
  }
}

const exportCsv = async () => {
  try {
    const res = await saveAndShare(backupName('csv'), toCSV(state, categoriesById.value), 'text/csv')
    await toast(res.shared ? 'CSV exportado' : `Guardado en ${res.path}`)
  } catch (err) {
    await toast(`No se pudo exportar: ${err.message}`, 'danger')
  }
}

const pickFile = () => fileEl.value?.click()

const importJson = async (ev) => {
  const file = ev.target.files?.[0]
  ev.target.value = '' // permite reimportar el mismo archivo
  if (!file) return
  try {
    const data = parseImport(await readFile(file))
    // Importar pisa los datos actuales: se pide confirmacion con las cifras.
    const alert = await alertController.create({
      header: '¿Importar la copia?',
      message: `Se reemplazarán tus datos actuales (${txCount.value} movimientos) por los ${data.transactions.length} del archivo.`,
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Importar',
          handler: () => { replaceAll(data); toast('Copia importada') }
        }
      ]
    })
    await alert.present()
  } catch (err) {
    await toast(`Archivo no válido: ${err.message}`, 'danger')
  }
}

const askWipe = async () => {
  const alert = await alertController.create({
    header: '¿Borrar todos los movimientos?',
    message: 'Se eliminarán los ' + txCount.value + ' movimientos guardados. Esta acción no se puede deshacer.',
    buttons: [
      { text: 'Cancelar', role: 'cancel' },
      {
        text: 'Borrar',
        role: 'destructive',
        handler: () => { clearTransactions(); toast('Movimientos borrados') }
      }
    ]
  })
  await alert.present()
}
</script>

<style scoped>
.seg {
  --background: var(--gb-surface-2);
  border-radius: 12px;
  margin: 12px 0 4px;
}
ion-segment-button {
  --color: var(--gb-text-dim);
  --color-checked: var(--gb-text);
  --indicator-color: var(--gb-surface);
  --border-radius: 10px;
  font-size: 13px;
  text-transform: none;
  min-height: 36px;
}
.opt {
  --padding-start: 18px;
  --inner-padding-end: 18px;
  --min-height: 60px;
}
.opt h3 { font-size: 15px !important; font-weight: 500; color: var(--gb-text); }
.opt p { font-size: 12.5px !important; color: var(--gb-text-faint); }
.opt ion-icon[slot='start'] { color: var(--gb-text-dim); font-size: 20px; margin-right: 14px; }
.opt--danger h3 { color: var(--ion-color-danger); }
.chev { color: var(--gb-text-faint); font-size: 16px; }

.opt--flush { --padding-start: 0; --inner-padding-end: 0; }
.period {
  display: flex;
  gap: 9px;
  margin: 12px 0 0;
  padding: 12px 14px;
  border-radius: var(--gb-radius-sm);
  background: var(--gb-surface-2);
  font-size: 13px;
  line-height: 1.5;
  color: var(--gb-text-dim);
}
.period ion-icon { font-size: 17px; flex: 0 0 auto; margin-top: 1px; color: var(--gb-accent); }
.period strong { color: var(--gb-text); font-weight: 600; }
.hint { margin: 8px 2px 0; font-size: 12px; color: var(--gb-text-faint); line-height: 1.45; }

.about p { font-size: 13px; line-height: 1.55; color: var(--gb-text-dim); margin: 10px 0 0; }
.about__stats { color: var(--gb-text-faint) !important; font-size: 12px !important; }
</style>
