import { createApp } from 'vue'
import { IonicVue } from '@ionic/vue'
import App from './App.vue'
import router from './router'
import { applyTheme, onSystemThemeChange } from './theme/theme'

import '@ionic/vue/css/core.css'
import '@ionic/vue/css/normalize.css'
import '@ionic/vue/css/structure.css'
import '@ionic/vue/css/typography.css'
import '@ionic/vue/css/padding.css'
import '@ionic/vue/css/flex-utils.css'

import './theme/variables.css'
import './theme/app.css'

applyTheme()
onSystemThemeChange(applyTheme)

const app = createApp(App).use(IonicVue, { mode: 'md', animated: true }).use(router)

router.isReady().then(() => app.mount('#app'))
