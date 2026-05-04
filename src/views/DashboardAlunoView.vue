<script setup>
import { computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import AppLayout from '@/components/AppLayout.vue'
import { useAuthStore } from '@/stores/useAuthStore'
import { useLabStore } from '@/stores/useLabStore'
import { useTicketStore } from '@/stores/useTicketStore'
import {
  Calendar, Zap, Megaphone, Monitor, Wifi, Printer,
  CheckCircle2, XCircle, Wrench, ArrowRight, Plus, Ticket
} from 'lucide-vue-next'

const auth        = useAuthStore()
const labStore    = useLabStore()
const ticketStore = useTicketStore()
const router      = useRouter()

onMounted(async () => {
  await labStore.loadLabs()
  await ticketStore.loadAllTickets()
})

// ─── Data hoje ────────────────────────────────────────────────────────────────
const today = computed(() =>
  new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })
)

// ─── Labs ─────────────────────────────────────────────────────────────────────
const labsGrid   = computed(() => labStore.labs.slice(0, 4))
const labsStatus = computed(() => labStore.labs.slice(0, 4))

function labStatusCfg(lab) {
  if (!lab) return { icon: CheckCircle2, cls: 'livre', label: 'LIVRE' }
  const raw = (lab.status || '').toUpperCase()
  if (['MAINTENANCE','MANUTENCAO'].includes(raw)) return { icon: Wrench,       cls: 'manutencao', label: 'MANUTENCAO' }
  if (lab.available === false || ['OCCUPIED','OCUPADO'].includes(raw))
                                                  return { icon: XCircle,      cls: 'ocupado',    label: 'OCUPADO' }
  return                                                 { icon: CheckCircle2, cls: 'livre',      label: 'LIVRE' }
}

// ─── Meus chamados (aluno) ────────────────────────────────────────────────────
const myOpenTickets = computed(() =>
  ticketStore.tickets.filter(t => {
    const isOpen = ['Aberto','OPEN','Em andamento','IN_PROGRESS'].includes(t.status)
    const isMine = t.authorId === auth.user?.id || t.requestedByUserId === auth.user?.id
    return isOpen && isMine
  })
)

const myRecentTickets = computed(() => myOpenTickets.value.slice(0, 3))

// ─── Helpers ──────────────────────────────────────────────────────────────────
function statusDotClass(status) {
  if (['Aberto','OPEN'].includes(status))              return 'dot-open'
  if (['Em andamento','IN_PROGRESS'].includes(status)) return 'dot-progress'
  return 'dot-done'
}

function priorityClass(p) {
  const v = (p || '').toUpperCase()
  if (['ALTA','HIGH'].includes(v))    return 'p-high'
  if (['MEDIA','MEDIUM'].includes(v)) return 'p-med'
  return 'p-low'
}
</script>

