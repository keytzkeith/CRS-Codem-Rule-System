<template>
  <div class="crs-page space-y-8">
    <section class="crs-hero">
      <SectionHeader
        eyebrow="Admin center"
        title="Control the CRS environment from one place."
        description="Use this page to review approvals, check system activity, and jump straight into user or backup management."
      >
        <div class="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
          <router-link to="/admin/users" class="crs-button crs-button-ghost w-full sm:w-auto">
            Manage users
          </router-link>
          <router-link to="/admin/backups" class="crs-button crs-button-ghost w-full sm:w-auto">
            Backups
          </router-link>
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
      <MetricCard label="Trades imported" :value="formatNumber(summary.tradesImported || 0)" hint="CRS import volume" />
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
            <div class="flex items-start justify-between gap-4">
              <div>
                <p class="crs-eyebrow">Registration flow</p>
                <p class="mt-2 text-2xl font-semibold text-white">{{ registrationMode }}</p>
              </div>
              <span class="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs text-slate-300">
                {{ registrationOverrideActive ? 'Dashboard override' : 'Env default' }}
              </span>
            </div>
            <p class="mt-2 text-sm text-slate-400">Switch how new users enter CRS without touching backend env values manually.</p>
            <div class="mt-4 grid gap-2 sm:grid-cols-3">
              <button
                v-for="mode in registrationModes"
                :key="mode.value"
                type="button"
                class="rounded-[16px] border px-3 py-3 text-left text-sm transition"
                :class="mode.value === registrationModeValue
                  ? 'border-amber-200/30 bg-amber-200/10 text-white'
                  : 'border-white/8 bg-white/[0.03] text-slate-300 hover:border-amber-200/20 hover:bg-white/[0.05]'"
                :disabled="registrationLoading"
                @click="updateRegistrationMode(mode.value)"
              >
                <span class="block font-medium">{{ mode.label }}</span>
                <span class="mt-1 block text-xs leading-5 text-slate-400">{{ mode.description }}</span>
              </button>
            </div>
          </div>
          <div class="rounded-[22px] border border-white/8 bg-white/[0.03] p-5">
            <p class="crs-eyebrow">Period window</p>
            <p class="mt-2 text-2xl font-semibold text-white">{{ periodLabel }}</p>
            <p class="mt-2 text-sm text-slate-400">Analytics window for the figures shown on this page.</p>
          </div>
          <div class="rounded-[22px] border border-emerald-400/15 bg-emerald-400/5 p-5">
            <p class="crs-eyebrow">Approval health</p>
            <p class="mt-2 text-3xl font-semibold text-white">{{ pendingApprovals }}</p>
            <p class="mt-2 text-sm text-slate-300">Accounts still waiting for approval. If this grows, it usually means onboarding review is lagging.</p>
          </div>
          <div class="rounded-[22px] border border-sky-400/15 bg-sky-400/5 p-5">
            <p class="crs-eyebrow">Verification health</p>
            <p class="mt-2 text-3xl font-semibold text-white">{{ formatNumber(unverifiedUsers) }}</p>
            <p class="mt-2 text-sm text-slate-300">Users who registered but have not completed email verification.</p>
          </div>
          <div class="rounded-[22px] border border-amber-400/15 bg-amber-400/5 p-5 md:col-span-2">
            <div class="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p class="crs-eyebrow">Data controls</p>
                <p class="mt-2 text-2xl font-semibold text-white">Operate the CRS ledger directly</p>
                <p class="mt-2 text-sm text-slate-300">Jump into user approvals, backups, and trade import review without moving through old TradeTally-style admin pages.</p>
              </div>
              <div class="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
                <router-link to="/admin/users" class="crs-button-primary w-full sm:w-auto">
                  Manage users
                </router-link>
                <router-link to="/admin/backups" class="crs-button crs-button-ghost w-full sm:w-auto">
                  Open backups
                </router-link>
                <router-link to="/trades/import" class="crs-button crs-button-ghost w-full sm:w-auto">
                  Review imports
                </router-link>
              </div>
            </div>
          </div>
        </div>
      </ChartCard>

      <ChartCard
        eyebrow="Quick actions"
        title="The controls that matter most day to day"
        description="Use the dashboard for quick approvals and status checks, then move into the deeper admin pages when needed."
      >
        <div class="grid gap-3 sm:grid-cols-2">
          <router-link to="/admin/users" class="rounded-[20px] border border-white/8 bg-white/[0.03] p-4 transition hover:border-amber-200/20 hover:bg-white/[0.05]">
            <p class="text-sm font-medium text-white">User management</p>
            <p class="mt-2 text-sm leading-6 text-slate-400">Approve users, verify accounts, change roles, and manage status.</p>
          </router-link>
          <router-link to="/admin/backups" class="rounded-[20px] border border-white/8 bg-white/[0.03] p-4 transition hover:border-amber-200/20 hover:bg-white/[0.05]">
            <p class="text-sm font-medium text-white">Backup management</p>
            <p class="mt-2 text-sm leading-6 text-slate-400">Create, download, restore, and prune full-site backups.</p>
          </router-link>
          <button type="button" class="rounded-[20px] border border-white/8 bg-white/[0.03] p-4 text-left transition hover:border-amber-200/20 hover:bg-white/[0.05]" :disabled="loading" @click="fetchAdminData">
            <p class="text-sm font-medium text-white">Refresh analytics</p>
            <p class="mt-2 text-sm leading-6 text-slate-400">Pull the latest summary data if you need to confirm activity after an import or admin action.</p>
          </button>
          <button type="button" class="rounded-[20px] border border-white/8 bg-white/[0.03] p-4 text-left transition hover:border-amber-200/20 hover:bg-white/[0.05]" :disabled="loading || !pendingUsers.length" @click="approveAllPending">
            <p class="text-sm font-medium text-white">Approve all pending</p>
            <p class="mt-2 text-sm leading-6 text-slate-400">Batch-approve every pending user currently visible on the dashboard.</p>
          </button>
        </div>
      </ChartCard>
    </div>

    <ChartCard
      eyebrow="Pending approvals"
      title="Users waiting for access"
      description="Approve accounts from the dashboard when you do not need the full user-management screen."
    >
      <div v-if="pendingUsers.length" class="space-y-3">
        <div
          v-for="user in pendingUsers"
          :key="user.id"
          class="flex flex-col gap-3 rounded-[20px] border border-white/8 bg-white/[0.03] p-4 lg:flex-row lg:items-center lg:justify-between"
        >
          <div class="min-w-0">
            <p class="truncate text-sm font-medium text-white">{{ user.full_name || user.fullName || user.username || user.email }}</p>
            <p class="truncate text-sm text-slate-400">{{ user.email }}</p>
            <p class="mt-1 text-xs text-slate-500">
              Joined {{ formatDate(user.created_at || user.createdAt) }}
            </p>
          </div>
          <div class="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
            <button
              type="button"
              class="crs-button-primary w-full sm:w-auto"
              :disabled="approvalLoading[user.id]"
              @click="approveUser(user)"
            >
              {{ approvalLoading[user.id] ? 'Approving...' : 'Approve user' }}
            </button>
            <router-link to="/admin/users" class="crs-button crs-button-ghost w-full sm:w-auto">
              Open full user page
            </router-link>
          </div>
        </div>
      </div>
      <div v-else class="rounded-[20px] border border-white/8 bg-white/[0.03] px-5 py-6 text-sm text-slate-400">
        No pending users right now.
      </div>
    </ChartCard>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
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
const pendingUsers = ref([])
const approvalLoading = reactive({})
const registrationLoading = ref(false)

