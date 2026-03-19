<script setup>
import { onMounted, computed } from 'vue';
import TicketCard from './TicketCard.vue';
import { TvIcon } from 'lucide-vue-next';
import { useTicketStore } from '@/stores/useTicketStore';

const props = defineProps({
    labId: String
})

const ticketStore = useTicketStore()
const tickets = computed(() => ticketStore.ticketsByLab[props.labId]?.slice(0, 4) ?? [])

onMounted(async () => {
    await ticketStore.loadTicketsByLabId(props.labId)
})

</script>

<template>
    <div class="card-list">

        <div class="cards-list" v-if="!ticketStore.loading && tickets.length > 0">
            <TicketCard v-for="ticket in tickets" :key="ticket.id" :title="ticket.titulo" :message="ticket.descricao"
                :status="ticket.status" :createdDate="ticket.createdAt" />

        </div>

        <div class="no-tickets" v-else-if="!ticketStore.loading && tickets.length === 0">
            <TvIcon size="48" color="#64748B" />
            <p>Tudo limpo! Nenhum chamado recente.</p>
        </div>

        <div class="no-tickets" v-else>
            <TvIcon size="48" color="#64748B" />
            <p>Carregando...</p>
        </div>

    </div>

</template>

<style scoped>
.cards-list {
    padding: 10px 4px;
    display: flex;
    flex-direction: row;
    gap: 10px;
}

.no-tickets {
    display: flex;
    align-items: center;
    flex-direction: column;
    gap: 5px;
    margin: auto;
    width: fit-content;
}

.no-tickets p {
    color: hsl(215, 19%, 35%);
}
</style>