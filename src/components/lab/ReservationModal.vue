<script setup>
import { ref, watch, computed } from 'vue'
import { X, ChevronDown, CalendarDays, Clock, FileText, Loader2, CheckCheck, Sparkles, SendHorizontal } from 'lucide-vue-next'
import { useReservationStore } from '@/stores/useReservationStore'
import { useLabSuggestionStore } from '@/stores/useLabSuggestionStore'

const reservationStore = useReservationStore()
const labSuggestionStore = useLabSuggestionStore()

const props = defineProps({
  isOpen:   { type: Boolean, default: false },
  labs:     { type: Array, default: () => [] },
  preLabId: { type: [String, Number], default: null }
})

const emit = defineEmits(['close', 'submitted'])

const isAiLoading = computed(() => labSuggestionStore.loading)
const aiError     = computed(() => labSuggestionStore.error)
const aiReason    = computed(() => labSuggestionStore.suggestion?.reason ?? '')

const form = ref({
  labId:       '',
  date:        '',
  startTime:   '',
  endTime:     '',
  description: ''
})

// ── IA ────────────────────────────────────────────────────────────────────────
const isAiPanelOpen = ref(false)
const aiPrompt      = ref('')

function toggleAiPanel() {
  isAiPanelOpen.value = !isAiPanelOpen.value
  aiReason.value = ''
  aiError.value  = ''
}

const aiCanSend = computed(() =>
  form.value.date && form.value.startTime && form.value.endTime && aiPrompt.value.trim()
)

const aiMissingFieldsHint = computed(() => {
  if (!form.value.date)      return 'Informe a data antes de consultar a IA.'
  if (!form.value.startTime) return 'Informe o horário de início antes de consultar a IA.'
  if (!form.value.endTime)   return 'Informe o horário de término antes de consultar a IA.'
  return ''
})

async function handleAiSuggest() {
  if (!aiCanSend.value) return

  try {
    const result = await labSuggestionStore.suggest({
      date:       form.value.date,
      startTime:  form.value.startTime,
      endTime:    form.value.endTime,
      userPrompt: aiPrompt.value.trim()
    })

    form.value.labId = result.labId

  } catch (err) {
    aiError.value =
      err?.response?.data?.message ||
      err.message ||
      'Não foi possível obter sugestão da IA.'
  } finally {
    isAiLoading.value = false
  }
}
// ─────────────────────────────────────────────────────────────────────────────

const today = computed(() => new Date().toISOString().slice(0, 10))

watch(() => props.isOpen, (val) => {
  if (val) {
    form.value = {
      labId:       props.preLabId ?? '',
      date:        '',
      startTime:   '',
      endTime:     '',
      description: ''
    }
    labSuggestionStore.reset()
  }
})

function handleClose() {
  if (!isLoading.value) emit('close')
}

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
  return new Date(`${date}T${time}`) < new Date()
}

