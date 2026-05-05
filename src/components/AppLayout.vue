<script setup>
import { ref, computed } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/useAuthStore'
import {
  LayoutDashboard, Calendar, FlaskConical, Activity,
  Ticket, BookOpen, Settings, LogOut, Users, Bell,
  Search, HelpCircle, ChevronDown, Wrench
} from 'lucide-vue-next'
import Avatar from '@/assets/images/Avatar.svg'

defineProps({
  campus: { type: String, default: 'IF Campus Palmares' }
})

const auth   = useAuthStore()
const route  = useRoute()
const router = useRouter()

const showMenu = ref(false)

const portalLabel = computed(() => ({
  STUDENT:    'Portal do Aluno',
  PROFESSOR:  'Portal do Professor',
  SECRETARY:  'Secretaria Administrativa',
  TECHNICIAN: 'Suporte Tecnico',
}[auth.user?.role] ?? 'ReservaLab Portal'))

const mainNav = computed(() => {
  const role = auth.user?.role
  if (role === 'STUDENT') return [
    { label: 'Dashboard',      icon: LayoutDashboard, to: '/dashboard/aluno' },
    { label: 'Consultar Labs', icon: FlaskConical,    to: '/laboratorios' },
    { label: 'Status de Uso',  icon: Activity,        to: '/status' },
  ]
  if (role === 'PROFESSOR') return [
    { label: 'Dashboard',       icon: LayoutDashboard, to: '/dashboard/professor' },
    { label: 'Minhas Reservas', icon: Calendar,        to: '/reservas' },
    { label: 'Meus Chamados',   icon: Ticket,          to: '/chamados' },
    { label: 'Consultar Labs',  icon: FlaskConical,    to: '/laboratorios' },
    { label: 'Status de Uso',   icon: Activity,        to: '/status' },
  ]
  return [
    { label: 'Dashboard',      icon: LayoutDashboard, to: '/dashboard/secretaria' },
    { label: 'Laboratórios',   icon: FlaskConical,    to: '/laboratorios' },
    { label: 'Gerenciar Labs', icon: Wrench,          to: '/gerenciar-laboratorios' },
    { label: 'Reservas',       icon: Calendar,        to: '/reservas' },
    { label: 'Chamados',       icon: Ticket,          to: '/chamados' },
    { label: 'Usuários',       icon: Users,           to: '/professores' },
    { label: 'Configurações',  icon: Settings,        to: '/configuracoes' },
  ]
})

const showSettingsInFooter = computed(() =>
  ['STUDENT', 'PROFESSOR'].includes(auth.user?.role)
)

function isActive(to) { return route.path === to }

function goDashboard() {
  showMenu.value = false
  router.push(auth.user?.dashboardRoute || '/login')
}

function logout() {
  showMenu.value = false
  auth.doLogout()
  router.push('/login')
}
</script>

<template>
  <div class="layout">
    <!-- Sidebar -->
    <aside class="sidebar">
      <div class="brand">
        <div class="brand-icon">
          <FlaskConical :size="17" color="white" />
        </div>
        <div class="brand-text">
          <span class="brand-name">ReservaLab</span>
          <span class="brand-sub">{{ portalLabel }}</span>
        </div>
      </div>

      <nav class="nav">
        <RouterLink
          v-for="item in mainNav"
          :key="item.to"
          :to="item.to"
          class="nav-link"
          :class="{ active: isActive(item.to) }"
        >
          <component :is="item.icon" :size="16" />
          <span>{{ item.label }}</span>
        </RouterLink>
      </nav>

      <div class="nav-footer">
        <RouterLink v-if="showSettingsInFooter" to="/configuracoes" class="nav-link">
          <Settings :size="16" />
          <span>Configurações</span>
        </RouterLink>
        <button class="nav-link logout-btn" @click="logout">
          <LogOut :size="16" />
          <span>Sair</span>
        </button>
      </div>
    </aside>

    <!-- Wrapper direito -->
    <div class="main-wrapper">
      <header class="topbar">
        <span class="campus-label">{{ campus }}</span>



        <div class="topbar-right">
          <button v-if="auth.user?.isAdmin()" class="icon-btn">
            <HelpCircle :size="18" color="#6b7280" />
          </button>
          <button class="icon-btn notif-btn">
            <Bell :size="18" color="#6b7280" />
            <span class="notif-dot"></span>
          </button>

          <!-- User dropdown -->
          <div class="nav-user">
            <button class="user-btn" @click="showMenu = !showMenu">
              <img :src="Avatar" alt="Avatar" class="avatar" />
              <span>{{ auth.user?.name }}</span>
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
      </header>

      <main class="page-content">
        <slot />
      </main>
    </div>
  </div>
</template>

<style scoped>
*, *::before, *::after { box-sizing: border-box; }

