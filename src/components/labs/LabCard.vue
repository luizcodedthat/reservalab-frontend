<script setup>
import { onMounted, computed } from "vue"
import { useReservationStore } from "@/stores/useReservationStore"
import { AlarmClock } from "lucide-vue-next"

const props = defineProps({
  labId: { type: [String, Number], required: true },
  name: { type: String, required: true },
  capacity: { type: Number, required: true }
})

const reservationStore = useReservationStore()

function pad(value) {
  return String(value).padStart(2, "0")
}

function getBrazilDateString(date = new Date()) {
  return new Intl.DateTimeFormat("sv-SE", {
    timeZone: "America/Sao_Paulo"
  }).format(date)
}

function timeToMinutes(timeStr) {
  if (!timeStr) return Infinity
  const [h, m] = timeStr.slice(0, 5).split(":").map(Number)
  return h * 60 + m
}

function formatTime(timeStr) {
  return timeStr ? timeStr.slice(0, 5) : "--:--"
}

function getReservationBlocks(reservation) {
  return [...(reservation?.timeBlocks ?? [])].sort((a, b) => {
    const orderDiff = (a.blockOrder ?? 0) - (b.blockOrder ?? 0)
    if (orderDiff !== 0) return orderDiff
    return timeToMinutes(a.startTime) - timeToMinutes(b.startTime)
  })
}

function getReservationStartMinute(reservation) {
  const blocks = getReservationBlocks(reservation)
  return blocks[0]?.startTime ? timeToMinutes(blocks[0].startTime) : Infinity
}

function getReservationEndMinute(reservation) {
  const blocks = getReservationBlocks(reservation)
  return blocks.at(-1)?.endTime ? timeToMinutes(blocks.at(-1).endTime) : -Infinity
}

function isReservationActiveNow(reservation, nowMinutes) {
  return getReservationBlocks(reservation).some(block => {
    const start = timeToMinutes(block.startTime)
    const end = timeToMinutes(block.endTime)
    return start <= nowMinutes && nowMinutes < end
  })
}

const todayStr = computed(() => getBrazilDateString())

const labIdNumber = computed(() => Number(props.labId))

onMounted(() => {
  reservationStore.loadReservationsByLab(labIdNumber.value)
})

const labReservations = computed(() =>
  (reservationStore.reservationsByLab?.(labIdNumber.value) || [])
    .filter(r => r.reservationDate === todayStr.value)
)

const currentReservation = computed(() => {
  const now = new Date()
  const nowMinutes = now.getHours() * 60 + now.getMinutes()

  return labReservations.value.find(res => isReservationActiveNow(res, nowMinutes)) || null
})

const nextReservation = computed(() => {
  const now = new Date()
  const nowMinutes = now.getHours() * 60 + now.getMinutes()

  return [...labReservations.value]
    .filter(res => getReservationStartMinute(res) > nowMinutes)
    .sort((a, b) => getReservationStartMinute(a) - getReservationStartMinute(b))[0] || null
})

const availabilityText = computed(() => {
  if (currentReservation.value) {
    const currentBlocks = getReservationBlocks(currentReservation.value)
    const activeBlock = currentBlocks.find(block => {
      const now = new Date()
      const nowMinutes = now.getHours() * 60 + now.getMinutes()
      const start = timeToMinutes(block.startTime)
      const end = timeToMinutes(block.endTime)
      return start <= nowMinutes && nowMinutes < end
    })

    return activeBlock
      ? `Ocupado até ${formatTime(activeBlock.endTime)}`
      : "Ocupado"
  }

  if (nextReservation.value) {
    const blocks = getReservationBlocks(nextReservation.value)
    const first = blocks[0]
    return first
      ? `Disponível até ${formatTime(first.startTime)}`
      : "Disponível"
  }

  return "Disponível o dia todo"
})
</script>

<template>
  <div class="lab-card" :class="{ 'reserved-lab': currentReservation }">
    <div class="card-top">
      <AlarmClock size="16" />
      <p class="availability-text">{{ availabilityText }}</p>
    </div>

    <div class="description">
      <h2 class="lab-name">{{ name }}</h2>
      <p class="capacity-text">Comporta {{ capacity }} alunos.</p>
    </div>

    <RouterLink class="link-lab" :to="`/laboratorios/${labId}`">
      Ir para reserva
    </RouterLink>
  </div>
</template>

<style scoped>
.card-top {
  display: flex;
  gap: 4px;
  align-items: center;
}

.lab-card {
  padding: 25px 20px;
  border-radius: 5px;
  border: 1px solid hsl(213, 27%, 84%);
  box-sizing: border-box;
  width: 248px;
  height: auto;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.lab-name {
  margin-bottom: 5px;
}

.availability-text {
  font-size: 14px;
}

.capacity-text {
  color: #64748B;
}

.link-lab {
  text-decoration: none;
  text-align: center;
  background-color: var(--color-primary);
  padding: 10px 16px;
  border-radius: 5px;
  margin-top: .4rem;
  color: hsl(0, 0%, 100%);
  font-size: var(--font-size-sm);
}

.lab-card.reserved-lab {
  border-left: 6px solid #fb2c36;
}
</style>