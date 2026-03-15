<template>
  <div class="min-h-screen bg-[radial-gradient(circle_at_top,rgba(215,183,122,0.12),transparent_0_24%),linear-gradient(180deg,#07111f_0%,#050c17_100%)] px-4 py-10 sm:px-6 lg:px-8">
    <div class="mx-auto grid min-h-[calc(100vh-5rem)] max-w-6xl items-center gap-8 lg:grid-cols-[1.05fr_0.95fr]">
      <section class="hidden rounded-[32px] border border-white/10 bg-white/[0.03] p-8 text-slate-200 shadow-[0_30px_90px_rgba(2,8,18,0.45)] lg:block">
        <img src="/crs-main.png" alt="CRS Codem System Rule" class="h-24 w-auto max-w-[260px] object-contain" />
        <h1 class="mt-4 text-5xl font-semibold tracking-[-0.05em] text-white">Sign in and review the tape with intent.</h1>
        <p class="mt-5 max-w-xl text-base leading-8 text-slate-300">
          Your rule system stays focused: record trades, review execution, study discipline, and cut the noise. The login flow should feel like the same product, not a generic auth page.
        </p>
        <div class="mt-10 grid gap-4 sm:grid-cols-3">
          <div class="rounded-[22px] border border-white/8 bg-black/20 p-4">
            <p class="text-sm font-medium text-white">Dashboard</p>
            <p class="mt-2 text-sm leading-6 text-slate-400">Win rate, net P&amp;L, streaks, and equity in one compact view.</p>
          </div>
          <div class="rounded-[22px] border border-white/8 bg-black/20 p-4">
            <p class="text-sm font-medium text-white">Journal</p>
            <p class="mt-2 text-sm leading-6 text-slate-400">Short structured review prompts tied to each trade.</p>
          </div>
          <div class="rounded-[22px] border border-white/8 bg-black/20 p-4">
            <p class="text-sm font-medium text-white">Analytics</p>
            <p class="mt-2 text-sm leading-6 text-slate-400">See recurring setups, session bias, and daily performance patterns.</p>
          </div>
        </div>
      </section>

      <div class="mx-auto w-full max-w-md rounded-[32px] border border-white/10 bg-slate-950/70 p-6 shadow-[0_30px_90px_rgba(2,8,18,0.45)] backdrop-blur-xl sm:p-8">
        <div>
          <div class="flex items-center">
            <img src="/crs-main.png" alt="CRS Codem System Rule" class="h-16 w-auto max-w-[220px] object-contain" />
          </div>
          <h2 class="mt-8 text-3xl font-semibold tracking-[-0.04em] text-white">
            Sign in
          </h2>
          <p class="mt-3 text-sm leading-7 text-slate-400">
            Resume your personal trading journal and rule-based review flow.
          </p>
          <p v-if="allowRegistration" class="mt-3 text-sm text-slate-400">
            Need an account?
            <router-link to="/register" class="font-medium text-amber-200 transition hover:text-amber-100">
              Create one
            </router-link>
          </p>
        </div>

      <!-- Verification message from registration -->
      <div v-if="verificationMessage" class="mt-6 rounded-2xl border border-sky-400/20 bg-sky-400/10 p-4">
        <p class="text-sm text-sky-100">{{ verificationMessage }}</p>
      </div>

      <!-- 2FA verification form -->
      <div v-if="showTwoFactor">
        <TwoFactorAuth
          :loading="authStore.loading"
          :error="formError"
          @submit="handleTwoFactorSubmit"
          @cancel="handleTwoFactorCancel"
        />
      </div>
      
      <form v-else class="mt-8 space-y-6" @submit.prevent="handleLogin">
        <div class="space-y-4">
          <div>
            <label for="email" class="mb-2 block text-sm font-medium text-slate-300">Email</label>
            <input
              id="email"
              v-model="form.email"
              name="email"
              type="email"
              required
              class="crs-input"
              placeholder="trader@example.com"
              @keydown.enter="handleLogin"
            />
          </div>
          <div>
            <label for="password" class="mb-2 block text-sm font-medium text-slate-300">Password</label>
            <input
              id="password"
              v-model="form.password"
              name="password"
              type="password"
              required
              class="crs-input"
              placeholder="Password"
              @keydown.enter="handleLogin"
            />
          </div>
        </div>

        <div v-if="formError" class="rounded-2xl border border-red-500/20 bg-red-500/10 p-4">
          <p class="text-sm text-red-100">{{ formError }}</p>
          <div v-if="showResendVerification" class="mt-3">
            <button
              @click="handleResendVerification"
              :disabled="resendLoading || resendCooldown > 0"
              class="text-sm font-medium text-amber-200 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <span v-if="resendLoading">Sending...</span>
              <span v-else-if="resendCooldown > 0">Resend in {{ resendCooldown }}s</span>
              <span v-else>Resend verification email</span>
            </button>
          </div>
          <div v-if="showApprovalMessage" class="mt-3">
            <p class="text-xs text-red-100/80">
              Your account is pending approval from an administrator. You will be able to sign in once approved.
            </p>
          </div>
        </div>
        
        <!-- Resend verification success message -->
        <div v-if="resendSuccess" class="rounded-2xl border border-emerald-400/20 bg-emerald-400/10 p-4">
          <p class="text-sm text-emerald-100">
            Verification email sent successfully! Please check your inbox.
          </p>
        </div>

        <div>
          <button
            type="submit"
            :disabled="authStore.loading"
            class="crs-button-primary w-full"
          >
            <span v-if="authStore.loading">Signing in...</span>
            <span v-else>Sign in</span>
          </button>
        </div>

        <div class="text-center mt-4">
          <router-link to="/forgot-password" class="text-sm text-slate-400 transition hover:text-white">
            Forgot your password?
          </router-link>
        </div>
      </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useNotification } from '@/composables/useNotification'
