<script setup>
import { ref, watch, computed } from 'vue'
import { X, ChevronDown, CalendarDays, Clock, FileText, Loader2, CheckCheck } from 'lucide-vue-next'
import { useReservationStore } from '@/stores/useReservationStore'

const reservationStore = useReservationStore()

const props = defineProps({
  isOpen:    { type: Boolean, default: false },
  labs:      { type: Array, default: () => [] },
  preLabId:  { type: [String, Number], default: null }
})

const emit = defineEmits(['close', 'submitted'])

const isLoading = ref(false)
const errorMessage = ref('')

const form = ref({
  labId: '',
  date: '',
  startTime: '',
  endTime: '',
  description: ''
})

// 🔥 hoje (para bloquear no input)
const today = computed(() => new Date().toISOString().slice(0, 10))

watch(() => props.isOpen, (val) => {
  if (val) {
    form.value = {
      labId: props.preLabId ?? '',
      date: '',
      startTime: '',
      endTime: '',
      description: ''
    }
    errorMessage.value = ''
  }
})

function handleClose() {
  if (!isLoading.value) emit('close')
}

// 🔥 HELPERS
function toMinutes(time) {
  const [h, m] = time.split(':').map(Number)
  return h * 60 + m
}

function hasConflict(newStart, newEnd, reservations) {
  const start = toMinutes(newStart)
  const end   = toMinutes(newEnd)

  return reservations.some(r =>
    r.timeBlocks?.some(block => {
      const bStart = toMinutes(block.startTime)
      const bEnd   = toMinutes(block.endTime)

      return start < bEnd && end > bStart
    })
  )
}

function isPastDateTime(date, time) {
  const now = new Date()
  const selected = new Date(`${date}T${time}`)
  return selected < now
}

