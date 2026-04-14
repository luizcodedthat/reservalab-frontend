import { defineStore } from 'pinia'
import UserService from '@/services/UserService'

export const useUserStore = defineStore('users', {
  state: () => ({
    usersById:   {},   // { userId: User }
    lastFetched: {},   // { userId: timestamp }
    allUsers:    [],   // lista completa (carregada sob demanda)
    loading:     false
  }),

  getters: {
    getUserById: (state) => (id) => state.usersById[id] ?? null
  },

  actions: {

    async loadUser(userId, forceRefresh = false) {
      const FIVE_MIN = 5 * 60 * 1000
      const now = Date.now()

      if (
        !forceRefresh &&
        this.usersById[userId] &&
        now - this.lastFetched[userId] < FIVE_MIN
      ) {
        return this.usersById[userId]
      }

      this.loading = true
      try {
        const user = await UserService.getUserById(userId)
        this.usersById[userId] = user
        this.lastFetched[userId] = now
        return user
      } finally {
        this.loading = false
      }
    },

    async loadAllUsers(forceRefresh = false) {
      if (!forceRefresh && this.allUsers.length > 0) return

      this.loading = true
      try {
        const users = await UserService.getAllUsers()
        this.allUsers = users
        users.forEach(u => {
          this.usersById[u.id] = u
          this.lastFetched[u.id] = Date.now()
        })
      } finally {
        this.loading = false
      }
    },

    async updateUser(id, updates) {
      this.loading = true
      try {
        const updated = await UserService.updateUser(id, updates)
        this.usersById[id] = updated
        this.lastFetched[id] = Date.now()

        const index = this.allUsers.findIndex(u => u.id === id)
        if (index !== -1) this.allUsers[index] = updated

        return updated
      } finally {
        this.loading = false
      }
    },

    async deactivateUser(id) {
      this.loading = true
      try {
        const updated = await UserService.deactivateUser(id)
        this.usersById[id] = updated
        const index = this.allUsers.findIndex(u => u.id === id)
        if (index !== -1) this.allUsers[index] = updated
        return updated
      } finally {
        this.loading = false
      }
    },

    async deleteUser(id) {
      this.loading = true
      try {
        await UserService.deleteUser(id)
        delete this.usersById[id]
        delete this.lastFetched[id]
        this.allUsers = this.allUsers.filter(u => u.id !== id)
      } finally {
        this.loading = false
      }
    }
  }
})
