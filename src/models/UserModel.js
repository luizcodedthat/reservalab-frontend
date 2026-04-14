// Roles alinhadas ao enum UserRole.java do backend
export const USER_ROLES = {
  STUDENT:    'STUDENT',
  PROFESSOR:  'PROFESSOR',
  SECRETARY:  'SECRETARY',
  TECHNICIAN: 'TECHNICIAN'
}

export const USER_ROLES_LABEL = {
  STUDENT:    'Aluno',
  PROFESSOR:  'Professor',
  SECRETARY:  'Secretário(a)',
  TECHNICIAN: 'Técnico(a)'
}

export class User {
  constructor(data = {}) {
    this.id        = data.id        ?? null
    this.name      = data.name      ?? ''
    this.username  = data.username  ?? ''
    this.email     = data.email     ?? ''
    this.picture   = data.picture   ?? ''   // avatar/foto de perfil (campo local)
    this.role      = data.role      ?? USER_ROLES.STUDENT
    this.active    = data.active    ?? true
    this.createdAt = data.createdAt ?? null
    this.updatedAt = data.updatedAt ?? null
  }

  get roleLabel() {
    return USER_ROLES_LABEL[this.role] ?? this.role
  }

  /** Secretário e Técnico têm acesso administrativo */
  isAdmin() {
    return [USER_ROLES.SECRETARY, USER_ROLES.TECHNICIAN].includes(this.role)
  }

  isProfessor() {
    return this.role === USER_ROLES.PROFESSOR
  }

  isStudent() {
    return this.role === USER_ROLES.STUDENT
  }

  isValid() {
    if (!this.name?.trim())  return false
    if (!this.email?.trim()) return false
    return true
  }

  /** Usado no registro — envia para o backend */
  toRegisterPayload(password) {
    return {
      name:     this.name,
      username: this.username,
      email:    this.email,
      password,
      role:     this.role
    }
  }

  /** Usado na atualização de perfil */
  toUpdatePayload(password = null) {
    const payload = {
      name:     this.name,
      username: this.username,
      email:    this.email,
      role:     this.role,
      active:   this.active
    }
    if (password) payload.password = password
    return payload
  }

  /** Constrói User a partir da resposta da API */
  static fromAPI(data) {
    return new User(data)
  }
}
