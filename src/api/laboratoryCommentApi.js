import api from './http'

export const laboratoryCommentApi = {

  getByLaboratory(laboratoryId, page = 0, size = 20) {
    return api.get(`/laboratories/${laboratoryId}/comments`, {
      params: { page, size }
    })
  },

  create(laboratoryId, commentData) {
    return api.post(
      `/laboratories/${laboratoryId}/comments`,
      commentData
    )
  },

  delete(laboratoryId, commentId) {
    return api.delete(
      `/laboratories/${laboratoryId}/comments/${commentId}`
    )
  }
}