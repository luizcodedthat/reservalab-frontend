import { defineStore } from 'pinia'
import LabSuggestionService from '@/services/LabSuggestionService'

export const useLabSuggestionStore = defineStore('labSuggestion', {
  state: () => ({
    loading: false,
    suggestion: null,  // { labId, labName, reason }
    error: ''
  }),

  actions: {
    async suggest(payload) {
      this.loading   = true
      this.suggestion = null
      this.error     = ''

      try {
        this.suggestion = await LabSuggestionService.suggest(payload)
        return this.suggestion
      } catch (err) {
        this.error =
          err?.response?.data?.message ||
          err.message ||
          'Não foi possível obter sugestão da IA.'
        throw err
      } finally {
        this.loading = false
      }
    },

    reset() {
      this.loading    = false
      this.suggestion = null
      this.error      = ''
    }
  }
})