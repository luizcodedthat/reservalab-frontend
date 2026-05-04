// src/stores/useAuthStore.js
import { defineStore } from 'pinia'
import { authApi } from '@/api/authApi'
import { User } from '@/models/UserModel'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user:    null,
    token:   localStorage.getItem('token') ?? null,
    loading: false,
    error:   null,
  }),

  getters: {
    isAuthenticated: (state) => !!state.token && !!state.user,
    isAdmin:         (state) => state.user?.isAdmin() ?? false,
  },

  actions: {
    /** Chamado no app init (main.js ou App.vue) se já houver token salvo */
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
      this.error   = null
      try {
        const response = await authApi.login({ email, password })
        this._saveSession(response.data)
        return this.user
      } catch (err) {
        this.error = err?.response?.data?.message || 'Credenciais inválidas.'
        throw err
      } finally {
        this.loading = false
      }
    },

    async doRegister(data) {
      this.loading = true
      this.error   = null
      try {
        const response = await authApi.register(data)
        this._saveSession(response.data)
        return this.user
      } catch (err) {
        this.error = err?.response?.data?.message || 'Erro ao cadastrar.'
        throw err
      } finally {
        this.loading = false
      }
    },

    doLogout() {
      this._clearSession()
    },

    // ─── Helpers ────────────────────────────────────────────────────────────

    _saveSession({ token, user }) {
      this.token = token
      this.user  = User.fromAPI(user)
      localStorage.setItem('token', token)
    },

    _clearSession() {
      this.token = null
      this.user  = null
      localStorage.removeItem('token')
    },
  },
})
