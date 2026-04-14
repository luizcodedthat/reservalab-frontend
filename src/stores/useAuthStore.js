import { defineStore } from 'pinia'
import { authApi } from '@/api/authApi'
import { User } from '@/models/UserModel'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user:    null,
    token:   localStorage.getItem('token') ?? null,
    loading: false
  }),

  getters: {
    isAuthenticated: (state) => !!state.token && !!state.user,
    isAdmin: (state) => state.user?.isAdmin() ?? false
  },

  actions: {
    async init() {
      if (!this.token) return

      this.loading = true
      try {
        const response = await authApi.me()
        this.user = User.fromAPI(response.data)
      } catch {
        this._clearSession()
      } finally {
        this.loading = false
      }
    },

    async doLogin(email, password) {
      this.loading = true
      try {
        const response = await authApi.login({ email, password })
        this._saveSession(response.data)
        return response.data.user
      } finally {
        this.loading = false
      }
    },

    async doRegister(data) {
      this.loading = true
      try {
        const response = await authApi.register(data)
        this._saveSession(response.data)
        return response.data.user
      } finally {
        this.loading = false
      }
    },

    doLogout() {
      this._clearSession()
    },

    _saveSession({ token, user }) {
      this.token = token
      this.user  = User.fromAPI(user)
      localStorage.setItem('token', token)
    },

    _clearSession() {
      this.token = null
      this.user  = null
      localStorage.removeItem('token')
    }
  }
})
