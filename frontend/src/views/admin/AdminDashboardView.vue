<template>
  <div class="crs-page space-y-8">
    <section class="crs-hero">
      <SectionHeader
        eyebrow="Admin command"
        title="Platform oversight without the old clutter."
        description="A lean CRS admin surface for approvals, growth, and operational pulse. It focuses on what matters instead of dumping every legacy control on one page."
      >
        <div class="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
          <select v-model="period" class="crs-input min-w-[132px]" @change="fetchAdminData">
            <option v-for="option in periodOptions" :key="option.value" :value="option.value">{{ option.label }}</option>
          </select>
          <button type="button" class="crs-button-primary w-full sm:w-auto" :disabled="loading" @click="fetchAdminData">
            {{ loading ? 'Refreshing...' : 'Refresh' }}
          </button>
        </div>
      </SectionHeader>
    </section>

    <div v-if="error" class="rounded-[20px] border border-red-500/30 bg-red-500/10 px-5 py-4 text-sm text-red-100">
      {{ error }}
    </div>

    <section class="crs-stat-grid">
      <MetricCard label="Total users" :value="formatNumber(userStats.total_users || 0)" hint="Registered accounts" />
      <MetricCard label="Approved users" :value="formatNumber(userStats.approved_users || 0)" hint="Can sign in" tone="positive" />
      <MetricCard label="Pending approval" :value="formatNumber(pendingApprovals)" hint="Needs review" tone="warning" />
      <MetricCard label="Admin users" :value="formatNumber(userStats.admin_users || 0)" hint="Operational access" />
      <MetricCard label="New signups" :value="formatNumber(summary.newSignups || 0)" :hint="periodLabel" tone="positive" />
      <MetricCard label="Active today" :value="formatNumber(summary.activeToday || 0)" hint="Platform activity" />
      <MetricCard label="Trades imported" :value="formatNumber(summary.tradesImported || 0)" hint="Legacy pipeline volume" />
      <MetricCard label="API calls" :value="formatNumber(summary.apiCalls || 0)" :hint="periodLabel" />
      <MetricCard label="Self deletions" :value="formatNumber(summary.selfDeletions || 0)" hint="User churn" tone="negative" />
      <MetricCard label="Admin deletions" :value="formatNumber(summary.adminDeletions || 0)" hint="Moderation actions" tone="negative" />
    </section>

    <div class="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
      <ChartCard
        eyebrow="Operational pulse"
        title="Admin snapshot"
        description="A condensed read on what changed over the selected period."
      >
        <div class="grid gap-4 md:grid-cols-2">
          <div class="rounded-[22px] border border-white/8 bg-white/[0.03] p-5">
            <p class="crs-eyebrow">Registration flow</p>
            <p class="mt-2 text-2xl font-semibold text-white">{{ registrationMode }}</p>
            <p class="mt-2 text-sm text-slate-400">Configured from the live auth endpoint. Useful when signups are unexpectedly blocked or approvals are required.</p>
          </div>
          <div class="rounded-[22px] border border-white/8 bg-white/[0.03] p-5">
            <p class="crs-eyebrow">Period window</p>
            <p class="mt-2 text-2xl font-semibold text-white">{{ periodLabel }}</p>
            <p class="mt-2 text-sm text-slate-400">Admin analytics summary for the active review window.</p>
          </div>
          <div class="rounded-[22px] border border-emerald-400/15 bg-emerald-400/5 p-5">
            <p class="crs-eyebrow">Approval health</p>
            <p class="mt-2 text-3xl font-semibold text-white">{{ pendingApprovals }}</p>
            <p class="mt-2 text-sm text-slate-300">Accounts still waiting for approval. This should stay low if onboarding is being reviewed consistently.</p>
          </div>
          <div class="rounded-[22px] border border-sky-400/15 bg-sky-400/5 p-5">
            <p class="crs-eyebrow">Verification health</p>
            <p class="mt-2 text-3xl font-semibold text-white">{{ formatNumber(unverifiedUsers) }}</p>
            <p class="mt-2 text-sm text-slate-300">Users who registered but still have not completed email verification.</p>
          </div>
        </div>
      </ChartCard>

      <ChartCard
        eyebrow="Admin notes"
        title="What this page is for"
        description="This is intentionally narrow. It gives you quick operational visibility without pulling you back into the old platform sprawl."
      >
        <div class="space-y-4 text-sm leading-7 text-slate-300">
          <p><span class="text-amber-200">User counts</span> help you keep track of approvals, active users, and whether the registration funnel is moving.</p>
          <p><span class="text-amber-200">Activity metrics</span> show whether the system is being used or whether something broke after a deployment.</p>
          <p><span class="text-amber-200">Admin actions</span> give you a clean signal on moderation or cleanup instead of burying it in the old screens.</p>
        </div>
      </ChartCard>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import api from '@/services/api'
import ChartCard from '@/components/crs/ChartCard.vue'
import MetricCard from '@/components/crs/MetricCard.vue'
import SectionHeader from '@/components/crs/SectionHeader.vue'

const loading = ref(false)
const error = ref('')
const period = ref('30d')
const summary = ref({})
const userStats = ref({})
const registrationConfig = ref({})

const periodOptions = [
  { value: 'today', label: 'Today' },
  { value: '7d', label: '7 days' },
  { value: '30d', label: '30 days' },
  { value: '90d', label: '90 days' },
  { value: 'all', label: 'All time' }
]

const periodLabel = computed(() => periodOptions.find((option) => option.value === period.value)?.label || '30 days')
const pendingApprovals = computed(() => {
  const totalUsers = Number(userStats.value.total_users || 0)
  const approvedUsers = Number(userStats.value.approved_users || 0)
  return Math.max(0, totalUsers - approvedUsers)
})
const unverifiedUsers = computed(() => {
  const totalUsers = Number(userStats.value.total_users || 0)
  const verifiedUsers = Number(userStats.value.verified_users || 0)
  return Math.max(0, totalUsers - verifiedUsers)
})
const registrationMode = computed(() => {
  const mode = registrationConfig.value.registrationMode || registrationConfig.value.mode || 'open'
  return mode.charAt(0).toUpperCase() + mode.slice(1)
})

onMounted(fetchAdminData)

async function fetchAdminData() {
  loading.value = true
  error.value = ''

  try {
    const [summaryResponse, usersResponse, authConfigResponse] = await Promise.all([
      api.get('/admin/analytics/summary', { params: { period: period.value } }),
      api.get('/users/admin/statistics'),
      api.get('/auth/config')
    ])

    summary.value = summaryResponse.data?.summary || {}
    userStats.value = usersResponse.data || {}
    registrationConfig.value = authConfigResponse.data || {}
  } catch (requestError) {
    error.value = requestError?.response?.data?.error || 'Unable to load the admin dashboard right now.'
  } finally {
    loading.value = false
  }
}

function formatNumber(value) {
  return new Intl.NumberFormat('en-US').format(Number(value || 0))
}
</script>
