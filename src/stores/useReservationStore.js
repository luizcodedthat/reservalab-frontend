import { defineStore } from 'pinia'
import ReservationService from '@/services/ReservationService'

export const useReservationStore = defineStore('reservations', {
  state: () => ({
    reservations:   [],
    loading:        false,
    lastFetchedAll: null,   // timestamp do ultimo fetch
  }),

  getters: {
    reservationsByLab: (state) => (labId) =>
      state.reservations.filter(r => Number(r.laboratoryId) === Number(labId)),

    getById: (state) => (id) =>
      state.reservations.find(r => r.id === Number(id)) || null,
  },

  actions: {
    /**
     * Carrega todas as reservas.
     * forceRefresh = true ignora o cache e sempre busca da API.
     */
    async loadReservations(forceRefresh = false) {
      const FIVE_MIN = 5 * 60 * 1000
      const now      = Date.now()

      // Se o cache ainda e valido e nao e forcado, nao busca
      if (
        !forceRefresh &&
        this.lastFetchedAll &&
        now - this.lastFetchedAll < FIVE_MIN &&
        this.reservations.length > 0
      ) {
        return
      }

      this.loading = true
      try {
        this.reservations   = await ReservationService.getAllReservations()
        this.lastFetchedAll = Date.now()
      } finally {
        this.loading = false
      }
    },

    async loadReservationsByLab(labId) {
      this.loading = true
      try {
        const data = await ReservationService.getReservationsByLab(labId)
        data.forEach(res => {
          const index = this.reservations.findIndex(r => r.id === res.id)
          if (index === -1) this.reservations.push(res)
          else              this.reservations[index] = res
        })
      } finally {
        this.loading = false
      }
    },

    async addReservation(reservationData) {
      const created = await ReservationService.createReservation(reservationData)
      this.reservations.unshift(created)   // adiciona no inicio
      this.lastFetchedAll = null            // invalida cache para forcar reload nos dashboards
      return created
    },

    async deleteReservation(id) {
      await ReservationService.deleteReservation(id)
      this.reservations   = this.reservations.filter(r => r.id !== id)
      this.lastFetchedAll = null
    },

    /** Invalida o cache manualmente (util apos operacoes externas) */
    invalidateCache() {
      this.lastFetchedAll = null
    },
  },
})
