<script setup>
import { ref, computed, onMounted } from "vue";
import { useRouter } from "vue-router";
import { useTicketStore } from "@/stores/useTicketStore";
import { useLabStore } from "@/stores/useLabStore";
import { useUserStore } from "@/stores/useUserStore";
import ChamadoCard from "@/components/chamados/ChamadoCard.vue";
import ChamadoModal from "@/components/chamados/ChamadoModal.vue";
import SearchAreaChamados from "@/components/chamados/SearchAreaChamados.vue";
import Navbar from "@/components/Navbar.vue";
import { Loader2, Ticket, Plus } from "lucide-vue-next";

const router      = useRouter();
const ticketStore = useTicketStore();
const labStore    = useLabStore();
const userStore   = useUserStore();

const isModalOpen  = ref(false);
const searchQuery  = ref("");
const activeFilter = ref([]);
const activeDate   = ref("");

const labsMap = computed(() => {
  const map = {};
  for (const lab of labStore.labs ?? []) {
    map[lab.id] = lab.nome ?? lab.name ?? lab.id;
  }
  return map;
});

const labsForModal = computed(() =>
  (labStore.labs ?? []).map((lab) => ({
    id:   lab.id,
    nome: lab.nome ?? lab.name ?? lab.id,
  })),
);

const filteredTickets = computed(() => {
  let result = ticketStore.tickets;

  if (activeFilter.value.length > 0) {
    result = result.filter((t) => activeFilter.value.includes(t.status));
  }

  if (activeDate.value) {
    result = result.filter((t) => {
      const raw = t.createdAt || t.date;
      if (!raw) return false;
      const d = typeof raw === "string"
        ? raw.split("T")[0]
        : new Date(raw).toISOString().split("T")[0];
      return d === activeDate.value;
    });
  }

  const query = searchQuery.value.trim().toLowerCase();
  if (query) {
    result = result.filter((t) => t.matchesSearch(query));
  }

  return result;
});

function handleAttend(ticket) {
  router.push({ name: "ChamadoDetalhe", params: { id: ticket.id } });
}

function handleView(ticket) {
  router.push({ name: "ChamadoDetalhe", params: { id: ticket.id } });
}

async function handleTicketSubmitted() {
  await ticketStore.loadAllTickets(true);
}

onMounted(async () => {
  await Promise.all([
    ticketStore.loadAllTickets(),
    labStore.loadLabs?.(),
    userStore.loadAllUsers(),
  ]);
});
</script>

<template>
  <div class="page">
    <Navbar />
    <main class="page__content">
      <header class="page__header">
        <h1 class="page__title">Gestão de Chamados</h1>
        <p class="page__subtitle">
          Monitore e gerencie as solicitações de suporte técnico dos laboratórios.
        </p>
      </header>

      <SearchAreaChamados
        class="page__controls"
        @update:search="searchQuery = $event"
        @update:status="activeFilter = $event"
        @update:date="activeDate = $event"
      />

      <div v-if="ticketStore.loading" class="state-msg">
        <Loader2 :size="28" class="spin" />
        <span>Carregando chamados...</span>
      </div>

      <div v-else-if="filteredTickets.length === 0" class="state-msg">
        <Ticket :size="40" style="color: #becab9" />
        <p>Nenhum chamado encontrado.</p>
        <p v-if="searchQuery || activeFilter.length > 0 || activeDate" class="state-msg__hint">
          Tente ajustar os filtros ou a busca.
        </p>
      </div>

      <div v-else class="ticket-grid">
        <ChamadoCard
          v-for="ticket in filteredTickets"
          :key="ticket.id"
          :ticket="ticket"
          :labs-map="labsMap"
          @attend="handleAttend"
          @view="handleView"
        />
      </div>
    </main>

    <ChamadoModal
      :is-open="isModalOpen"
      :labs="labsForModal"
      @close="isModalOpen = false"
      @submitted="handleTicketSubmitted"
    />

    <button class="fab" title="Abrir novo chamado" @click="isModalOpen = true">
      <Plus color="#fff" :size="24" />
    </button>
  </div>
</template>

<style scoped>
.page { min-height: 100vh; background: #f9f9f9; }

.page__content {
  flex: 1;
  padding: 6rem 1.5rem 3rem;
  max-width: 80rem;
  margin: 0 auto;
  width: 100%;
}

.page__header { margin-bottom: 2.5rem; }
.page__title {
  font-family: "Public Sans", sans-serif;
  font-size: 1.875rem;
  font-weight: 800;
  color: #1a1c1c;
  letter-spacing: -0.02em;
}
.page__subtitle { color: #3f4a3c; margin-top: 0.25rem; font-size: 0.9375rem; }

.page__controls { margin-bottom: 2rem; }

.ticket-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1.5rem;
}
@media (min-width: 640px)  { .ticket-grid { grid-template-columns: repeat(2, 1fr); } }
@media (min-width: 1024px) { .ticket-grid { grid-template-columns: repeat(3, 1fr); } }

.state-msg {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  padding: 5rem 1rem;
  color: #6f7a6b;
}
.state-msg__hint { font-size: 0.875rem; color: #6f7a6b; }

.fab {
  position: fixed;
  bottom: 2rem;
  right: 2rem;
  width: 3.5rem;
  height: 3.5rem;
  border-radius: 9999px;
  background: #006b1f;
  color: #ffffff;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 20px rgba(0, 107, 31, 0.35);
  z-index: 40;
  transition: transform 0.15s, box-shadow 0.15s;
}
.fab:hover { box-shadow: 0 6px 28px rgba(0, 107, 31, 0.45); }
.fab:active { transform: scale(0.9); }

@keyframes spin { to { transform: rotate(360deg); } }
.spin { animation: spin 0.8s linear infinite; }
</style>
