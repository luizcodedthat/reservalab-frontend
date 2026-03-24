import api from './http'

export const ticketApi = {
  getAll: (page = 0, size = 20) =>
    api.get(`/tickets?page=${page}&size=${size}`),

  getById: (id) =>
    api.get(`/tickets/${id}`),

  search: (params) =>
    api.get('/tickets/search', { params }),

  create: (ticket) =>
    api.post('/tickets', ticket),

  update: (id, ticket) =>
    api.put(`/tickets/${id}`, ticket),

  delete: (id) =>
    api.delete(`/tickets/${id}`)
}
