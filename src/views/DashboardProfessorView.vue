<script setup>
import { computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import AppLayout from '@/components/AppLayout.vue'
import { useAuthStore } from '@/stores/useAuthStore'
import { useTicketStore } from '@/stores/useTicketStore'
import { useReservationStore } from '@/stores/useReservationStore'
import { useLabStore } from '@/stores/useLabStore'
import {
  Ticket, CalendarCheck, Clock,
  ChevronLeft, ChevronRight, Wrench, FlaskConical
} from 'lucide-vue-next'

const auth             = useAuthStore()
const ticketStore      = useTicketStore()
const reservationStore = useReservationStore()
const labStore         = useLabStore()
const router           = useRouter()

onMounted(async () => {
  await Promise.allSettled([
    ticketStore.loadAllTickets(),
    reservationStore.loadReservations(true),
    labStore.loadLabs(),
  ])
})

// ─── labsMap ──────────────────────────────────────────────────────────────────
const labsMap = computed(() => {
  const map = {}
  for (const lab of labStore.labs ?? []) map[lab.id] = lab.name
  return map
})

// ─── Minhas reservas ──────────────────────────────────────────────────────────
const myReservations = computed(() =>
  reservationStore.reservations.filter(r => {
    const uid = auth.user?.id
    return r.requestedByUserId === uid || r.professorId === uid || r.userId === uid
  })
)

const activeReservations = computed(() =>
  myReservations.value.filter(r =>
    ["APPROVED","CONFIRMADA","PENDING","PENDENTE"].includes((r.status || '').toUpperCase())
  )
)

const nextReservation = computed(() => {
  const now = new Date()
  return [...activeReservations.value]
    .filter(r => {
      const d = r.reservationDate || r.date
      return d ? new Date(d + 'T23:59:59') >= now : true
    })
    .sort((a, b) => new Date(a.reservationDate || a.date || '') - new Date(b.reservationDate || b.date || ''))[0] ?? null
})

// ─── Meus chamados ────────────────────────────────────────────────────────────
const myTickets = computed(() =>
  ticketStore.tickets.filter(t => {
    const uid = auth.user?.id
    return t.createdByUserId === uid || t.authorId === uid || t.requestedByUserId === uid || t.userId === uid
  })
)

const myOpenTickets = computed(() =>
  myTickets.value.filter(t => ['Aberto','OPEN','Em andamento','IN_PROGRESS'].includes(t.status))
)

const myResolvedThisMonth = computed(() => {
  const now = new Date()
  return myTickets.value.filter(t => {
    const d = t.updatedAt ? new Date(t.updatedAt) : null
    return d && d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear() &&
      ['Concluido','RESOLVED','Fechado','CLOSED'].includes(t.status)
  }).length
})

// ─── Agenda semanal ───────────────────────────────────────────────────────────
const SHOW_DAYS = ['SEGUNDA','TERÇA','QUARTA','QUINTA','SEXTA']

function getWeekStart() {
  const d = new Date()
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1)
  const ws = new Date(d)
  ws.setDate(diff); ws.setHours(0,0,0,0)
  return ws
}

const weekStart = getWeekStart()
const weekEnd   = new Date(weekStart); weekEnd.setDate(weekStart.getDate() + 4)

const weekLabel = computed(() => {
  const fmt = d => d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long' })
  return `${fmt(weekStart)} — ${fmt(weekEnd)}`
})

const weekAgenda = computed(() =>
  SHOW_DAYS.map((dayName, i) => {
    const dayDate = new Date(weekStart)
    dayDate.setDate(weekStart.getDate() + i)
    const dateStr = new Intl.DateTimeFormat('sv-SE', { timeZone: 'America/Sao_Paulo' }).format(dayDate)
    const res = myReservations.value.find(r => {
      const rd = r.reservationDate || r.date
      return rd && rd.split('T')[0] === dateStr
    })
    return {
      day:  dayName,
      date: dayDate.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
      res:  res ?? null,
    }
  })
)

// ─── Atividades recentes ──────────────────────────────────────────────────────
const recentActivities = computed(() => {
  const items = []
  myReservations.value.slice(0, 2).forEach(r => {
    items.push({
      type:  'reserva',
      title: 'Reserva ' + statusLabel(r.status),
      desc:  labsMap.value[r.laboratoryId] || r.labName || 'Laboratório',
      time:  formatRelative(r.updatedAt || r.createdAt),
    })
  })
  myTickets.value.slice(0, 1).forEach(t => {
    items.push({
      type:  'chamado',
      title: 'Chamado Atualizado',
      desc:  `#${t.id} - ${t.title || ''}`,
      time:  formatRelative(t.updatedAt || t.createdAt),
    })
  })
  return items.slice(0, 3)
})

