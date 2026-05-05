import api from './http'

export const labApi = {
  getAll:     (page = 0, size = 20) => api.get(`/laboratories?page=${page}&size=${size}`),
  getById:    (id)                  => api.get(`/laboratories/${id}`),
  getComments:(id, page=0, size=20) => api.get(`/laboratories/${id}/comments?page=${page}&size=${size}`),
  create:     (data)                => api.post('/laboratories', data),
  update:     (id, data)            => api.put(`/laboratories/${id}`, data),
  delete:     (id)                  => api.delete(`/laboratories/${id}`),
  activate:   (id)                  => api.patch(`/laboratories/${id}/activate`),
  deactivate: (id)                  => api.patch(`/laboratories/${id}/deactivate`),
}
