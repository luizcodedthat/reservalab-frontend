<script setup>
import { ref, computed, onMounted } from 'vue'
import AppLayout from '@/components/AppLayout.vue'
import { useUserStore } from '@/stores/useUserStore'
import {
  Search, Plus, UserCheck, UserX, Mail,
  Shield, Pencil, Trash2, X, Loader,
  Eye, EyeOff, CheckCircle2, AlertCircle
} from 'lucide-vue-next'

const userStore = useUserStore()
const search    = ref('')
const roleFilter = ref('TODOS')

onMounted(() => userStore.loadAllUsers())

const ROLE_OPTS = ['TODOS', 'STUDENT', 'PROFESSOR', 'SECRETARY', 'TECHNICIAN']
const ROLE_LABEL = {
  STUDENT:    'Aluno',
  PROFESSOR:  'Professor',
  SECRETARY:  'Secretário(a)',
  TECHNICIAN: 'Técnico(a)',
}
const ROLE_OPTIONS = [
  { value: 'STUDENT',    label: 'Aluno' },
  { value: 'PROFESSOR',  label: 'Professor' },
  { value: 'SECRETARY',  label: 'Secretário(a)' },
  { value: 'TECHNICIAN', label: 'Técnico(a)' },
]

const filtered = computed(() => {
  const q = search.value.toLowerCase()
  return (userStore.allUsers ?? []).filter(u => {
    const matchRole = roleFilter.value === 'TODOS' || u.role === roleFilter.value
    const matchQ = !q ||
      u.name?.toLowerCase().includes(q) ||
      u.email?.toLowerCase().includes(q) ||
      u.username?.toLowerCase().includes(q)
    return matchRole && matchQ
  })
})

function initials(name) {
  return (name || '').trim().split(' ').filter(Boolean)
    .slice(0, 2).map(n => n[0].toUpperCase()).join('')
}

// ─── Modal de CRIAÇÃO ────────────────────────────────────────────────────────
const showCreate  = ref(false)
const createError = ref('')
const creating    = ref(false)
const showCreatePw = ref(false)

const createForm = ref({
  name: '', username: '', email: '', password: '', role: 'STUDENT'
})

function openCreate() {
  createForm.value = { name: '', username: '', email: '', password: '', role: 'STUDENT' }
  createError.value = ''
  showCreate.value  = true
}

async function submitCreate() {
  createError.value = ''
  if (!createForm.value.name.trim())     { createError.value = 'Nome é obrigatório.'; return }
  if (!createForm.value.username.trim()) { createError.value = 'Username é obrigatório.'; return }
  if (!createForm.value.email.trim())    { createError.value = 'Email é obrigatório.'; return }
  if (createForm.value.password.length < 6) { createError.value = 'Senha deve ter ao menos 6 caracteres.'; return }

  creating.value = true
  try {
    // Usa o endpoint de registro do AuthController
    const http  = (await import('@/api/http')).default
    const { data } = await http.post('auth/register', {
      name:     createForm.value.name.trim(),
      username: createForm.value.username.trim(),
      email:    createForm.value.email.trim(),
      password: createForm.value.password,
      role:     createForm.value.role,
    })
    showCreate.value = false
    await userStore.loadAllUsers(true)
  } catch (err) {
    createError.value = err?.response?.data?.message || 'Erro ao criar usuário.'
  } finally {
    creating.value = false
  }
}

// ─── Modal de EDIÇÃO ─────────────────────────────────────────────────────────
const showEdit   = ref(false)
const editingUser = ref(null)
const editError  = ref('')
const editing    = ref(false)
const showEditPw = ref(false)

const editForm = ref({
  name: '', username: '', email: '', role: 'STUDENT', active: true, password: ''
})

function openEdit(u) {
  editForm.value = {
    name:     u.name     || '',
    username: u.username || '',
    email:    u.email    || '',
    role:     u.role     || 'STUDENT',
    active:   u.active   ?? true,
    password: '',
  }
  editError.value  = ''
  editingUser.value = u
  showEdit.value   = true
}

