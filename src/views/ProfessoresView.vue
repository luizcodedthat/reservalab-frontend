<script setup>
import { ref, computed, onMounted } from 'vue'
import AppLayout from '@/components/AppLayout.vue'
import { useUserStore } from '@/stores/useUserStore'
import { Search, Plus, UserCheck, UserX, Mail, Shield } from 'lucide-vue-next'

const userStore = useUserStore()
const search    = ref('')

onMounted(() => userStore.loadAllUsers())

const ROLE_LABEL = {
  STUDENT:    'Aluno',
  PROFESSOR:  'Professor',
  SECRETARY:  'Secretario(a)',
  TECHNICIAN: 'Tecnico(a)',
}

const filtered = computed(() => {
  const q = search.value.toLowerCase()
  return (userStore.allUsers ?? []).filter(u =>
    u.name?.toLowerCase().includes(q) ||
    u.email?.toLowerCase().includes(q) ||
    u.role?.toLowerCase().includes(q)
  )
})

function initials(name) {
  return (name || '').trim().split(' ').filter(Boolean).slice(0, 2).map(n => n[0].toUpperCase()).join('')
}
</script>

<template>
  <AppLayout>

    <div class="page-header">
      <div>
        <h1 class="page-title">Professores e Usuarios</h1>
        <p class="page-sub">Gerencie os usuarios cadastrados no sistema.</p>
      </div>
    </div>

    <!-- Barra de busca -->
    <div class="toolbar">
      <div class="search-box">
        <Search :size="14" color="#9ca3af" />
        <input v-model="search" placeholder="Buscar por nome, email ou perfil..." />
      </div>
    </div>

    <!-- Loading -->
    <div v-if="userStore.loading" class="empty-state">Carregando usuarios...</div>

    <!-- Tabela -->
    <div v-else class="card">
      <table class="table">
        <thead>
          <tr>
            <th>USUARIO</th>
            <th>EMAIL</th>
            <th>PERFIL</th>
            <th>STATUS</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="u in filtered" :key="u.id">
            <td>
              <div class="user-cell">
                <div class="avatar">{{ initials(u.name) }}</div>
                <div>
                  <div class="user-name">{{ u.name }}</div>
                  <div class="user-username">@{{ u.username }}</div>
                </div>
              </div>
            </td>
            <td>
              <div class="cell-with-icon">
                <Mail :size="13" color="#94a3b8" />
                {{ u.email }}
              </div>
            </td>
            <td>
              <div class="cell-with-icon">
                <Shield :size="13" color="#94a3b8" />
                {{ ROLE_LABEL[u.role] ?? u.role }}
              </div>
            </td>
            <td>
              <span class="status-pill" :class="u.active ? 'active' : 'inactive'">
                <component :is="u.active ? UserCheck : UserX" :size="11" />
                {{ u.active ? 'Ativo' : 'Inativo' }}
              </span>
            </td>
          </tr>
          <tr v-if="!filtered.length">
            <td colspan="4" class="empty-row">Nenhum usuario encontrado.</td>
          </tr>
        </tbody>
      </table>
    </div>

  </AppLayout>
</template>

<style scoped>
.page-header { display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 18px; }
.page-title  { font-size: 24px; font-weight: 800; color: #0f172a; margin: 0 0 3px; }
.page-sub    { font-size: 13px; color: #64748b; margin: 0; }

.toolbar     { display: flex; gap: 10px; margin-bottom: 14px; }
.search-box  {
  flex: 1; max-width: 380px; display: flex; align-items: center; gap: 8px;
  background: #fff; border: 1px solid #e8ecf0; border-radius: 8px; padding: 8px 12px;
}
.search-box input { border: none; background: none; outline: none; font-size: 13px; color: #374151; width: 100%; }
.search-box input::placeholder { color: #9ca3af; }

.card  { background: #fff; border: 1px solid #e8ecf0; border-radius: 12px; overflow: hidden; }
.table { width: 100%; border-collapse: collapse; }
.table th {
  font-size: 10.5px; font-weight: 600; color: #94a3b8;
  text-transform: uppercase; letter-spacing: 0.5px;
  padding: 12px 16px; text-align: left;
  border-bottom: 1px solid #f1f5f9; background: #fafafa;
}
.table td {
  padding: 12px 16px; font-size: 13px; color: #374151;
  border-bottom: 1px solid #f8fafc; vertical-align: middle;
}
.table tr:last-child td { border-bottom: none; }
.table tr:hover td { background: #fafafa; }

.user-cell   { display: flex; align-items: center; gap: 10px; }
.avatar      {
  width: 32px; height: 32px; border-radius: 50%; background: #e2e8f0;
  display: flex; align-items: center; justify-content: center;
  font-size: 11px; font-weight: 700; color: #475569; flex-shrink: 0;
}
.user-name     { font-size: 13px; font-weight: 600; color: #0f172a; }
.user-username { font-size: 11.5px; color: #94a3b8; }

.cell-with-icon { display: flex; align-items: center; gap: 6px; }

.status-pill {
  display: inline-flex; align-items: center; gap: 4px;
  font-size: 11px; font-weight: 600; padding: 3px 9px; border-radius: 6px;
}
.active   { background: #f0fdf4; color: #16a34a; }
.inactive { background: #fef2f2; color: #ef4444; }

.empty-state { text-align: center; padding: 40px; color: #94a3b8; font-size: 13px; }
.empty-row   { text-align: center; color: #94a3b8; padding: 24px !important; }
</style>
