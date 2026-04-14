<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useLabStore } from '@/stores/useLabStore'
import { useReservationStore } from '@/stores/useReservationStore'
import { useLabReservations } from '@/composables/useLabReservations'
import Navbar from '@/components/Navbar.vue'

import { CalendarCheck2, User, School, Loader2 } from 'lucide-vue-next'
import LabInfo from '@/components/lab/LabInfo.vue'
import TicketCardList from '@/components/lab/TicketCardList.vue'
import CommentsList from '@/components/lab/CommentsList.vue'
import ReservationModal from '@/components/lab/ReservationModal.vue'

const route = useRoute()
const labStore = useLabStore()
const reservationStore = useReservationStore()

const labId = computed(() => route.params.id)
const lab = computed(() => labStore.labById[labId.value] ?? null)

const isReservationModalOpen = ref(false)

// 🔥 NOVA LÓGICA PROFISSIONAL
const {
  currentReservation,
  nextReservations,
  getStart,
  getEnd
} = useLabReservations(labId)

onMounted(async () => {
  await labStore.loadLabById(labId.value)
  await reservationStore.loadReservationsByLab(labId.value)
})
</script>

<template>
  <div class="page">
    <navbar />
    <main v-if="lab" class="page__content">

      <header class="page__header">
        <h1 class="page__title">{{ lab.name }}</h1>
        <p class="page__subtitle">Gestão centralizada e monitoramento de ativos do Campus.</p>
      </header>

      <div class="layout">

        <!-- Coluna principal -->
        <div class="layout__main">

          <!-- ✅ RESERVA ATUAL -->
          <section v-if="currentReservation">
            <h2 class="section-title section-title--primary">
              <CalendarCheck2 :size="20" />
              Reserva Atual
            </h2>

            <div class="current-reservation">
              <div>
                <p class="current-reservation__status">Em andamento</p>

                <h3 class="current-reservation__title">
                  {{ currentReservation.purpose }}
                </h3>

                <p class="current-reservation__author">
                  <User :size="14" />
                  {{ currentReservation.requestedByName }}
                </p>
              </div>

              <div class="current-reservation__time">
                <span class="current-reservation__time-label">Horário</span>
                <span class="current-reservation__time-value">
                  {{ getStart(currentReservation) }} - {{ getEnd(currentReservation) }}
                </span>
              </div>
            </div>
          </section>

          <!-- ✅ PRÓXIMAS RESERVAS -->
          <section v-if="nextReservations.length > 0">
            <h2 class="section-title">Próximas Reservas</h2>

            <div class="reservations-list">
              <div
                v-for="res in nextReservations"
                :key="res.id"
                class="reservation-item"
              >
                <div class="reservation-item__icon">
                  <School :size="20" />
                </div>

                <div class="reservation-item__info">
                  <h4 class="reservation-item__title">
                    {{ res.purpose }}
                  </h4>

                  <p class="reservation-item__author">
                    {{ res.requestedByName }}
                  </p>
                </div>

                <div class="reservation-item__time">
                  <span>
                    {{ getStart(res) }} - {{ getEnd(res) }}
                  </span>
                  <span class="reservation-item__day">
                    {{ res.reservationDate }}
                  </span>
                </div>
              </div>
            </div>
          </section>

          <!-- Tickets -->
          <TicketCardList :lab-id="labId" />

          <!-- Comentários -->
          <CommentsList :lab-id="labId" />

        </div>

        <!-- Sidebar -->
        <LabInfo
          :lab="lab"
          @open-reservation="isReservationModalOpen = true"
        />

      </div>
    </main>

    <!-- Loading -->
    <div v-else class="state-loading">
      <Loader2 :size="32" class="spin" />
      <span>Carregando laboratório...</span>
    </div>

    <!-- Modal -->
    <ReservationModal
      :is-open="isReservationModalOpen"
      :labs="lab ? [lab] : []"
      :pre-lab-id="labId"
      @close="isReservationModalOpen = false"
      @submitted="() => {}"
    />
  </div>
