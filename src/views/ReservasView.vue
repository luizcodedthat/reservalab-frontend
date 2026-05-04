<script setup>
import { ref, computed, onMounted } from 'vue'
import AppLayout from '@/components/AppLayout.vue'
import { useReservationStore } from '@/stores/useReservationStore'
import { useLabStore } from '@/stores/useLabStore'
import { useAuthStore } from '@/stores/useAuthStore'
import ReservationModal from '@/components/lab/ReservationModal.vue'
import {
  Plus, Search, Calendar, Clock, FlaskConical,
  CheckCircle2, XCircle, Loader, Ban, Pencil, X
} from 'lucide-vue-next'

const reservationStore = useReservationStore()
const labStore         = useLabStore()
const auth             = useAuthStore()

onMounted(async () => {
  await Promise.allSettled([
    reservationStore.loadReservations(true),
    labStore.loadLabs(),
  ])
})

const isAdmin = computed(() => auth.user?.isAdmin())

const searchTerm   = ref('')
const filterStatus = ref('TODOS')
const STATUS_OPTS  = ['TODOS', 'APROVADA', 'PENDENTE', 'CANCELADA']

function normalizeStatus(s) {
  const st = (s || '').toUpperCase()
  if (['APPROVED','CONFIRMADA'].includes(st)) return 'APPROVED'
  if (['PENDING','PENDENTE'].includes(st))    return 'PENDING'
  if (['CANCELLED','CANCELADA'].includes(st)) return 'CANCELLED'
  return st
}

const visibleReservations = computed(() => {
  return reservationStore.reservations.filter(r => {
    const uid  = auth.user?.id
    const mine = r.requestedByUserId === uid || r.professorId === uid || r.userId === uid
    if (!isAdmin.value && !mine) return false

    if (searchTerm.value) {
      const q   = searchTerm.value.toLowerCase()
      const lab = labStore.labs.find(l => l.id === r.laboratoryId)?.name || ''
      if (!lab.toLowerCase().includes(q) &&
          !(r.purpose || r.courseName || '').toLowerCase().includes(q)) return false
    }

    const st = normalizeStatus(r.status)
    if (filterStatus.value === 'APROVADA'  && st !== 'APPROVED')  return false
    if (filterStatus.value === 'PENDENTE'  && st !== 'PENDING')   return false
    if (filterStatus.value === 'CANCELADA' && st !== 'CANCELLED') return false
    return true
  }).sort((a, b) => new Date(b.reservationDate || b.date || 0) - new Date(a.reservationDate || a.date || 0))
})

// Modal criacao
const showCreate = ref(false)
async function onSubmitted() {
  showCreate.value = false
  await reservationStore.loadReservations(true)
}

// Modal edicao
const showEdit    = ref(false)
const editingRes  = ref(null)
const editError   = ref('')
const editLoading = ref(false)
const editForm    = ref({ laboratoryId: '', reservationDate: '', startTime: '', endTime: '', purpose: '' })

function openEdit(r) {
  const block = r.timeBlocks?.[0]
  editForm.value = {
    laboratoryId:    r.laboratoryId ?? '',
    reservationDate: r.reservationDate || r.date || '',
    startTime:       block?.startTime || r.startTime || '',
    endTime:         block?.endTime   || r.endTime   || '',
    purpose:         r.purpose || r.description || r.courseName || '',
  }
  editError.value  = ''
  editingRes.value = r
  showEdit.value   = true
}

async function submitEdit() {
  editError.value = ''
  if (!editForm.value.reservationDate) { editError.value = 'Informe a data.';    return }
  if (!editForm.value.startTime)       { editError.value = 'Informe o início.';  return }
  if (!editForm.value.endTime)         { editError.value = 'Informe o término.'; return }
  if (editForm.value.startTime >= editForm.value.endTime) {
    editError.value = 'Horário final deve ser maior.'
    return
  }

  editLoading.value = true
  try {
    await reservationStore.updateReservation(editingRes.value.id, {
      laboratoryId:    Number(editForm.value.laboratoryId),
      reservationDate: editForm.value.reservationDate,
      purpose:         editForm.value.purpose,
      timeBlocks: [{
        startTime:  editForm.value.startTime,
        endTime:    editForm.value.endTime,
        blockOrder: 1,
      }],
    })
    showEdit.value = false
    // store já atualiza in-place — reload opcional mas mantém consistência
    await reservationStore.loadReservations(true)
  } catch (err) {
    editError.value = err?.response?.data?.message || 'Erro ao atualizar reserva.'
  } finally {
    editLoading.value = false
  }
}

