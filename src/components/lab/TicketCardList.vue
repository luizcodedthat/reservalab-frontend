<script setup>
import { computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { Plus } from 'lucide-vue-next'
import { useTicketStore } from '@/stores/useTicketStore'
import TicketCard from '@/components/lab/TicketCard.vue'

const props = defineProps({
  labId: { type: [String, Number], required: true }
})

const router      = useRouter()
const ticketStore = useTicketStore()

const labKey = computed(() => `lab${props.labId}`)

const tickets = computed(() =>
  (ticketStore.ticketsByLab?.[labKey.value] ?? []).slice(0, 5)
)

function goToNewTicket() {
  router.push({ name: 'Chamados' })
}

onMounted(() => ticketStore.loadTicketsByLabId(labKey.value))
</script>

<template>
  <section class="tickets-section">
    <div class="tickets-section__header">
      <h2 class="section-title">Manutenção e Chamados</h2>
      <button class="add-btn" @click="goToNewTicket">
        <Plus :size="14" />
        Novo Chamado
      </button>
    </div>

    <div v-if="tickets.length > 0" class="table-wrap">
      <table class="table">
        <thead>
          <tr>
            <th>Título &amp; Descrição</th>
            <th>Status</th>
            <th>Autor</th>
            <th>Data</th>
          </tr>
        </thead>
        <tbody>
          <TicketCard
            v-for="ticket in tickets"
            :key="ticket.id"
            :ticket="ticket"
          />
        </tbody>
      </table>
    </div>

    <p v-else class="empty-text">Nenhum chamado registrado para este laboratório.</p>
  </section>
</template>

<style scoped>
.tickets-section { display: flex; flex-direction: column; gap: 1rem; }
.tickets-section__header {
  display: flex; justify-content: space-between; align-items: center;
}
.section-title {
  font-family: 'Public Sans', sans-serif;
  font-size: 1.25rem; font-weight: 700; color: #1a1c1c;
}
.add-btn {
  display: flex; align-items: center; gap: 0.375rem;
  background: none; border: none; cursor: pointer;
  color: #006b1f; font-size: 0.875rem; font-weight: 700;
}
.add-btn:hover { text-decoration: underline; }
.table-wrap { overflow-x: auto; }
.table {
  width: 100%; border-collapse: collapse; text-align: left;
}
.table thead tr {
  font-size: 0.625rem; font-weight: 700; text-transform: uppercase;
  letter-spacing: 0.1em; color: #3f4a3c;
  border-bottom: 1px solid rgba(190,202,185,0.2);
}
.table th { padding-bottom: 1rem; }
.empty-text { color: #6f7a6b; font-size: 0.875rem; }
</style>
