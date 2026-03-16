<template>
  <header
    class="sticky top-0 z-50 border-b border-white/10 bg-slate-950/70 backdrop-blur-xl transition-transform duration-300 ease-out"
    :class="headerClass"
  >
    <nav class="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
      <router-link :to="authStore.isAuthenticated ? '/dashboard' : '/'" class="flex items-center">
        <img src="/crs-main.png" alt="CRS Codem System Rule" class="h-14 w-auto max-w-[180px] object-contain drop-shadow-[0_12px_32px_rgba(0,0,0,0.28)] sm:h-16 sm:max-w-[220px]" />
      </router-link>

      <div v-if="authStore.isAuthenticated" class="hidden items-center gap-2 md:flex">
        <router-link
          v-for="item in navigation"
          :key="item.route"
          :to="item.to"
          class="rounded-full px-4 py-2 text-sm transition"
          :class="isActiveRoute(item)
            ? 'bg-amber-200/12 text-amber-100 shadow-[0_10px_30px_rgba(215,183,122,0.08)]'
            : 'text-slate-400 hover:bg-white/5 hover:text-white'"
        >
          {{ item.name }}
        </router-link>
      </div>

      <div class="flex items-center gap-3">
        <button
          v-if="authStore.isAuthenticated"
          type="button"
          class="rounded-full border border-white/10 px-4 py-2 text-sm text-slate-300 transition hover:border-white/20 hover:text-white md:hidden"
          @click="toggleMobileMenu"
        >
          Menu
        </button>

        <template v-if="authStore.isAuthenticated">
          <button type="button" class="hidden text-sm text-slate-400 transition hover:text-white md:block" @click="authStore.logout">
            Logout
          </button>
        </template>
        <template v-else>
          <router-link to="/login" class="crs-button crs-button-ghost text-white">Login</router-link>
          <router-link to="/register" class="crs-button-primary">Sign Up</router-link>
        </template>
      </div>
    </nav>

    <div v-if="authStore.isAuthenticated && isMobileMenuOpen" class="border-t border-white/5 px-4 pb-4 md:hidden">
      <div class="mt-4 grid gap-2">
        <router-link
          v-for="item in navigation"
          :key="item.route"
          :to="item.to"
          class="rounded-xl px-4 py-3 text-sm transition"
          :class="isActiveRoute(item) ? 'bg-amber-200/12 text-amber-100' : 'bg-white/5 text-slate-300'"
          @click="isMobileMenuOpen = false"
        >
          {{ item.name }}
        </router-link>
        <button
          type="button"
          class="rounded-2xl bg-white/5 px-4 py-3 text-left text-sm text-slate-300"
          @click="authStore.logout(); isMobileMenuOpen = false"
        >
          Logout
        </button>
      </div>
    </div>
  </header>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { CRS_NAV_ITEMS } from '@/config/navigation'

const authStore = useAuthStore()
const route = useRoute()
const isMobileMenuOpen = ref(false)
const isMobileHeaderHidden = ref(false)
let lastScrollY = 0

const navigation = computed(() =>
  CRS_NAV_ITEMS.filter((item) => !item.adminOnly || authStore.user?.role === 'admin')
)
const headerClass = computed(() => (isMobileHeaderHidden.value ? '-translate-y-full md:translate-y-0' : 'translate-y-0'))

function isActiveRoute(item) {
  if (!item.activeRoutes?.length) {
    return route.name === item.route
  }

  return item.activeRoutes.includes(route.name)
}

function toggleMobileMenu() {
  isMobileMenuOpen.value = !isMobileMenuOpen.value
}

function handleScroll() {
  const currentScrollY = window.scrollY
  const isDesktop = window.innerWidth >= 768

  if (isDesktop) {
    isMobileHeaderHidden.value = false
    lastScrollY = currentScrollY
    return
  }

  if (isMobileMenuOpen.value) {
    isMobileHeaderHidden.value = false
    lastScrollY = currentScrollY
    return
  }

  if (currentScrollY <= 24) {
    isMobileHeaderHidden.value = false
    lastScrollY = currentScrollY
    return
  }

  const scrollingDown = currentScrollY > lastScrollY
  const scrollDelta = Math.abs(currentScrollY - lastScrollY)

  if (scrollDelta < 8) {
    return
  }

  isMobileHeaderHidden.value = scrollingDown
  lastScrollY = currentScrollY
}

watch(
  () => route.fullPath,
  () => {
    isMobileMenuOpen.value = false
    isMobileHeaderHidden.value = false
  }
)

watch(
  () => isMobileMenuOpen.value,
  (isOpen) => {
    if (isOpen) {
      isMobileHeaderHidden.value = false
    }
  }
)

onMounted(() => {
  lastScrollY = window.scrollY
  window.addEventListener('scroll', handleScroll, { passive: true })
})

onBeforeUnmount(() => {
  window.removeEventListener('scroll', handleScroll)
})
</script>
