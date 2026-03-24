export class Chamado {

  static statusParaAPI = {
    'Aberto':       'OPEN',
    'Em andamento': 'IN_PROGRESS',
    'Concluído':    'RESOLVED',
    'Fechado':      'CLOSED'
  }


  static statusParaFront = {
    'OPEN':        'Aberto',
    'IN_PROGRESS': 'Em andamento',
    'PENDING':     'Em andamento',
    'RESOLVED':    'Concluído',
    'CLOSED':      'Fechado'
  }

  constructor(data = {}) {
    this.id         = data.id         ?? null
    this.authorId   = data.authorId   ?? null
    this.labId      = data.labId      ?? null
    this.titulo     = data.titulo     ?? ""
    this.descricao  = data.descricao  ?? ""
    this.status     = data.status     ?? "Aberto"
    this.prioridade = data.prioridade ?? "MEDIUM"
    this.createdAt  = data.createdAt  ?? Date.now()
    this.data       = data.data       ?? new Date().toLocaleDateString('pt-BR')
    this.comentario = data.comentario ?? ""
  }


  isValid() {
    if (!this.titulo?.trim())   return false
    if (!this.descricao?.trim()) return false
    if (!this.labId)             return false
    return true
  }


  matchesSearch(searchTerm) {
    if (!searchTerm) return true
    const term = searchTerm.toLowerCase()
    return [this.titulo, this.descricao, this.status]
      .map(v => (v || '').toLowerCase())
      .some(field => field.includes(term))
  }


  toAPI() {
    return {
      laboratoryId:      this.labId ? parseInt(this.labId.replace('lab', '')) : null,
      createdByUserId:   this.authorId ?? 1,
      title:             this.titulo,
      description:       this.descricao,
      status:            Chamado.statusParaAPI[this.status] ?? 'OPEN',
      priority:          this.prioridade ?? 'MEDIUM',
      resolutionComment: this.comentario ?? ''
    }
  }


  static fromAPI(ticket) {
    return new Chamado({
      id:         ticket.id,
      authorId:   ticket.createdByUserId,
      labId:      ticket.laboratoryId ? `lab${ticket.laboratoryId}` : null,
      titulo:     ticket.title,
      descricao:  ticket.description,
      status:     Chamado.statusParaFront[ticket.status] ?? ticket.status,
      prioridade: ticket.priority ?? 'MEDIUM',
      createdAt:  ticket.createdAt ? new Date(ticket.createdAt).getTime() : Date.now(),
      data:       ticket.createdAt ? new Date(ticket.createdAt).toLocaleDateString('pt-BR') : '',
      comentario: ticket.resolutionComment ?? ''
    })
  }
}
