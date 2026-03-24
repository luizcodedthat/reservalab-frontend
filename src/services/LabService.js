import { labApi } from '../api/labApi'
import { Lab } from '../models/LabModel'

class LabService {

  async getAllLabs(page = 0, size = 20) {
    const response = await labApi.getAll(page, size)
    const docs = response.data.content || []

    return docs.map(doc => new Lab(doc))
  }

  async getLabById(id) {
    const response = await labApi.getById(id)
    return new Lab(response.data)
  }

  async getLabComments(id, page = 0, size = 20) {
    const response = await labApi.getComments(id, page, size)
    return response.data.content
  }

  async searchLabs(searchTerm) {
    if (!searchTerm || !searchTerm.trim()) {
      return this.getAllLabs()
    }

    const all = await this.getAllLabs()
    const term = searchTerm.toLowerCase()

    return all.filter(lab => lab.matchesSearch(term))
  }

  async getAvailableLabs() {
    const all = await this.getAllLabs()
    return all.filter(lab => lab.available === true)
  }
}

export default new LabService()