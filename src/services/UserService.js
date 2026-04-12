import http from '@/api/http'
import { User } from '@/models/UserModel'

class UserService {

  async getAllUsers() {
    const response = await http.get('/users')
    return response.data.map(User.fromAPI)
  }

  async getUserById(id) {
    const response = await http.get(`/users/${id}`)
    return User.fromAPI(response.data)
  }

  async getUserByEmail(email) {
    const response = await http.get('/users/by-email', { params: { email } })
    return User.fromAPI(response.data)
  }

  async getUserByUsername(username) {
    const response = await http.get('/users/by-username', { params: { username } })
    return User.fromAPI(response.data)
  }

  async getUsersByRole(role) {
    const response = await http.get('/users/by-role', { params: { role } })
    return response.data.map(User.fromAPI)
  }

  async createUser(userData) {
    const user = User.fromAPI(userData)

    if (!user.isValid()) {
      throw new Error('Dados do usuário são inválidos')
    }

    // Criação passa pelo fluxo de registro do AuthController
    const response = await http.post('/auth/register', user.toRegisterPayload(userData.password))
    return User.fromAPI(response.data.user)
  }

  async updateUser(id, updates) {
    const user = User.fromAPI(updates)

    if (!user.isValid()) {
      throw new Error('Dados atualizados são inválidos')
    }

    const response = await http.put(`/users/${id}`, user.toUpdatePayload(updates.password))
    return User.fromAPI(response.data)
  }

  async deactivateUser(id) {
    const response = await http.patch(`/users/${id}/deactivate`)
    return User.fromAPI(response.data)
  }

  async deleteUser(id) {
    await http.delete(`/users/${id}`)
    return true
  }
}

export default new UserService()