async function submitEdit() {
  editError.value = ''
  if (!editForm.value.name.trim())  { editError.value = 'Nome é obrigatório.'; return }
  if (!editForm.value.email.trim()) { editError.value = 'Email é obrigatório.'; return }

  editing.value = true
  try {
    const updates = {
      name:     editForm.value.name.trim(),
      username: editForm.value.username.trim(),
      email:    editForm.value.email.trim(),
      role:     editForm.value.role,
      active:   editForm.value.active,
    }
    if (editForm.value.password.trim()) {
      updates.password = editForm.value.password
    }
    await userStore.updateUser(editingUser.value.id, updates)
    showEdit.value = false
  } catch (err) {
    editError.value = err?.response?.data?.message || 'Erro ao atualizar usuário.'
  } finally {
    editing.value = false
  }
}

// ─── Desativar / Ativar ───────────────────────────────────────────────────────
const togglingId = ref(null)

async function toggleActive(u) {
  const action = u.active ? 'desativar' : 'ativar'
  if (!confirm(`Deseja ${action} o usuário ${u.name}?`)) return
  togglingId.value = u.id
  try {
    if (u.active) {
      await userStore.deactivateUser(u.id)
    } else {
      await userStore.updateUser(u.id, { active: true })
    }
  } catch (err) {
    alert(err?.response?.data?.message || `Erro ao ${action} usuário.`)
  } finally {
    togglingId.value = null
  }
}

// ─── Deletar ─────────────────────────────────────────────────────────────────
const deletingId = ref(null)

async function deleteUser(u) {
  if (!confirm(`Deseja EXCLUIR permanentemente o usuário ${u.name}?\n\nEsta ação não pode ser desfeita.`)) return
  deletingId.value = u.id
  try {
    await userStore.deleteUser(u.id)
  } catch (err) {
    alert(err?.response?.data?.message || 'Erro ao excluir usuário.')
  } finally {
    deletingId.value = null
  }
}
</script>

