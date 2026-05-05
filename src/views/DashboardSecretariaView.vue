<script setup>
import { computed, onMounted } from "vue";
import { useRouter } from "vue-router";
import AppLayout from "@/components/AppLayout.vue";
import { useTicketStore } from "@/stores/useTicketStore";
import { useLabStore } from "@/stores/useLabStore";
import { useReservationStore } from "@/stores/useReservationStore";
import { useUserStore } from "@/stores/useUserStore";
import {
  Download,
  Plus,
  Calendar,
  AlertTriangle,
  FlaskConical,
  Users,
  Wrench,
  Wifi,
  Leaf,
  ArrowRight,
} from "lucide-vue-next";

const ticketStore = useTicketStore();
const labStore = useLabStore();
const reservationStore = useReservationStore();
const userStore = useUserStore();
const router = useRouter();

onMounted(async () => {
  await ticketStore.loadAllTickets();
  await labStore.loadLabs();
  await reservationStore.loadReservations();
  await userStore.loadAllUsers();
});

// ─── Helpers de data ──────────────────────────────────────────────────────────
function getTodayStr() {
  return new Intl.DateTimeFormat("sv-SE", {
    timeZone: "America/Sao_Paulo",
  }).format(new Date());
}

function isActiveNow(r) {
  const now = new Date();
  const todayStr = getTodayStr();
  const rDate = (r.reservationDate || r.date || "").split("T")[0];
  if (rDate !== todayStr) return false;

  const st = (r.status || "").toUpperCase();
  if (!["APPROVED", "CONFIRMADA", "PENDING", "PENDENTE"].includes(st)) return false;

  const block = r.timeBlocks?.[0];
  const startStr = block?.startTime || r.startTime;
  const endStr = block?.endTime || r.endTime;
  if (!startStr || !endStr) return false;

  const [sh, sm] = startStr.split(":").map(Number);
  const [eh, em] = endStr.split(":").map(Number);
  const start = new Date(now);
  start.setHours(sh, sm, 0, 0);
  const end = new Date(now);
  end.setHours(eh, em, 0, 0);
  return now >= start && now <= end;
}

// ─── Stats ────────────────────────────────────────────────────────────────────
const activeReservations = computed(
  () =>
    reservationStore.reservations.filter((r) =>
      ["APPROVED", "CONFIRMADA", "PENDING", "PENDENTE"].includes((r.status || "").toUpperCase()),
    ).length,
);

const openTickets = computed(
  () =>
    ticketStore.tickets.filter((t) =>
      ["Aberto", "OPEN", "Em andamento", "IN_PROGRESS"].includes(t.status),
    ).length,
);

const labsInUse = computed(() => {
  return labStore.labs.filter((lab) => {
    if (
      lab.available === false ||
      ["OCCUPIED", "OCUPADO"].includes((lab.status || "").toUpperCase())
    )
      return true;
    return reservationStore.reservations.some((r) => {
      const samelab = r.laboratoryId === lab.id || r.labId === lab.id;
      return samelab && isActiveNow(r);
    });
  }).length;
});

const professorsLogged = computed(
  () => userStore.allUsers.filter((u) => u.role === "PROFESSOR" && u.active).length,
);

// ─── Grafico semanal (reservas por dia) ───────────────────────────────────────
const DAYS = ["SEG", "TER", "QUA", "QUI", "SEX", "SAB"];

const weekOccupancy = computed(() => {
  const now = new Date();
  const day = now.getDay();
  const monday = new Date(now);
  monday.setDate(now.getDate() - day + (day === 0 ? -6 : 1));
  monday.setHours(0, 0, 0, 0);

  return DAYS.map((label, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    const dateStr = new Intl.DateTimeFormat("sv-SE", { timeZone: "America/Sao_Paulo" }).format(d);
    const count = reservationStore.reservations.filter((r) => {
      const rDate = (r.reservationDate || r.date || "").split("T")[0];
      return rDate === dateStr;
    }).length;
    const max = labStore.labs.length || 1;
    return { day: label, count, pct: Math.min(100, Math.round((count / max) * 100)) };
  });
});

// ─── Ultimas reservas ─────────────────────────────────────────────────────────
const recentReservations = computed(() =>
  [...reservationStore.reservations]
    .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
    .slice(0, 5),
);