async function handleSubmit() {
  errorMessage.value = ''

  if (!form.value.labId)            { errorMessage.value = 'Selecione o laboratório.'; return }
  if (!form.value.date)             { errorMessage.value = 'Informe a data da reserva.'; return }
  if (!form.value.startTime)        { errorMessage.value = 'Informe o horário de início.'; return }
  if (!form.value.endTime)          { errorMessage.value = 'Informe o horário de término.'; return }
  if (!form.value.description.trim()) { errorMessage.value = 'Descreva a atividade.'; return }

  if (form.value.date < today.value) {
    errorMessage.value = 'Não é possível reservar em datas passadas.'
    return
  }

  if (isPastDateTime(form.value.date, form.value.startTime)) {
    errorMessage.value = 'Não é possível reservar horários no passado.'
    return
  }

  if (form.value.startTime >= form.value.endTime) {
    errorMessage.value = 'O horário final deve ser maior que o inicial.'
    return
  }

  isLoading.value = true

  try {
    await reservationStore.loadReservationsByLab(form.value.labId)

    const sameDayReservations = reservationStore.reservations.filter(r =>
      Number(r.laboratoryId) === Number(form.value.labId) &&
      r.reservationDate === form.value.date
    )

    if (hasConflict(form.value.startTime, form.value.endTime, sameDayReservations)) {
      errorMessage.value = 'Já existe uma reserva nesse horário.'
      return
    }

    await reservationStore.addReservation({
      laboratoryId:      Number(form.value.labId),
      requestedByUserId: 2,
      requestedByName:   'Usuário',
      reservationDate:   form.value.date,
      purpose:           form.value.description,
      timeBlocks: [
        { startTime: form.value.startTime, endTime: form.value.endTime, blockOrder: 1 }
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
              <p class="modal__subtitle">Preencha os detalhes para agendar seu horário.</p>
            </div>
            <button class="modal__close-btn" :disabled="isLoading" @click="handleClose">
              <X :size="20" />
            </button>
          </div>

          <!-- Body -->
          <div class="modal__body">

            <!-- LAB -->
            <div class="form-group">
              <div class="lab-label-row">
                <label class="form-label">Selecionar Laboratório</label>
                <button class="ai-toggle-btn" type="button" @click="toggleAiPanel">
                  <Sparkles :size="11" />
                  {{ isAiPanelOpen ? 'Ocultar IA' : 'Perguntar à IA' }}
                </button>
              </div>

              <div class="select-wrapper">
                <select v-model="form.labId" class="form-select" :disabled="isLoading">
                  <option value="" disabled>Selecione</option>
                  <option v-for="lab in labs" :key="lab.id" :value="lab.id">
                    {{ lab.code ? `${lab.code} - ${lab.name}` : lab.name }}
                  </option>
                </select>
                <ChevronDown :size="18" class="select-icon" />
              </div>

              <!-- Painel IA -->
              <Transition name="ai-panel">
                <div v-if="isAiPanelOpen" class="ai-panel">
                  <p class="ai-panel__hint">
                    Descreva sua necessidade e a IA sugerirá o laboratório mais adequado
                    para o período escolhido.
                  </p>

                  <div class="ai-input-row">
                    <textarea
                      v-model="aiPrompt"
                      class="ai-textarea"
                      rows="2"
                      placeholder="Ex: Preciso de um lab com pelo menos 20 computadores para uma aula de programação..."
                      :disabled="isAiLoading"
                    />
                    <button
                      class="ai-send-btn"
                      type="button"
                      :disabled="!aiCanSend || isAiLoading"
                      :title="aiMissingFieldsHint || 'Consultar IA'"
                      @click="handleAiSuggest"
                    >
                      <Loader2 v-if="isAiLoading" :size="15" class="spin" />
                      <SendHorizontal v-else :size="15" />
                    </button>
                  </div>

                  <p v-if="aiMissingFieldsHint && !aiCanSend" class="ai-hint-warn">
                    {{ aiMissingFieldsHint }}
                  </p>

                  <p v-if="aiError" class="ai-error">{{ aiError }}</p>

                  <p v-if="aiReason" class="ai-reason">
                    <Sparkles :size="11" class="ai-reason__icon" />
                    {{ aiReason }}
                  </p>
                </div>
              </Transition>
            </div>

            <!-- DATA + HORÁRIO -->
            <div class="form-row-3">
              <div class="form-group">
                <label class="form-label"><CalendarDays :size="12" /> Data</label>
                <input v-model="form.date" type="date" class="form-input" :min="today" />
              </div>

              <div class="form-group">
                <label class="form-label"><Clock :size="12" /> Início</label>
                <input v-model="form.startTime" type="time" class="form-input" />
              </div>

              <div class="form-group">
                <label class="form-label"><Clock :size="12" /> Fim</label>
                <input v-model="form.endTime" type="time" class="form-input" />
              </div>
            </div>

            <!-- DESCRIÇÃO -->
            <div class="form-group">
              <label class="form-label"><FileText :size="12" /> Descrição</label>
              <textarea
                v-model="form.description"
                class="form-textarea"
                rows="3"
                placeholder="Ex: Aula prática..."
              />
            </div>

            <p v-if="errorMessage" class="error-msg">{{ errorMessage }}</p>

          </div>

          <!-- Footer -->
          <div class="modal__footer">
            <button class="btn btn--cancel" @click="handleClose">Cancelar</button>
            <button class="btn btn--submit" :disabled="isLoading" @click="handleSubmit">
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
/* ── existentes ─────────────────────────────────────────────────────────────── */
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
.form-row-3 { display: grid; grid-template-columns: 1fr; gap: 1rem; }
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
.select-icon {
  position: absolute; right: 0.875rem; top: 50%;
  transform: translateY(-50%); pointer-events: none; color: #3f4a3c;
}
.error-msg { font-size: 0.8rem; color: #ba1a1a; font-weight: 500; }

.modal__footer {
  padding: 1rem 2rem 1.75rem;
  display: flex; flex-direction: column; gap: 0.75rem; justify-content: flex-end;
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

/* ── IA ─────────────────────────────────────────────────────────────────────── */
.lab-label-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.ai-toggle-btn {
  display: inline-flex; align-items: center; gap: 0.3rem;
  font-size: 0.625rem; font-weight: 700; text-transform: uppercase;
  letter-spacing: 0.08em; color: #006b1f;
  background: none; border: none; cursor: pointer; padding: 0;
  transition: opacity 0.15s;
}
.ai-toggle-btn:hover { opacity: 0.7; }

.ai-panel {
  background: #f0f7f1;
  border: 1px solid #c2ddc8;
  border-radius: 0.5rem;
  padding: 0.875rem 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.625rem;
}

.ai-panel__hint {
  font-size: 0.75rem;
  color: #3f4a3c;
  line-height: 1.4;
}

.ai-input-row {
  display: flex;
  gap: 0.5rem;
  align-items: flex-start;
}

.ai-textarea {
  flex: 1;
  background: #ffffff;
  border: 1px solid #c2ddc8;
  border-radius: 0.375rem;
  padding: 0.5rem 0.75rem;
  font-size: 0.8125rem;
  font-family: 'Inter', sans-serif;
  color: #1a1c1c;
  resize: none;
  outline: none;
  transition: box-shadow 0.2s;
  line-height: 1.4;
}
.ai-textarea:focus { box-shadow: 0 0 0 2px #006b1f; }
.ai-textarea:disabled { opacity: 0.6; cursor: not-allowed; }

.ai-send-btn {
  flex-shrink: 0;
  width: 2.25rem; height: 2.25rem;
  background: #006b1f; color: #fff;
  border: none; border-radius: 0.375rem;
  display: flex; align-items: center; justify-content: center;
  cursor: pointer; transition: opacity 0.15s, transform 0.1s;
  margin-top: 0.125rem;
}
.ai-send-btn:hover:not(:disabled) { opacity: 0.85; }
.ai-send-btn:active:not(:disabled) { transform: scale(0.94); }
.ai-send-btn:disabled { opacity: 0.45; cursor: not-allowed; }

.ai-hint-warn {
  font-size: 0.7rem;
  color: #8a6800;
  font-weight: 500;
}

.ai-error {
  font-size: 0.75rem;
  color: #ba1a1a;
  font-weight: 500;
}

.ai-reason {
  display: flex; align-items: flex-start; gap: 0.375rem;
  font-size: 0.75rem; color: #1a4225; line-height: 1.45;
  background: #d6f0dc; border-radius: 0.375rem;
  padding: 0.5rem 0.625rem;
}
.ai-reason__icon { flex-shrink: 0; margin-top: 0.1rem; color: #006b1f; }

/* animação do painel */
.ai-panel-enter-active,
.ai-panel-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}
.ai-panel-enter-from,
.ai-panel-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}
</style>