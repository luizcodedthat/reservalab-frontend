import api from './http'

export const reservationApi = {

  getAll: (page = 0, size = 20) =>
    api.get(`/reservations?page=${page}&size=${size}`),

  getById: (id) =>
    api.get(`/reservations/${id}`),

  search: (params) =>
    api.get('/reservations/search', { params }),

  create: (reservation) =>
    api.post('/reservations', reservation),

  cancel: (id) =>
    api.delete(`/reservations/${id}`),

  cancelByFilter: (params) =>
    api.delete('/reservations', { params })

}