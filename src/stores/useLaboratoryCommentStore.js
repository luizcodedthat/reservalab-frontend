import { defineStore } from 'pinia'
import LaboratoryCommentService from '@/services/LaboratoryCommentService'
import CommentVoteService from '@/services/CommentVoteService'

export const useLaboratoryCommentStore = defineStore('laboratoryComments', {
  state: () => ({
    commentsByLaboratory: {},
    lastFetched: {},
    loading: false,
    error: null
  }),

  getters: {
    getCommentsByLaboratory: (state) => (laboratoryId) =>
      state.commentsByLaboratory[laboratoryId] ?? [],

    isLoading: (state) => state.loading
  },

  actions: {

    async loadComments(laboratoryId, force = false) {
      const FIVE_MIN = 5 * 60 * 1000
      const now = Date.now()

      if (!force &&
        this.lastFetched[laboratoryId] &&
        now - this.lastFetched[laboratoryId] < FIVE_MIN) {
        return
      }

      this.loading = true
      this.error = null

      try {
        const comments = await LaboratoryCommentService.getByLaboratory(laboratoryId)
        this.commentsByLaboratory[laboratoryId] = comments
        this.lastFetched[laboratoryId] = now

      } catch (error) {
        this.error =
          error?.response?.data?.message ||
          'Erro ao carregar comentários do laboratório'
        console.error(this.error)
      } finally {
        this.loading = false
      }
    },

    async addComment(laboratoryId, commentData) {
      this.error = null

      try {
        const created = await LaboratoryCommentService.create(laboratoryId, commentData)
        if (!this.commentsByLaboratory[laboratoryId]) {
          this.commentsByLaboratory[laboratoryId] = []
        }
        this.commentsByLaboratory[laboratoryId].unshift(created)
        return created

      } catch (error) {
        this.error =
          error?.response?.data?.message ||
          'Erro ao criar comentário do laboratório'
        console.error(this.error)
        throw error
      }
    },

    async deleteComment(laboratoryId, commentId) {
      this.error = null

      try {
        await LaboratoryCommentService.delete(laboratoryId, commentId)
        if (this.commentsByLaboratory[laboratoryId]) {
          this.commentsByLaboratory[laboratoryId] =
            this.commentsByLaboratory[laboratoryId].filter(c => c.id !== commentId)
        }

      } catch (error) {
        this.error =
          error?.response?.data?.message ||
          'Erro ao deletar comentário do laboratório'
        console.error(this.error)
        throw error
      }
    },

    async upvote(laboratoryId, commentId) {
      const comment = this.findComment(laboratoryId, commentId)
      if (!comment) return

      try {
        if (comment.userVote === 'UPVOTE') {
          await CommentVoteService.removeVote(commentId)
          comment.upvotes -= 1
          comment.userVote = null
          return
        }

        await CommentVoteService.vote(commentId, 'UPVOTE')

        if (comment.userVote === 'DOWNVOTE') {
          comment.downvotes -= 1
        }
        comment.upvotes += 1
        comment.userVote = 'UPVOTE'

      } catch (error) {
        console.error('Erro ao dar UPVOTE', error)
        throw error
      }
    },

    async downvote(laboratoryId, commentId) {
      const comment = this.findComment(laboratoryId, commentId)
      if (!comment) return

      try {
        if (comment.userVote === 'DOWNVOTE') {
          await CommentVoteService.removeVote(commentId)
          comment.downvotes -= 1
          comment.userVote = null
          return
        }

        await CommentVoteService.vote(commentId, 'DOWNVOTE')

        if (comment.userVote === 'UPVOTE') {
          comment.upvotes -= 1
        }
        comment.downvotes += 1
        comment.userVote = 'DOWNVOTE'

      } catch (error) {
        console.error('Erro ao dar DOWNVOTE', error)
        throw error
      }
    },

    async removeVote(laboratoryId, commentId) {
      const comment = this.findComment(laboratoryId, commentId)
      if (!comment) return

      try {
        await CommentVoteService.removeVote(commentId)

        if (comment.userVote === 'UPVOTE' && comment.upvotes > 0) comment.upvotes -= 1
        else if (comment.userVote === 'DOWNVOTE' && comment.downvotes > 0) comment.downvotes -= 1

        comment.userVote = null

      } catch (error) {
        console.error('Erro ao remover voto', error)
        throw error
      }
    },

    findComment(laboratoryId, commentId) {
      const comments = this.commentsByLaboratory[laboratoryId] ?? []
      return comments.find(c => c.id === commentId)
    }
  }
})