<script setup>
import { ref, computed, onMounted } from 'vue'
import AppLayout from '@/components/AppLayout.vue'
import { useLabStore }  from '@/stores/useLabStore'
import { useAuthStore } from '@/stores/useAuthStore'
import {
  Plus, Search, Pencil, Trash2, X, Loader,
  AlertCircle, FlaskConical, CheckCircle2, XCircle,
  Building2, Monitor, Layers, PowerOff, Power
} from 'lucide-vue-next'

const labStore = useLabStore()
const auth     = useAuthStore()

onMounted(() => labStore.loadLabs(true))

// ── Filtros ──────────────────────────────────────────────────────────────────
const searchTerm   = ref('')
const filterStatus = ref('TODOS')
const STATUS_OPTS  = ['TODOS', 'ATIVO', 'INATIVO']

const filtered = computed(() => {
  const q = searchTerm.value.toLowerCase()
  return (labStore.labs ?? []).filter(l => {
    const matchQ = !q ||
      l.name?.toLowerCase().includes(q) ||
      l.code?.toLowerCase().includes(q) ||
      l.building?.toLowerCase().includes(q)
    const matchS =
      filterStatus.value === 'TODOS'  ||
      (filterStatus.value === 'ATIVO'   &&  l.active) ||
      (filterStatus.value === 'INATIVO' && !l.active)
    return matchQ && matchS
  })
})

// ── Modal criar / editar ─────────────────────────────────────────────────────
const showModal  = ref(false)
const editingLab = ref(null)
const modalError = ref('')
const saving     = ref(false)

const emptyForm = () => ({
  name: '', code: '', description: '',
  capacity: '', computerCount: '',
  building: '', floor: '', active: true,
})

const form = ref(emptyForm())

function openCreate() {
  editingLab.value = null
  form.value       = emptyForm()
  modalError.value = ''
  showModal.value  = true
}

function openEdit(lab) {
  editingLab.value = lab
  form.value = {
    name:          lab.name          || '',
    code:          lab.code          || '',
    description:   lab.description   || '',
    capacity:      lab.capacity      ?? '',
    computerCount: lab.computerCount ?? '',
    building:      lab.building      || '',
    floor:         lab.floor         || '',
    active:        lab.active        ?? true,
  }
  modalError.value = ''
  showModal.value  = true
}

async function saveModal() {
  modalError.value = ''
  if (!form.value.name.trim()) { modalError.value = 'Nome é obrigatório.'; return }
  if (!form.value.code.trim()) { modalError.value = 'Código é obrigatório.'; return }
  if (!form.value.capacity || Number(form.value.capacity) <= 0) {
    modalError.value = 'Capacidade deve ser maior que zero.'; return
  }

  saving.value = true
  try {
    const payload = {
      name:          form.value.name.trim(),
      code:          form.value.code.trim().toUpperCase(),
      description:   form.value.description.trim() || null,
      capacity:      Number(form.value.capacity),
      computerCount: Number(form.value.computerCount) || 0,
      building:      form.value.building.trim() || null,
      floor:         form.value.floor.trim()    || null,
      active:        form.value.active,
    }
    if (editingLab.value) {
      await labStore.updateLab(editingLab.value.id, payload)
    } else {
      await labStore.addLab(payload)
    }
    showModal.value = false
  } catch (err) {
    modalError.value = err?.response?.data?.message || 'Erro ao salvar laboratório.'
  } finally {
    saving.value = false
  }
}

// ── Ações do card ─────────────────────────────────────────────────────────────
const loadingId = ref(null)

async function handleToggle(lab) {
  const action = lab.active ? 'desativar' : 'reativar'
  if (!confirm(`Deseja ${action} o laboratório "${lab.name}"?`)) return
  loadingId.value = `toggle-${lab.id}`
  try {
    if (lab.active) await labStore.deactivateLab(lab.id)
    else            await labStore.activateLab(lab.id)
  } catch (err) {
    console.error('ERRO TOGGLE:', err)  // ← adiciona essa linha aqui
    alert(err?.response?.data?.message || `Erro ao ${action} laboratório.`)
  } finally {
    loadingId.value = null
  }
}

async function handleDelete(lab) {
  if (!confirm(`Isso removerá permanentemente "${lab.name}". Confirma?`)) return
  loadingId.value = `delete-${lab.id}`
  try {
    await labStore.deleteLab(lab.id)
  } catch (err) {
    alert(err?.response?.data?.message || 'Erro ao remover laboratório.')
  } finally {
    loadingId.value = null
  }
}
</script>