import { useRegistrationMode } from '@/composables/useRegistrationMode'
import api from '@/services/api'
import TwoFactorAuth from '@/components/TwoFactorAuth.vue'

const route = useRoute()
const authStore = useAuthStore()
const { showError, showSuccess } = useNotification()
const { allowRegistration, fetchRegistrationConfig } = useRegistrationMode()

const verificationMessage = ref('')
const showResendVerification = ref(false)
const showApprovalMessage = ref(false)
const userEmail = ref('')
const resendLoading = ref(false)
const resendCooldown = ref(0)
const resendSuccess = ref(false)
const showTwoFactor = ref(false)
const tempToken = ref('')
const formError = ref('')

const form = ref({
  email: '',
  password: ''
})

async function handleLogin() {
  // Reset state
  authStore.clearError()
  formError.value = ''
  showResendVerification.value = false
  showApprovalMessage.value = false
  resendSuccess.value = false
  showTwoFactor.value = false
  userEmail.value = ''
  tempToken.value = ''

  try {
    // Check if there's a return URL from OAuth flow or a redirect path
    const returnUrl = route.query.return_url || route.query.redirect || null
    await authStore.login(form.value, returnUrl)
  } catch (error) {
    if (error.requiresApproval) {
      showApprovalMessage.value = true
      userEmail.value = error.email || form.value.email
      formError.value = authStore.error || ''
    } else if (error.requires2FA) {
      showTwoFactor.value = true
      tempToken.value = error.tempToken
      // Clear any error message since 2FA is a normal flow
      authStore.clearError()
      formError.value = ''
    } else {
      formError.value = authStore.error || 'Unable to sign in with those credentials.'
    }
  }
}

async function handleResendVerification() {
  const emailToUse = userEmail.value || form.value.email
  if (!emailToUse) {
    showError('Error', 'Please enter your email address')
    return
  }
  
  resendLoading.value = true
  resendSuccess.value = false
  
  try {
    const response = await api.post('/auth/resend-verification', {
      email: emailToUse
    })
    
    resendSuccess.value = true
    showSuccess('Success', response.data.message)
    
    // Clear the auth error since we've sent a new verification email
    authStore.clearError()
    formError.value = ''
    
    // Start cooldown timer
    resendCooldown.value = 60
    const cooldownInterval = setInterval(() => {
      resendCooldown.value--
      if (resendCooldown.value <= 0) {
        clearInterval(cooldownInterval)
      }
    }, 1000)
    
  } catch (error) {
    showError('Error', error.response?.data?.error || 'Failed to resend verification email')
  } finally {
    resendLoading.value = false
  }
}

async function handleTwoFactorSubmit(code) {
  formError.value = ''
  try {
    await authStore.verify2FA(tempToken.value, code)
  } catch (error) {
    formError.value = authStore.error || '2FA verification failed'
  }
}

function handleTwoFactorCancel() {
  showTwoFactor.value = false
  tempToken.value = ''
  authStore.clearError()
  formError.value = ''
}

onMounted(async () => {
  authStore.clearError()
  formError.value = ''
  // Fetch registration config to determine if registration is allowed
  await fetchRegistrationConfig()
  
  // Check for verification message from registration
  if (route.query.message) {
    verificationMessage.value = route.query.message
  }
})

onBeforeUnmount(() => {
  authStore.clearError()
})
</script>
