<script setup>
import { ref, computed, onMounted } from 'vue'
import { useLabStore } from '@/stores/useLabStore'
import { useReservationStore } from '@/stores/useReservationStore'
import SearchArea from '@/components/labs/SearchArea.vue'
import LabCardList from '@/components/labs/LabCardList.vue'
import Navbar from "@/components/Navbar.vue";

const labStore = useLabStore()
const reservationStore = useReservationStore()

const searchQuery    = ref('')
const selectedStatus = ref([])

// 🔥 FUNÇÃO PRA SABER SE ESTÁ OCUPADO AGORA
function isLabOccupiedNow(labId) {
  const now = new Date()
  const nowMinutes = now.getHours() * 60 + now.getMinutes()
  const today = now.toISOString().slice(0, 10)

  const reservations = reservationStore.reservations.filter(r =>
    Number(r.laboratoryId) === Number(labId) &&
    r.reservationDate?.startsWith(today)
  )

  return reservations.some(r => {
    const start = r.timeBlocks?.[0]?.startTime
    const end   = r.timeBlocks?.at(-1)?.endTime

    if (!start || !end) return false

    const [sh, sm] = start.split(':').map(Number)
    const [eh, em] = end.split(':').map(Number)

    const startMin = sh * 60 + sm
    const endMin   = eh * 60 + em

    return nowMinutes >= startMin && nowMinutes < endMin
  })
}

// 🔥 AQUI É O SEGREDO
const labsWithStatus = computed(() => {
  return (labStore.labs ?? []).map(lab => ({
    ...lab,
    status: isLabOccupiedNow(lab.id) ? 'OCCUPIED' : 'AVAILABLE'
  }))
})

const filteredLabs = computed(() => {
  let result = labsWithStatus.value

  const query = searchQuery.value.trim().toLowerCase()
  if (query) {
    result = result.filter(l =>
      l.name?.toLowerCase().includes(query) ||
      l.code?.toLowerCase().includes(query)
    )
  }

  if (selectedStatus.value.length > 0) {
    result = result.filter(l => selectedStatus.value.includes(l.status))
  }

  return result
})

// 🔥 IMPORTANTE: carregar reservas também
onMounted(async () => {
  await labStore.loadLabs?.()
  await reservationStore.loadReservations?.() // 👈 ESSENCIAL
})
</script>

<template>
  <div class="page">
    <navbar />
    <main class="page__content">

      <header class="page__header">
        <h1 class="page__title">Laboratórios do Campus</h1>
        <p class="page__subtitle">
          Explore as infraestruturas disponíveis para práticas acadêmicas, pesquisas e projetos.
          Realize reservas e consulte o status em tempo real de cada ambiente.
        </p>
      </header>

      <SearchArea
        class="page__controls"
        @update:search="searchQuery = $event"
        @update:status="selectedStatus = $event"
      />

      <LabCardList
        :labs="filteredLabs"
        :loading="labStore.loading"
      />

    </main>
  </div>
</template>

<style scoped>
.page { min-height: 100vh; background: #f9f9f9; }
.page__content {
  padding: 6rem 1.5rem 3rem;
  max-width: 80rem;
  margin: 0 auto;
  width: 100%;
}
.page__header { margin-bottom: 3rem; }
.page__title {
  font-family: 'Public Sans', sans-serif;
  font-size: 2.25rem; font-weight: 800; color: #1a1c1c; letter-spacing: -0.03em;
}
.page__subtitle {
  color: #3f4a3c; max-width: 42rem; line-height: 1.6; margin-top: 0.5rem;
}
.page__controls { margin-bottom: 2.5rem; }
</style>