<template>
  <AppLayout>

    <!-- Header -->
    <div class="page-header">
      <div>
        <h1 class="page-title">Laboratórios</h1>
        <p class="page-sub">Cadastre, edite e gerencie os laboratórios do campus.</p>
      </div>
      <button class="btn-primary" @click="openCreate">
        <Plus :size="15" /> Novo Laboratório
      </button>
    </div>

    <!-- Toolbar -->
    <div class="toolbar">
      <div class="search-box">
        <Search :size="14" color="#9ca3af" />
        <input v-model="searchTerm" placeholder="Buscar por nome, código ou bloco..." />
      </div>
      <div class="filters">
        <button
          v-for="opt in STATUS_OPTS" :key="opt"
          class="filter-btn" :class="{ active: filterStatus === opt }"
          @click="filterStatus = opt"
        >{{ opt }}</button>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="labStore.loading && !labStore.labs.length" class="center-msg">
      <Loader :size="18" class="spinning" color="#94a3b8" /> Carregando...
    </div>

    <!-- Grid de cards -->
    <div v-else-if="filtered.length > 0" class="lab-grid">
      <div v-for="lab in filtered" :key="lab.id" class="lab-card" :class="{ inactive: !lab.active }">

        <!-- Cabeçalho do card -->
        <div class="card-top">
          <div class="card-icon">
            <FlaskConical :size="18" color="#16a34a" />
          </div>
          <div class="card-title-wrap">
            <div class="card-name">{{ lab.name }}</div>
            <div class="card-code">{{ lab.code }}</div>
          </div>
          <span class="status-pill" :class="lab.active ? 's-active' : 's-inactive'">
            <component :is="lab.active ? CheckCircle2 : XCircle" :size="11" />
            {{ lab.active ? 'Ativo' : 'Inativo' }}
          </span>
        </div>

        <!-- Descrição -->
        <p v-if="lab.description" class="card-desc">{{ lab.description }}</p>

        <!-- Detalhes -->
        <div class="card-details">
          <div class="detail" v-if="lab.building || lab.floor">
            <Building2 :size="13" color="#94a3b8" />
            {{ [lab.building, lab.floor].filter(Boolean).join(' · ') }}
          </div>
          <div class="detail">
            <Layers :size="13" color="#94a3b8" />
            Capacidade: {{ lab.capacity }} pessoas
          </div>
          <div class="detail" v-if="lab.computerCount">
            <Monitor :size="13" color="#94a3b8" />
            {{ lab.computerCount }} computadores
          </div>
        </div>

        <!-- Ações -->
        <div class="card-actions">
          <button class="act-btn blue" title="Editar" @click="openEdit(lab)">
            <Pencil :size="13" /> Editar
          </button>

          <button
            class="act-btn" :class="lab.active ? 'red' : 'green'"
            :title="lab.active ? 'Desativar' : 'Reativar'"
            :disabled="loadingId === `toggle-${lab.id}`"
            @click="handleToggle(lab)"
          >
            <Loader    v-if="loadingId === `toggle-${lab.id}`" :size="13" class="spinning" />
            <PowerOff  v-else-if="lab.active"                  :size="13" />
            <Power     v-else                                   :size="13" />
            {{ lab.active ? 'Desativar' : 'Reativar' }}
          </button>

          <button
            class="act-btn red" title="Excluir permanentemente"
            :disabled="loadingId === `delete-${lab.id}`"
            @click="handleDelete(lab)"
          >
            <Loader v-if="loadingId === `delete-${lab.id}`" :size="13" class="spinning" />
            <Trash2 v-else :size="13" />
          </button>
        </div>

      </div>
    </div>

    <!-- Vazio -->
    <div v-else class="empty-state">
      <FlaskConical :size="36" color="#e2e8f0" />
      <p>Nenhum laboratório encontrado.</p>
      <button class="btn-primary" @click="openCreate"><Plus :size="14" /> Criar primeiro</button>
    </div>

    <!-- ── Modal ──────────────────────────────────────────────────────────── -->
    <Teleport to="body">
      <Transition name="fade">
        <div v-if="showModal" class="overlay" @click.self="showModal = false">
          <div class="modal">
            <div class="modal-head">
              <h2 class="modal-title">
                {{ editingLab ? 'Editar Laboratório' : 'Novo Laboratório' }}
              </h2>
              <button class="modal-close" @click="showModal = false"><X :size="18" /></button>
            </div>

            <div class="modal-body">
              <div v-if="modalError" class="form-error">
                <AlertCircle :size="14" /> {{ modalError }}
              </div>

              <div class="field-row">
                <div class="field">
                  <label>Nome *</label>
                  <input v-model="form.name" type="text" placeholder="Lab. de Informática" />
                </div>
                <div class="field">
                  <label>Código *</label>
                  <input v-model="form.code" type="text" placeholder="LAB-01" style="text-transform:uppercase" />
                </div>
              </div>

              <div class="field">
                <label>Descrição</label>
                <textarea v-model="form.description" rows="2" placeholder="Descreva o laboratório..."></textarea>
              </div>

              <div class="field-row">
                <div class="field">
                  <label>Capacidade *</label>
                  <input v-model="form.capacity" type="number" min="1" placeholder="30" />
                </div>
                <div class="field">
                  <label>Computadores</label>
                  <input v-model="form.computerCount" type="number" min="0" placeholder="20" />
                </div>
              </div>

              <div class="field-row">
                <div class="field">
                  <label>Bloco / Prédio</label>
                  <input v-model="form.building" type="text" placeholder="Bloco A" />
                </div>
                <div class="field">
                  <label>Andar</label>
                  <input v-model="form.floor" type="text" placeholder="Térreo" />
                </div>
              </div>

              <div v-if="editingLab" class="field">
                <label>Status</label>
                <select v-model="form.active">
                  <option :value="true">Ativo</option>
                  <option :value="false">Inativo</option>
                </select>
              </div>
            </div>

            <div class="modal-foot">
              <button class="btn-ghost" @click="showModal = false">Cancelar</button>
              <button class="btn-primary" :disabled="saving" @click="saveModal">
                <Loader v-if="saving" :size="14" class="spinning" />
                <span v-else>{{ editingLab ? 'Salvar' : 'Criar' }}</span>
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

  </AppLayout>