function labName(r) {
  const lab = labStore.labs.find((l) => l.id === r.laboratoryId || l.id === r.labId);
  return lab?.name || r.labName || `Lab ${r.laboratoryId}`;
}

function formatResTime(r) {
  const d = r.reservationDate || r.date;
  const dateLabel = d
    ? new Date(d + "T00:00:00").toLocaleDateString("pt-BR", {
        weekday: "short",
        day: "2-digit",
        month: "2-digit",
      })
    : "";
  const block = r.timeBlocks?.[0];
  const start = block?.startTime || r.startTime;
  const end = block?.endTime || r.endTime;
  const t = start && end ? `, ${start} - ${end}` : "";
  return `${dateLabel}${t}`;
}

function professorName(r) {
  if (r.requestedByName) return r.requestedByName;
  const u = userStore.allUsers.find(
    (u) => u.id === r.requestedByUserId || u.id === r.professorId || u.id === r.userId,
  );
  return u?.name || "Professor";
}

function professorInitials(r) {
  const name = professorName(r);
  return name
    .trim()
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0].toUpperCase())
    .join("");
}

function statusClass(s) {
  const st = (s || "").toUpperCase();
  if (["APPROVED", "CONFIRMADA"].includes(st)) return "s-confirmed";
  if (["PENDING", "PENDENTE"].includes(st)) return "s-pending";
  return "s-other";
}

function statusLabel(s) {
  const st = (s || "").toUpperCase();
  if (["APPROVED", "CONFIRMADA"].includes(st)) return "CONFIRMADA";
  if (["PENDING", "PENDENTE"].includes(st)) return "PENDENTE";
  if (["CANCELLED", "CANCELADA"].includes(st)) return "CANCELADA";
  return s || "-";
}

// ─── Chamados recentes ────────────────────────────────────────────────────────
const recentTickets = computed(() =>
  [...ticketStore.tickets]
    .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
    .slice(0, 3),
);

function priorityLabel(p) {
  const v = (p || "").toUpperCase();
  if (v === "ALTA" || v === "HIGH") return "ALTA PRIORIDADE";
  if (v === "MEDIA" || v === "MEDIUM") return "MEDIA PRIORIDADE";
  return "BAIXA PRIORIDADE";
}

function priorityCls(p) {
  const v = (p || "").toUpperCase();
  if (v === "ALTA" || v === "HIGH") return "p-high";
  if (v === "MEDIA" || v === "MEDIUM") return "p-med";
  return "p-low";
}

function ticketIcon(t) {
  const title = (t.title || "").toLowerCase();
  if (title.includes("wifi") || title.includes("rede") || title.includes("internet")) return Wifi;
  if (title.includes("insumo") || title.includes("quimica") || title.includes("material"))
    return Leaf;
  return Wrench;
}

