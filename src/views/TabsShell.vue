<template>
  <ion-page>
    <ion-tabs>
      <ion-router-outlet />

      <ion-tab-bar slot="bottom">
        <ion-tab-button tab="dashboard" href="/resumen">
          <ion-icon :icon="pieChartOutline" />
          <ion-label>Resumen</ion-label>
        </ion-tab-button>
        <ion-tab-button tab="transactions" href="/movimientos">
          <ion-icon :icon="listOutline" />
          <ion-label>Movimientos</ion-label>
        </ion-tab-button>
        <ion-tab-button tab="stats" href="/analisis">
          <ion-icon :icon="statsChartOutline" />
          <ion-label>Análisis</ion-label>
        </ion-tab-button>
        <ion-tab-button tab="settings" href="/ajustes">
          <ion-icon :icon="settingsOutline" />
          <ion-label>Ajustes</ion-label>
        </ion-tab-button>
      </ion-tab-bar>
    </ion-tabs>

    <TransactionSheet
      :open="sheet.open"
      :transaction="sheet.transaction"
      :default-date="sheet.defaultDate"
      @close="closeSheet"
      @save="saveFromSheet"
      @delete="deleteFromSheet"
    />
  </ion-page>
</template>

<script setup>
import {
  IonPage, IonTabs, IonTabBar, IonTabButton, IonRouterOutlet, IonIcon, IonLabel
} from '@ionic/vue'
import {
  pieChartOutline, listOutline, statsChartOutline, settingsOutline
} from 'ionicons/icons'
import TransactionSheet from '@/components/TransactionSheet.vue'
import { sheet, closeSheet, saveFromSheet, deleteFromSheet } from '@/store/sheet'
</script>

<style scoped>
ion-tab-button { --color-selected: var(--gb-text); font-weight: 600; }
ion-tab-button ion-label { font-size: 11px; }
</style>
