  import { defineStore } from "pinia";
  import LabService from "@/services/LabService";

  export const useLabStore = defineStore("labs", {
      state: () => ({
          labs: [],
          labById: {},
          lastFetchedAll: null,
          lastFetchedById: {},
          loading: false
      }),

      actions: {
          async loadLabs(forceRefresh = false) {
              const FIVE_MIN = 5 * 60 * 1000;
              const now = Date.now();

              if (!forceRefresh &&
                  this.lastFetchedAll &&
                  now - this.lastFetchedAll < FIVE_MIN &&
                  this.labs.length > 0
              ) {
                  return;
              }

              this.loading = true;

              const labs = await LabService.getAllLabs();
              this.labs = labs;
              this.lastFetched = now;

              this.loading = false;
          },

          async loadLabById(labId, forceRefresh = false) {
              const FIVE_MIN = 5 * 60 * 1000;
              const now = Date.now();

              if (
                  !forceRefresh &&
                  this.labById[labId] &&
                  this.lastFetchedById[labId] &&
                  now - this.lastFetchedById[labId] < FIVE_MIN
              ) {
                  return this.labById[labId];
              }

              this.loading = true;

              const lab = await LabService.getLabById(labId);

              this.labById[labId] = lab;
              this.lastFetchedById[labId] = now;

              this.loading = false;

              return lab;
          },

          async addLab(lab) {
              const created = await LabService.create(lab);
              this.labs.push(created);

              this.lastFetched = Date.now();
          }
      }
  });
