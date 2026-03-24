<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { useLabStore } from '@/stores/useLabStore'
import { useReservationStore } from '@/stores/useReservationStore'
import ReservationModal from '@/components/lab/ReservationModal.vue'
import { AlarmClock, Building, Computer, Signal, StickyNote } from 'lucide-vue-next'

const props = defineProps({
  id: {
    type: [String, Number],
    required: true
  }
})

const labStore = useLabStore()
const reservationStore = useReservationStore()

const lab = ref(null)
const showModal = ref(false)
const now = ref(new Date())
let timerId = null

function pad(value) {
  return String(value).padStart(2, '0')
}

function getBrazilDateString(date) {
  return new Intl.DateTimeFormat('sv-SE', {
    timeZone: 'America/Sao_Paulo'
  }).format(date)
}

function toMinutes(timeStr) {
  if (!timeStr) return Infinity
  const [h, m] = timeStr.slice(0, 5).split(':').map(Number)
  return h * 60 + m
}

function formatTime(timeStr) {
  return timeStr ? timeStr.slice(0, 5) : '--:--'
}

function getReservationBlocks(reservation) {
  return [...(reservation?.timeBlocks ?? [])].sort((a, b) => {
    const orderDiff = (a.blockOrder ?? 0) - (b.blockOrder ?? 0)
    if (orderDiff !== 0) return orderDiff
    return toMinutes(a.startTime) - toMinutes(b.startTime)
  })
}

function getReservationStartTime(reservation) {
  const blocks = getReservationBlocks(reservation)
  return blocks[0]?.startTime ?? null
}

function getReservationEndTime(reservation) {
  const blocks = getReservationBlocks(reservation)
  return blocks.at(-1)?.endTime ?? null
}

function getActiveBlock(reservation) {
  const currentMinutes = now.value.getHours() * 60 + now.value.getMinutes()

  return getReservationBlocks(reservation).find(block => {
    const start = toMinutes(block.startTime)
    const end = toMinutes(block.endTime)
    return start <= currentMinutes && currentMinutes < end
  }) || null
}

function getNextStartMinutes(reservation) {
  const currentMinutes = now.value.getHours() * 60 + now.value.getMinutes()
  const nextBlock = getReservationBlocks(reservation).find(block => toMinutes(block.startTime) > currentMinutes)
  return nextBlock ? toMinutes(nextBlock.startTime) : Infinity
}

function formatReservationStatus(status) {
  const labels = {
    PENDING: 'Em análise',
    APPROVED: 'Aprovada',
    IN_PROGRESS: 'Em andamento',
    COMPLETED: 'Concluída',
    REJECTED: 'Rejeitada',
    CANCELLED: 'Cancelada'
  }

  return labels[status] || status || 'Sem status'
}

const todayStr = computed(() => getBrazilDateString(now.value))

const labReservations = computed(() => {
  if (!lab.value) return []

  return (reservationStore.reservations || [])
    .filter(reservation => {
      const reservationLabId = Number(reservation.laboratoryId ?? reservation.labId)
      return reservationLabId === Number(lab.value.id) &&
        reservation.reservationDate === todayStr.value
    })
    .sort((a, b) => toMinutes(getReservationStartTime(a)) - toMinutes(getReservationStartTime(b)))
})

const currentReservation = computed(() => {
  return labReservations.value.find(reservation => getActiveBlock(reservation)) || null
})

const currentReservationBlock = computed(() => {
  if (!currentReservation.value) return null
  return getActiveBlock(currentReservation.value)
})

const nextReservationsList = computed(() => {
  return labReservations.value
    .filter(reservation => {
      // exclui a reserva atual em andamento
      return reservation.id !== currentReservation.value?.id
    })
    .filter(reservation => getNextStartMinutes(reservation) !== Infinity)
    .sort((a, b) => getNextStartMinutes(a) - getNextStartMinutes(b))
})

async function loadData() {
  try {
    lab.value = await labStore.loadLabById(props.id)

    if (lab.value?.id) {
      await reservationStore.loadReservationsByLab(lab.value.id)
    }
  } catch (error) {
    console.error('Erro ao carregar dados do laboratório:', error)
  }
}

onMounted(async () => {
  await loadData()

  timerId = setInterval(() => {
    now.value = new Date()
  }, 60000)
})

onBeforeUnmount(() => {
  if (timerId) clearInterval(timerId)
})
</script>

