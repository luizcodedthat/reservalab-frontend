<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/useAuthStore'
import AppLogo from './AppLogo.vue'
import Avatar from '@/assets/images/Avatar.svg'
import { LayoutDashboard, LogOut, ChevronDown } from 'lucide-vue-next'

defineOptions({ name: 'AppNavbar' })

const showMenu = ref(false)
const router   = useRouter()
const auth     = useAuthStore()

const userName = computed(() => {
  const parts = (auth.user?.name || 'Usuario').trim().split(' ')
  return parts.length === 1 ? parts[0] : `${parts[0]} ${parts[1]}`
})

function toggle()   { showMenu.value = !showMenu.value }
function close()    { showMenu.value = false }

function goDashboard() {
  close()
  router.push(auth.user?.dashboardRoute || '/login')
}

function logout() {
  close()
  auth.doLogout()
  router.push('/login')
}
</script>

<template>
  <nav class="navbar">
    <div class="navbar-content">
      <AppLogo :width="40" />

      <ul class="nav-links">
        <li><router-link to="/laboratorios">Laboratórios</router-link></li>
        <li><router-link to="/chamados">Chamados</router-link></li>
      </ul>

      <div class="nav-user">
        <button class="user-btn" @click="toggle">
          <img :src="Avatar" alt="Avatar" class="avatar" />
          <span>{{ userName }}</span>
          <ChevronDown :size="14" :class="{ rotated: showMenu }" />
        </button>

        <Transition name="dropdown">
          <div v-if="showMenu" class="dropdown">
            <div class="dropdown-header">
              <div class="d-name">{{ auth.user?.name }}</div>
              <div class="d-role">{{ auth.user?.roleLabel }}</div>
            </div>
            <div class="divider" />
            <button class="d-item" @click="goDashboard">
              <LayoutDashboard :size="15" /> Meu Dashboard
            </button>
            <div class="divider" />
            <button class="d-item danger" @click="logout">
              <LogOut :size="15" /> Sair
            </button>
          </div>
        </Transition>
      </div>
    </div>
  </nav>
</template>

<style scoped>
.navbar {
  background: var(--color-white);
  border-bottom: 1px solid var(--color-gray-border);
  padding: 0 24px;
  height: 56px;
  display: flex;
  align-items: center;
}

.navbar-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
}

.nav-links {
  list-style: none;
  display: flex;
  gap: 4px;
  margin: 0;
  padding: 0;
}

.nav-links li a {
  text-decoration: none;
  color: var(--color-gray-text);
  font-size: 13.5px;
  font-weight: 500;
  padding: 6px 12px;
  border-radius: 7px;
  transition: all 0.13s;
  font-family: var(--font-family-body);
}

.nav-links li a:hover,
.nav-links li a.router-link-active {
  color: #035261;
  background: #EBF6EC;
}

.nav-user {
  position: relative;
}

.user-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  background: none;
  border: 1px solid var(--color-gray-border);
  border-radius: 9px;
  padding: 5px 10px 5px 5px;
  cursor: pointer;
  font-size: 13px;
  font-weight: 500;
  color: var(--color-black);
  transition: all 0.13s;
  font-family: var(--font-family-body);
}

.user-btn:hover {
  background: var(--color-gray-background);
}

.avatar {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  object-fit: cover;
}

.rotated {
  transform: rotate(180deg);
  transition: transform 0.2s;
}

.dropdown {
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  background: var(--color-white);
  border: 1px solid var(--color-gray-border);
  border-radius: 10px;
  box-shadow: 0 8px 24px rgba(0,0,0,0.1);
  min-width: 200px;
  overflow: hidden;
  z-index: 100;
}

.dropdown-header {
  padding: 12px 14px 10px;
}

.d-name {
  font-size: 13px;
  font-weight: 600;
  color: var(--color-black);
  font-family: var(--font-family-title);
}

.d-role {
  font-size: 11.5px;
  color: var(--color-gray-text);
  margin-top: 2px;
  font-family: var(--font-family-body);
}

.divider {
  height: 1px;
  background: var(--color-gray-background);
}

.d-item {
  display: flex;
  align-items: center;
  gap: 9px;
  width: 100%;
  padding: 10px 14px;
  background: none;
  border: none;
  font-size: 13px;
  color: var(--color-black);
  cursor: pointer;
  text-align: left;
  transition: background 0.13s;
  font-family: var(--font-family-body);
}

.d-item:hover {
  background: var(--color-gray-background);
}

.d-item.danger {
  color: #992923;
}

.d-item.danger:hover {
  background: #E6C9C7;
}

.dropdown-enter-active,
.dropdown-leave-active {
  transition: opacity 0.15s, transform 0.15s;
}

.dropdown-enter-from,
.dropdown-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}
</style>