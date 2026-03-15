<template>
  <div id="app" class="crs-shell">
    <NavBar v-if="!isAuthRoute" />
    <main class="min-h-screen">
      <router-view />
    </main>

    <footer v-if="!isAuthRoute" class="border-t border-white/5 bg-slate-950/40 backdrop-blur-md">
      <div class="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-5 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
        <p>Your CRS rule system</p>
        <p>Personal trade review built around discipline, structure, and clean execution.</p>
      </div>
    </footer>

    <Notification />
    <ModalAlert />
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import NavBar from '@/components/layout/NavBar.vue'
import Notification from '@/components/common/Notification.vue'
import ModalAlert from '@/components/common/ModalAlert.vue'

const route = useRoute()

const isAuthRoute = computed(() => route.meta.guest)
</script>
