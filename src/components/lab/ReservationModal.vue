<script setup>
import { ref, computed } from 'vue'
import { Transition } from 'vue'
import { DatePicker } from 'v-calendar'

import 'v-calendar/style.css'

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

const slots = [
  { index: 0, startTime: "07:45", endTime: "08:30" },
  { index: 1, startTime: "08:30", endTime: "09:15" },
  { index: 2, startTime: "09:35", endTime: "10:20" },
  { index: 3, startTime: "10:20", endTime: "11:05" },
  { index: 4, startTime: "11:05", endTime: "11:50" },
  { index: 5, startTime: "13:00", endTime: "13:45" },
  { index: 6, startTime: "13:45", endTime: "14:30" },
  { index: 7, startTime: "14:30", endTime: "15:15" },
  { index: 8, startTime: "15:35", endTime: "16:20" },
  { index: 9, startTime: "16:20", endTime: "17:05" },
  { index: 10, startTime: "17:05", endTime: "17:50" },
  { index: 11, startTime: "18:15", endTime: "19:00" },
  { index: 12, startTime: "19:00", endTime: "19:45" },
  { index: 13, startTime: "19:45", endTime: "20:30" },
  { index: 14, startTime: "20:30", endTime: "21:15" },
  { index: 15, startTime: "21:15", endTime: "22:00" }
]

function getSlotRange(reservation, slots) {
  const startIndex = slots.find(s => s.startTime === reservation.startTime)?.index
  const endIndex = slots.find(s => s.endTime === reservation.endTime)?.index
  if (startIndex == null || endIndex == null) return []

  return Array.from({ length: endIndex - startIndex + 1 }, (_, i) => startIndex + i)
}

const pastSlots = computed(() => {
  const past = new Set()

  const nowBrasilia = new Date(
    new Date().toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' })
  )

  const todayBrasilia = nowBrasilia.toISOString().split('T')[0]
  const selectedDateStr = selectedDate.value.toISOString().split('T')[0]

  if (selectedDateStr !== todayBrasilia) return past

  const currentMinutes = nowBrasilia.getHours() * 60 + nowBrasilia.getMinutes()

  slots.forEach(slot => {
    const [endH, endM] = slot.endTime.split(':').map(Number)
    const endMinutes = endH * 60 + endM

    if (endMinutes <= currentMinutes) {
      past.add(slot.index)
    }
  })

  return past
})

const busySlots = computed(() => {
  const dateStr = selectedDate.value.toISOString().split('T')[0]
  const labId = props.labInfo.id

  const todaysReservations = reservationStore.reservationsByLab(labId)
    .filter(r => r.date === dateStr)

  const occupied = new Set([...pastSlots.value])

  todaysReservations.forEach(res => {
    res.intervals.forEach(interval => {
      for (let i = interval.startSlot; i <= interval.endSlot; i++) {
        occupied.add(i)
      }
    })
  })

  return occupied
})

const filteredStartTimes = computed(() => {
  return slots.filter(s => !busySlots.value.has(s.index))
})

const filteredEndTimes = computed(() => {
  if (!startTime.value) return []

  const startIndex = slots.find(s => s.startTime === startTime.value)?.index

  return slots.filter(slot => {
    if (slot.index < startIndex) return false

    for (let i = startIndex; i <= slot.index; i++) {
      if (busySlots.value.has(i)) return false
    }
    return true
  })
})

function validateInterval() {
  conflictList.value = []

  const startIndex = slots.find(s => s.startTime === startTime.value)?.index
  const endIndex = slots.find(s => s.endTime === endTime.value)?.index

  if (startIndex == null || endIndex == null) return false

  for (let i = startIndex; i <= endIndex; i++) {
    if (busySlots.value.has(i)) {
      conflictList.value.push(slots[i])
    }
  }

  return conflictList.value.length === 0
}

