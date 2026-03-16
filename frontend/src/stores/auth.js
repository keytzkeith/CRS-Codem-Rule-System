import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import api from '@/services/api'
import router from '@/router'
import { useCrsStore } from '@/stores/crs'

export const useAuthStore = defineStore('auth', () => {
  const mockAuthMode = import.meta.env.DEV ? (import.meta.env.VITE_ENABLE_MOCK_AUTH || '').toLowerCase() : ''
  const user = ref(null)
  const token = ref(localStorage.getItem('token'))
  const loading = ref(false)
  const error = ref(null)
  const registrationConfig = ref(null)
  const pendingOnboarding = ref(false)

  const isAuthenticated = computed(() => !!token.value)
  const showOnboardingModal = computed(() => {
    if (!user.value) return false
    return pendingOnboarding.value || !user.value.onboarding_completed
  })

  async function login(credentials, returnUrl = null) {
    loading.value = true
    error.value = null
    const crsStore = useCrsStore()

    try {
      const response = await api.post('/auth/login', credentials)

      // Check if admin approval is required
      if (response.data.requiresApproval) {
        error.value = response.data.error
        const approvalError = new Error('Admin approval required')
        approvalError.requiresApproval = true
        approvalError.email = response.data.email
        throw approvalError
      }

      // Check if 2FA is required
      if (response.data.requires2FA) {
        const twoFactorError = new Error('Two-factor authentication required')
        twoFactorError.requires2FA = true
        twoFactorError.tempToken = response.data.tempToken
        twoFactorError.message = response.data.message
        throw twoFactorError
      }

      const { user: userData, token: authToken } = response.data

      token.value = authToken
      localStorage.setItem('token', authToken)

      // Set authorization header for subsequent requests
      api.defaults.headers.common['Authorization'] = `Bearer ${authToken}`

      if (response.data.is_first_login === true) {
        pendingOnboarding.value = true
      }

      // Fetch complete user data with settings
      await fetchUser()
      await crsStore.hydratePersistence(true)

      // If there's a return URL, redirect there instead of dashboard
      if (returnUrl) {
        const decoded = decodeURIComponent(returnUrl)
        if (decoded.startsWith('/')) {
          router.push(decoded)
        } else {
          window.location.href = decoded
        }
      } else {
        router.push({ name: 'dashboard' })
      }

      return response.data
    } catch (err) {
      if (shouldUseMockAuth(err, mockAuthMode)) {
        completeMockAuth(credentials.email, returnUrl)
        return {
          message: 'Mock login successful',
          mockAuth: true
        }
      }

      // Don't set error for 2FA or approval - these are normal flows
      if (!err.requires2FA && !err.requiresApproval) {
        error.value = getAuthErrorMessage(err, 'login')
      }
      throw err
    } finally {
      loading.value = false
    }
  }

  async function register(userData) {
    loading.value = true
    error.value = null
    const crsStore = useCrsStore()
    
    try {
      const response = await api.post('/auth/register', userData)
      
      // Check if email verification or admin approval is required (new flow)
      if (response.data.requiresVerification || response.data.requiresApproval) {
        // Don't auto-login, just return the response
        return response.data
      }
      
      // Legacy flow for existing users (if any)
      const { user: newUser, token: authToken } = response.data
      
      if (authToken) {
        user.value = newUser
        token.value = authToken
        localStorage.setItem('token', authToken)
        api.defaults.headers.common['Authorization'] = `Bearer ${authToken}`
        await crsStore.hydratePersistence(true)
        router.push({ name: 'dashboard' })
      }
      
      return response.data
    } catch (err) {
      if (shouldUseMockAuth(err, mockAuthMode)) {
        completeMockAuth(userData.email)
        return {
          message: 'Mock registration successful',
          mockAuth: true,
          requiresVerification: false
        }
      }

      error.value = getAuthErrorMessage(err, 'register')
      throw err
    } finally {
      loading.value = false
    }
  }

  async function logout() {
    try {
      await api.post('/auth/logout')
    } catch (err) {
      console.error('Logout error:', err)
    } finally {
      user.value = null
      token.value = null
      localStorage.removeItem('token')
      localStorage.removeItem('mock_auth_user')
      router.push({ name: 'home' })
    }
  }

  async function fetchUser() {
    if (!token.value) return

    try {
      const response = await api.get('/auth/me')
      // Merge settings into user object (convert snake_case to camelCase)
      const settings = response.data.settings || {}
      const u = response.data.user || {}
      user.value = {
        ...u,
        onboarding_completed: u.onboarding_completed ?? false,
        settings: {
          publicProfile: settings.public_profile ?? false,
          emailNotifications: settings.email_notifications ?? true,
          defaultTags: settings.default_tags || [],
          accountEquity: settings.account_equity || 0,
          // Add other settings as needed
          ...settings
        }
      }
      return user.value
    } catch (err) {
      if (err.response?.status === 401) {
        logout()
      }
      throw err
    }
  }

  async function resendVerification(email) {
    loading.value = true
    error.value = null
    
    try {
      const response = await api.post('/auth/resend-verification', { email })
      return response.data
    } catch (err) {
      error.value = err.response?.data?.error || 'Failed to resend verification email'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function forgotPassword(email) {
    loading.value = true
    error.value = null
    
    try {
      const response = await api.post('/auth/forgot-password', { email })
      return response.data
    } catch (err) {
      error.value = err.response?.data?.error || 'Failed to send password reset email'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function resetPassword(token, password) {
    loading.value = true
    error.value = null
    
    try {
      const response = await api.post('/auth/reset-password', { token, password })
      return response.data
    } catch (err) {
      error.value = err.response?.data?.error || 'Failed to reset password'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function checkAuth() {
    if (token.value) {
      if (token.value === 'mock-dev-token' && mockAuthMode) {
        const storedUser = localStorage.getItem('mock_auth_user')
        if (storedUser) {
          user.value = JSON.parse(storedUser)
        }
        return
      }

      // Set the authorization header for subsequent requests
      api.defaults.headers.common['Authorization'] = `Bearer ${token.value}`
      await fetchUser()
    }
  }

  async function verify2FA(tempToken, twoFactorCode) {
    loading.value = true
    error.value = null
    const crsStore = useCrsStore()
    
    try {
      const response = await api.post('/auth/verify-2fa', { 
        tempToken,
        twoFactorCode 
      })
      
      const { user: userData, token: authToken } = response.data

      if (response.data.is_first_login === true) {
        pendingOnboarding.value = true
      }

      token.value = authToken
      localStorage.setItem('token', authToken)
      api.defaults.headers.common['Authorization'] = `Bearer ${authToken}`

      await fetchUser()
      await crsStore.hydratePersistence(true)

      router.push({ name: 'dashboard' })
      return response.data
    } catch (err) {
      error.value = err.response?.data?.error || '2FA verification failed'
      throw err
    } finally {
      loading.value = false
    }
  }

  function shouldUseMockAuth(err, mode = '') {
    if (mode === 'force' || mode === 'mock') {
      return true
    }

    if (!mode || !err?.response) {
      return false
    }

    return [401, 403].includes(err.response.status)
  }

  function getAuthErrorMessage(err, action = 'login') {
    const backendMessage = err?.response?.data?.error
    if (backendMessage) {
      return backendMessage
    }

    if (!err?.response) {
      return 'Unable to reach the server. Check your connection and try again.'
    }

    if (err.response.status === 429) {
      return 'Too many attempts. Wait a moment and try again.'
    }

    if (err.response.status >= 500) {
      return action === 'register'
        ? 'Server error while creating your account. Check the backend setup and try again.'
        : 'Server error while signing you in. Try again shortly.'
    }

    return action === 'login'
      ? 'Unable to sign in with those credentials.'
      : 'Unable to create your account with those details.'
  }

  function clearError() {
    error.value = null
  }

  function completeMockAuth(email, returnUrl = null) {
    const mockUser = {
      id: 'crs-local-user',
      email: email || 'crs@local.dev',
      username: 'crs_local',
      full_name: 'CRS Local User',
      fullName: 'CRS Local User',
      onboarding_completed: true,
      role: 'admin',
      tier: 'crs',
      settings: {
        publicProfile: false,
        emailNotifications: false,
        defaultTags: [],
        accountEquity: 25000
      }
    }

    user.value = mockUser
    token.value = 'mock-dev-token'
    localStorage.setItem('token', token.value)
    localStorage.setItem('mock_auth_user', JSON.stringify(mockUser))

    if (returnUrl) {
      const decoded = decodeURIComponent(returnUrl)
      if (decoded.startsWith('/')) {
        router.push(decoded)
        return
      }
    }

    router.push({ name: 'dashboard' })
  }

  async function completeOnboarding() {
    try {
      await api.post('/users/onboarding-completed')
      pendingOnboarding.value = false
      if (user.value) {
        user.value = { ...user.value, onboarding_completed: true }
      }
    } catch (err) {
      console.error('Failed to mark onboarding completed:', err)
      pendingOnboarding.value = false
    }
  }

  async function getRegistrationConfig() {
    try {
      const response = await api.get('/auth/config')
      registrationConfig.value = response.data
      return response.data
    } catch (err) {
      console.error('Failed to fetch registration config:', err)
      // Return default values as fallback
      return {
        registrationMode: 'open',
        emailVerificationEnabled: false,
        allowRegistration: true
      }
    }
  }

  return {
    user,
    token,
    loading,
    error,
    registrationConfig,
    pendingOnboarding,
    showOnboardingModal,
    isAuthenticated,
    clearError,
    login,
    register,
    logout,
    fetchUser,
    checkAuth,
    resendVerification,
    forgotPassword,
    resetPassword,
    verify2FA,
    completeOnboarding,
    getRegistrationConfig
  }
})
