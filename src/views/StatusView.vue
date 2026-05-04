<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import AppLayout from '@/components/AppLayout.vue'
import { useLabStore } from '@/stores/useLabStore'
import { useReservationStore } from '@/stores/useReservationStore'
import { CheckCircle2, XCircle, Wrench, RefreshCw, Monitor, Wifi, Users, FlaskConical } from 'lucide-vue-next'

const labStore         = useLabStore()
const reservationStore = useReservationStore()
const router           = useRouter()

const lastUpdate  = ref(new Date())
const isRefreshing = ref(false)
let timer = null

async function refresh() {
  isRefreshing.value = true
  await labStore.loadLabs(true)
  await reservationStore.loadReservations()
  lastUpdate.value   = new Date()
  isRefreshing.value = false
}

onMounted(async () => {
  await refresh()
  timer = setInterval(refresh, 60000)
})
onUnmounted(() => clearInterval(timer))

// ─── Filtro ───────────────────────────────────────────────────────────────────
const filterStatus = ref('TODOS')

// ─── Enriquecer labs com reserva ativa agora ─────────────────────────────────
const enrichedLabs = computed(() => {
  const now = new Date()
  const todayStr = now.toISOString().split('T')[0]

  return labStore.labs.map(lab => {
    // Busca reserva ativa neste momento para este lab
    const activeRes = reservationStore.reservations.find(r => {
      // Compatibilidade com campos do ReservationModel (reservationDate ou date)
      const rDate = r.reservationDate || r.date
      if (!rDate) return false

      const rDateStr = new Date(rDate).toISOString().split('T')[0]
      if (rDateStr !== todayStr) return false

      const samelab = r.laboratoryId === lab.id || r.labId === lab.id
      if (!samelab) return false

      const st = (r.status || '').toUpperCase()
      if (!['APPROVED','CONFIRMADA'].includes(st)) return false

      // Verifica se o horário atual está dentro do bloco
      const block = r.timeBlocks?.[0]
      const startStr = block?.startTime || r.startTime
      const endStr   = block?.endTime   || r.endTime

      if (startStr && endStr) {
        const [sh, sm] = startStr.split(':').map(Number)
        const [eh, em] = endStr.split(':').map(Number)
        const start = new Date(now); start.setHours(sh, sm, 0, 0)
        const end   = new Date(now); end.setHours(eh, em, 0, 0)
        return now >= start && now <= end
      }

      return true
    })

    // Determina status computado
    const rawStatus = (lab.status || '').toUpperCase()
    let computed = 'LIVRE'
    if (['MAINTENANCE','MANUTENCAO'].includes(rawStatus)) computed = 'MANUTENCAO'
    else if (activeRes || lab.available === false || ['OCCUPIED','OCUPADO'].includes(rawStatus)) computed = 'OCUPADO'

    return { ...lab, computed, activeRes }
  })
})

const filtered = computed(() => {
  if (filterStatus.value === 'TODOS') return enrichedLabs.value
  return enrichedLabs.value.filter(l => l.computed === filterStatus.value)
})

const totals = computed(() => ({
  livre:      enrichedLabs.value.filter(l => l.computed === 'LIVRE').length,
  ocupado:    enrichedLabs.value.filter(l => l.computed === 'OCUPADO').length,
  manutencao: enrichedLabs.value.filter(l => l.computed === 'MANUTENCAO').length,
}))

// ─── Helpers ──────────────────────────────────────────────────────────────────
function statusCfg(s) {
  if (s === 'OCUPADO')    return { icon: XCircle,      cls: 'ocupado',    label: 'OCUPADO' }
  if (s === 'MANUTENCAO') return { icon: Wrench,       cls: 'manutencao', label: 'MANUTENCAO' }
  return                         { icon: CheckCircle2, cls: 'livre',      label: 'LIVRE' }
}

function formatBlock(r) {
  const block = r.timeBlocks?.[0]
  if (block?.startTime && block?.endTime) return `${block.startTime} – ${block.endTime}`
  if (r.startTime && r.endTime)           return `${r.startTime} – ${r.endTime}`
  return ''
}

const lastUpdateLabel = computed(() =>
  lastUpdate.value.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
)
</script>