// ─── Helpers ──────────────────────────────────────────────────────────────────
function statusLabel(s) {
  const m = { APPROVED:'Confirmada', CONFIRMADA:'Confirmada', PENDING:'Pendente', PENDENTE:'Pendente', CANCELLED:'Cancelada' }
  return m[(s || '').toUpperCase()] || s || '-'
}

function statusClass(s) {
  const st = (s || '').toUpperCase()
  if (['APPROVED','CONFIRMADA'].includes(st)) return 's-confirmed'
  if (['PENDING','PENDENTE'].includes(st))    return 's-pending'
  return 's-other'
}

function activityColor(type) { return type === 'reserva' ? '#16a34a' : '#ef4444' }

function formatRelative(ts) {
  if (!ts) return ''
  const diff = Date.now() - new Date(ts).getTime()
  const h = Math.floor(diff / 3600000)
  if (h < 1)  return 'há poucos minutos'
  if (h < 24) return `há ${h}h`
  return `há ${Math.floor(h / 24)} dia(s)`
}

function formatTime(r) {
  if (!r) return ''
  const block = r.timeBlocks?.[0]
  if (block?.startTime && block?.endTime) return `${block.startTime} – ${block.endTime}`
  if (r.startTime && r.endTime)           return `${r.startTime} – ${r.endTime}`
  const d = r.reservationDate || r.date
  return d ? new Date(d + 'T00:00:00').toLocaleDateString('pt-BR') : ''
}

function getResLabName(r) {
  return labsMap.value[r.laboratoryId] || labsMap.value[r.labId] || r.labName || `Lab ${r.laboratoryId || '-'}`
}

function priorityClass(p) {
  const v = (p || '').toUpperCase()
  if (['ALTA','HIGH'].includes(v))    return 'p-high'
  if (['MEDIA','MEDIUM'].includes(v)) return 'p-med'
  return 'p-low'
}
</script>