<template>
  <AppLayout>

    <!-- Header -->
    <div class="page-header">
      <div>
        <h1 class="page-title">Usuários</h1>
        <p class="page-sub">Cadastre, edite e gerencie todos os usuários do sistema.</p>
      </div>
      <button class="btn-primary" @click="openCreate">
        <Plus :size="15" color="#fff" /> Novo Usuário
      </button>
    </div>

    <!-- Toolbar -->
    <div class="toolbar">
      <div class="search-box">
        <Search :size="14" color="#9ca3af" />
        <input v-model="search" placeholder="Buscar por nome, email ou username..." />
      </div>
      <div class="filters">
        <button
          v-for="opt in ROLE_OPTS" :key="opt"
          class="filter-btn"
          :class="{ active: roleFilter === opt }"
          @click="roleFilter = opt"
        >{{ opt === 'TODOS' ? 'Todos' : ROLE_LABEL[opt] }}</button>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="userStore.loading && !userStore.allUsers.length" class="empty-state">
      Carregando usuários...
    </div>

    <!-- Tabela -->
    <div v-else class="card">
      <table class="table">
        <thead>
          <tr>
            <th>USUÁRIO</th>
            <th>EMAIL</th>
            <th>PERFIL</th>
            <th>STATUS</th>
            <th>AÇÕES</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="u in filtered" :key="u.id">
            <td>
              <div class="user-cell">
                <div class="avatar" :class="u.active ? '' : 'avatar-inactive'">
                  {{ initials(u.name) }}
                </div>
                <div>
                  <div class="user-name">{{ u.name }}</div>
                  <div class="user-username">@{{ u.username }}</div>
                </div>
              </div>
            </td>
            <td>
              <div class="cell-with-icon">
                <Mail :size="13" color="#94a3b8" /> {{ u.email }}
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
            <td>
              <div class="actions">
                <!-- Editar -->
                <button class="act-btn blue" title="Editar" @click="openEdit(u)">
                  <Pencil :size="13" />
                </button>

                <!-- Ativar / Desativar -->
                <button
                  class="act-btn"
                  :class="u.active ? 'yellow' : 'green'"
                  :title="u.active ? 'Desativar' : 'Ativar'"
                  :disabled="togglingId === u.id"
                  @click="toggleActive(u)"
                >
                  <Loader v-if="togglingId === u.id" :size="13" class="spinning" />
                  <UserX  v-else-if="u.active" :size="13" />
                  <UserCheck v-else :size="13" />
                </button>

                <!-- Deletar -->
                <button
                  class="act-btn red"
                  title="Excluir permanentemente"
                  :disabled="deletingId === u.id"
                  @click="deleteUser(u)"
                >
                  <Loader  v-if="deletingId === u.id" :size="13" class="spinning" />
                  <Trash2  v-else :size="13" />
                </button>
              </div>
            </td>
          </tr>
          <tr v-if="!filtered.length">
            <td colspan="5" class="empty-row">Nenhum usuário encontrado.</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- ─── Modal CRIAR ──────────────────────────────────────────────────────── -->
    <Teleport to="body">
      <Transition name="fade">
        <div v-if="showCreate" class="overlay" @click.self="showCreate = false">
          <div class="modal">
            <div class="modal-head">
              <h2 class="modal-title">Novo Usuário</h2>
              <button class="modal-close" @click="showCreate = false"><X :size="18" /></button>
            </div>
            <div class="modal-body">
              <div v-if="createError" class="form-error">
                <AlertCircle :size="14" /> {{ createError }}
              </div>

              <div class="field">
                <label>Nome completo *</label>
                <input v-model="createForm.name" type="text" placeholder="Nome do usuário" />
              </div>
              <div class="field-row">
                <div class="field">
                  <label>Username *</label>
                  <input v-model="createForm.username" type="text" placeholder="usuario.nome" />
                </div>
                <div class="field">
                  <label>Perfil *</label>
                  <select v-model="createForm.role">
                    <option v-for="r in ROLE_OPTIONS" :key="r.value" :value="r.value">{{ r.label }}</option>
                  </select>
                </div>
              </div>
              <div class="field">
                <label>Email *</label>
                <input v-model="createForm.email" type="email" placeholder="email@ifpe.edu.br" />
              </div>
              <div class="field">
                <label>Senha * (mínimo 6 caracteres)</label>
                <div class="pw-wrap">
                  <input v-model="createForm.password" :type="showCreatePw ? 'text' : 'password'" placeholder="••••••" />
                  <button class="pw-eye" @click="showCreatePw = !showCreatePw">
                    <component :is="showCreatePw ? EyeOff : Eye" :size="15" color="#94a3b8" />
                  </button>
                </div>
              </div>
            </div>
            <div class="modal-foot">
              <button class="btn-ghost" @click="showCreate = false">Cancelar</button>
              <button class="btn-primary" :disabled="creating" @click="submitCreate">
                <Loader v-if="creating" :size="14" class="spinning" />
                <span style="color: #fff;" v-else>Criar Usuário</span>
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- ─── Modal EDITAR ─────────────────────────────────────────────────────── -->
    <Teleport to="body">
      <Transition name="fade">
        <div v-if="showEdit" class="overlay" @click.self="showEdit = false">
          <div class="modal">
            <div class="modal-head">
              <h2 class="modal-title">Editar Usuário</h2>
              <button class="modal-close" @click="showEdit = false"><X :size="18" /></button>
            </div>
            <div class="modal-body">
              <div v-if="editError" class="form-error">
                <AlertCircle :size="14" /> {{ editError }}
              </div>

              <div class="field">
                <label>Nome completo *</label>
                <input v-model="editForm.name" type="text" />
              </div>
              <div class="field-row">
                <div class="field">
                  <label>Username</label>
                  <input v-model="editForm.username" type="text" />
                </div>
                <div class="field">
                  <label>Perfil</label>
                  <select v-model="editForm.role">
                    <option v-for="r in ROLE_OPTIONS" :key="r.value" :value="r.value">{{ r.label }}</option>
                  </select>
                </div>
              </div>
              <div class="field">
                <label>Email *</label>
                <input v-model="editForm.email" type="email" />
              </div>
              <div class="field">
                <label>Status</label>
                <select v-model="editForm.active">
                  <option :value="true">Ativo</option>
                  <option :value="false">Inativo</option>
                </select>
              </div>
              <div class="field">
                <label>Nova senha <span class="field-opt">(deixe vazio para não alterar)</span></label>
                <div class="pw-wrap">
                  <input v-model="editForm.password" :type="showEditPw ? 'text' : 'password'" placeholder="Nova senha (opcional)" />
                  <button class="pw-eye" @click="showEditPw = !showEditPw">
                    <component :is="showEditPw ? EyeOff : Eye" :size="15" color="#94a3b8" />
                  </button>
                </div>
              </div>
            </div>
            <div class="modal-foot">
              <button class="btn-ghost" @click="showEdit = false">Cancelar</button>
              <button class="btn-primary" :disabled="editing" @click="submitEdit">
                <Loader v-if="editing" :size="14" class="spinning" />
                <span v-else>Salvar Alterações</span>
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

  </AppLayout>
