<script setup>
import { ref, computed } from 'vue'
import { DatePicker } from 'v-calendar'
import 'v-calendar/style.css'
import { X } from 'lucide-vue-next'

import { useReservationStore } from '@/stores/useReservationStore'
import { useAuthStore } from '@/stores/useAuthStore'

const reservationStore = useReservationStore()
const authStore = useAuthStore()

const emit = defineEmits(['close'])

const props = defineProps({
  show: { type: Boolean, default: false },
  labInfo: { type: Object, required: true }
})

const selectedDate = ref(new Date())
const startTime = ref('')
const endTime = ref('')
const message = ref('')
const conflictList = ref([])

function closeModal() {
  emit('close')
}

function pad(n) {
  return String(n).padStart(2, '0')
}

function toDateString(date) {
  if (!date) return ''
  const year = date.getFullYear()
  const month = pad(date.getMonth() + 1)
  const day = pad(date.getDate())
  return `${year}-${month}-${day}`
}

function timeToMinutes(timeStr) {
  if (!timeStr) return 0
  const [h, m] = timeStr.slice(0, 5).split(':').map(Number)
  return h * 60 + m
}

function normalizeTime(timeStr) {
  return timeStr?.length === 5 ? `${timeStr}:00` : timeStr
}

function formatTime(timeStr) {
  return timeStr ? timeStr.slice(0, 5) : ''
}

function rangesOverlap(startA, endA, startB, endB) {
  return timeToMinutes(startA) < timeToMinutes(endB) &&
         timeToMinutes(endA) > timeToMinutes(startB)
}

const selectedDateStr = computed(() => toDateString(selectedDate.value))
const labId = computed(() => Number(props.labInfo?.id))

const dayReservations = computed(() => {
  const all = reservationStore.reservations || []
  return all.filter(res =>
    Number(res.laboratoryId) === labId.value &&
    res.reservationDate === selectedDateStr.value
  )
})

const busyBlocks = computed(() => {
  const blocks = []

  dayReservations.value.forEach(reservation => {
    ;(reservation.timeBlocks || []).forEach(block => {
      blocks.push({
        reservationId: reservation.id,
        requestedByName: reservation.requestedByName,
        purpose: reservation.purpose,
        startTime: formatTime(block.startTime),
        endTime: formatTime(block.endTime),
        blockOrder: block.blockOrder
      })
    })
  })

  return blocks
})

const matchingConflicts = computed(() => {
  if (!startTime.value || !endTime.value) return []

  return busyBlocks.value.filter(block =>
    rangesOverlap(startTime.value, endTime.value, block.startTime, block.endTime)
  )
})

function validateInterval() {
  conflictList.value = []

  if (!startTime.value || !endTime.value) {
    return false
  }

  if (timeToMinutes(startTime.value) >= timeToMinutes(endTime.value)) {
    conflictList.value.push({
      startTime: startTime.value,
      endTime: endTime.value,
      requestedByName: 'Horário inválido',
      purpose: 'A hora inicial deve ser menor que a hora final'
    })
    return false
  }

  conflictList.value = matchingConflicts.value
  return conflictList.value.length === 0
}

async function confirmReservation() {
  if (!authStore.user) {
    alert('Você precisa estar autenticado para reservar.')
    return
  }

  if (!validateInterval()) {
    return
  }

  const reservationData = {
    laboratoryId: labId.value,
    requestedByUserId: 1, // Mockado
    requestedByName: authStore.user.displayName,
    reservationDate: selectedDateStr.value,
    purpose: message.value.trim(),
    timeBlocks: [
      {
        startTime: normalizeTime(startTime.value),
        endTime: normalizeTime(endTime.value),
        blockOrder: 1,
        durationMinutes: timeToMinutes(endTime.value) - timeToMinutes(startTime.value)
      }
    ]
  }

  try {
    await reservationStore.addReservation(reservationData)

    startTime.value = ''
    endTime.value = ''
    message.value = ''
    conflictList.value = []

    closeModal()
  } catch (e) {
    alert('Erro ao criar reserva.')
    console.error(e)
  }
}
</script>

