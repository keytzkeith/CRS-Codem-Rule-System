<template>
  <div id="app" class="crs-shell">
    <NavBar v-if="!isAuthRoute" />
    <main class="min-h-screen">
      <router-view />
    </main>

    <footer v-if="!isAuthRoute" class="border-t border-white/5 bg-slate-950/40 backdrop-blur-md">
      <div class="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-5 text-sm text-slate-500 sm:px-6 lg:px-8">
        <div class="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div class="flex items-center gap-3">
            <img
              src="/profileimgprofile.png"
              alt="Keith Odera"
              class="h-11 w-11 rounded-full border border-white/10 object-cover"
            />
            <div>
              <p class="text-slate-300">Created by Keith Odera</p>
              <p>Founder &amp; Developer of CRS, building from Kenya.</p>
            </div>
          </div>
          <div class="flex flex-wrap items-center gap-x-4 gap-y-2">
            <a
              href="mailto:codemtrader@gmail.com"
              class="inline-flex items-center gap-2 transition hover:text-white"
            >
              <EnvelopeIcon class="h-4 w-4" />
              codemtrader@gmail.com
            </a>
            <a
              href="https://keytz-portfolio.vercel.app/"
              target="_blank"
              rel="noreferrer"
              class="inline-flex items-center gap-2 transition hover:text-white"
            >
              <GlobeAltIcon class="h-4 w-4" />
              Portfolio
            </a>
            <a
              href="https://github.com/keytzkeith/CRS-Codem-Rule-System/"
              target="_blank"
              rel="noreferrer"
              class="inline-flex items-center gap-2 transition hover:text-white"
            >
              <CodeBracketIcon class="h-4 w-4" />
              GitHub
            </a>
          </div>
        </div>
        <div class="flex flex-col gap-1 text-xs text-slate-500 md:flex-row md:items-center md:justify-between">
          <p>CRS is a personal trading journal for execution review, imports, and disciplined performance tracking.</p>
          <p>&copy; {{ currentYear }} Keith Odera</p>
        </div>
      </div>
    </footer>

    <Notification />
    <ModalAlert />
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { CodeBracketIcon, EnvelopeIcon, GlobeAltIcon } from '@heroicons/vue/24/outline'
import { useRoute } from 'vue-router'
import NavBar from '@/components/layout/NavBar.vue'
import Notification from '@/components/common/Notification.vue'
import ModalAlert from '@/components/common/ModalAlert.vue'

const route = useRoute()

const isAuthRoute = computed(() => route.meta.guest)
const currentYear = new Date().getFullYear()
</script>
