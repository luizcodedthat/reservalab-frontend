import { defineStore } from "pinia";
import ReservationService from "@/services/ReservationService";

export const useReservationStore = defineStore("reservations", {
  state: () => ({
    reservations: [],
    loading: false
  }),

  getters: {
    reservationsByLab: (state) => {
      return (labId) =>
        state.reservations.filter(r => Number(r.laboratoryId) === Number(labId));
    },

    getById: (state) => {
      return (id) =>
        state.reservations.find(r => r.id === Number(id)) || null;
    }
  },

  actions: {

    async loadReservations() {
      this.loading = true;

      try {
        this.reservations = await ReservationService.getAllReservations();
      } finally {
        this.loading = false;
      }
    },

    async loadReservationsByLab(labId) {
      this.loading = true;

      try {
        const data = await ReservationService.getReservationsByLab(labId);

        data.forEach(res => {
          const index = this.reservations.findIndex(r => r.id === res.id);

          if (index === -1) {
            this.reservations.push(res);
          } else {
            this.reservations[index] = res;
          }
        });

      } finally {
        this.loading = false;
      }
    },

    async addReservation(reservationData) {
      const created = await ReservationService.createReservation(reservationData);

      this.reservations.push(created);

      return created;
    },

    async deleteReservation(id) {
      await ReservationService.deleteReservation(id);

      this.reservations = this.reservations.filter(r => r.id !== id);
    }
  }
});