<template>
  <Transition name="modal">
    <div v-if="show" class="modal-backdrop" @click.self="closeModal">
      <div class="modal">
        <button class="close-btn" type="button" @click="closeModal" aria-label="Fechar modal">
          <X size="18" />
        </button>

        <h1 class="modal-title">Reservar Laboratório</h1>
        <p class="modal-subtitle">{{ labInfo?.name }}</p>

        <div class="form">
          <div class="form-group">
            <label class="label">Data</label>
            <DatePicker
              expanded
              locale="pt-BR"
              :first-day-of-week="1"
              v-model="selectedDate"
              mode="date"
              is-required
            />
          </div>

          <div class="form-group">
            <label class="label">Início</label>
            <input
              v-model="startTime"
              class="input"
              type="time"
            />
          </div>

          <div class="form-group">
            <label class="label">Fim</label>
            <input
              v-model="endTime"
              class="input"
              type="time"
            />
          </div>

          <div class="form-group">
            <label class="label">Mensagem</label>
            <textarea
              class="textarea"
              v-model="message"
              rows="2"
              placeholder="Ex.: ADS4M, Apresentação de TCC, Mulheres Mil"
            ></textarea>
            <p class="hint">Mensagem curta informando o propósito da reserva.</p>
          </div>

          <div v-if="conflictList.length" class="conflict-box">
            <h3 class="conflict-title">Conflitos encontrados:</h3>

            <ul class="conflict-list">
              <li v-for="c in conflictList" :key="`${c.reservationId}-${c.blockOrder}`">
                {{ c.startTime }} até {{ c.endTime }}
                <span v-if="c.requestedByName"> — {{ c.requestedByName }}</span>
                <span v-if="c.purpose"> — {{ c.purpose }}</span>
              </li>
            </ul>

            <p class="conflict-hint">Escolha outro horário.</p>
          </div>

          <button class="btn-primary mt-4" @click="confirmReservation">
            Confirmar Reserva
          </button>
        </div>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.55);
  backdrop-filter: blur(3px);
  display: flex;
  justify-content: center;
  align-items: center;
}

.modal {
  position: relative;
  background: white;
  padding: 2rem;
  width: 450px;
  border-radius: 16px;
  box-shadow:
    0 10px 15px -3px rgba(0, 0, 0, 0.1),
    0 4px 6px -2px rgba(0, 0, 0, 0.05);
  animation: fadeIn 0.2s ease;
}

.close-btn {
  position: absolute;
  top: 14px;
  right: 14px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 34px;
  height: 34px;
  border-radius: 9999px;
  border: 1px solid #E5E7EB;
  background: white;
  color: #64748B;
  transition: background 0.2s, color 0.2s, border-color 0.2s;
}

.close-btn:hover {
  background: #F8FAFC;
  color: #0F172A;
  border-color: #CBD5E1;
}

.modal-title {
  font-size: 1.4rem;
  font-weight: 600;
  margin-bottom: 0.4rem;
  padding-right: 2rem;
}

.modal-subtitle {
  color: #64748B;
  margin-bottom: 1.5rem;
}

.form-group {
  margin-bottom: 1rem;
  display: flex;
  flex-direction: column;
}

.label {
  font-weight: 500;
  margin-bottom: 0.35rem;
}

.select,
.textarea,
.input {
  width: 100%;
  border: 1px solid #D1D5DB;
  border-radius: 8px;
  padding: 0.6rem;
  font-size: 0.95rem;
  transition: border-color 0.2s;
}

.select:focus,
.textarea:focus,
.input:focus {
  border-color: #6366F1;
  outline: none;
}

.hint {
  color: #6B7280;
  font-size: 0.8rem;
  margin-top: 0.25rem;
}

.btn-primary {
  width: 100%;
  background: #4F46E5;
  color: white;
  padding: 0.75rem;
  border-radius: 8px;
  font-weight: 500;
  transition: 0.2s;
}

.btn-primary:hover {
  background: #4338CA;
}

.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.2s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.conflict-box {
  margin-top: 15px;
  margin-bottom: 15px;
  padding: 12px;
  background: #ffe5e5;
  border: 1px solid #ffbaba;
  border-radius: 6px;
}

.conflict-title {
  font-weight: bold;
  margin-bottom: 6px;
  color: #a10000;
}

.conflict-list {
  margin-left: 16px;
}

.conflict-hint {
  margin-top: 8px;
  color: #b00000;
  font-size: 0.9rem;
}
</style>