export class Lab {
  constructor(data = {}) {
    this.id = data.id ?? null
    this.name = data.name ?? ''
    this.code = data.code ?? ''

    this.description = data.description ?? ''

    this.capacity = data.capacity ?? 0
    this.computerCount = data.computerCount ?? 0

    this.building = data.building ?? ''
    this.floor = data.floor ?? ''

    this.active = data.active ?? true

    this.createdAt = data.createdAt ?? null
    this.updatedAt = data.updatedAt ?? null
  }

  isValid() {
    if (!this.name.trim()) return false
    if (!this.code.trim()) return false
    if (!this.capacity || this.capacity <= 0) return false

    return true
  }

  canBeUsed() {
    return this.active === true
  }

  getLocation() {
    return [this.building, this.floor].filter(Boolean).join(' • ')
  }

  matchesSearch(searchTerm) {
    if (!searchTerm) return true

    const term = searchTerm.toLowerCase()

    const fields = [
      this.name.toLowerCase(),
      this.code.toLowerCase(),
      this.description.toLowerCase(),
      this.building.toLowerCase()
    ]

    return fields.some(field => field.includes(term))
  }

  toJSON() {
    return {
      id: this.id,
      name: this.name,
      code: this.code,
      description: this.description,
      capacity: this.capacity,
      computerCount: this.computerCount,
      building: this.building,
      floor: this.floor,
      active: this.active,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    }
  }
}