</template>

<style scoped>
.page-header { display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 18px; }
.page-title  { font-size: 24px; font-weight: 800; color: #0f172a; margin: 0 0 3px; }
.page-sub    { font-size: 13px; color: #64748b; margin: 0; }

.btn-primary { display: flex; align-items: center; gap: 6px; background: #16a34a; color: #fff; border: none; padding: 9px 18px; border-radius: 8px; font-size: 13.5px; font-weight: 600; cursor: pointer; }
.btn-primary:hover:not(:disabled) { background: #15803d; }
.btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }

.toolbar    { display: flex; gap: 12px; margin-bottom: 16px; flex-wrap: wrap; }
.search-box { display: flex; align-items: center; gap: 8px; background: #fff; border: 1px solid #e8ecf0; border-radius: 8px; padding: 8px 12px; flex: 1; max-width: 380px; }
.search-box input { border: none; background: none; outline: none; font-size: 13px; color: #374151; width: 100%; }
.search-box input::placeholder { color: #9ca3af; }
.filters    { display: flex; gap: 6px; flex-wrap: wrap; }
.filter-btn { background: #fff; border: 1px solid #e8ecf0; border-radius: 6px; padding: 5px 12px; font-size: 12px; color: #64748b; cursor: pointer; transition: all 0.13s; }
.filter-btn:hover  { background: #f1f5f9; }
.filter-btn.active { background: #16a34a; color: #fff; border-color: #16a34a; font-weight: 600; }

.empty-state { text-align: center; padding: 40px; color: #94a3b8; font-size: 13px; }

.card  { background: #fff; border: 1px solid #e8ecf0; border-radius: 12px; overflow: hidden; }
.table { width: 100%; border-collapse: collapse; }
.table th { font-size: 10.5px; font-weight: 600; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.5px; padding: 12px 16px; text-align: left; border-bottom: 1px solid #f1f5f9; background: #fafafa; }
.table td { padding: 12px 16px; font-size: 13px; color: #374151; border-bottom: 1px solid #f8fafc; vertical-align: middle; }
.table tr:last-child td { border-bottom: none; }
.table tr:hover td { background: #fafafa; }

.user-cell   { display: flex; align-items: center; gap: 10px; }
.avatar      { width: 32px; height: 32px; border-radius: 50%; background: #e2e8f0; display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 700; color: #475569; flex-shrink: 0; }
.avatar-inactive { opacity: 0.5; }
.user-name     { font-size: 13px; font-weight: 600; color: #0f172a; }
.user-username { font-size: 11.5px; color: #94a3b8; }

.cell-with-icon { display: flex; align-items: center; gap: 6px; }

.status-pill { display: inline-flex; align-items: center; gap: 4px; font-size: 11px; font-weight: 600; padding: 3px 9px; border-radius: 6px; }
.active   { background: #f0fdf4; color: #16a34a; }
.inactive { background: #fef2f2; color: #ef4444; }

.actions { display: flex; gap: 6px; }
.act-btn  { border-radius: 7px; width: 30px; height: 30px; display: flex; align-items: center; justify-content: center; cursor: pointer; border: 1px solid; transition: all 0.13s; background: none; flex-shrink: 0; }
.act-btn:disabled { opacity: 0.5; cursor: not-allowed; }
.act-btn.blue   { border-color: #bfdbfe; color: #3b82f6; }
.act-btn.blue:hover:not(:disabled)   { background: #eff6ff; }
.act-btn.yellow { border-color: #fde68a; color: #d97706; }
.act-btn.yellow:hover:not(:disabled) { background: #fefce8; }
.act-btn.green  { border-color: #bbf7d0; color: #16a34a; }
.act-btn.green:hover:not(:disabled)  { background: #f0fdf4; }
.act-btn.red    { border-color: #fecaca; color: #ef4444; }
.act-btn.red:hover:not(:disabled)    { background: #fef2f2; }

.empty-row { text-align: center; color: #94a3b8; padding: 24px !important; }

@keyframes spin { to { transform: rotate(360deg); } }
.spinning { animation: spin 1s linear infinite; }

/* ─── Modais ─── */
.overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.45); display: flex; align-items: center; justify-content: center; z-index: 1000; padding: 20px; }
.modal   { background: #fff; border-radius: 14px; width: 100%; max-width: 500px; box-shadow: 0 20px 60px rgba(0,0,0,0.18); max-height: 90vh; overflow-y: auto; }
.modal-head { display: flex; justify-content: space-between; align-items: center; padding: 20px 22px 0; position: sticky; top: 0; background: #fff; z-index: 1; }
.modal-title { font-size: 17px; font-weight: 700; color: #0f172a; margin: 0; }
.modal-close { background: none; border: none; cursor: pointer; color: #94a3b8; padding: 4px; border-radius: 6px; }
.modal-close:hover { background: #f1f5f9; }
.modal-body  { padding: 18px 22px; display: flex; flex-direction: column; gap: 14px; }
.form-error  { display: flex; align-items: center; gap: 7px; background: #fef2f2; color: #ef4444; font-size: 12.5px; padding: 9px 12px; border-radius: 7px; border: 1px solid #fecaca; }
.field       { display: flex; flex-direction: column; gap: 5px; }
.field label { font-size: 12px; font-weight: 600; color: #374151; }
.field-opt   { font-weight: 400; color: #94a3b8; font-size: 11px; }
.field input, .field select { border: 1px solid #e2e8f0; border-radius: 8px; padding: 9px 12px; font-size: 13px; color: #0f172a; outline: none; background: #fff; font-family: inherit; box-sizing: border-box; width: 100%; }
.field input:focus, .field select:focus { border-color: #16a34a; box-shadow: 0 0 0 3px #16a34a18; }
.field-row   { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.pw-wrap     { position: relative; }
.pw-wrap input { width: 100%; padding-right: 42px; border: 1px solid #e2e8f0; border-radius: 8px; padding: 9px 42px 9px 12px; font-size: 13px; color: #0f172a; outline: none; box-sizing: border-box; }
.pw-wrap input:focus { border-color: #16a34a; box-shadow: 0 0 0 3px #16a34a18; }
.pw-eye { position: absolute; right: 10px; top: 50%; transform: translateY(-50%); background: none; border: none; cursor: pointer; padding: 2px; display: flex; align-items: center; }
.modal-foot  { display: flex; justify-content: flex-end; gap: 10px; padding: 16px 22px; border-top: 1px solid #f1f5f9; position: sticky; bottom: 0; background: #fff; }
.btn-ghost   { background: none; border: 1px solid #e2e8f0; color: #64748b; padding: 9px 18px; border-radius: 8px; font-size: 13.5px; font-weight: 500; cursor: pointer; }
.btn-ghost:hover { background: #f8fafc; }

.fade-enter-active, .fade-leave-active { transition: opacity 0.2s; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>
