import api from './http'

export const commentApi = {

  getCommentsByLab(labId, page = 0, size = 20) {
    return api.get(`/laboratories/${labId}/comments`, {
      params: { page, size }
    })
  },

  // GET /api/tickets/{ticketId}/comments
  getByTicket(ticketId, page = 0, size = 20) {
    return api.get(`tickets/${ticketId}/comments`, {
      params: { page, size }
    })
  },

  // POST /api/tickets/{ticketId}/comments
  create(ticketId, commentData) {
    return api.post(`tickets/${ticketId}/comments`, commentData)
  },

  // DELETE /api/tickets/{ticketId}/comments/{commentId}
  delete(ticketId, commentId) {
    return api.delete(`tickets/${ticketId}/comments/${commentId}`)
  }
}