<template>
  <AppLayout campus="IF Campus">

    <!-- Greeting -->
    <div class="greeting-bar">
      <div>
        <h1 class="greeting">Ola, {{ auth.user?.firstName }}.</h1>
        <p class="greeting-sub">Veja o que esta acontecendo nos laboratorios hoje.</p>
      </div>
      <div class="meta-cards">
        <div class="meta-card">
          <span class="meta-label">DATA DE HOJE</span>
          <span class="meta-value">{{ today }}</span>
        </div>
        <div v-if="myOpenTickets.length > 0" class="meta-card meta-green">
          <span class="meta-label">CHAMADOS ABERTOS</span>
          <span class="meta-value">{{ myOpenTickets.length }} em aberto</span>
        </div>
      </div>
    </div>

    <!-- Grid principal -->
    <div class="main-grid">

      <!-- Meus chamados -->
      <div class="card">
        <div class="card-head">
          <div class="card-title">
            <Ticket :size="16" color="#16a34a" /> Meus Chamados
          </div>
          <button class="pill-btn" @click="router.push('/chamados')">Ver todos</button>
        </div>

        <div v-if="ticketStore.loading" class="empty-msg">Carregando...</div>

        <div v-else-if="myRecentTickets.length === 0" class="empty-msg">
          Nenhum chamado aberto no momento.
        </div>

        <div v-else class="ticket-list">
          <div
            v-for="t in myRecentTickets"
            :key="t.id"
            class="ticket-row"
            @click="router.push(`/chamados/${t.id}`)"
          >
            <div class="ticket-dot" :class="statusDotClass(t.status)"></div>
            <div class="ticket-body">
              <div class="ticket-title">{{ t.title }}</div>
              <div class="ticket-meta">{{ t.labId }} &bull; {{ t.status }}</div>
            </div>
            <div class="ticket-priority" :class="priorityClass(t.priority)">
              {{ t.priority || 'MEDIA' }}
            </div>
          </div>
        </div>

        <button class="btn-outline mt-12" @click="router.push('/chamados')">
          <Plus :size="13" /> Abrir novo chamado
        </button>
      </div>

      <!-- Coluna direita -->
      <div class="right-col">

        <!-- Status em tempo real -->
        <div class="card">
          <div class="card-title mb-12">
            <Zap :size="16" color="#16a34a" /> Status em Tempo Real
          </div>

          <div v-if="labStore.loading" class="empty-msg">Carregando labs...</div>

          <div v-else-if="labsStatus.length === 0" class="empty-msg">
            Nenhum laboratorio encontrado.
          </div>

          <div v-else class="status-list">
            <div
              v-for="lab in labsStatus"
              :key="lab.id"
              class="status-row"
              @click="router.push(`/laboratorios/${lab.id}`)"
            >
              <component :is="labStatusCfg(lab).icon" :size="15" :class="`icon-${labStatusCfg(lab).cls}`" />
              <span class="status-name">{{ lab.name || lab.labId }}</span>
              <span class="status-pill" :class="`pill-${labStatusCfg(lab).cls}`">
                {{ labStatusCfg(lab).label }}
              </span>
            </div>
          </div>
        </div>

        <!-- Comunicados -->
        <div class="card card-dark">
          <div class="card-title mb-12">
            <Megaphone :size="16" /> Comunicados
          </div>
          <div class="announce-list">
            <div class="announce-item">
              <div class="announce-title">Bem-vindo ao ReservaLab</div>
              <div class="announce-text">
                Acompanhe o status dos laboratorios e abra chamados diretamente pelo portal.
              </div>
            </div>
          </div>
          <button class="btn-ghost-white" @click="router.push('/chamados')">
            Ver chamados
          </button>
        </div>

      </div>
    </div>

    <!-- Labs -->
    <div class="section-header">
      <div>
        <h2 class="section-title">Consultar Laboratorios</h2>
        <p class="section-sub">Explore as instalacoes e recursos disponiveis.</p>
      </div>
      <RouterLink to="/laboratorios" class="link-map">
        Ver todos <ArrowRight :size="13" />
      </RouterLink>
    </div>

    <div v-if="labStore.loading" class="empty-msg">Carregando laboratorios...</div>

    <div v-else class="labs-grid">
      <RouterLink
        v-for="lab in labsGrid"
        :key="lab.id"
        :to="`/laboratorios/${lab.id}`"
        class="lab-card"
      >
        <div class="lab-img">
          <span class="lab-status-tag" :class="`pill-${labStatusCfg(lab).cls}`">
            {{ labStatusCfg(lab).label }}
          </span>
        </div>
        <div class="lab-body">
          <div class="lab-name-row">
            <span class="lab-name">{{ lab.name }}</span>
            <span class="lab-code">{{ lab.labId }}</span>
          </div>
          <p class="lab-desc">{{ lab.description || 'Laboratorio do campus' }}</p>
          <div class="lab-icons">
            <Monitor :size="13" color="#9ca3af" />
            <Wifi    :size="13" color="#9ca3af" />
            <Printer :size="13" color="#9ca3af" />
          </div>
        </div>
      </RouterLink>

      <div v-if="labsGrid.length === 0" class="labs-empty">
        Nenhum laboratorio disponivel.
      </div>
    </div>

  </AppLayout>
</template>

