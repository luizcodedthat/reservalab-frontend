import http from '@/api/http'
import { User } from '@/models/UserModel'

class UserService {

  async getAllUsers() {
    const response = await http.get('users')
    return response.data.map(d => User.fromAPI(d))
  }

  async getUserById(id) {
    const response = await http.get(`users/${id}`)
    return User.fromAPI(response.data)
  }

  async getUserByEmail(email) {
    const response = await http.get('users/by-email', { params: { email } })
    return User.fromAPI(response.data)
  }

  async getUserByUsername(username) {
    const response = await http.get('users/by-username', { params: { username } })
    return User.fromAPI(response.data)
  }

  async getUsersByRole(role) {
    const response = await http.get('users/by-role', { params: { role } })
    return response.data.map(d => User.fromAPI(d))
  }

  async createUser(userData) {
    const user = User.fromAPI(userData)
    if (!user.isValid()) throw new Error('Dados do usuario sao invalidos')
    const response = await http.post('auth/register', user.toRegisterPayload(userData.password))
    return User.fromAPI(response.data.user)
  }

  /**
   * Atualiza dados do usuario.
   * IMPORTANTE: envia APENAS os campos fornecidos, nunca sobrescreve
   * campos omitidos (como role) com valores default.
   */
  async updateUser(id, updates) {
    // Monta payload apenas com os campos presentes em updates
    const payload = {}
    if (updates.name     !== undefined) payload.name     = updates.name
    if (updates.username !== undefined) payload.username  = updates.username
    if (updates.email    !== undefined) payload.email     = updates.email
    if (updates.role     !== undefined) payload.role      = updates.role
    if (updates.active   !== undefined) payload.active    = updates.active
    if (updates.password !== undefined && updates.password !== '') {
      payload.password = updates.password
    }

    const response = await http.put(`users/${id}`, payload)
    return User.fromAPI(response.data)
  }

  async deactivateUser(id) {
    const response = await http.patch(`users/${id}/deactivate`)
    return User.fromAPI(response.data)
  }

  async deleteUser(id) {
    await http.delete(`users/${id}`)
    return true
  }
}

export default new UserService()
