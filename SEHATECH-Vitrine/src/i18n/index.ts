import { createI18n } from 'vue-i18n'
import fr from './locales/fr'
import en from './locales/en'
import ar from './locales/ar'

const i18n = createI18n({
  legacy: false,
  locale: localStorage.getItem('locale') || 'fr',
  fallbackLocale: 'fr',
  messages: {
    fr,
    en,
    ar
  }
})

export default i18n
