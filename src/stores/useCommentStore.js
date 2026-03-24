import { defineStore } from "pinia";
import CommentService from "@/services/CommentService";

export const useCommentStore = defineStore("comments", {
  state: () => ({
    commentsByLab: {},   // { labId: Comment[] }
    lastFetched: {},     // { labId: timestamp }
    loading: false
  }),

  getters: {
    getCommentsByLab: (state) => {
      return (labId) => state.commentsByLab[labId] || [];
    }
  },

  actions: {

    async loadComments(labId, force = false) {
      const FIVE_MIN = 5 * 60 * 1000;
      const now = Date.now();

      if (
        !force &&
        this.lastFetched[labId] &&
        now - this.lastFetched[labId] < FIVE_MIN
      ) {
        return;
      }

      this.loading = true;

      try {
        const comments = await CommentService.getByLab(labId);

        this.commentsByLab[labId] = comments;
        this.lastFetched[labId] = now;

      } catch (error) {
        console.error("Erro ao carregar comentários:", error);
      } finally {
        this.loading = false;
      }
    },

    async addComment(commentData) {
      try {
        const created = await CommentService.create(commentData);

        const labId = created.laboratoryId;

        if (!this.commentsByLab[labId]) {
          this.commentsByLab[labId] = [];
        }

        this.commentsByLab[labId].unshift(created);

        return created;

      } catch (error) {
        console.error("Erro ao criar comentário:", error);
        throw error;
      }
    }

  }
});