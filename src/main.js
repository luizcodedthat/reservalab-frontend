import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import pinia from '@/stores'
import './assets/styles/main.css'
import './assets/styles/ui.css'
import './composables/useValidators.js'
import { useAuthStore } from './stores/useAuthStore'

const app = createApp(App)
app.use(router)
app.use(pinia)

const auth = useAuthStore()
auth.init().then(() => {
  app.mount('#app')
})