<template>
  <AppLayout>
    <!-- Header -->
    <div class="page-header">
      <div>
        <p class="welcome">Bem-vindo de volta, Prof. {{ auth.user?.firstName }}</p>
        <h1 class="page-title">Visão Geral</h1>
      </div>
      <div class="header-actions">
        <button class="btn-primary" @click="router.push('/chamados')">
          <Ticket :size="15" /> Abrir Chamado
        </button>
        <button class="btn-secondary" @click="router.push('/laboratorios')">
          <FlaskConical :size="15" /> Consultar Labs
        </button>
      </div>
    </div>

    <!-- Stats -->
    <div class="top-grid">
      <div class="card stat-card">
        <div class="stat-icon-wrap bg-green">
          <CalendarCheck :size="21" color="#16a34a" />
          <span v-if="activeReservations.length > 0" class="new-badge">
            {{ activeReservations.length }} ativas
          </span>
        </div>
        <div class="stat-label">Minhas Reservas Ativas</div>
        <div class="stat-num">{{ String(activeReservations.length).padStart(2, '0') }}</div>
        <div v-if="nextReservation" class="stat-sub">
          Próxima: {{ getResLabName(nextReservation) }} · {{ formatTime(nextReservation) }}
        </div>
        <div v-else class="stat-sub">Nenhuma reserva próxima</div>
      </div>

      <div class="card stat-card">
        <div class="stat-icon-wrap bg-red">
          <Ticket :size="21" color="#ef4444" />
        </div>
        <div class="stat-label">Chamados de Suporte</div>
        <div class="stat-num">
          {{ String(myOpenTickets.length).padStart(2, '0') }}
          <span v-if="myOpenTickets.length > 0" class="open-label">Em aberto</span>
        </div>
        <div class="stat-sub">{{ myResolvedThisMonth }} concluídos este mês</div>
      </div>

      <div class="card">
        <div class="card-title mb-12">
          <Clock :size="15" color="#16a34a" /> Atividades Recentes
        </div>
        <div v-if="recentActivities.length === 0" class="empty-msg">Nenhuma atividade recente.</div>
        <div v-else class="activities">
          <div v-for="a in recentActivities" :key="a.title + a.time" class="act-row">
            <div class="act-bar" :style="{ background: activityColor(a.type) }"></div>
            <div>
              <div class="act-title">{{ a.title }}</div>
              <div class="act-desc">{{ a.desc }}</div>
              <div class="act-time">{{ a.time }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Agenda semanal -->
    <div class="card agenda-card">
      <div class="agenda-head">
        <div>
          <div class="card-title">Sua Agenda da Semana</div>
          <div class="agenda-week">{{ weekLabel }}</div>
        </div>
        <div class="agenda-nav">
          <button class="nav-btn"><ChevronLeft :size="15" /></button>
          <button class="nav-btn"><ChevronRight :size="15" /></button>
        </div>
      </div>
      <div v-if="reservationStore.loading" class="empty-msg">Carregando agenda...</div>
      <div v-else class="week-grid">
        <div v-for="d in weekAgenda" :key="d.day" class="week-col">
          <div class="week-day">
            {{ d.day }}
            <span class="week-date">{{ d.date }}</span>
          </div>
          <div v-if="d.res" class="week-block" @click="router.push('/reservas')">
            <div class="week-time">{{ formatTime(d.res) }}</div>
            <div class="week-lab">{{ getResLabName(d.res) }}</div>
            <div class="week-turma">{{ d.res.purpose || d.res.courseName || '' }}</div>
            <span class="week-status" :class="statusClass(d.res.status)">
              {{ statusLabel(d.res.status) }}
            </span>
          </div>
          <div v-else class="week-empty">Livre</div>
        </div>
      </div>
    </div>

    <!-- Bottom -->
    <div class="bottom-grid">
      <div class="tip-card">
        <span class="tip-tag">DICA DE USO</span>
        <h3 class="tip-title">Mantenha seus labs seguros</h3>
        <p class="tip-text">Acompanhe seus chamados e reserve laboratórios com antecedência.</p>
        <button class="btn-white" @click="router.push('/reservas')">Ver minhas reservas</button>
      </div>

      <div class="card">
        <div class="card-title mb-12">
          <Wrench :size="15" color="#16a34a" /> Meus Chamados Recentes
        </div>
        <div v-if="myTickets.length === 0" class="empty-msg">Nenhum chamado aberto.</div>
        <div v-else class="ticket-list">
          <div
            v-for="t in myTickets.slice(0, 3)"
            :key="t.id"
            class="ticket-row"
            @click="router.push(`/chamados/${t.id}`)"
          >
            <div class="ticket-icon"><Wrench :size="13" color="#64748b" /></div>
            <div class="ticket-body">
              <div class="ticket-top">
                <span class="ticket-title">{{ t.title || 'Sem título' }}</span>
                <span class="ticket-time">{{ formatRelative(t.createdAt) }}</span>
              </div>
              <div class="ticket-lab-name">{{ labsMap[t.laboratoryId] || `Lab ${t.laboratoryId || '-'}` }}</div>
              <div class="ticket-desc">{{ (t.description || '').slice(0, 50) }}</div>
              <span class="priority-label" :class="priorityClass(t.priority)">
                &#x2022; {{ (t.priority || 'MEDIA').toUpperCase() }} PRIORIDADE
              </span>
            </div>
          </div>
        </div>
        <button class="attend-btn mt-12" @click="router.push('/chamados')">
          Ver todos os chamados
        </button>
      </div>
    </div>
  </AppLayout>
</template>

<style scoped>
.page-header { display:flex; justify-content:space-between; align-items:flex-end; margin-bottom:22px; }
.welcome     { font-size:13px; color:#64748b; margin:0 0 2px; }
.page-title  { font-size:28px; font-weight:800; color:#0f172a; margin:0; }
.header-actions { display:flex; gap:10px; }
.btn-primary   { display:flex; align-items:center; gap:6px; background:#16a34a; color:#fff; border:none; padding:9px 18px; border-radius:8px; font-size:13.5px; font-weight:600; cursor:pointer; }
.btn-primary:hover { background:#15803d; }
.btn-secondary { display:flex; align-items:center; gap:6px; background:#fff; color:#374151; border:1px solid #d1d5db; padding:9px 18px; border-radius:8px; font-size:13.5px; font-weight:600; cursor:pointer; }
.btn-secondary:hover { background:#f8fafc; }
.top-grid { display:grid; grid-template-columns:1fr 1fr 1fr; gap:13px; margin-bottom:13px; }
.card     { background:#fff; border:1px solid #e8ecf0; border-radius:12px; padding:18px; }
.card-title { display:flex; align-items:center; gap:7px; font-size:14px; font-weight:600; color:#0f172a; }
.mb-12 { margin-bottom:12px; } .mt-12 { margin-top:12px; }
.stat-card { display:flex; flex-direction:column; gap:5px; }
.stat-icon-wrap { width:46px; height:46px; border-radius:10px; display:flex; align-items:center; justify-content:center; margin-bottom:8px; position:relative; }
.bg-green { background:#f0fdf4; } .bg-red { background:#fef2f2; }
.new-badge { position:absolute; top:-4px; right:-50px; background:#16a34a; color:#fff; font-size:10px; padding:2px 7px; border-radius:10px; white-space:nowrap; }
.stat-label { font-size:13px; color:#64748b; }
.stat-num   { font-size:40px; font-weight:800; color:#0f172a; line-height:1.1; display:flex; align-items:baseline; gap:8px; }
.open-label { font-size:12px; font-weight:600; color:#ef4444; }
.stat-sub   { font-size:12px; color:#94a3b8; }
.activities { display:flex; flex-direction:column; gap:13px; }
.act-row    { display:flex; gap:10px; align-items:flex-start; }
.act-bar    { width:3px; border-radius:2px; flex-shrink:0; align-self:stretch; min-height:38px; }
.act-title  { font-size:13px; font-weight:600; color:#0f172a; }
.act-desc   { font-size:12px; color:#64748b; }
.act-time   { font-size:11px; color:#94a3b8; margin-top:1px; }
.agenda-card { margin-bottom:13px; }
.agenda-head { display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:16px; }
.agenda-week { font-size:12px; color:#94a3b8; margin-top:3px; }
.agenda-nav  { display:flex; gap:4px; }
.nav-btn     { background:#fff; border:1px solid #e8ecf0; border-radius:6px; width:28px; height:28px; display:flex; align-items:center; justify-content:center; cursor:pointer; color:#64748b; }
.week-grid  { display:grid; grid-template-columns:repeat(5,1fr); gap:8px; }
.week-col   { display:flex; flex-direction:column; gap:8px; }
.week-day   { font-size:10.5px; font-weight:600; color:#94a3b8; letter-spacing:.4px; display:flex; flex-direction:column; gap:1px; }
.week-date  { font-size:10px; font-weight:400; color:#cbd5e1; }
.week-block { background:#f0fdf4; border-left:3px solid #16a34a; border-radius:7px; padding:10px; cursor:pointer; }
.week-block:hover { background:#dcfce7; }
.week-time  { font-size:11.5px; font-weight:600; color:#16a34a; }
.week-lab   { font-size:12.5px; font-weight:600; color:#0f172a; margin-top:3px; }
.week-turma { font-size:11px; color:#64748b; margin-top:1px; }
.week-status{ display:inline-block; font-size:9.5px; font-weight:700; padding:1px 6px; border-radius:4px; margin-top:5px; }
.s-confirmed { background:#f0fdf4; color:#16a34a; }
.s-pending   { background:#fef3c7; color:#d97706; }
.s-other     { background:#f1f5f9; color:#64748b; }
.week-empty { background:#f8fafc; border:1.5px dashed #e2e8f0; border-radius:7px; min-height:80px; display:flex; align-items:center; justify-content:center; font-size:12px; color:#94a3b8; }
.bottom-grid { display:grid; grid-template-columns:1fr 1fr; gap:13px; }
.tip-card  { background:linear-gradient(140deg,#14532d 0%,#166534 60%,#15803d 100%); border-radius:12px; padding:24px; color:#fff; display:flex; flex-direction:column; gap:10px; }
.tip-tag   { display:inline-block; background:rgba(255,255,255,.15); font-size:10px; padding:3px 9px; border-radius:4px; width:fit-content; }
.tip-title { font-size:20px; font-weight:700; margin:0; }
.tip-text  { font-size:13px; opacity:.85; line-height:1.5; margin:0; }
.btn-white { background:#fff; color:#0f172a; border:none; padding:9px 18px; border-radius:8px; font-size:13px; font-weight:600; cursor:pointer; width:fit-content; }
.ticket-list { display:flex; flex-direction:column; gap:8px; }
.ticket-row  { display:flex; gap:10px; align-items:flex-start; cursor:pointer; padding:8px; border-radius:8px; transition:background .1s; border:1px solid #f1f5f9; }
.ticket-row:hover { background:#f8fafc; }
.ticket-icon { width:32px; height:32px; background:#f1f5f9; border-radius:7px; display:flex; align-items:center; justify-content:center; flex-shrink:0; }
.ticket-body { flex:1; min-width:0; }
.ticket-top  { display:flex; justify-content:space-between; gap:6px; margin-bottom:2px; }
.ticket-title{ font-size:13px; font-weight:600; color:#0f172a; }
.ticket-time { font-size:11px; color:#94a3b8; white-space:nowrap; }
.ticket-lab-name { font-size:11.5px; color:#16a34a; font-weight:500; margin-bottom:2px; }
.ticket-desc { font-size:12px; color:#64748b; margin-bottom:4px; }
.priority-label { font-size:10.5px; font-weight:700; }
.p-high { color:#ef4444; } .p-med { color:#f59e0b; } .p-low { color:#16a34a; }
.attend-btn { width:100%; padding:10px; border:1px solid #e8ecf0; background:#fff; border-radius:8px; font-size:13px; color:#374151; font-weight:500; cursor:pointer; }
.attend-btn:hover { background:#f8fafc; }
.empty-msg { font-size:13px; color:#94a3b8; text-align:center; padding:16px 0; }
</style>
