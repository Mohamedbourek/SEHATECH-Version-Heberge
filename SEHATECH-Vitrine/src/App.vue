<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'
import { Icon } from '@iconify/vue'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useI18n } from 'vue-i18n'

const { t, locale } = useI18n()
gsap.registerPlugin(ScrollTrigger)

// Theme Management
const isDark = ref(false)
const toggleTheme = () => {
  isDark.value = !isDark.value
  if (isDark.value) {
    document.documentElement.classList.add('dark')
    localStorage.setItem('theme', 'dark')
  } else {
    document.documentElement.classList.remove('dark')
    localStorage.setItem('theme', 'light')
  }
}

// Language Management
const languages = [
  { code: 'fr', name: 'Français', flag: 'twemoji:flag-france' },
  { code: 'en', name: 'English', flag: 'twemoji:flag-united-kingdom' },
  { code: 'ar', name: 'العربية', flag: 'twemoji:flag-algeria' }
]

const changeLanguage = (code: string) => {
  locale.value = code
  localStorage.setItem('locale', code)
  isMenuOpen.value = false
}

// RTL Support
const isRTL = computed(() => locale.value === 'ar')

watch(locale, (newLocale) => {
  document.documentElement.dir = newLocale === 'ar' ? 'rtl' : 'ltr'
  document.documentElement.lang = newLocale
}, { immediate: true })

// Navigation Links
const navLinks = computed(() => [
  { name: t('nav.home'), href: '#hero' },
  { name: t('nav.problem'), href: '#problem' },
  { name: t('nav.solution'), href: '#solution' },
  { name: t('nav.features'), href: '#features' },
  { name: t('nav.team'), href: '#team' },
  { name: t('nav.contact'), href: '#contact' },
])

// Stats
const stats = computed(() => [
  { value: '40%', label: t('problem.stats.time'), icon: 'lucide:clock' },
  { value: '30%', label: t('problem.stats.errors'), icon: 'lucide:shield-check' },
  { value: '24/7', label: t('problem.stats.iot'), icon: 'lucide:activity' },
  { value: '100%', label: t('problem.stats.digital'), icon: 'lucide:lock' },
])

// Applications / Features
const apps = computed(() => [
  {
    name: t('apps.admin.name'),
    description: t('apps.admin.desc'),
    url: 'https://sehatech-admin.vercel.app/',
    icon: 'lucide:layout-dashboard',
    color: 'blue'
  },
  {
    name: t('apps.doctor.name'),
    description: t('apps.doctor.desc'),
    url: 'https://sehatech-medecin.vercel.app/',
    icon: 'lucide:stethoscope',
    color: 'cyan'
  },
  {
    name: t('apps.tech.name'),
    description: t('apps.tech.desc'),
    url: 'https://sehatech-tech.vercel.app/',
    icon: 'lucide:wrench',
    color: 'indigo'
  },
  {
    name: t('apps.nurse.name'),
    description: t('apps.nurse.desc'),
    url: 'https://drive.google.com/file/d/1B6handXIxrS7HzA48TnpBo75Dh4XD1c9/view',
    icon: 'lucide:users',
    color: 'emerald'
  },
])

const isMenuOpen = ref(false)
const isLangOpen = ref(false)

