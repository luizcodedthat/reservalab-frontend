import { defineStore } from "pinia";
import LabService from "@/services/LabService";

export const useLabStore = defineStore("labs", {
  state: () => ({
    labs: [],
    labById: {},
    lastFetchedAll: null,
    lastFetchedById: {},
    loading: false,
  }),

  actions: {
    async loadLabs(forceRefresh = false) {
      const FIVE_MIN = 5 * 60 * 1000;
      const now = Date.now();

      if (
        !forceRefresh &&
        this.lastFetchedAll &&
        now - this.lastFetchedAll < FIVE_MIN &&
        this.labs.length > 0
      )
        return;

      this.loading = true;
      try {
        this.labs = await LabService.getAllLabs();
        this.lastFetchedAll = Date.now(); // ← bug corrigido (era this.lastFetched)
      } finally {
        this.loading = false;
      }
    },

    async loadLabById(labId, forceRefresh = false) {
      const FIVE_MIN = 5 * 60 * 1000;
      const now = Date.now();

      if (
        !forceRefresh &&
        this.labById[labId] &&
        this.lastFetchedById[labId] &&
        now - this.lastFetchedById[labId] < FIVE_MIN
      )
        return this.labById[labId];

      this.loading = true;
      try {
        const lab = await LabService.getLabById(labId);
        this.labById[labId] = lab;
        this.lastFetchedById[labId] = Date.now();
        return lab;
      } finally {
        this.loading = false;
      }
    },

    async addLab(labData) {
      const created = await LabService.create(labData);
      this.labs.push(created);
      this.lastFetchedAll = null;
      return created;
    },

    async updateLab(id, labData) {
      const updated = await LabService.update(id, labData);
      const idx = this.labs.findIndex((l) => l.id === updated.id);
      if (idx !== -1) this.labs[idx] = updated;
      this.labById[id] = updated;
      this.lastFetchedAll = null;
      return updated;
    },

    async activateLab(id) {
      await LabService.activate(id);
      const idx = this.labs.findIndex((l) => l.id === id);
      if (idx !== -1) this.labs[idx] = { ...this.labs[idx], active: true };
      this.lastFetchedAll = null;
    },

    async deactivateLab(id) {
      await LabService.deactivate(id);
      const idx = this.labs.findIndex((l) => l.id === id);
      if (idx !== -1) this.labs[idx] = { ...this.labs[idx], active: false };
      this.lastFetchedAll = null;
    },

    async deleteLab(id) {
      await LabService.delete(id);
      this.labs = this.labs.filter((l) => l.id !== id);
      delete this.labById[id];
      delete this.lastFetchedById[id];
      this.lastFetchedAll = null;
    },

    invalidateCache() {
      this.lastFetchedAll = null;
    },
  },
});