<style scoped>
.greeting-bar { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 22px; flex-wrap: wrap; gap: 14px; }
.greeting     { font-size: 34px; font-weight: 800; color: #0f172a; margin: 0 0 3px; }
.greeting-sub { font-size: 14px; color: #64748b; margin: 0; }
.meta-cards   { display: flex; gap: 10px; flex-wrap: wrap; }
.meta-card    { background: #fff; border: 1px solid #e8ecf0; border-radius: 10px; padding: 12px 16px; min-width: 140px; }
.meta-label   { display: block; font-size: 10px; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px; }
.meta-value   { display: block; font-size: 13.5px; font-weight: 600; color: #0f172a; }
.meta-green   { background: #f0fdf4; border-color: #bbf7d0; }
.meta-green .meta-value { color: #16a34a; }

.main-grid { display: grid; grid-template-columns: 1fr 310px; gap: 14px; margin-bottom: 26px; }

.card      { background: #fff; border: 1px solid #e8ecf0; border-radius: 12px; padding: 18px; }
.card-dark { background: #14532d; color: #fff; border-color: transparent; }
.card-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px; }
.card-title{ display: flex; align-items: center; gap: 7px; font-size: 14px; font-weight: 600; color: #0f172a; }
.card-dark .card-title { color: #fff; }
.mb-12 { margin-bottom: 12px; }
.mt-12 { margin-top: 12px; }

.pill-btn  { background: #f1f5f9; color: #64748b; border: none; font-size: 11.5px; padding: 4px 10px; border-radius: 6px; cursor: pointer; }
.pill-btn:hover { background: #e2e8f0; }

.ticket-list  { display: flex; flex-direction: column; gap: 8px; }
.ticket-row   { display: flex; align-items: center; gap: 10px; padding: 10px; border-radius: 8px; cursor: pointer; transition: background 0.1s; }
.ticket-row:hover { background: #f8fafc; }
.ticket-dot   { width: 9px; height: 9px; border-radius: 50%; flex-shrink: 0; }
.dot-open     { background: #ef4444; }
.dot-progress { background: #f59e0b; }
.dot-done     { background: #16a34a; }
.ticket-body  { flex: 1; }
.ticket-title { font-size: 13px; font-weight: 600; color: #0f172a; }
.ticket-meta  { font-size: 11.5px; color: #94a3b8; margin-top: 1px; }
.ticket-priority { font-size: 10.5px; font-weight: 700; }
.p-high { color: #ef4444; }
.p-med  { color: #f59e0b; }
.p-low  { color: #16a34a; }

.btn-outline {
  display: flex; align-items: center; justify-content: center; gap: 6px;
  width: 100%; padding: 8px; border: 1px dashed #d1d5db;
  background: none; border-radius: 8px; font-size: 13px; color: #64748b; cursor: pointer; transition: all 0.15s;
}
.btn-outline:hover { border-color: #16a34a; color: #16a34a; background: #f0fdf4; }

.right-col   { display: flex; flex-direction: column; gap: 12px; }
.status-list { display: flex; flex-direction: column; gap: 10px; }
.status-row  { display: flex; align-items: center; gap: 8px; cursor: pointer; padding: 4px 6px; border-radius: 6px; transition: background 0.1s; }
.status-row:hover { background: #f8fafc; }
.status-name { flex: 1; font-size: 13.5px; font-weight: 500; color: #0f172a; }
.status-pill { font-size: 10px; font-weight: 700; padding: 2px 8px; border-radius: 4px; }

.icon-livre      { color: #16a34a; }
.icon-ocupado    { color: #ef4444; }
.icon-manutencao { color: #f59e0b; }
.pill-livre      { background: #f0fdf4; color: #16a34a; }
.pill-ocupado    { background: #fef2f2; color: #ef4444; }
.pill-manutencao { background: #fffbeb; color: #d97706; }

.announce-list  { display: flex; flex-direction: column; gap: 9px; margin-bottom: 14px; }
.announce-item  { background: rgba(255,255,255,0.09); border-radius: 8px; padding: 10px 12px; }
.announce-title { font-size: 13px; font-weight: 600; margin-bottom: 3px; }
.announce-text  { font-size: 12px; opacity: 0.8; line-height: 1.45; }
.btn-ghost-white { width: 100%; padding: 9px; border: 1px solid rgba(255,255,255,0.25); background: none; color: #fff; border-radius: 8px; font-size: 13px; cursor: pointer; }
.btn-ghost-white:hover { background: rgba(255,255,255,0.1); }

.section-header { display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 14px; }
.section-title  { font-size: 17px; font-weight: 700; color: #0f172a; margin: 0 0 2px; }
.section-sub    { font-size: 13px; color: #64748b; margin: 0; }
.link-map       { display: flex; align-items: center; gap: 4px; color: #16a34a; font-size: 13px; font-weight: 500; text-decoration: none; }
.link-map:hover { text-decoration: underline; }

.labs-grid  { display: grid; grid-template-columns: repeat(4, 1fr); gap: 13px; }
.lab-card   { background: #fff; border: 1px solid #e8ecf0; border-radius: 12px; overflow: hidden; text-decoration: none; display: block; transition: box-shadow 0.15s; }
.lab-card:hover { box-shadow: 0 4px 14px rgba(0,0,0,0.09); }
.lab-img    { height: 110px; background: linear-gradient(135deg, #1e3a2f 0%, #2d6a45 100%); position: relative; }
.lab-status-tag { position: absolute; top: 8px; left: 8px; font-size: 10px; font-weight: 700; padding: 2px 8px; border-radius: 4px; }
.lab-body   { padding: 12px; }
.lab-name-row { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 3px; }
.lab-name   { font-size: 13.5px; font-weight: 600; color: #0f172a; }
.lab-code   { font-size: 10.5px; color: #94a3b8; }
.lab-desc   { font-size: 12px; color: #64748b; margin: 0 0 8px; line-height: 1.4; }
.lab-icons  { display: flex; gap: 6px; }
.labs-empty { color: #94a3b8; text-align: center; padding: 20px; grid-column: 1/-1; font-size: 13px; }
.empty-msg  { font-size: 13px; color: #94a3b8; padding: 16px 0; text-align: center; }
</style>