</template>

<style scoped>
.page { min-height: 100vh; background: #f9f9f9; }
.page__content {
  padding: 6rem 1.5rem 3rem; max-width: 80rem; margin: 0 auto;
}
.page__header { margin-bottom: 3rem; }
.page__title {
  font-family: 'Public Sans', sans-serif; font-size: 2.5rem;
  font-weight: 900; color: #1a1c1c; letter-spacing: -0.04em;
}
.page__subtitle { color: #3f4a3c; margin-top: 0.375rem; font-weight: 500; }

.layout { display: grid; grid-template-columns: 1fr; gap: 3rem; }
@media (min-width: 1024px) { .layout { grid-template-columns: 1fr 20rem; } }
.layout__main { display: flex; flex-direction: column; gap: 3rem; }

.section-title {
  font-family: 'Public Sans', sans-serif;
  font-size: 1.25rem; font-weight: 700; color: #1a1c1c;
  display: flex; align-items: center; gap: 0.5rem; margin-bottom: 1.5rem;
}
.section-title--primary { color: #006b1f; }

.current-reservation {
  background: rgba(11,135,43,0.07); border-left: 4px solid #006b1f;
  border-radius: 0.75rem; padding: 2rem;
  display: flex; flex-direction: column; gap: 1.5rem;
}
@media (min-width: 640px) {
  .current-reservation { flex-direction: row; justify-content: space-between; align-items: center; }
}
.current-reservation__status {
  font-size: 0.75rem; font-weight: 700; text-transform: uppercase;
  letter-spacing: 0.1em; color: #006b1f; margin-bottom: 0.375rem;
}
.current-reservation__title {
  font-family: 'Public Sans', sans-serif;
  font-size: 1.5rem; font-weight: 800; color: #005316;
}
.current-reservation__author {
  display: flex; align-items: center; gap: 0.375rem;
  color: #3f4a3c; font-size: 0.9375rem; margin-top: 0.5rem;
}
.current-reservation__time {
  background: #0b872b; color: #ffffff;
  padding: 0.75rem 1.5rem; border-radius: 0.5rem;
  text-align: center; flex-shrink: 0;
}
.current-reservation__time-label {
  display: block; font-size: 0.625rem; text-transform: uppercase;
  letter-spacing: 0.1em; opacity: 0.8; font-weight: 700;
}
.current-reservation__time-value {
  display: block; font-size: 1.25rem; font-weight: 700; margin-top: 0.25rem;
}

.reservations-list { display: flex; flex-direction: column; gap: 0.75rem; }
.reservation-item {
  background: #ffffff; padding: 1.25rem; border-radius: 0.5rem;
  display: flex; align-items: center; gap: 1rem; transition: background 0.15s;
}
.reservation-item:hover { background: #f3f3f4; }
.reservation-item__icon {
  width: 3rem; height: 3rem; flex-shrink: 0; border-radius: 9999px;
  background: #e8e8e8; display: flex; align-items: center;
  justify-content: center; color: #006b1f;
}
.reservation-item__info { flex: 1; }
.reservation-item__title { font-weight: 700; color: #1a1c1c; font-size: 0.9375rem; }
.reservation-item__author { font-size: 0.875rem; color: #3f4a3c; margin-top: 0.125rem; }
.reservation-item__time { text-align: right; flex-shrink: 0; }
.reservation-item__time span:first-child { display: block; font-weight: 700; color: #1a1c1c; }
.reservation-item__day { font-size: 0.75rem; color: #3f4a3c; }

.state-loading {
  display: flex; flex-direction: column; align-items: center;
  justify-content: center; gap: 0.75rem; padding: 8rem 1rem; color: #3f4a3c;
}
@keyframes spin { to { transform: rotate(360deg); } }
.spin { animation: spin 0.8s linear infinite; }
</style>