// Cancelar — usa DELETE /:id (unico endpoint de cancel no backend)
const cancellingId = ref(null)
async function cancelReservation(r) {
  if (!confirm('Deseja cancelar esta reserva?')) return
  cancellingId.value = r.id
  try {
    await reservationStore.deleteReservation(r.id)
  } catch (err) {
    alert(err?.response?.data?.message || 'Erro ao cancelar reserva.')
  } finally {
    cancellingId.value = null
  }
}

function isMine(r) {
  const uid = auth.user?.id
  return r.requestedByUserId === uid || r.professorId === uid || r.userId === uid
}
function canEdit(r)   { return normalizeStatus(r.status) === 'PENDING' && (isAdmin.value || isMine(r)) }
function canCancel(r) { return normalizeStatus(r.status) !== 'CANCELLED' && (isAdmin.value || isMine(r)) }

function statusCfg(s) {
  const st = normalizeStatus(s)
  if (st === 'APPROVED')  return { cls: 's-approved', label: 'Aprovada',  icon: CheckCircle2 }
  if (st === 'PENDING')   return { cls: 's-pending',  label: 'Pendente',  icon: Clock }
  if (st === 'CANCELLED') return { cls: 's-cancel',   label: 'Cancelada', icon: XCircle }
  return                         { cls: 's-other',    label: s || '-',    icon: Clock }
}
function getLabName(r) {
  const lab = labStore.labs.find(l => l.id === r.laboratoryId)
  return lab?.name || r.labName || (r.laboratoryId ? `Lab ${r.laboratoryId}` : 'Laboratorio')
}
function formatDate(r) {
  const d = r.reservationDate || r.date
  if (!d) return '-'
  return new Date(d + 'T00:00:00').toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: '2-digit', year: 'numeric' })
}
function formatTime(r) {
  const block = r.timeBlocks?.[0]
  if (block?.startTime && block?.endTime) return `${block.startTime} - ${block.endTime}`
  if (r.startTime && r.endTime)           return `${r.startTime} - ${r.endTime}`
  return '-'
}
function getPurpose(r) { return r.purpose || r.description || r.courseName || '' }
</script>

