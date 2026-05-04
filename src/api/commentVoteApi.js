import api from './http'

export const commentVoteApi = {

  vote(commentId, type) {
    return api.post(`/comments/${commentId}/votes`, { type })
  },

  removeVote(commentId) {
    return api.delete(`/comments/${commentId}/votes`)
  }
}