.layout {
  display: flex;
  height: 100vh;
  font-family: 'DM Sans', 'Inter', -apple-system, sans-serif;
  background: #f8fafc;
}

/* ===== Sidebar ===== */
.sidebar {
  width: 215px;
  min-width: 215px;
  background: #fff;
  border-right: 1px solid #e8ecf0;
  display: flex;
  flex-direction: column;
  padding: 22px 0;
}

.brand {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 0 18px 20px;
  border-bottom: 1px solid #f1f5f9;
  margin-bottom: 14px;
}

.brand-icon {
  width: 34px;
  height: 34px;
  background: #16a34a;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.brand-name { display: block; font-size: 13.5px; font-weight: 700; color: #0f172a; }
.brand-sub  { display: block; font-size: 10px; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.4px; margin-top: 1px; }

.nav { flex: 1; padding: 0 10px; display: flex; flex-direction: column; gap: 2px; overflow-y: auto; }

.nav-link {
  display: flex;
  align-items: center;
  gap: 9px;
  padding: 8px 10px;
  border-radius: 7px;
  color: #64748b;
  font-size: 13.5px;
  text-decoration: none;
  transition: all 0.13s;
  cursor: pointer;
  border: none;
  background: none;
  width: 100%;
  text-align: left;
}
.nav-link:hover  { background: #f1f5f9; color: #0f172a; }
.nav-link.active { background: #f0fdf4; color: #16a34a; font-weight: 600; }

.nav-footer {
  padding: 14px 10px 0;
  border-top: 1px solid #f1f5f9;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.logout-btn       { color: #ef4444; }
.logout-btn:hover { background: #fef2f2; color: #dc2626; }

/* ===== Main wrapper ===== */
.main-wrapper { flex: 1; display: flex; flex-direction: column; overflow: hidden; }

.topbar {
  height: 58px;
  background: #fff;
  border-bottom: 1px solid #e8ecf0;
  display: flex;
  align-items: center;
  padding: 0 24px;
  gap: 16px;
  flex-shrink: 0;
}

.campus-label { font-size: 13px; color: #64748b; font-weight: 500; min-width: 90px; }

.search-box {
  flex: 1;
  max-width: 360px;
  display: flex;
  align-items: center;
  gap: 8px;
  background: #f8fafc;
  border: 1px solid #e8ecf0;
  border-radius: 8px;
  padding: 7px 12px;
}
.search-box input {
  border: none;
  background: none;
  outline: none;
  font-size: 13px;
  color: #374151;
  width: 100%;
}
.search-box input::placeholder { color: #9ca3af; }

.topbar-right { margin-left: auto; display: flex; align-items: center; gap: 10px; }

.icon-btn { background: none; border: none; cursor: pointer; padding: 5px; position: relative; }

.notif-btn .notif-dot {
  position: absolute;
  top: 3px;
  right: 3px;
  width: 7px;
  height: 7px;
  background: #ef4444;
  border-radius: 50%;
  border: 1.5px solid white;
}

/* ===== User dropdown ===== */
.nav-user { position: relative; }

.user-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  background: none;
  border: 1px solid #e8ecf0;
  border-radius: 9px;
  padding: 5px 10px 5px 5px;
  cursor: pointer;
  font-size: 13px;
  font-weight: 500;
  color: #374151;
  transition: all 0.13s;
}
.user-btn:hover { background: #f8fafc; border-color: #d1d5db; }

.avatar { width: 28px; height: 28px; border-radius: 50%; object-fit: cover; }

.rotated { transform: rotate(180deg); transition: transform 0.2s; }

.dropdown {
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  background: #fff;
  border: 1px solid #e8ecf0;
  border-radius: 10px;
  box-shadow: 0 8px 24px rgba(0,0,0,0.1);
  min-width: 200px;
  overflow: hidden;
  z-index: 100;
}

.dropdown-header { padding: 12px 14px 10px; }
.d-name { font-size: 13px; font-weight: 600; color: #0f172a; }
.d-role { font-size: 11.5px; color: #94a3b8; margin-top: 2px; }
.divider { height: 1px; background: #f1f5f9; }

.d-item {
  display: flex;
  align-items: center;
  gap: 9px;
  width: 100%;
  padding: 10px 14px;
  background: none;
  border: none;
  font-size: 13px;
  color: #374151;
  cursor: pointer;
  text-align: left;
  transition: background 0.13s;
}
.d-item:hover { background: #f8fafc; }
.d-item.danger { color: #ef4444; }
.d-item.danger:hover { background: #fef2f2; }

.dropdown-enter-active, .dropdown-leave-active { transition: opacity 0.15s, transform 0.15s; }
.dropdown-enter-from, .dropdown-leave-to { opacity: 0; transform: translateY(-6px); }

.page-content { flex: 1; overflow-y: auto; padding: 26px; }
</style>
