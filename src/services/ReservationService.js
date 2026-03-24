import { reservationApi } from '../api/reservationApi'
import { Reservation } from '../models/ReservationModel'

class ReservationService {

  // Buscar todas as reservas
  async getAllReservations(page = 0, size = 20) {
    const response = await reservationApi.getAll(page, size)
    const docs = response.data.content ?? []

    return docs.map(doc => new Reservation(doc))
  }

  // Buscar reserva por ID
  async getReservationById(id) {
    const response = await reservationApi.getById(id)
    return new Reservation(response.data)
  }

  // Criar nova reserva
  async createReservation(reservationData) {
    const reservation = new Reservation(reservationData)

    if (!reservation.isValid()) {
      throw new Error('Dados da reserva são inválidos')
    }

    const response = await reservationApi.create(
      reservation.toJSON?.() ?? { ...reservation }
    )

    return new Reservation(response.data)
  }

  // Cancelar reserva (DELETE /reservations/{id})
  async deleteReservation(id) {
    await reservationApi.cancel(id)
    return true
  }

  // Buscar reservas com filtros (usa endpoint /search)
  async searchReservations(filters) {
    const response = await reservationApi.search(filters)
    const docs = response.data.content || []

    return docs.map(doc => new Reservation(doc))
  }

  // Buscar reservas por laboratório
  async getReservationsByLab(labId) {
    return this.searchReservations({
      laboratoryId: Number(labId)
    })
  }

  // Buscar reservas por data
  async getReservationsByDate(dateStr) {
    return this.searchReservations({
      dateFrom: dateStr,
      dateTo: dateStr
    })
  }

  // Buscar reservas aprovadas
  async getApprovedReservations() {
    return this.searchReservations({
      status: 'APPROVED'
    })
  }

  // Cancelar reservas por filtro
  async cancelReservationsByFilter(filters) {
    const response = await reservationApi.cancelByFilter(filters)
    return response.data
  }

}

export default new ReservationService()