async function confirmReservation() {
  if (!validateInterval()) {
    return
  }

  const startIndex = slots.find(s => s.startTime === startTime.value)?.index
  const endIndex = slots.find(s => s.endTime === endTime.value)?.index

  const reservationData = {
    labId: props.labInfo.id,
    authorId: authStore.user.uid,
    authorName: authStore.user.displayName,
    date: selectedDate.value.toISOString().split("T")[0],
    description: message.value.trim(),
    intervals: [
      {
        startSlot: startIndex,
        endSlot: endIndex
      }
    ]
  }

  try {
    await reservationStore.addReservation(reservationData)

    startTime.value = ""
    endTime.value = ""
    message.value = ""
    conflictList.value = []

    emit("close")
  } catch (e) {
    alert("Erro ao criar reserva.")
    console.error(e)
  }
}

</script>

<template>
  <Transition name="modal">
    <div v-if="show" class="modal-backdrop">
      <div class="modal">
        <h1 class="modal-title">Reservar Laboratório</h1>
        <p class="modal-subtitle">{{ labInfo?.name }}</p>

        <div class="form">

          <!-- Date -->
          <div class="form-group">
            <label class="label">Data</label>
            <DatePicker expanded locale="pt-BR" :first-day-of-week="1" v-model="selectedDate" mode="date" is-required />
          </div>

          <!-- Start Time -->
          <div class="form-group">
            <label class="label">Início</label>
            <select v-model="startTime" class="select">
              <option disabled value="">Selecione...</option>

              <option v-for="slot in filteredStartTimes" :key="slot.index" :value="slot.startTime">
                {{ slot.index + 1 }}º horário — {{ slot.startTime }}
              </option>
            </select>

          </div>

          <!-- End Time -->
          <div class="form-group">
            <label class="label">Fim</label>
            <select v-model="endTime" class="select">
              <option disabled value="">Selecione...</option>

              <option v-for="slot in filteredEndTimes" :key="slot.index" :value="slot.endTime">
                {{ slot.index + 1 }}º horário — {{ slot.endTime }}
              </option>
            </select>

          </div>

          <!-- Message -->
          <div class="form-group">
            <label class="label">Mensagem</label>
            <textarea class="textarea" v-model="message" rows="2"
              placeholder="Ex.: ADS4M, Apresentação de TCC, Mulheres Mil"></textarea>
            <p class="hint">Mensagem curta informando o propósito da reserva.</p>
          </div>

          <!-- Exibir conflitos -->
          <div v-if="conflictList.length" class="conflict-box">
            <h3 class="conflict-title">Horários já reservados:</h3>

            <ul class="conflict-list">
              <li v-for="c in conflictList" :key="c.index">
                {{ c.index + 1 }}º horário — {{ c.startTime }} até {{ c.endTime }}
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
/* ===========================
   BACKDROP
=========================== */
.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.55);
  backdrop-filter: blur(3px);
  display: flex;
  justify-content: center;
  align-items: center;
}

/* ===========================
   MODAL CONTAINER (shadcn style)
=========================== */
.modal {
  background: white;
  padding: 2rem;
  width: 450px;
  border-radius: 16px;
  box-shadow:
    0 10px 15px -3px rgba(0, 0, 0, 0.1),
    0 4px 6px -2px rgba(0, 0, 0, 0.05);
  animation: fadeIn 0.2s ease;
}

.modal-title {
  font-size: 1.4rem;
  font-weight: 600;
  margin-bottom: 0.4rem;
}

.modal-subtitle {
  color: #64748B;
  margin-bottom: 1.5rem;
}

/* ===========================
   FORM ELEMENTS
=========================== */
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
.textarea {
  width: 100%;
  border: 1px solid #D1D5DB;
  border-radius: 8px;
  padding: 0.6rem;
  font-size: 0.95rem;
  transition: border-color 0.2s;
}

.select:focus,
.textarea:focus {
  border-color: #6366F1;
  outline: none;
}

.hint {
  color: #6B7280;
  font-size: 0.8rem;
  margin-top: 0.25rem;
}

/* ===========================
   BUTTON
=========================== */
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

/* ===========================
   ANIMATION
=========================== */
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