</template>

<style scoped>
.page-header { display:flex; justify-content:space-between; align-items:flex-end; margin-bottom:18px; }
.page-title  { font-size:24px; font-weight:800; color:#0f172a; margin:0 0 3px; }
.page-sub    { font-size:13px; color:#64748b; margin:0; }

.btn-primary { display:flex; align-items:center; gap:6px; background:#16a34a; color:#fff; border:none; padding:9px 18px; border-radius:8px; font-size:13.5px; font-weight:600; cursor:pointer; }
.btn-primary:hover:not(:disabled) { background:#15803d; }
.btn-primary:disabled { opacity:.6; cursor:not-allowed; }

.toolbar    { display:flex; gap:12px; margin-bottom:18px; flex-wrap:wrap; }
.search-box { display:flex; align-items:center; gap:8px; background:#fff; border:1px solid #e8ecf0; border-radius:8px; padding:8px 12px; flex:1; max-width:380px; }
.search-box input { border:none; background:none; outline:none; font-size:13px; color:#374151; width:100%; }
.search-box input::placeholder { color:#9ca3af; }
.filters    { display:flex; gap:6px; flex-wrap:wrap; }
.filter-btn { background:#fff; border:1px solid #e8ecf0; border-radius:6px; padding:5px 12px; font-size:12px; color:#64748b; cursor:pointer; transition:all .13s; }
.filter-btn:hover  { background:#f1f5f9; }
.filter-btn.active { background:#16a34a; color:#fff; border-color:#16a34a; font-weight:600; }

.center-msg { display:flex; align-items:center; justify-content:center; gap:8px; color:#94a3b8; font-size:13px; padding:48px; }

.lab-grid { display:grid; grid-template-columns:repeat(auto-fill, minmax(300px, 1fr)); gap:14px; }

.lab-card {
  background:#fff; border:1px solid #e8ecf0; border-radius:12px;
  padding:16px; display:flex; flex-direction:column; gap:12px;
  transition:box-shadow .15s;
}
.lab-card:hover { box-shadow:0 2px 12px rgba(0,0,0,.08); }
.lab-card.inactive { opacity:.7; }

.card-top { display:flex; align-items:flex-start; gap:10px; }
.card-icon { width:38px; height:38px; background:#f0fdf4; border-radius:9px; display:flex; align-items:center; justify-content:center; flex-shrink:0; }
.card-title-wrap { flex:1; }
.card-name { font-size:14px; font-weight:700; color:#0f172a; }
.card-code { font-size:11px; color:#94a3b8; margin-top:2px; font-family:monospace; }

.status-pill { display:inline-flex; align-items:center; gap:4px; font-size:11px; font-weight:600; padding:3px 8px; border-radius:6px; white-space:nowrap; flex-shrink:0; }
.s-active   { background:#f0fdf4; color:#16a34a; }
.s-inactive { background:#fef2f2; color:#ef4444; }

.card-desc { font-size:12.5px; color:#64748b; line-height:1.5; margin:0; }

.card-details { display:flex; flex-direction:column; gap:5px; }
.detail { display:flex; align-items:center; gap:6px; font-size:12px; color:#64748b; }

.card-actions { display:flex; gap:8px; margin-top:4px; }
.act-btn {
  display:flex; align-items:center; gap:5px;
  border-radius:7px; padding:6px 12px; font-size:12px; font-weight:500;
  cursor:pointer; border:1px solid; transition:all .13s; background:none;
}
.act-btn:disabled { opacity:.5; cursor:not-allowed; }
.act-btn.blue  { border-color:#bfdbfe; color:#3b82f6; }
.act-btn.blue:hover:not(:disabled)  { background:#eff6ff; }
.act-btn.red   { border-color:#fecaca; color:#ef4444; }
.act-btn.red:hover:not(:disabled)   { background:#fef2f2; }
.act-btn.green { border-color:#bbf7d0; color:#16a34a; }
.act-btn.green:hover:not(:disabled) { background:#f0fdf4; }

.empty-state { display:flex; flex-direction:column; align-items:center; gap:12px; padding:60px; color:#94a3b8; font-size:14px; background:#fff; border:1px solid #e8ecf0; border-radius:12px; text-align:center; }

/* ── Modal ── */
.overlay { position:fixed; inset:0; background:rgba(0,0,0,.45); display:flex; align-items:center; justify-content:center; z-index:1000; padding:20px; }
.modal   { background:#fff; border-radius:14px; width:100%; max-width:520px; box-shadow:0 20px 60px rgba(0,0,0,.18); max-height:90vh; overflow-y:auto; }
.modal-head { display:flex; justify-content:space-between; align-items:center; padding:20px 22px 0; position:sticky; top:0; background:#fff; }
.modal-title { font-size:17px; font-weight:700; color:#0f172a; margin:0; }
.modal-close { background:none; border:none; cursor:pointer; color:#94a3b8; padding:4px; border-radius:6px; }
.modal-close:hover { background:#f1f5f9; }
.modal-body { padding:18px 22px; display:flex; flex-direction:column; gap:14px; }
.form-error { display:flex; align-items:center; gap:7px; background:#fef2f2; color:#ef4444; font-size:12.5px; padding:9px 12px; border-radius:7px; border:1px solid #fecaca; }
.field { display:flex; flex-direction:column; gap:5px; }
.field label { font-size:12px; font-weight:600; color:#374151; }
.field input,.field select,.field textarea { border:1px solid #e2e8f0; border-radius:8px; padding:9px 12px; font-size:13px; color:#0f172a; outline:none; background:#fff; font-family:inherit; resize:vertical; box-sizing:border-box; width:100%; }
.field input:focus,.field select:focus,.field textarea:focus { border-color:#16a34a; box-shadow:0 0 0 3px #16a34a18; }
.field-row { display:grid; grid-template-columns:1fr 1fr; gap:12px; }
.modal-foot { display:flex; justify-content:flex-end; gap:10px; padding:16px 22px; border-top:1px solid #f1f5f9; position:sticky; bottom:0; background:#fff; }
.btn-ghost { background:none; border:1px solid #e2e8f0; color:#64748b; padding:9px 18px; border-radius:8px; font-size:13.5px; font-weight:500; cursor:pointer; }
.btn-ghost:hover { background:#f8fafc; }
@keyframes spin { to { transform:rotate(360deg); } }
.spinning { animation:spin 1s linear infinite; }
.fade-enter-active,.fade-leave-active { transition:opacity .2s; }
.fade-enter-from,.fade-leave-to { opacity:0; }
</style>
