<script setup>
import { ref, computed, onMounted } from 'vue'
import AppLayout from '@/components/AppLayout.vue'
import { useReservationStore } from '@/stores/useReservationStore'
import { useLabStore } from '@/stores/useLabStore'
import { useAuthStore } from '@/stores/useAuthStore'
import { Calendar, ChevronLeft, ChevronRight, Clock } from 'lucide-vue-next'

const reservationStore = useReservationStore()
const labStore         = useLabStore()
const auth             = useAuthStore()

onMounted(async () => {
  await reservationStore.loadReservations()
  await labStore.loadLabs()
})

// ─── Semana atual ─────────────────────────────────────────────────────────────
const weekOffset = ref(0)

const weekStart = computed(() => {
  const d = new Date()
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1)
  d.setDate(diff + weekOffset.value * 7)
  d.setHours(0, 0, 0, 0)
  return new Date(d)
})

const weekDays = computed(() => {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart.value)
    d.setDate(d.getDate() + i)
    return d
  })
})

const weekLabel = computed(() => {
  const fmt = (d) => d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long' })
  const last = weekDays.value[6]
  return `${fmt(weekStart.value)} — ${fmt(last)}`
})

const DIAS_PT = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab']

// ─── Filtros ──────────────────────────────────────────────────────────────────
const selectedStatus = ref('TODOS')
const STATUS_OPTIONS = ['TODOS', 'APROVADA', 'PENDENTE', 'CANCELADA']

// ─── Reservas filtradas por semana ────────────────────────────────────────────
const isStudent   = computed(() => auth.user?.role === 'STUDENT')
const isProfessor = computed(() => auth.user?.role === 'PROFESSOR')

const weekReservations = computed(() => {
  const start = weekStart.value
  const end   = new Date(weekDays.value[6]); end.setHours(23, 59, 59)

  return reservationStore.reservations.filter(r => {
    if (!r.date) return false
    const d = new Date(r.date)
    if (d < start || d > end) return false

    // Aluno vê apenas reservas do seu curso/turma (sem filtro de id por ora)
    // Professor vê apenas as suas
    if (isProfessor.value && r.professorId !== auth.user?.id && r.userId !== auth.user?.id) return false

    if (selectedStatus.value !== 'TODOS') {
      const st = (r.status || '').toUpperCase()
      if (selectedStatus.value === 'APROVADA'  && !['APPROVED','CONFIRMADA'].includes(st)) return false
      if (selectedStatus.value === 'PENDENTE'  && !['PENDING','PENDENTE'].includes(st))    return false
      if (selectedStatus.value === 'CANCELADA' && !['CANCELLED','CANCELADA'].includes(st)) return false
    }

    return true
  })
})

// ─── Agrupar por dia ─────────────────────────────────────────────────────────
function reservationsForDay(dayDate) {
  const dateStr = dayDate.toISOString().split('T')[0]
  return weekReservations.value.filter(r => {
    if (!r.date) return false
    return new Date(r.date).toISOString().split('T')[0] === dateStr
  }).sort((a, b) => (a.startTime || '').localeCompare(b.startTime || ''))
}

