<template>
  <ion-app>
    <ion-router-outlet />
  </ion-app>
</template>

<script setup>
import { watch, onMounted } from 'vue'
import { IonApp, IonRouterOutlet, alertController } from '@ionic/vue'
import { state } from '@/store/useStore'
import { applyTheme } from '@/theme/theme'
import { checkForUpdate, openDownloadPage } from '@/utils/updates'

watch(() => state.settings.theme, applyTheme)

async function announceUpdate (release) {
  const alert = await alertController.create({
    header: 'Hay una versión nueva',
    subHeader: `Got Bills ${release.version}`,
    message: 'Se abrirá la página de descarga en el navegador. Instálala encima: tus movimientos se mantienen.',
    buttons: [
      {
        text: 'Ahora no',
        role: 'cancel',
        // Se recuerda para no repetir el aviso en cada arranque con la misma version.
        handler: () => { state.settings.skippedVersion = release.version }
      },
      { text: 'Descargar', handler: () => openDownloadPage(release.url) }
    ]
  })
  await alert.present()
}

onMounted(async () => {
  // Se deja respirar al arranque: el aviso nunca debe retrasar la pantalla.
  setTimeout(async () => {
    const release = await checkForUpdate(state.settings)
    if (release) announceUpdate(release)
  }, 2500)
})
</script>