const registrationModes = [
  { value: 'open', label: 'Open', description: 'Allow signups immediately.' },
  { value: 'approval', label: 'Approval', description: 'Require admin approval before access.' },
  { value: 'disabled', label: 'Disabled', description: 'Block new registrations entirely.' }
]

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
const registrationModeValue = computed(() => registrationConfig.value.registrationMode || registrationConfig.value.mode || 'open')
const registrationOverrideActive = computed(() => Boolean(registrationConfig.value.overrideActive))

onMounted(fetchAdminData)

async function fetchAdminData() {
  loading.value = true
  error.value = ''

  try {
    const [summaryResponse, usersResponse, authConfigResponse, pendingUsersResponse] = await Promise.all([
      api.get('/admin/analytics/summary', { params: { period: period.value } }),
      api.get('/users/admin/statistics'),
      api.get('/settings/admin/registration'),
      api.get('/users/admin/users/pending')
    ])

    summary.value = summaryResponse.data?.summary || {}
    userStats.value = usersResponse.data || {}
    registrationConfig.value = authConfigResponse.data || {}
    pendingUsers.value = pendingUsersResponse.data?.users || pendingUsersResponse.data || []
  } catch (requestError) {
    error.value = requestError?.response?.data?.error || 'Unable to load the admin dashboard right now.'
  } finally {
    loading.value = false
  }
}

function formatNumber(value) {
  return new Intl.NumberFormat('en-US').format(Number(value || 0))
}

function formatDate(value) {
  if (!value) return 'recently'

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'recently'

  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  }).format(date)
}

async function approveUser(user) {
  approvalLoading[user.id] = true

  try {
    await api.post(`/users/admin/users/${user.id}/approve`)
    pendingUsers.value = pendingUsers.value.filter((entry) => entry.id !== user.id)
    await fetchAdminData()
  } catch (requestError) {
    error.value = requestError?.response?.data?.error || 'Failed to approve that user.'
  } finally {
    approvalLoading[user.id] = false
  }
}

async function approveAllPending() {
  if (!pendingUsers.value.length) return

  loading.value = true
  error.value = ''

  try {
    for (const user of pendingUsers.value) {
      await api.post(`/users/admin/users/${user.id}/approve`)
    }
    await fetchAdminData()
  } catch (requestError) {
    error.value = requestError?.response?.data?.error || 'Failed while approving pending users.'
  } finally {
    loading.value = false
  }
}

async function updateRegistrationMode(mode) {
  if (mode === registrationModeValue.value) return

  registrationLoading.value = true
  error.value = ''

  try {
    const response = await api.put('/settings/admin/registration', { registrationMode: mode })
    registrationConfig.value = response.data || { registrationMode: mode, overrideActive: true }
  } catch (requestError) {
    error.value = requestError?.response?.data?.error || 'Failed to update registration mode.'
  } finally {
    registrationLoading.value = false
  }
}
</script>
