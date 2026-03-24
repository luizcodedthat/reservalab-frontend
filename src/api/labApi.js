import api from './http'

export const labApi = {

  getAll: (page = 0, size = 20) =>
    api.get(`/laboratories?page=${page}&size=${size}`),

  getById: (id) =>
    api.get(`/laboratories/${id}`),

  getComments: (id, page = 0, size = 20) =>
    api.get(`/laboratories/${id}/comments?page=${page}&size=${size}`)

}