<template>
  <div class="lab-wrapper" v-if="lab">
    <div class="heading">
      <h1 class="lab-title">{{ lab.name }}</h1>
      <h3 class="lab-category">{{ lab.code || 'Código não informado' }}</h3>
    </div>

    <div class="lab-cards">
      <div class="lab-reservation">
        <div class="current-reservation-section">
          <div class="current-reservation-card">
            <h3 class="card-text-top">Atual responsável</h3>

            <h2 class="card-title">
              {{ currentReservation ? currentReservation.requestedByName : 'Livre' }}
            </h2>

            <h3 class="card-text-bottom">
              <StickyNote size="16" color="#64748B" />
              {{ currentReservation ? currentReservation.purpose : 'Laboratório vago' }}
            </h3>
          </div>

          <div class="current-reservation-card" v-if="currentReservation">
            <h3 class="card-text-top">Reservado até</h3>

            <h2 class="card-title">
              {{ formatTime(currentReservationBlock?.endTime || getReservationEndTime(currentReservation)) }}
            </h2>

            <h3 class="card-text-bottom">
              {{ formatReservationStatus(currentReservation.status) }}
            </h3>
          </div>
        </div>

        <h4 class="next-reservations-section-text">Próximas reservas</h4>

        <div class="next-reservation-section">
          <div
            class="next-reservation-card"
            v-for="reserv in nextReservationsList"
            :key="reserv.id"
          >
            <div class="top">
              <div class="reservation-range">
                <AlarmClock size="16" color="#64748B" />

                <h3 class="next-card-text-top">
                  {{ formatTime(getReservationStartTime(reserv)) }}
                  <span v-if="getReservationEndTime(reserv) && getReservationEndTime(reserv) !== getReservationStartTime(reserv)">
                    até {{ formatTime(getReservationEndTime(reserv)) }}
                  </span>
                </h3>
              </div>

              <h3 class="ticket-status">
                {{ formatReservationStatus(reserv.status) }}
              </h3>
            </div>

            <h2 class="next-card-title">{{ reserv.requestedByName }}</h2>
            <h3 class="next-card-text-bottom">{{ reserv.purpose }}</h3>
          </div>

          <div class="next-reservation-card" v-if="nextReservationsList.length === 0">
            <div class="top">
              <div class="reservation-range">
                <AlarmClock size="16" color="#64748B" />
                <h3 class="next-card-text-top">Restante do dia</h3>
              </div>
              <h3 class="ticket-status">Disponível</h3>
            </div>

            <h2 class="next-card-title">Vago</h2>
            <h3 class="next-card-text-bottom">Aguardando reserva...</h3>
          </div>
        </div>

        <button @click="showModal = true" class="btn-primary">
          Reservar esse laboratório
        </button>

        <ReservationModal
          :show="showModal"
          :labInfo="lab"
          @close="showModal = false"
        />
      </div>

      <div class="info-cards">
        <div class="info-card">
          <div class="top">Capacidade <Computer size="16" /></div>
          <h2>{{ lab.capacity }} alunos</h2>
        </div>

        <div class="info-card">
          <div class="top">Localização <Building size="16" /></div>
          <h2>{{ lab.getLocation() }}</h2>
        </div>

        <div class="info-card">
          <div class="top">Estado <Signal size="16" /></div>
          <h2>{{ lab.active ? 'Aberto' : 'Fechado' }}</h2>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.lab-title {
  font-size: var(--font-size-5xl);
}

.lab-category {
  font-size: var(--font-size-lg);
  font-weight: 400;
  color: hsl(215, 19%, 35%);
  margin-bottom: 20px;
}

.lab-cards {
  display: flex;
  flex-direction: row;
  gap: 10px;
}

.lab-reservation {
  flex: 1;
}

.next-reservation-section {
  margin-bottom: 20px;
  display: flex;
  gap: 10px;
  flex-direction: row;
  flex-wrap: wrap;
}

.current-reservation-section {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
  flex-wrap: wrap;
}

.next-reservations-section-text {
  font-size: var(--font-size-base);
  font-weight: 500;
  margin-bottom: 10px;
}

.current-reservation-card {
  padding: 20px 40px 20px 20px;
  border-radius: 6px;
  border: 1px solid var(--color-gray-border);
  width: fit-content;
  min-width: 260px;
}