function formatRelative(ts) {
  if (!ts) return "";
  const diff = Date.now() - new Date(ts).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 60) return `ha ${m} min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `ha ${h} hora${h > 1 ? "s" : ""}`;
  return `ha ${Math.floor(h / 24)} dia(s)`;
}
</script>

<template>
  <AppLayout campus="Secretaria Administrativa">
    <!-- Header -->
    <div class="page-header">
      <div>
        <h1 class="page-title">Painel de Controle</h1>
        <p class="page-sub">Bem-vindo a central administrativa do ReservaLab.</p>
      </div>
      <div class="header-actions">
        <button class="btn-secondary"><Download :size="14" /> Exportar Relatorio Mensal</button>
        <button class="btn-primary" @click="router.push('/laboratorios')">
          <Plus :size="14" color="#fff" /> Adicionar Laboratorio
        </button>
      </div>
    </div>

    <!-- Stats -->
    <div class="stats-grid">
      <div class="stat-card" @click="router.push('/reservas')">
        <div class="stat-top">
          <div class="stat-icon bg-green"><Calendar :size="19" color="#16a34a" /></div>
          <span class="stat-badge green">Total ativo</span>
        </div>
        <div class="stat-label">Reservas Ativas</div>
        <div class="stat-num">{{ activeReservations }}</div>
      </div>
      <div class="stat-card" @click="router.push('/chamados')">
        <div class="stat-top">
          <div class="stat-icon bg-red"><AlertTriangle :size="19" color="#ef4444" /></div>
          <span v-if="openTickets > 0" class="stat-badge red">Urgente</span>
        </div>
        <div class="stat-label">Chamados em Aberto</div>
        <div class="stat-num">{{ String(openTickets).padStart(2, "0") }}</div>
      </div>
      <div class="stat-card" @click="router.push('/status')">
        <div class="stat-top">
          <div class="stat-icon bg-purple"><FlaskConical :size="19" color="#8b5cf6" /></div>
          <span class="stat-badge purple">{{ labStore.labs.length }} total</span>
        </div>
        <div class="stat-label">Laboratorios em Uso</div>
        <div class="stat-num">{{ labsInUse }}</div>
      </div>
      <div class="stat-card" @click="router.push('/professores')">
        <div class="stat-top">
          <div class="stat-icon bg-blue"><Users :size="19" color="#3b82f6" /></div>
          <span class="stat-badge blue">Ativos</span>
        </div>
        <div class="stat-label">Professores Ativos</div>
        <div class="stat-num">{{ professorsLogged }}</div>
      </div>
    </div>

    <!-- Mid: grafico + gestao -->
    <div class="mid-grid">
      <div class="card">
        <div class="chart-head">
          <div>
            <div class="card-title">Ocupacao Semanal</div>
            <div class="chart-sub">Reservas por dia — {{ labStore.labs.length }} laboratorios</div>
          </div>
        </div>
        <div class="bar-chart">
          <div v-for="d in weekOccupancy" :key="d.day" class="bar-col">
            <div class="bar-pct">{{ d.pct }}%</div>
            <div class="bar-track">
              <div class="bar-fill" :style="{ height: (d.pct || 4) + '%' }"></div>
            </div>
            <span class="bar-label">{{ d.day }}</span>
          </div>
        </div>
      </div>

      <div class="team-card">
        <h3 class="team-title">Gestão de Equipe</h3>
        <p class="team-sub">
          Mantenha a base de dados dos docentes atualizada para agilizar processos.
        </p>
        <div class="team-actions">
          <button class="team-btn" @click="router.push('/professores/cadastrar')">
            <div class="team-btn-icon"><Users :size="17" color="#16a34a" /></div>
            <span class="team-btn-text">Cadastrar Usuário</span>
            <ArrowRight :size="15" class="team-arrow" color="#fff" />
          </button>
          <button class="team-btn" @click="router.push('/professores')">
            <div class="team-btn-icon"><Users :size="17" color="#16a34a" /></div>
            <span class="team-btn-text">Ver Listagem Completa</span>
            <ArrowRight :size="15" class="team-arrow" color="#fff" />
          </button>
        </div>
      </div>
    </div>

    <!-- Bottom: tabela + chamados -->
    <div class="bottom-grid">
      <div class="card">
        <div class="table-head">
          <div class="card-title">Ultimas Reservas</div>
          <button class="link-btn" @click="router.push('/reservas')">Ver todas</button>
        </div>
        <div v-if="reservationStore.loading" class="loading-msg">Carregando...</div>
        <table v-else class="res-table">
          <thead>
            <tr>
              <th>PROFESSOR</th>
              <th>LABORATORIO</th>
              <th>HORARIO</th>
              <th>STATUS</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="r in recentReservations" :key="r.id">
              <td>
                <div class="prof-cell">
                  <div class="prof-av">{{ professorInitials(r) }}</div>
                  {{ professorName(r) }}
                </div>
              </td>
              <td>{{ labName(r) }}</td>
              <td>{{ formatResTime(r) }}</td>
              <td>
                <span class="status-pill" :class="statusClass(r.status)">
                  {{ statusLabel(r.status) }}
                </span>
              </td>
            </tr>
            <tr v-if="recentReservations.length === 0">
              <td colspan="4" class="empty-row">Nenhuma reserva encontrada.</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="card">
        <div class="card-title mb-14">Chamados Recentes</div>
        <div v-if="ticketStore.loading" class="loading-msg">Carregando...</div>
        <div v-else class="ticket-list">
          <div
            v-for="t in recentTickets"
            :key="t.id"
            class="ticket-row"
            @click="router.push(`/chamados/${t.id}`)"
          >
            <div class="ticket-icon">
              <component :is="ticketIcon(t)" :size="15" color="#64748b" />
            </div>
            <div class="ticket-body">
              <div class="ticket-top">
                <span class="ticket-title">{{ t.title }}</span>
                <span class="ticket-time">{{ formatRelative(t.createdAt) }}</span>
              </div>
              <div class="ticket-desc">{{ t.labId }} — {{ t.description?.slice(0, 45) }}</div>
              <span class="priority-label" :class="priorityCls(t.priority)">
                &bull; {{ priorityLabel(t.priority) }}
              </span>
            </div>
          </div>
          <div v-if="recentTickets.length === 0" class="empty-row-txt">Nenhum chamado recente.</div>
        </div>
        <button class="attend-btn" @click="router.push('/chamados')">Atender Chamados</button>
      </div>
    </div>
  </AppLayout>
</template>

<style scoped>
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 20px;
}
.page-title {
  font-size: 26px;
  font-weight: 800;
  color: #0f172a;
  margin: 0 0 3px;
}
.page-sub {
  font-size: 13px;
  color: #64748b;
  margin: 0;
}
.header-actions {
  display: flex;
  gap: 10px;
}
.btn-primary {
  display: flex;
  align-items: center;
  gap: 6px;
  background: #16a34a;
  color: #fff;
  border: none;
  padding: 9px 16px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
}
.btn-primary:hover {
  background: #15803d;
}
.btn-secondary {
  display: flex;
  align-items: center;
  gap: 6px;
  background: #fff;
  color: #374151;
  border: 1px solid #d1d5db;
  padding: 9px 16px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
}
.btn-secondary:hover {
  background: #f8fafc;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
  margin-bottom: 12px;
}
.stat-card {
  background: #fff;
  border: 1px solid #e8ecf0;
  border-radius: 12px;
  padding: 16px;
  cursor: pointer;
  transition: box-shadow 0.15s;
}
.stat-card:hover {
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.07);
}
.stat-top {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 10px;
}
.stat-icon {
  width: 40px;
  height: 40px;
  border-radius: 9px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.bg-green {
  background: #f0fdf4;
}
.bg-red {
  background: #fef2f2;
}
.bg-purple {
  background: #f5f3ff;
}
.bg-blue {
  background: #eff6ff;
}
.stat-badge {
  font-size: 10px;
  font-weight: 600;
  padding: 2px 7px;
  border-radius: 8px;
}
.green {
  background: #f0fdf4;
  color: #16a34a;
}
.red {
  background: #fef2f2;
  color: #ef4444;
}
.purple {
  background: #f5f3ff;
  color: #8b5cf6;
}
.blue {
  background: #eff6ff;
  color: #3b82f6;
}
.stat-label {
  font-size: 12.5px;
  color: #64748b;
  margin-bottom: 4px;
}
.stat-num {
  font-size: 33px;
  font-weight: 800;
  color: #0f172a;
  line-height: 1;
}

.mid-grid {
  display: grid;
  grid-template-columns: 1fr 290px;
  gap: 12px;
  margin-bottom: 12px;
}
.card {
  background: #fff;
  border: 1px solid #e8ecf0;
  border-radius: 12px;
  padding: 18px;
}
.card-title {
  font-size: 14px;
  font-weight: 600;
  color: #0f172a;
}
.mb-14 {
  margin-bottom: 14px;
}

.chart-head {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 16px;
}
.chart-sub {
  font-size: 12px;
  color: #94a3b8;
  margin-top: 3px;
}

.bar-chart {
  display: flex;
  gap: 10px;
  height: 160px;
  align-items: flex-end;
}
.bar-col {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  height: 100%;
}
.bar-pct {
  font-size: 10px;
  color: #94a3b8;
  margin-bottom: 4px;
}
.bar-track {
  flex: 1;
  width: 100%;
  display: flex;
  align-items: flex-end;
}
.bar-fill {
  width: 100%;
  background: linear-gradient(180deg, #16a34a 0%, #4ade80 100%);
  border-radius: 5px 5px 0 0;
  min-height: 4px;
  transition: height 0.4s ease;
}
.bar-label {
  font-size: 10.5px;
  color: #94a3b8;
  margin-top: 7px;
}

.team-card {
  background: linear-gradient(140deg, #14532d 0%, #166534 60%, #15803d 100%);
  border-radius: 12px;
  padding: 22px;
  color: #fff;
}
.team-title {
  font-size: 20px;
  font-weight: 700;
  color: #fff;
  margin: 0 0 8px;
}
.team-sub {
  font-size: 12.5px;
  opacity: 0.8;
  margin: 0 0 18px;
  color: #fff;
  line-height: 1.45;
}
.team-actions {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.team-btn {
  display: flex;
  align-items: center;
  gap: 10px;
  background: rgba(255, 255, 255, 0.12);
  border: none;
  border-radius: 9px;
  padding: 11px 13px;
  color: #fff;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.15s;
}
.team-btn:hover {
  background: rgba(255, 255, 255, 0.2);
}
.team-btn-icon {
  width: 30px;
  height: 30px;
  background: rgba(255, 255, 255, 0.15);
  border-radius: 7px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.team-btn-text {
  color: #fff;
}
.team-arrow {
  margin-left: auto;
  opacity: 0.7;
}

.bottom-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}
.table-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 14px;
}
.link-btn {
  background: none;
  border: none;
  color: #16a34a;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
}

.res-table {
  width: 100%;
  border-collapse: collapse;
}
.res-table th {
  font-size: 10px;
  font-weight: 600;
  color: #94a3b8;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  padding: 5px 0 8px;
  text-align: left;
  border-bottom: 1px solid #f1f5f9;
}
.res-table td {
  padding: 9px 0;
  font-size: 13px;
  color: #374151;
  border-bottom: 1px solid #f8fafc;
  vertical-align: middle;
}
.res-table tr:last-child td {
  border-bottom: none;
}
.prof-cell {
  display: flex;
  align-items: center;
  gap: 8px;
}
.prof-av {
  width: 28px;
  height: 28px;
  background: #e2e8f0;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
  font-weight: 700;
  color: #475569;
  flex-shrink: 0;
}
.status-pill {
  font-size: 10px;
  font-weight: 700;
  padding: 2px 7px;
  border-radius: 4px;
}
.s-confirmed {
  background: #f0fdf4;
  color: #16a34a;
}
.s-pending {
  background: #fef3c7;
  color: #d97706;
}
.s-other {
  background: #f1f5f9;
  color: #64748b;
}

.ticket-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 14px;
}
.ticket-row {
  display: flex;
  gap: 10px;
  align-items: flex-start;
  cursor: pointer;
  padding: 7px;
  border-radius: 8px;
  transition: background 0.1s;
}
.ticket-row:hover {
  background: #f8fafc;
}
.ticket-icon {
  width: 34px;
  height: 34px;
  background: #f1f5f9;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.ticket-body {
  flex: 1;
}
.ticket-top {
  display: flex;
  justify-content: space-between;
  gap: 6px;
}
.ticket-title {
  font-size: 13px;
  font-weight: 600;
  color: #0f172a;
}
.ticket-time {
  font-size: 11px;
  color: #94a3b8;
  white-space: nowrap;
}
.ticket-desc {
  font-size: 12px;
  color: #64748b;
  margin: 2px 0 4px;
}
.priority-label {
  font-size: 10.5px;
  font-weight: 700;
}
.p-high {
  color: #ef4444;
}
.p-med {
  color: #f59e0b;
}
.p-low {
  color: #16a34a;
}

.attend-btn {
  width: 100%;
  padding: 10px;
  border: 1px solid #e8ecf0;
  background: #fff;
  border-radius: 8px;
  font-size: 13px;
  color: #374151;
  font-weight: 500;
  cursor: pointer;
}
.attend-btn:hover {
  background: #f8fafc;
}

.loading-msg {
  text-align: center;
  color: #94a3b8;
  font-size: 13px;
  padding: 20px;
}
.empty-row {
  text-align: center;
  color: #94a3b8;
  padding: 20px !important;
  font-size: 13px;
}
.empty-row-txt {
  text-align: center;
  color: #94a3b8;
  font-size: 13px;
  padding: 16px 0;
}
</style>
