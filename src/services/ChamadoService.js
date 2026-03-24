import { ticketApi } from '@/api/ticketApi'
import { Chamado } from '@/models/ChamadoModel'

class ChamadoService {

  async getAllTickets() {
    const response = await ticketApi.getAll()
    return response.data.content.map(Chamado.fromAPI)
  }

  async getTicketsByLabId(labId) {
    const numericId = parseInt(labId.replace('lab', ''))
    const response = await ticketApi.search({ labId: numericId })
    return response.data.content.map(Chamado.fromAPI)
  }

  async getTicketById(id) {
    const response = await ticketApi.getById(id)
    return Chamado.fromAPI(response.data)
  }

  async addTicket(data) {
    const chamado = new Chamado(data)
    if (!chamado.isValid()) throw new Error("Dados do ticket são inválidos")
    const response = await ticketApi.create(chamado.toAPI())
    return Chamado.fromAPI(response.data)
  }

  async updateTicket(id, updates) {
    const existing = await this.getTicketById(id)
    if (!existing) throw new Error("Ticket não encontrado")

    const updated = { ...existing, ...updates }
    const chamado = new Chamado(updated)
    if (!chamado.isValid()) throw new Error("Dados do ticket são inválidos")

    const response = await ticketApi.update(id, chamado.toAPI())
    return Chamado.fromAPI(response.data)
  }

  async deleteTicket(id) {
    await ticketApi.delete(id)
    return true
  }

  async searchTickets(searchTerm) {
    const all = await this.getAllTickets()
    return all.filter(c => c.matchesSearch(searchTerm))
  }

  async getOpenTickets() {
    const response = await ticketApi.search({ status: 'OPEN' })
    return response.data.content.map(Chamado.fromAPI)
  }
}

export default new ChamadoService()