const isToday = (d) => {
  const t = new Date()
  return d.toDateString() === t.toDateString()
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function statusCfg(s) {
  const st = (s || '').toUpperCase()
  if (['APPROVED','CONFIRMADA'].includes(st))  return { cls: 's-approved', label: 'Aprovada' }
  if (['PENDING','PENDENTE'].includes(st))      return { cls: 's-pending',  label: 'Pendente' }
  if (['CANCELLED','CANCELADA'].includes(st))   return { cls: 's-cancel',   label: 'Cancelada' }
  return { cls: 's-other', label: s || '-' }
}

function labName(r) {
  const lab = labStore.labs.find(l => l.id === r.laboratoryId || l.id === r.labId)
  return lab?.name || r.labName || r.labId || `Lab ${r.laboratoryId}`
}

function formatTime(r) {
  if (r.startTime && r.endTime) return `${r.startTime} – ${r.endTime}`
  if (r.date) return new Date(r.date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
  return ''
}
</script>

<template>
  <AppLayout>

    <!-- Header -->
    <div class="page-header">
      <div>
        <h1 class="page-title">Horarios</h1>
        <p class="page-sub">Visualize as reservas e ocupacao semanal dos laboratorios.</p>
      </div>
    </div>

    <!-- Toolbar -->
    <div class="toolbar">
      <div class="week-nav">
        <button class="nav-btn" @click="weekOffset--">
          <ChevronLeft :size="16" />
        </button>
        <span class="week-label">
          <Calendar :size="14" color="#16a34a" />
          {{ weekLabel }}
        </span>
        <button class="nav-btn" @click="weekOffset++">
          <ChevronRight :size="16" />
        </button>
        <button
          v-if="weekOffset !== 0"
          class="btn-today"
          @click="weekOffset = 0"
        >Hoje</button>
      </div>

      <div class="filters">
        <button
          v-for="opt in STATUS_OPTIONS"
          :key="opt"
          class="filter-btn"
          :class="{ active: selectedStatus === opt }"
          @click="selectedStatus = opt"
        >{{ opt }}</button>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="reservationStore.loading" class="loading-msg">
      <Clock :size="16" color="#94a3b8" /> Carregando horarios...
    </div>

    <!-- Grade semanal -->
    <div v-else class="week-grid">
      <div
        v-for="day in weekDays"
        :key="day.toDateString()"
        class="day-col"
        :class="{ today: isToday(day) }"
      >
        <!-- Cabecalho do dia -->
        <div class="day-header">
          <span class="day-name">{{ DIAS_PT[day.getDay()] }}</span>
          <span class="day-num" :class="{ 'day-today-badge': isToday(day) }">
            {{ day.getDate() }}
          </span>
        </div>

        <!-- Reservas do dia -->
        <div class="day-body">
          <div
            v-for="r in reservationsForDay(day)"
            :key="r.id"
            class="res-block"
            :class="statusCfg(r.status).cls"
          >
            <div class="res-time">
              <Clock :size="11" />
              {{ formatTime(r) }}
            </div>
            <div class="res-lab">{{ labName(r) }}</div>
            <div v-if="r.courseName || r.className" class="res-course">
              {{ r.courseName || r.className }}
            </div>
            <span class="res-status">{{ statusCfg(r.status).label }}</span>
          </div>

          <div v-if="reservationsForDay(day).length === 0" class="day-empty">
            Livre
          </div>
        </div>
      </div>
    </div>

    <!-- Legenda -->
    <div class="legend">
      <span class="legend-item s-approved">Aprovada</span>
      <span class="legend-item s-pending">Pendente</span>
      <span class="legend-item s-cancel">Cancelada</span>
    </div>

  </AppLayout>
</template>

<style scoped>
.page-header { margin-bottom: 18px; }
.page-title  { font-size: 24px; font-weight: 800; color: #0f172a; margin: 0 0 3px; }
.page-sub    { font-size: 13px; color: #64748b; margin: 0; }

.toolbar     { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; flex-wrap: wrap; gap: 10px; }

.week-nav    { display: flex; align-items: center; gap: 8px; }
.nav-btn     { background: #fff; border: 1px solid #e8ecf0; border-radius: 7px; width: 30px; height: 30px; display: flex; align-items: center; justify-content: center; cursor: pointer; color: #64748b; }
.nav-btn:hover { background: #f1f5f9; }
.week-label  { display: flex; align-items: center; gap: 6px; font-size: 13.5px; font-weight: 600; color: #0f172a; padding: 0 4px; }
.btn-today   { background: #f0fdf4; color: #16a34a; border: 1px solid #bbf7d0; border-radius: 6px; padding: 4px 10px; font-size: 12px; font-weight: 600; cursor: pointer; }

.filters     { display: flex; gap: 6px; }
.filter-btn  { background: #fff; border: 1px solid #e8ecf0; border-radius: 6px; padding: 5px 12px; font-size: 12px; color: #64748b; cursor: pointer; transition: all 0.13s; }
.filter-btn:hover  { background: #f1f5f9; }
.filter-btn.active { background: #16a34a; color: #fff; border-color: #16a34a; font-weight: 600; }

.loading-msg { display: flex; align-items: center; gap: 8px; color: #94a3b8; font-size: 13px; padding: 32px; justify-content: center; }

/* Grade */
.week-grid { display: grid; grid-template-columns: repeat(7, 1fr); gap: 8px; margin-bottom: 14px; }

.day-col        { background: #fff; border: 1px solid #e8ecf0; border-radius: 10px; overflow: hidden; min-height: 300px; }
.day-col.today  { border-color: #16a34a; box-shadow: 0 0 0 1px #16a34a22; }

.day-header     { padding: 10px; border-bottom: 1px solid #f1f5f9; display: flex; flex-direction: column; align-items: center; gap: 3px; }
.day-name       { font-size: 10.5px; font-weight: 600; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.4px; }
.day-num        { font-size: 17px; font-weight: 700; color: #0f172a; line-height: 1; }
.day-today-badge{ background: #16a34a; color: #fff; border-radius: 50%; width: 28px; height: 28px; display: flex; align-items: center; justify-content: center; font-size: 13px; }

.day-body  { padding: 8px; display: flex; flex-direction: column; gap: 6px; }

.res-block { border-radius: 7px; padding: 8px 10px; border-left: 3px solid; }
.s-approved{ background: #f0fdf4; border-color: #16a34a; }
.s-pending { background: #fefce8; border-color: #eab308; }
.s-cancel  { background: #fef2f2; border-color: #ef4444; opacity: 0.7; }
.s-other   { background: #f8fafc; border-color: #94a3b8; }

.res-time   { display: flex; align-items: center; gap: 4px; font-size: 11px; color: #64748b; margin-bottom: 2px; }
.s-approved .res-time { color: #16a34a; }
.res-lab    { font-size: 12.5px; font-weight: 600; color: #0f172a; }
.res-course { font-size: 11px; color: #64748b; margin-top: 1px; }
.res-status { display: inline-block; font-size: 9.5px; font-weight: 700; margin-top: 5px; padding: 1px 6px; border-radius: 4px; background: rgba(0,0,0,0.06); color: inherit; }

.day-empty { color: #cbd5e1; font-size: 12px; text-align: center; padding: 24px 0; }

.legend     { display: flex; gap: 10px; justify-content: flex-end; }
.legend-item{ font-size: 11.5px; font-weight: 600; padding: 3px 10px; border-radius: 5px; border-left: 3px solid; }
.legend-item.s-approved{ background: #f0fdf4; border-color: #16a34a; color: #16a34a; }
.legend-item.s-pending { background: #fefce8; border-color: #eab308; color: #854d0e; }
.legend-item.s-cancel  { background: #fef2f2; border-color: #ef4444; color: #ef4444; }
</style>
