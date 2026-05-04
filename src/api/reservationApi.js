import http from '@/api/http'

export const reservationApi = {
  // GET /reservations?page=0&size=20
  getAll: (page = 0, size = 20) =>
    http.get('reservations', { params: { page, size } }),

  // GET /reservations/:id
  getById: (id) =>
    http.get(`reservations/${id}`),

  // POST /reservations
  create: (data) =>
    http.post('reservations', data),

  // PUT /reservations/:id  (editar dados da reserva)
  update: (id, data) =>
    http.put(`reservations/${id}`, data),

  // PATCH /reservations/:id/status  (aprovar / cancelar)
  updateStatus: (id, status) =>
    http.patch(`reservations/${id}/status`, { status }),

  // DELETE /reservations/:id  (cancelar via delete)
  cancel: (id) =>
    http.delete(`reservations/${id}`),

  // POST /reservations/search  (filtros)
  search: (filters) =>
    http.post('reservations/search', filters),

  // DELETE /reservations/cancel-by-filter
  cancelByFilter: (filters) =>
    http.delete('reservations/cancel-by-filter', { data: filters }),
}