// 🚀 SUBMIT
async function handleSubmit() {
  errorMessage.value = ''

  // validações básicas
  if (!form.value.labId)       { errorMessage.value = 'Selecione o laboratório.'; return }
  if (!form.value.date)        { errorMessage.value = 'Informe a data da reserva.'; return }
  if (!form.value.startTime)   { errorMessage.value = 'Informe o horário de início.'; return }
  if (!form.value.endTime)     { errorMessage.value = 'Informe o horário de término.'; return }
  if (!form.value.description.trim()) {
    errorMessage.value = 'Descreva a atividade.'
    return
  }

  // 🚫 data passada
  if (form.value.date < today.value) {
    errorMessage.value = 'Não é possível reservar em datas passadas.'
    return
  }

  // 🚫 horário passado (hoje)
  if (isPastDateTime(form.value.date, form.value.startTime)) {
    errorMessage.value = 'Não é possível reservar horários no passado.'
    return
  }

  // 🚫 horário inválido
  if (form.value.startTime >= form.value.endTime) {
    errorMessage.value = 'O horário final deve ser maior que o inicial.'
    return
  }

  isLoading.value = true

  try {
    // 🔥 garante dados atualizados
    await reservationStore.loadReservationsByLab(form.value.labId)

    // 🔥 filtrar reservas do mesmo dia
    const sameDayReservations = reservationStore.reservations.filter(r =>
      Number(r.laboratoryId) === Number(form.value.labId) &&
      r.reservationDate === form.value.date
    )

    // 🚫 conflito
    const conflict = hasConflict(
      form.value.startTime,
      form.value.endTime,
      sameDayReservations
    )

    if (conflict) {
      errorMessage.value = 'Já existe uma reserva nesse horário.'
      return
    }

    // 🚀 criar reserva
    await reservationStore.addReservation({
      laboratoryId: Number(form.value.labId),

      requestedByUserId: 2, // depois integrar auth
      requestedByName: 'Usuário',

      reservationDate: form.value.date,
      purpose: form.value.description,

      timeBlocks: [
        {
          startTime: form.value.startTime,
          endTime: form.value.endTime,
          blockOrder: 1
        }
      ]
    })

    emit('submitted')
    emit('close')

  } catch (err) {
    console.error('Erro ao criar reserva:', err)

    errorMessage.value =
      err?.response?.data?.message ||
      err.message ||
      'Não foi possível confirmar a reserva.'
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="isOpen" class="modal-overlay" @click.self="handleClose">
        <div class="modal">

          <!-- Header -->
          <div class="modal__header">
            <div>
              <h2 class="modal__title">Nova Reserva de Laboratório</h2>
              <p class="modal__subtitle">
                Preencha os detalhes para agendar seu horário.
              </p>
            </div>

            <button class="modal__close-btn" :disabled="isLoading" @click="handleClose">
              <X :size="20" />
            </button>
          </div>

          <!-- Body -->
          <div class="modal__body">

            <!-- LAB -->
            <div class="form-group">
              <label class="form-label">Selecionar Laboratório</label>

              <div class="select-wrapper">
                <select v-model="form.labId" class="form-select" :disabled="isLoading">
                  <option value="" disabled>Selecione</option>

                  <option v-for="lab in labs" :key="lab.id" :value="lab.id">
                    {{ lab.code ? `${lab.code} - ${lab.name}` : lab.name }}
                  </option>
                </select>

                <ChevronDown :size="18" class="select-icon" />
              </div>
            </div>

            <!-- DATA + HORÁRIO -->
            <div class="form-row-3">

              <div class="form-group">
                <label class="form-label">
                  <CalendarDays :size="12" /> Data
                </label>

                <!-- 🔥 BLOQUEIA DATA PASSADA -->
                <input
                  v-model="form.date"
                  type="date"
                  class="form-input"
                  :min="today"
                />
              </div>

              <div class="form-group">
                <label class="form-label">
                  <Clock :size="12" /> Início
                </label>

                <input
                  v-model="form.startTime"
                  type="time"
                  class="form-input"
                />
              </div>

              <div class="form-group">
                <label class="form-label">
                  <Clock :size="12" /> Fim
                </label>

                <input
                  v-model="form.endTime"
                  type="time"
                  class="form-input"
                />
              </div>

            </div>

            <!-- DESCRIÇÃO -->
            <div class="form-group">
              <label class="form-label">
                <FileText :size="12" /> Descrição
              </label>

              <textarea
                v-model="form.description"
                class="form-textarea"
                rows="3"
                placeholder="Ex: Aula prática..."
              />
            </div>

            <p v-if="errorMessage" class="error-msg">
              {{ errorMessage }}
            </p>

          </div>

          <!-- Footer -->
          <div class="modal__footer">
            <button class="btn btn--cancel" @click="handleClose">
              Cancelar
            </button>

            <button class="btn btn--submit" @click="handleSubmit" :disabled="isLoading">
              <Loader2 v-if="isLoading" :size="16" class="spin" />
              <CheckCheck v-else :size="16" />
              {{ isLoading ? 'Confirmando...' : 'Confirmar Reserva' }}
            </button>
          </div>

        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.modal-overlay {
  position: fixed; inset: 0; z-index: 100;
  display: flex; align-items: center; justify-content: center;
  background: rgba(26,28,28,0.4); backdrop-filter: blur(6px); padding: 1rem;
}
.modal {
  background: #ffffff; width: 100%; max-width: 36rem;
  border-radius: 0.75rem; box-shadow: 0 24px 64px rgba(0,0,0,0.18);
  display: flex; flex-direction: column; max-height: 90vh; overflow: hidden;
}
.modal__header {
  display: flex; justify-content: space-between; align-items: flex-start;
  padding: 1.75rem 2rem 1.25rem;
  border-bottom: 1px solid rgba(190,202,185,0.15);
  background: #f9f9f9;
}
.modal__title {
  font-family: 'Public Sans', sans-serif; font-size: 1.375rem;
  font-weight: 800; color: #1a1c1c; letter-spacing: -0.02em;
}
.modal__subtitle { font-size: 0.875rem; color: #3f4a3c; margin-top: 0.25rem; }
.modal__close-btn {
  padding: 0.375rem; border-radius: 9999px; border: none;
  background: transparent; cursor: pointer; color: #3f4a3c;
  display: flex; transition: background 0.15s;
}
.modal__close-btn:hover { background: #e8e8e8; }
.modal__close-btn:disabled { opacity: 0.5; cursor: not-allowed; }

.modal__body {
  padding: 1.5rem 2rem; overflow-y: auto;
  display: flex; flex-direction: column; gap: 1.25rem;
}
.form-group { display: flex; flex-direction: column; gap: 0.5rem; }
.form-row-3 {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1rem;
}
@media (min-width: 480px) {
  .form-row-3 { grid-template-columns: 1fr 1fr 1fr; }
}
.form-label {
  font-size: 0.625rem; font-weight: 700; text-transform: uppercase;
  letter-spacing: 0.1em; color: #3f4a3c;
}
.form-input, .form-select, .form-textarea {
  width: 100%; background: #f3f3f4; border: none;
  border-radius: 0.5rem; padding: 0.75rem 1rem;
  font-size: 0.875rem; color: #1a1c1c;
  font-family: 'Inter', sans-serif; outline: none; transition: box-shadow 0.2s;
}
.form-input:focus, .form-select:focus, .form-textarea:focus { box-shadow: 0 0 0 2px #006b1f; }
.form-input:disabled, .form-select:disabled, .form-textarea:disabled { opacity: 0.6; cursor: not-allowed; }
.form-textarea { resize: none; }
.select-wrapper { position: relative; }
.form-select { appearance: none; cursor: pointer; padding-right: 2.5rem; }
.select-icon { position: absolute; right: 0.875rem; top: 50%; transform: translateY(-50%); pointer-events: none; color: #3f4a3c; }

.error-msg { font-size: 0.8rem; color: #ba1a1a; font-weight: 500; }

.modal__footer {
  padding: 1rem 2rem 1.75rem;
  display: flex; flex-direction: column; gap: 0.75rem;
  justify-content: flex-end;
}
@media (min-width: 480px) {
  .modal__footer { flex-direction: row; }
}
.btn {
  padding: 0.75rem 1.5rem; border-radius: 0.5rem;
  font-size: 0.875rem; font-weight: 700; cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  gap: 0.5rem; border: none; transition: opacity 0.15s, transform 0.1s;
}
.btn:disabled { opacity: 0.6; cursor: not-allowed; }
.btn:active:not(:disabled) { transform: scale(0.97); }
.btn--cancel { background: transparent; color: #3f4a3c; }
.btn--cancel:hover:not(:disabled) { background: #e8e8e8; }
.btn--submit {
  flex: 1; background: linear-gradient(135deg, #006b1f, #0b872b);
  color: #ffffff; box-shadow: 0 4px 12px rgba(0,107,31,0.2);
}
.btn--submit:hover:not(:disabled) { opacity: 0.92; }
.modal-enter-active, .modal-leave-active { transition: opacity 0.2s ease; }
.modal-enter-from, .modal-leave-to { opacity: 0; }
@keyframes spin { to { transform: rotate(360deg); } }
.spin { animation: spin 0.8s linear infinite; }
</style>