onMounted(() => {
  // Init theme
  const savedTheme = localStorage.getItem('theme')
  if (savedTheme === 'dark' || (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
    isDark.value = true
    document.documentElement.classList.add('dark')
  }

  // Hero Animations
  gsap.from('.hero-text', {
    y: 30,
    opacity: 0,
    duration: 1,
    stagger: 0.2,
    ease: 'power3.out'
  })

  gsap.from('.hero-image', {
    scale: 0.9,
    opacity: 0,
    duration: 1.2,
    delay: 0.5,
    ease: 'back.out(1.7)'
  })

  // Scroll Reveal
  gsap.utils.toArray('.reveal').forEach((elem: any) => {
    gsap.from(elem, {
      scrollTrigger: {
        trigger: elem,
        start: 'top 85%',
      },
      y: 40,
      opacity: 0,
      duration: 1,
      ease: 'power2.out'
    })
  })
})
</script>

<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300" :dir="isRTL ? 'rtl' : 'ltr'">
    <!-- Navbar -->
    <nav class="fixed top-0 left-0 right-0 z-50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-lg border-b border-gray-200 dark:border-gray-800 transition-colors">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between items-center h-16">
          <!-- Logo -->
          <div class="flex items-center gap-3">
            <img src="/src/assets/images/logo.png" alt="SEHATECH" class="w-8 h-8" />
            <span class="text-xl font-bold text-gray-900 dark:text-white tracking-tight">
              SEHA<span class="text-primary-500">TECH</span>
            </span>
          </div>

          <!-- Desktop Nav -->
          <div class="hidden md:flex items-center gap-8">
            <a v-for="link in navLinks" :key="link.name" :href="link.href" 
               class="text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-primary-500 dark:hover:text-primary-400 transition-colors">
              {{ link.name }}
            </a>
            
            <div class="h-6 w-px bg-gray-200 dark:bg-gray-800"></div>

            <!-- Language Switcher -->
            <div class="relative">
              <button @click="isLangOpen = !isLangOpen" class="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400 transition-colors">
                <Icon :icon="languages.find(l => l.code === locale)?.flag || 'twemoji:flag-france'" class="text-xl" />
                <span class="uppercase text-xs font-bold">{{ locale }}</span>
              </button>
              <div v-if="isLangOpen" @click="isLangOpen = false" class="fixed inset-0 z-0"></div>
              <transition enter-active-class="transition duration-100 ease-out" enter-from-class="transform scale-95 opacity-0" enter-to-class="transform scale-100 opacity-100" leave-active-class="transition duration-75 ease-in" leave-from-class="transform scale-100 opacity-100" leave-to-class="transform scale-95 opacity-0">
                <div v-if="isLangOpen" class="absolute right-0 mt-2 w-40 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-100 dark:border-gray-700 py-2 z-10">
                  <button v-for="lang in languages" :key="lang.code" @click="changeLanguage(lang.code); isLangOpen = false" class="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors" :class="{ 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400': locale === lang.code }">
                    <Icon :icon="lang.flag" class="text-lg" />
                    {{ lang.name }}
                  </button>
                </div>
              </transition>
            </div>

            <!-- Theme Toggle -->
            <button @click="toggleTheme" class="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400 transition-colors">
              <Icon :icon="isDark ? 'lucide:sun' : 'lucide:moon'" class="text-xl" />
            </button>

            <a href="https://sehatech-links.vercel.app/" target="_blank" class="btn-primary-sehatech">
              {{ t('nav.demo') }}
            </a>
          </div>

          <!-- Mobile Toggle -->
          <div class="md:hidden flex items-center gap-4">
            <button @click="toggleTheme" class="p-2 text-gray-500 dark:text-gray-400">
              <Icon :icon="isDark ? 'lucide:sun' : 'lucide:moon'" class="text-xl" />
            </button>
            <button @click="isMenuOpen = !isMenuOpen" class="text-gray-900 dark:text-white">
              <Icon :icon="isMenuOpen ? 'lucide:x' : 'lucide:menu'" class="text-2xl" />
            </button>
          </div>
        </div>
      </div>

      <!-- Mobile Menu -->
      <transition enter-active-class="transition duration-200 ease-out" enter-from-class="opacity-0 -translate-y-4" enter-to-class="opacity-100 translate-y-0" leave-active-class="transition duration-150 ease-in" leave-from-class="opacity-100 translate-y-0" leave-to-class="opacity-0 -translate-y-4">
        <div v-if="isMenuOpen" class="md:hidden bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 p-4 space-y-4 shadow-xl">
          <a v-for="link in navLinks" :key="link.name" :href="link.href" @click="isMenuOpen = false" class="block text-lg font-medium text-gray-900 dark:text-white py-2">
            {{ link.name }}
          </a>
          <div class="flex gap-4 py-2 border-t border-gray-100 dark:border-gray-800 pt-4">
             <button v-for="lang in languages" :key="lang.code" @click="changeLanguage(lang.code)" class="flex-1 flex flex-col items-center gap-2 p-3 rounded-xl border border-gray-100 dark:border-gray-800" :class="{ 'bg-primary-50 dark:bg-primary-900/20 border-primary-200 dark:border-primary-800': locale === lang.code }">
                <Icon :icon="lang.flag" class="text-2xl" />
                <span class="text-xs font-bold dark:text-white">{{ lang.name }}</span>
             </button>
          </div>
          <a href="https://sehatech-links.vercel.app/" target="_blank" class="btn-primary-sehatech w-full block text-center">{{ t('nav.demo') }}</a>
        </div>
      </transition>
    </nav>

    <!-- Hero Section -->
    <section id="hero" class="relative pt-32 pb-20 md:pt-48 md:pb-32 overflow-hidden">
      <div class="absolute inset-0 z-0">
        <div class="absolute top-0 left-1/4 w-96 h-96 bg-primary-500/10 rounded-full blur-3xl"></div>
        <div class="absolute bottom-0 right-1/4 w-96 h-96 bg-accent-500/10 rounded-full blur-3xl"></div>
      </div>

      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
        <div class="hero-text inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 text-sm font-semibold mb-6 border border-primary-100 dark:border-primary-800">
          <span class="relative flex h-2 w-2" :class="isRTL ? 'ml-2' : 'mr-2'">
            <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary-400 opacity-75"></span>
            <span class="relative inline-flex rounded-full h-2 w-2 bg-primary-500"></span>
          </span>
          {{ t('hero.badge') }}
        </div>
        <h1 class="hero-text text-5xl md:text-7xl font-extrabold text-gray-900 dark:text-white mb-6 tracking-tight leading-tight">
          {{ t('hero.title') }} <br/> <span class="bg-clip-text text-transparent bg-gradient-to-r from-primary-500 to-cyan-500">SEHATECH</span>
        </h1>
        <p class="hero-text text-xl text-gray-600 dark:text-gray-400 mb-10 max-w-3xl mx-auto leading-relaxed">
          {{ t('hero.subtitle') }}
        </p>
        <div class="hero-text flex flex-col sm:flex-row gap-4 justify-center">
          <a href="https://sehatech-links.vercel.app/" target="_blank" class="btn-primary-sehatech text-lg px-8 py-4 shadow-xl shadow-primary-500/20">
            {{ t('hero.cta_primary') }}
          </a>
          <a href="#features" class="px-8 py-4 text-lg font-semibold text-gray-900 dark:text-white bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-all">
            {{ t('hero.cta_secondary') }}
          </a>
        </div>

        <!-- Dashboard Preview -->
        <div class="hero-image mt-20 max-w-5xl mx-auto">
          <div class="relative group">
            <div class="absolute -inset-1 bg-gradient-to-r from-primary-500 to-cyan-500 rounded-[2rem] blur opacity-25 group-hover:opacity-40 transition duration-1000 group-hover:duration-200"></div>
            <div class="relative bg-white dark:bg-gray-800 rounded-[2rem] border border-gray-200 dark:border-gray-700 overflow-hidden shadow-2xl">
              <div class="flex items-center gap-2 px-4 py-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50" :dir="'ltr'">
                <div class="flex gap-1.5">
                  <div class="w-3 h-3 rounded-full bg-red-400"></div>
                  <div class="w-3 h-3 rounded-full bg-yellow-400"></div>
                  <div class="w-3 h-3 rounded-full bg-green-400"></div>
                </div>
                <div class="mx-auto text-xs text-gray-400 font-medium">sehatech-dashboard.app</div>
              </div>
              <div class="aspect-video bg-gray-100 dark:bg-gray-900 flex items-center justify-center relative">
                <Icon icon="lucide:layout" class="text-9xl text-gray-300 dark:text-gray-700 opacity-50" />
                <div class="absolute inset-0 bg-gradient-to-tr from-primary-500/5 to-transparent"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Problem Section -->
    <section id="problem" class="py-24 bg-white dark:bg-gray-900 transition-colors reveal">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="grid lg:grid-cols-2 gap-16 items-center">
          <div>
            <h2 class="text-3xl md:text-5xl font-bold text-gray-900 dark:text-white mb-8 tracking-tight">
              {{ t('problem.title') }}
            </h2>
            <p class="text-lg text-gray-600 dark:text-gray-400 mb-8 leading-relaxed">
              {{ t('problem.description') }}
            </p>
            <div class="grid sm:grid-cols-2 gap-6">
              <div v-for="stat in stats" :key="stat.label" class="p-6 bg-gray-50 dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 hover:border-primary-500 transition-all group text-start">
                <Icon :icon="stat.icon" class="text-3xl text-primary-500 mb-4 group-hover:scale-110 transition-transform" />
                <div class="text-3xl font-bold text-gray-900 dark:text-white mb-1">{{ stat.value }}</div>
                <div class="text-sm text-gray-500 dark:text-gray-400">{{ stat.label }}</div>
              </div>
            </div>
          </div>
          <div class="relative lg:order-last">
            <div class="bg-primary-500 rounded-[2.5rem] p-1 shadow-2xl shadow-primary-500/20">
              <div class="bg-gray-900 rounded-[2.3rem] overflow-hidden aspect-square flex items-center justify-center">
                <Icon icon="lucide:stethoscope" class="text-9xl text-primary-500/20 animate-pulse-slow" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Solutions Section -->
    <section id="features" class="py-24 bg-gray-50 dark:bg-gray-900/50 reveal">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center mb-16">
        <h2 class="text-3xl md:text-5xl font-bold text-gray-900 dark:text-white mb-6 tracking-tight">
          {{ t('apps.title') }}
        </h2>
        <p class="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
          {{ t('apps.subtitle') }}
        </p>
      </div>

      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          <div v-for="app in apps" :key="app.name" class="group bg-white dark:bg-gray-800 p-8 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-soft hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 text-start">
            <div class="w-14 h-14 rounded-2xl flex items-center justify-center mb-6 transition-transform group-hover:rotate-12" :class="`bg-primary-50 dark:bg-primary-900/30 text-primary-500` ">
              <Icon :icon="app.icon" class="text-2xl" />
            </div>
            <h3 class="text-xl font-bold text-gray-900 dark:text-white mb-3">{{ app.name }}</h3>
            <p class="text-gray-600 dark:text-gray-400 text-sm mb-6 leading-relaxed">
              {{ app.description }}
            </p>
            <a :href="app.url" target="_blank" class="inline-flex items-center gap-2 text-sm font-bold text-primary-500 hover:gap-3 transition-all">
              {{ t('apps.open') }}
              <Icon :icon="isRTL ? 'lucide:arrow-left' : 'lucide:arrow-right'" />
            </a>
          </div>
        </div>
      </div>
    </section>

    <!-- Team -->
    <section id="team" class="py-24 bg-white dark:bg-gray-900 reveal">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="text-center mb-16">
          <h2 class="text-3xl md:text-5xl font-bold text-gray-900 dark:text-white mb-6">{{ t('team.title') }}</h2>
          <p class="text-lg text-gray-600 dark:text-gray-400">{{ t('team.subtitle') }}</p>
        </div>
        
        <div class="flex justify-center">
          <div class="max-w-md w-full bg-gray-50 dark:bg-gray-800 p-10 rounded-[3rem] border border-gray-100 dark:border-gray-700 text-center shadow-soft">
            <div class="w-32 h-32 mx-auto mb-8 rounded-full bg-primary-500/10 flex items-center justify-center border-4 border-white dark:border-gray-700 shadow-xl overflow-hidden">
               <img src="/src/assets/images/logo.png" alt="Founder" class="w-full h-full object-contain p-4" />
            </div>
            <h3 class="text-2xl font-bold text-gray-900 dark:text-white mb-2">Fondateur SEHATECH</h3>
            <p class="text-primary-500 font-semibold mb-6">{{ t('team.role') }}</p>
            <p class="text-gray-600 dark:text-gray-400 italic mb-8">"{{ t('team.quote') }}"</p>
            <div class="flex justify-center gap-4">
              <a v-for="social in ['linkedin', 'twitter', 'github']" :key="social" href="#" class="w-12 h-12 rounded-2xl bg-white dark:bg-gray-900 flex items-center justify-center text-gray-400 hover:text-primary-500 hover:shadow-lg transition-all">
                <Icon :icon="`lucide:${social}`" class="text-xl" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Contact -->
    <section id="contact" class="py-24 bg-white dark:bg-gray-900">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="bg-gradient-to-br from-gray-900 to-primary-950 rounded-[3.5rem] p-12 md:p-24 text-center relative overflow-hidden shadow-2xl">
          <div class="absolute inset-0 z-0 opacity-20">
            <div class="absolute -top-24 -left-24 w-96 h-96 bg-primary-500 rounded-full blur-3xl"></div>
            <div class="absolute -bottom-24 -right-24 w-96 h-96 bg-accent-500 rounded-full blur-3xl"></div>
          </div>
          
          <div class="relative z-10">
            <h2 class="text-4xl md:text-6xl font-bold text-white mb-8 tracking-tight">{{ t('contact.title') }}</h2>
            <p class="text-xl text-gray-400 mb-12 max-w-2xl mx-auto">{{ t('contact.subtitle') }}</p>
            <div class="flex flex-wrap justify-center gap-8 mb-16">
              <div class="flex items-center gap-3 text-white">
                <div class="w-10 h-10 rounded-full bg-primary-500/20 flex items-center justify-center text-primary-400">
                  <Icon icon="lucide:mail" />
                </div>
                <span>contact@sehatech.com</span>
              </div>
              <div class="flex items-center gap-3 text-white">
                <div class="w-10 h-10 rounded-full bg-primary-500/20 flex items-center justify-center text-primary-400">
                  <Icon icon="lucide:phone" />
                </div>
                <span>+213 (0) XX XX XX XX</span>
              </div>
            </div>
            <a href="mailto:contact@sehatech.com" class="btn-primary-sehatech text-xl px-12 py-5 shadow-2xl shadow-primary-500/40">
              {{ t('contact.cta') }}
            </a>
          </div>
        </div>
      </div>
    </section>

    <!-- Footer -->
    <footer class="py-16 bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex flex-col md:flex-row justify-between items-center gap-8">
          <div class="flex items-center gap-3">
            <img src="/src/assets/images/logo.png" alt="SEHATECH" class="w-6 h-6" />
            <span class="text-xl font-bold text-gray-900 dark:text-white tracking-tight">SEHATECH</span>
          </div>
          <p class="text-gray-500 dark:text-gray-400">&copy; 2026 SEHATECH. {{ t('footer.copy') }}</p>
          <div class="flex gap-8">
            <a href="#" class="text-gray-400 hover:text-primary-500 transition-colors">{{ t('footer.privacy') }}</a>
            <a href="#" class="text-gray-400 hover:text-primary-500 transition-colors">{{ t('footer.legal') }}</a>
          </div>
        </div>
      </div>
    </footer>
  </div>
</template>

<style>
/* Dashboard-like Buttons */
.btn-primary-sehatech {
  @apply bg-primary-500 text-white font-bold py-2.5 px-6 rounded-xl hover:bg-primary-600 active:scale-95 transition-all duration-200 shadow-lg shadow-primary-500/20 cursor-pointer;
}

/* Scroll Smoothness */
html {
  scroll-behavior: smooth;
}

/* Animations reveal */
.reveal {
  will-change: transform, opacity;
}

/* Scrollbar Style */
::-webkit-scrollbar {
  @apply w-1.5;
}
::-webkit-scrollbar-track {
  @apply bg-transparent;
}
::-webkit-scrollbar-thumb {
  @apply bg-gray-200 dark:bg-gray-800 rounded-full hover:bg-gray-300 dark:hover:bg-gray-700;
}

/* RTL Adjustments */
[dir="rtl"] .hero-text .animate-ping {
  right: auto;
  left: 0;
}
</style>