.card-text-top,
.ticket-status {
  font-size: var(--font-size-sm);
  font-weight: 400;
}

.card-title {
  font-size: var(--font-size-2xl);
  margin: 5px 0 3px;
}

.card-text-bottom {
  font-size: var(--font-size-sm);
  font-weight: 400;
  color: var(--color-gray-text);
  display: flex;
  gap: 4px;
  align-items: center;
}

.next-reservation-card {
  padding: 20px;
  border-radius: 6px;
  border: 1px solid var(--color-gray-border);
  width: fit-content;
  min-width: 260px;
}

.next-reservation-card .top {
  display: flex;
  justify-content: space-between;
  gap: 10px;
}

.next-reservation-card .reservation-range {
  display: flex;
  gap: 5px;
  align-items: center;
}

.reservation-range h3 {
  font-size: var(--font-size-sm);
  font-weight: 400;
  color: var(--color-gray-text);
}

.next-card-title {
  font-size: var(--font-size-base);
  font-weight: 500;
  margin: 10px 0 4px;
}

.next-card-text-bottom {
  font-size: var(--font-size-base);
  font-weight: 400;
  color: var(--color-gray-text);
}

.info-cards {
  display: flex;
  flex-direction: column;
  gap: 10px;
  min-width: 220px;
}

.info-card {
  padding: 20px;
  border-radius: 6px;
  border: 1px solid var(--color-gray-border);
}

.info-card .top {
  display: flex;
  justify-content: space-between;
  font-size: var(--font-size-sm);
}

.info-card h2 {
  font-size: var(--font-size-2xl);
  margin-top: 5px;
}

.btn-primary {
  padding: 10px 16px;
}

h3 span {
  color: var(--color-gray-text);
}
</style>


<style scoped>
.lab-title {
    font-size: var(--font-size-5xl);
}

.lab-category {
    font-size: var(--font-size-lg);
    font-weight: 400;
    color: hsl(215, 19%, 35%);
    margin-bottom: 20px;
}

.lab-cards {
    display: flex;
    flex-direction: row;
    gap: 10px;
}

.lab-reservation {
    flex: 1;
}

.next-reservation-section {
    margin-bottom: 20px;
    display: flex;
    gap: 10px;
    flex-direction: row;
}

.current-reservation-section {
    display: flex;
    gap: 10px;
    margin-bottom: 20px;

}

.next-reservations-section-text {
    font-size: var(--font-size-base);
    font-weight: 500;
    margin-bottom: 10px;
}

.current-reservation-card {
    padding: 20px 40px 20px 20px;
    border-radius: 6px;
    border: 1px solid var(--color-gray-border);
    width: fit-content;
}

.card-text-top,
.ticket-status {
    font-size: var(--font-size-sm);
    font-weight: 400;
}

.card-title {
    font-size: var(--font-size-2xl);
    margin: 5px 0 3px;
}

.card-text-bottom {
    font-size: var(--font-size-sm);
    font-weight: 400;
    color: var(--color-gray-text);
    display: flex;
    gap: 4px;
}

.next-reservation-card {
    padding: 20px 20px 20px 20px;
    border-radius: 6px;
    border: 1px solid var(--color-gray-border);
    width: fit-content;
    min-width: 260px;
}

.next-reservation-card .top {
    display: flex;
    justify-content: space-between;
}

.next-reservation-card .reservation-range {
    display: flex;
    gap: 5px;
    align-items: center;
}

.reservation-range h3 {
    font-size: var(--font-size-sm);
    font-weight: 400;
    color: var(--color-gray-text);
}

.next-card-title {
    font-size: var(--font-size-base);
    font-weight: 500;
    margin: 10px 0 4px;
}

.next-card-text-bottom {
    font-size: var(--font-size-base);
    font-weight: 400;
    color: var(--color-gray-text);
}

.info-cards {
    display: flex;
    flex-direction: column;
    gap: 10px;
}

.info-card {
    padding: 20px 20px 20px 20px;
    border-radius: 6px;
    border: 1px solid var(--color-gray-border);
    min-width: 180px;
}

.info-card .top {
    display: flex;
    justify-content: space-between;
    font-size: var(--font-size-sm);
}

.info-card h2 {
    font-size: var(--font-size-2xl);
    margin-top: 5px;
}

.btn-primary {
    padding: 10px 16px;
}

h3 span {
    color: var(--color-gray-text);
}
</style>
