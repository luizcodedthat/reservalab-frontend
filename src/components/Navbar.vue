<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/useAuthStore'
import AppLogo from './AppLogo.vue'
import Avatar from '@/assets/images/Avatar.svg'

defineOptions({
  name: "AppNavbar"
})

const showModal = ref(false)
const router = useRouter()

const authStore = useAuthStore()

const userName = computed(() => {
  const fullName = authStore.user?.name || "Usuário"

  const parts = fullName.trim().split(" ")


  if (parts.length === 1) return parts[0]


  return parts[0] + " " + parts[1]
})

const toggleModal = () => {
  showModal.value = !showModal.value
}

const logout = async () => {
  await authStore.doLogout()
  router.push('/login')
}
</script>

<template>
  <nav class="navbar">
    <div class="navbar-content">
      <AppLogo :width="40" />

      <ul class="nav-links">
        <li><router-link to="/laboratorios">Laboratórios</router-link></li>
        <li><router-link to="/Chamados">Chamados</router-link></li>
      </ul>

      <div class="nav-user">
        <button @click="toggleModal">Olá, {{ userName }}</button>
        <img :src="Avatar" alt="Avatar" width="40" />

        <div v-if="showModal" class="dropdown-menu">
          <p class="logout" @click="logout">Sair</p>
        </div>
      </div>
    </div>
  </nav>
</template>


<style scoped>
.navbar {
    background-color: #ffffff;
    color: #333;
    padding: 10px 20px;
}

.navbar-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.nav-links {
    list-style: none;
    display: flex;
    gap: 20px;
    margin: 0;
    padding: 0;
}

.nav-links li a {
    text-decoration: none;
    color: #333;
    font-weight: 500;
}

.nav-links li a:hover {
    color: #007BFF;
}

.nav-user {
  position: relative;
  display: flex;
  align-items: center;
  gap: 10px;
}

.nav-user button {
  background: none;
  border: none;
  cursor: pointer;
  font-weight: 500;
  color: #333;
}

.nav-user button:hover {
  color: #007BFF;
}


.dropdown-menu {
  position: absolute;
  top: 110%;
  right: 0;
  background: white;
  color: black;
  border-radius: 6px;
  box-shadow: 0 2px 6px rgba(0,0,0,0.2);
  padding: 10px;
  min-width: 150px;
  z-index: 10;
}

.dropdown-menu p {
  margin: 8px 0;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 4px;
  transition: all 0.2s ease;
}


.dropdown-menu p:not(.logout):hover {
  background: #f1f1f1;
}


.dropdown-menu p.logout:hover {
  color: #007BFF;

}
</style>