<template>
  <AppLayout>
    <div class="page-header">
      <div>
        <h1 class="page-title">{{ isAdmin ? 'Gerenciar Reservas' : 'Minhas Reservas' }}</h1>
        <p class="page-sub">{{ isAdmin ? 'Todas as reservas do campus.' : 'Gerencie suas reservas de laboratorio.' }}</p>
      </div>
      <button class="btn-primary" @click="showCreate = true"><Plus :size="15" /> Nova Reserva</button>
    </div>

    <div class="toolbar">
      <div class="search-box">
        <Search :size="14" color="#9ca3af" />
        <input v-model="searchTerm" placeholder="Buscar por laboratorio ou atividade..." />
      </div>
      <div class="filters">
        <button v-for="opt in STATUS_OPTS" :key="opt" class="filter-btn" :class="{ active: filterStatus === opt }" @click="filterStatus = opt">{{ opt }}</button>
      </div>
    </div>

    <div v-if="reservationStore.loading" class="center-msg"><Loader :size="18" class="spinning" color="#94a3b8" /> Carregando...</div>

    <div v-else-if="visibleReservations.length === 0" class="empty-state">
      <Calendar :size="36" color="#e2e8f0" />
      <p>Nenhuma reserva encontrada.</p>
      <button class="btn-primary" @click="showCreate = true"><Plus :size="14" /> Criar primeira reserva</button>
    </div>

    <div v-else class="res-list">
      <div v-for="r in visibleReservations" :key="r.id" class="res-card">
        <div class="res-left">
          <div class="res-icon-wrap"><FlaskConical :size="18" color="#16a34a" /></div>
          <div>
            <div class="res-lab">{{ getLabName(r) }}</div>
            <div v-if="getPurpose(r)" class="res-desc">{{ getPurpose(r).slice(0, 70) }}</div>
            <div v-if="isAdmin && r.requestedByName" class="res-by">Por: {{ r.requestedByName }}</div>
          </div>
        </div>
        <div class="res-mid">
          <div class="res-detail"><Calendar :size="12" color="#94a3b8" /> {{ formatDate(r) }}</div>
          <div class="res-detail"><Clock    :size="12" color="#94a3b8" /> {{ formatTime(r) }}</div>
        </div>
        <div class="res-right">
          <span class="status-pill" :class="statusCfg(r.status).cls">
            <component :is="statusCfg(r.status).icon" :size="11" /> {{ statusCfg(r.status).label }}
          </span>
          <button v-if="canEdit(r)"   class="act-btn blue" title="Editar"   @click="openEdit(r)"><Pencil :size="13" /></button>
          <button v-if="canCancel(r)" class="act-btn red"  title="Cancelar" :disabled="cancellingId === r.id" @click="cancelReservation(r)">
            <Loader v-if="cancellingId === r.id" :size="13" class="spinning" />
            <Ban    v-else                        :size="13" />
          </button>
        </div>
      </div>
    </div>

    <ReservationModal :is-open="showCreate" :labs="labStore.labs" @close="showCreate = false" @submitted="onSubmitted" />

    <Teleport to="body">
      <Transition name="fade">
        <div v-if="showEdit" class="overlay" @click.self="showEdit = false">
          <div class="modal">
            <div class="modal-head">
              <h2 class="modal-title">Editar Reserva</h2>
              <button class="modal-close" @click="showEdit = false"><X :size="18" /></button>
            </div>
            <div class="modal-body">
              <div v-if="editError" class="form-error">{{ editError }}</div>
              <div class="field"><label>Laboratorio</label>
                <select v-model="editForm.laboratoryId">
                  <option v-for="lab in labStore.labs" :key="lab.id" :value="lab.id">{{ lab.name }}</option>
                </select>
              </div>
              <div class="field"><label>Data</label>
                <input v-model="editForm.reservationDate" type="date" :min="new Date().toISOString().split('T')[0]" />
              </div>
              <div class="field-row">
                <div class="field"><label>Inicio</label><input v-model="editForm.startTime" type="time" /></div>
                <div class="field"><label>Termino</label><input v-model="editForm.endTime" type="time" /></div>
              </div>
              <div class="field"><label>Descricao</label>
                <textarea v-model="editForm.purpose" rows="3" placeholder="Descreva a atividade..."></textarea>
              </div>
            </div>
            <div class="modal-foot">
              <button class="btn-ghost" @click="showEdit = false">Cancelar</button>
              <button class="btn-primary" :disabled="editLoading" @click="submitEdit">
                <Loader v-if="editLoading" :size="14" class="spinning" /><span v-else>Salvar</span>
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </AppLayout>
</template>

