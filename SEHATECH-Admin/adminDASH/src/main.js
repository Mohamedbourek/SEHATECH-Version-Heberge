import { createApp } from 'vue'
import { createPinia } from 'pinia'
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate'
import Toast from 'vue-toastification'
import 'vue-toastification/dist/index.css'
import App from './App.vue'
import router from './router'
import './assets/main.css'
import { vClickOutside } from './directives/click-outside'

const pinia = createPinia()
pinia.use(piniaPluginPersistedstate)

const app = createApp(App)
app.use(pinia)
app.use(router)
app.directive('click-outside', vClickOutside)
app.use(Toast, {
  position: 'bottom-right',
  timeout: 5000,
  closeOnClick: true,
  pauseOnFocusLoss: true,
  pauseOnHover: true,
  draggable: true,
  draggablePercent: 0.6,
  showCloseButtonOnHover: false,
  hideProgressBar: true,
  closeButton: 'button',
  icon: true,
  rtl: false
})

// Initialiser le store d'authentification et vérifier l'authentification
import { useAuthStore } from './stores/auth'
const authStore = useAuthStore(pinia)

// Gestionnaire d'erreurs global
app.config.errorHandler = (err, vm, info) => {
  console.error('Vue Error:', err)
  console.error('Info:', info)
}

window.onerror = function(message, source, lineno, colno, error) {
  console.error('Global Error:', {message, source, lineno, colno, error})
}

app.mount('#app')