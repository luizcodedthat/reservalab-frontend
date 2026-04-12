import { defineStore } from 'pinia'
import CommentService from '@/services/CommentService'

export const useCommentStore = defineStore('comments', {
  state: () => ({
    commentsByTicket: {},  // { ticketId: Comment[] }
    lastFetched:      {},  // { ticketId: timestamp }
    loading:          false
  }),

  getters: {
    getCommentsByTicket: (state) => (ticketId) =>
      state.commentsByTicket[ticketId] ?? []
  },

  actions: {

    async loadComments(ticketId, force = false) {
      const FIVE_MIN = 5 * 60 * 1000
      const now = Date.now()

      if (
        !force &&
        this.lastFetched[ticketId] &&
        now - this.lastFetched[ticketId] < FIVE_MIN
      ) {
        return
      }

      this.loading = true
      try {
        const comments = await CommentService.getByTicket(ticketId)
        this.commentsByTicket[ticketId] = comments
        this.lastFetched[ticketId] = now
      } catch (error) {
        console.error('Erro ao carregar comentários:', error)
      } finally {
        this.loading = false
      }
    },

    async addComment(ticketId, commentData) {
      try {
        const created = await CommentService.create(ticketId, commentData)

        if (!this.commentsByTicket[ticketId]) {
          this.commentsByTicket[ticketId] = []
        }

        this.commentsByTicket[ticketId].unshift(created)
        return created
      } catch (error) {
        console.error('Erro ao criar comentário:', error)
        throw error
      }
    },

    async deleteComment(ticketId, commentId) {
      try {
        await CommentService.delete(ticketId, commentId)
        if (this.commentsByTicket[ticketId]) {
          this.commentsByTicket[ticketId] =
            this.commentsByTicket[ticketId].filter(c => c.id !== commentId)
        }
      } catch (error) {
        console.error('Erro ao deletar comentário:', error)
        throw error
      }
    }
  }
})
