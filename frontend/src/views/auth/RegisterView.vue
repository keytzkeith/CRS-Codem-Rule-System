<template>
  <div class="min-h-screen bg-[radial-gradient(circle_at_top,rgba(215,183,122,0.12),transparent_0_24%),linear-gradient(180deg,#07111f_0%,#050c17_100%)] px-4 py-10 sm:px-6 lg:px-8">
    <div class="mx-auto grid min-h-[calc(100vh-5rem)] max-w-6xl items-center gap-8 lg:grid-cols-[1fr_1fr]">
      <section class="hidden rounded-[32px] border border-white/10 bg-white/[0.03] p-8 text-slate-200 shadow-[0_30px_90px_rgba(2,8,18,0.45)] lg:block">
        <img src="/crs-main.png" alt="CRS Codem System Rule" class="h-24 w-auto max-w-[260px] object-contain" />
        <p class="mt-8 text-[0.72rem] uppercase tracking-[0.24em] text-amber-200">CRS onboarding</p>
        <h1 class="mt-4 text-5xl font-semibold tracking-[-0.05em] text-white">Create an account and start logging with structure.</h1>
        <p class="mt-5 max-w-xl text-base leading-8 text-slate-300">
          Create your account, record the trades, and build a review process around consistency instead of noise.
        </p>
      </section>

      <div class="mx-auto w-full max-w-md rounded-[32px] border border-white/10 bg-slate-950/70 p-6 shadow-[0_30px_90px_rgba(2,8,18,0.45)] backdrop-blur-xl sm:p-8">
        <div>
          <div class="flex items-center">
            <img src="/crs-main.png" alt="CRS Codem System Rule" class="h-16 w-auto max-w-[220px] object-contain" />
          </div>
          <h2 class="mt-8 text-3xl font-semibold tracking-[-0.04em] text-white">
            Create account
          </h2>
          <p class="mt-3 text-sm leading-7 text-slate-400">
            Set up your CRS workspace and keep the journal centered on execution quality.
          </p>
          <p class="mt-3 text-sm text-slate-400">
            Already have access?
            <router-link to="/login" class="font-medium text-amber-200 transition hover:text-amber-100">
              Sign in
            </router-link>
          </p>
        </div>

      <!-- Registration disabled message -->
      <div v-if="registrationDisabled" class="mt-8 rounded-2xl border border-amber-300/20 bg-amber-300/10 p-4">
        <div class="text-center">
          <h3 class="mb-2 text-lg font-medium text-amber-100">
            Registration Currently Disabled
          </h3>
          <p class="text-sm text-amber-50/85">
            User registration is currently disabled by the administrator. Please contact an administrator for assistance.
          </p>
          <div class="mt-4">
            <router-link to="/login" class="crs-button-primary">
              Sign In Instead
            </router-link>
          </div>
        </div>
      </div>
      
      <form v-if="!registrationDisabled" class="mt-8 space-y-6" @submit.prevent="handleRegister">
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
              placeholder="john@example.com"
              @keydown.enter="handleRegister"
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
              placeholder="Minimum 8 characters"
              @keydown.enter="handleRegister"
            />
          </div>
        </div>

        <!-- Marketing Consent Checkbox (only shown when billing is enabled) -->
        <div v-if="billingEnabled" class="flex items-start">
          <div class="flex items-center h-5">
            <input
              id="marketing_consent"
              v-model="form.marketing_consent"
              name="marketing_consent"
              type="checkbox"
              class="h-4 w-4 rounded border-white/10 bg-transparent text-amber-200"
            />
          </div>
          <div class="ml-3 text-sm">
            <label for="marketing_consent" class="text-slate-300">
              I agree to receive occasional product updates and release notes about CRS improvements.
            </label>
          </div>
        </div>

        <div v-if="formError" class="rounded-2xl border border-red-500/20 bg-red-500/10 p-4">
          <p class="text-sm text-red-100">{{ formError }}</p>
        </div>

        <div>
          <button
            type="submit"
            :disabled="authStore.loading"
            class="crs-button-primary w-full"
          >
            <span v-if="authStore.loading">Creating account...</span>
            <span v-else>Create account</span>
          </button>
        </div>
        
      </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useNotification } from '@/composables/useNotification'

const authStore = useAuthStore()
const router = useRouter()
const route = useRoute()
const { showError, showSuccess } = useNotification()

const form = ref({
  email: '',
  password: '',
  marketing_consent: false
})

const registrationDisabled = ref(false)
const billingEnabled = ref(false)
const formError = ref('')

onMounted(async () => {
  authStore.clearError()
  formError.value = ''
  // Pre-fill email from query param (from home page quick signup)
  if (route.query.email) {
    form.value.email = route.query.email
  }

  try {
    const config = await authStore.getRegistrationConfig()
    registrationDisabled.value = !config.allowRegistration
    billingEnabled.value = config.billingEnabled === true

    // If registration is disabled, redirect to login after 3 seconds
    if (registrationDisabled.value) {
      setTimeout(() => {
        router.push('/login')
      }, 5000)
    }
  } catch (error) {
    console.error('Failed to fetch registration config:', error)
  }
})

async function handleRegister() {
  authStore.clearError()
  formError.value = ''

  try {
    const response = await authStore.register(form.value)

    // Show success message
    showSuccess('Registration Successful', response.message)
    
    // Check if email verification or admin approval is required
    if (response.requiresVerification && response.requiresApproval) {
      router.push({ name: 'login', query: { message: 'Registration successful! Please check your email to verify your account and wait for admin approval.' } })
    } else if (response.requiresVerification) {
      router.push({ name: 'login', query: { message: 'Registration successful! Please check your email to verify your account.' } })
    } else if (response.requiresApproval) {
      router.push({ name: 'login', query: { message: 'Your account is pending admin approval' } })
    } else {
      router.push({ name: 'login', query: { message: 'You can now sign in to your account' } })
    }
  } catch (error) {
    formError.value = authStore.error || 'Unable to create your account.'
    showError('Registration failed', formError.value)
  }
}

onBeforeUnmount(() => {
  authStore.clearError()
})
</script>