<template>
  <AppLayout>

    <div class="page-header">
      <div>
        <h1 class="page-title">Status de Uso</h1>
        <p class="page-sub">Ocupacao em tempo real dos laboratorios do campus.</p>
      </div>
      <button class="btn-refresh" @click="refresh" :disabled="isRefreshing">
        <RefreshCw :size="14" :class="{ spinning: isRefreshing }" />
        Atualizar &bull; {{ lastUpdateLabel }}
      </button>
    </div>

    <!-- Contadores clicaveis -->
    <div class="counters">
      <div class="counter" :class="{ active: filterStatus === 'LIVRE' }" @click="filterStatus = 'LIVRE'">
        <CheckCircle2 :size="22" color="#16a34a" />
        <div><div class="c-num green">{{ totals.livre }}</div><div class="c-label">Livre{{ totals.livre !== 1 ? 's' : '' }}</div></div>
      </div>
      <div class="counter" :class="{ active: filterStatus === 'OCUPADO' }" @click="filterStatus = 'OCUPADO'">
        <XCircle :size="22" color="#ef4444" />
        <div><div class="c-num red">{{ totals.ocupado }}</div><div class="c-label">Ocupado{{ totals.ocupado !== 1 ? 's' : '' }}</div></div>
      </div>
      <div class="counter" :class="{ active: filterStatus === 'MANUTENCAO' }" @click="filterStatus = 'MANUTENCAO'">
        <Wrench :size="22" color="#f59e0b" />
        <div><div class="c-num yellow">{{ totals.manutencao }}</div><div class="c-label">Manutencao</div></div>
      </div>
      <div class="counter" :class="{ active: filterStatus === 'TODOS' }" @click="filterStatus = 'TODOS'">
        <FlaskConical :size="22" color="#6366f1" />
        <div><div class="c-num purple">{{ enrichedLabs.length }}</div><div class="c-label">Total</div></div>
      </div>
    </div>

    <div v-if="labStore.loading || isRefreshing" class="loading-msg">Atualizando status...</div>

    <div v-else class="labs-grid">
      <div
        v-for="lab in filtered"
        :key="lab.id"
        class="lab-card"
        :class="`top-${statusCfg(lab.computed).cls}`"
        @click="router.push(`/laboratorios/${lab.id}`)"
      >
        <div class="lab-top">
          <div>
            <div class="lab-name">{{ lab.name }}</div>
            <div class="lab-id">{{ lab.labId }}</div>
          </div>
          <div class="badge" :class="`badge-${statusCfg(lab.computed).cls}`">
            <component :is="statusCfg(lab.computed).icon" :size="12" />
            {{ statusCfg(lab.computed).label }}
          </div>
        </div>

        <!-- Info se estiver ocupado -->
        <div v-if="lab.computed === 'OCUPADO' && lab.activeRes" class="info-box info-ocupado">
          <div class="info-row">
            <Users :size="12" />
            {{ lab.activeRes.requestedByName || lab.activeRes.purpose || 'Em uso' }}
          </div>
          <div v-if="formatBlock(lab.activeRes)" class="info-row">
            <Monitor :size="12" />
            {{ formatBlock(lab.activeRes) }}
          </div>
        </div>

        <div v-else-if="lab.computed === 'MANUTENCAO'" class="info-box info-manut">
          Em manutencao — acesso restrito.
        </div>

        <div v-else class="info-box info-livre">
          Disponivel para reserva.
        </div>

        <div class="lab-resources">
          <div class="res-ico"><Monitor :size="11" color="#94a3b8" /></div>
          <div class="res-ico"><Wifi    :size="11" color="#94a3b8" /></div>
        </div>
      </div>

      <div v-if="filtered.length === 0" class="empty">
        Nenhum laboratorio para o filtro selecionado.
      </div>
    </div>

  </AppLayout>
</template>

<style scoped>
.page-header { display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 18px; }
.page-title  { font-size: 24px; font-weight: 800; color: #0f172a; margin: 0 0 3px; }
.page-sub    { font-size: 13px; color: #64748b; margin: 0; }

.btn-refresh { display: flex; align-items: center; gap: 6px; background: #fff; border: 1px solid #e8ecf0; border-radius: 8px; padding: 8px 14px; font-size: 12.5px; color: #64748b; cursor: pointer; transition: all 0.15s; }
.btn-refresh:hover:not(:disabled) { background: #f1f5f9; }
.btn-refresh:disabled { opacity: 0.6; cursor: not-allowed; }

@keyframes spin { to { transform: rotate(360deg); } }
.spinning { animation: spin 1s linear infinite; }

.counters { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin-bottom: 18px; }
.counter  { background: #fff; border: 2px solid #e8ecf0; border-radius: 12px; padding: 16px; display: flex; align-items: center; gap: 14px; cursor: pointer; transition: all 0.15s; }
.counter:hover  { border-color: #cbd5e1; box-shadow: 0 2px 8px rgba(0,0,0,0.06); }
.counter.active { border-color: #16a34a; background: #f0fdf4; }
.c-num    { font-size: 28px; font-weight: 800; line-height: 1; }
.c-label  { font-size: 12px; color: #64748b; margin-top: 2px; }
.green    { color: #16a34a; }
.red      { color: #ef4444; }
.yellow   { color: #f59e0b; }
.purple   { color: #6366f1; }

.loading-msg { text-align: center; color: #94a3b8; font-size: 13px; padding: 40px; }

.labs-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; }

.lab-card { background: #fff; border: 1.5px solid #e8ecf0; border-radius: 12px; padding: 16px; cursor: pointer; transition: all 0.15s; display: flex; flex-direction: column; gap: 10px; }
.lab-card:hover { box-shadow: 0 4px 14px rgba(0,0,0,0.08); transform: translateY(-1px); }
.top-livre      { border-top: 3px solid #16a34a; }
.top-ocupado    { border-top: 3px solid #ef4444; }
.top-manutencao { border-top: 3px solid #f59e0b; }

.lab-top  { display: flex; justify-content: space-between; align-items: flex-start; }
.lab-name { font-size: 14px; font-weight: 600; color: #0f172a; }
.lab-id   { font-size: 11px; color: #94a3b8; margin-top: 2px; }

.badge { display: flex; align-items: center; gap: 4px; font-size: 10.5px; font-weight: 700; padding: 3px 8px; border-radius: 5px; white-space: nowrap; }
.badge-livre      { background: #f0fdf4; color: #16a34a; }
.badge-ocupado    { background: #fef2f2; color: #ef4444; }
.badge-manutencao { background: #fffbeb; color: #d97706; }

.info-box   { border-radius: 7px; padding: 8px 10px; font-size: 12px; }
.info-row   { display: flex; align-items: center; gap: 6px; color: #64748b; margin-bottom: 3px; }
.info-row:last-child { margin-bottom: 0; }
.info-ocupado { background: #f8fafc; }
.info-manut   { background: #fffbeb; color: #d97706; }
.info-livre   { background: #f0fdf4; color: #16a34a; }

.lab-resources { display: flex; gap: 6px; }
.res-ico       { width: 24px; height: 24px; background: #f8fafc; border-radius: 5px; display: flex; align-items: center; justify-content: center; }

.empty { grid-column: 1/-1; text-align: center; color: #94a3b8; font-size: 13px; padding: 48px; }
</style>
