<template>
  <ion-app>
    <ion-router-outlet />
  </ion-app>
</template>

<script setup>
import { watch } from 'vue'
import { IonApp, IonRouterOutlet } from '@ionic/vue'
import { state } from '@/store/useStore'
import { applyTheme } from '@/theme/theme'

watch(() => state.settings.theme, applyTheme)
</script>