<style scoped>
.page-header{display:flex;justify-content:space-between;align-items:flex-end;margin-bottom:18px}
.page-title{font-size:24px;font-weight:800;color:#0f172a;margin:0 0 3px}
.page-sub{font-size:13px;color:#64748b;margin:0}
.btn-primary{display:flex;align-items:center;gap:6px;background:#16a34a;color:#fff;border:none;padding:9px 18px;border-radius:8px;font-size:13.5px;font-weight:600;cursor:pointer}
.btn-primary:hover:not(:disabled){background:#15803d}
.btn-primary:disabled{opacity:.6;cursor:not-allowed}
.toolbar{display:flex;gap:12px;margin-bottom:16px;flex-wrap:wrap}
.search-box{display:flex;align-items:center;gap:8px;background:#fff;border:1px solid #e8ecf0;border-radius:8px;padding:8px 12px;flex:1;max-width:380px}
.search-box input{border:none;background:none;outline:none;font-size:13px;color:#374151;width:100%}
.search-box input::placeholder{color:#9ca3af}
.filters{display:flex;gap:6px;flex-wrap:wrap}
.filter-btn{background:#fff;border:1px solid #e8ecf0;border-radius:6px;padding:5px 12px;font-size:12px;color:#64748b;cursor:pointer;transition:all .13s}
.filter-btn:hover{background:#f1f5f9}
.filter-btn.active{background:#16a34a;color:#fff;border-color:#16a34a;font-weight:600}
.center-msg{display:flex;align-items:center;justify-content:center;gap:8px;color:#94a3b8;font-size:13px;padding:48px}
.empty-state{display:flex;flex-direction:column;align-items:center;gap:12px;padding:60px;color:#94a3b8;font-size:14px;background:#fff;border:1px solid #e8ecf0;border-radius:12px;text-align:center}
.res-list{display:flex;flex-direction:column;gap:10px}
.res-card{background:#fff;border:1px solid #e8ecf0;border-radius:12px;padding:16px;display:flex;align-items:center;gap:16px;transition:box-shadow .15s;flex-wrap:wrap}
.res-card:hover{box-shadow:0 2px 10px rgba(0,0,0,.07)}
.res-left{display:flex;align-items:flex-start;gap:12px;flex:1;min-width:200px}
.res-icon-wrap{width:40px;height:40px;background:#f0fdf4;border-radius:9px;display:flex;align-items:center;justify-content:center;flex-shrink:0}
.res-lab{font-size:14px;font-weight:600;color:#0f172a}
.res-desc{font-size:12px;color:#64748b;margin-top:2px}
.res-by{font-size:11px;color:#94a3b8;margin-top:3px}
.res-mid{display:flex;flex-direction:column;gap:5px;min-width:170px}
.res-detail{display:flex;align-items:center;gap:6px;font-size:12.5px;color:#64748b}
.res-right{display:flex;align-items:center;gap:7px;flex-shrink:0}
.status-pill{display:inline-flex;align-items:center;gap:4px;font-size:11px;font-weight:700;padding:4px 10px;border-radius:6px;white-space:nowrap}
.s-approved{background:#f0fdf4;color:#16a34a}
.s-pending{background:#fefce8;color:#854d0e}
.s-cancel{background:#fef2f2;color:#ef4444}
.s-other{background:#f1f5f9;color:#64748b}
.act-btn{border-radius:7px;width:32px;height:32px;display:flex;align-items:center;justify-content:center;cursor:pointer;border:1px solid;transition:all .13s;flex-shrink:0;background:none}
.act-btn:disabled{opacity:.5;cursor:not-allowed}
.act-btn.blue{border-color:#bfdbfe;color:#3b82f6}
.act-btn.blue:hover:not(:disabled){background:#eff6ff}
.act-btn.red{border-color:#fecaca;color:#ef4444}
.act-btn.red:hover:not(:disabled){background:#fef2f2}
@keyframes spin{to{transform:rotate(360deg)}}
.spinning{animation:spin 1s linear infinite}
.overlay{position:fixed;inset:0;background:rgba(0,0,0,.45);display:flex;align-items:center;justify-content:center;z-index:1000;padding:20px}
.modal{background:#fff;border-radius:14px;width:100%;max-width:480px;box-shadow:0 20px 60px rgba(0,0,0,.18)}
.modal-head{display:flex;justify-content:space-between;align-items:center;padding:20px 22px 0}
.modal-title{font-size:17px;font-weight:700;color:#0f172a;margin:0}
.modal-close{background:none;border:none;cursor:pointer;color:#94a3b8;padding:4px;border-radius:6px}
.modal-close:hover{background:#f1f5f9}
.modal-body{padding:18px 22px;display:flex;flex-direction:column;gap:14px}
.form-error{background:#fef2f2;color:#ef4444;font-size:12.5px;padding:9px 12px;border-radius:7px;border:1px solid #fecaca}
.field{display:flex;flex-direction:column;gap:5px}
.field label{font-size:12px;font-weight:500;color:#374151}
.field input,.field select,.field textarea{border:1px solid #e2e8f0;border-radius:8px;padding:9px 12px;font-size:13px;color:#0f172a;outline:none;background:#fff;font-family:inherit;resize:vertical;box-sizing:border-box;width:100%}
.field input:focus,.field select:focus,.field textarea:focus{border-color:#16a34a;box-shadow:0 0 0 3px #16a34a18}
.field-row{display:grid;grid-template-columns:1fr 1fr;gap:12px}
.modal-foot{display:flex;justify-content:flex-end;gap:10px;padding:16px 22px;border-top:1px solid #f1f5f9}
.btn-ghost{background:none;border:1px solid #e2e8f0;color:#64748b;padding:9px 18px;border-radius:8px;font-size:13.5px;font-weight:500;cursor:pointer}
.btn-ghost:hover{background:#f8fafc}
.fade-enter-active,.fade-leave-active{transition:opacity .2s}
.fade-enter-from,.fade-leave-to{opacity:0}
</style>
