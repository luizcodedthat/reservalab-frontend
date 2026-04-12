<script setup>
import { ref, watch } from 'vue'
import { useTicketStore } from '@/stores/useTicketStore'
import {
  X, ChevronDown, AlertCircle, Loader2, Save
} from 'lucide-vue-next'

const props = defineProps({
  isOpen: { type: Boolean, default: false },
  ticket: { type: Object, default: null },
  labs:   { type: Array, default: () => [] }
})

const emit = defineEmits(['close', 'updated'])

const ticketStore = useTicketStore()

const STATUS_OPTIONS = ['Aberto', 'Em andamento', 'Concluído', 'Fechado']
const PRIORIDADE_OPTIONS = [
  { value: 'LOW',    label: 'Baixa'   },
  { value: 'MEDIUM', label: 'Média'   },
  { value: 'HIGH',   label: 'Alta'    },
  { value: 'URGENT', label: 'Urgente' },
]

const form = ref({
  titulo: '', descricao: '', labId: '',
  status: '', prioridade: '', comentario: ''
})
const errorMessage = ref('')

watch(
  () => [props.isOpen, props.ticket],
  ([open, ticket]) => {
    if (open && ticket) {
      form.value = {
        titulo:     ticket.titulo     ?? '',
        descricao:  ticket.descricao  ?? '',
        labId:      ticket.labId      ?? '',
        status:     ticket.status     ?? 'Aberto',
        prioridade: ticket.prioridade ?? 'MEDIUM',
        comentario: ticket.comentario ?? ''
      }
      errorMessage.value = ''
    }
  },
  { immediate: true }
)

function handleClose() {
  if (!ticketStore.loading) emit('close')
}

async function handleSubmit() {
  errorMessage.value = ''

  if (!form.value.titulo.trim()) { errorMessage.value = 'O título é obrigatório.'; return }
  if (!form.value.descricao.trim()) { errorMessage.value = 'A descrição é obrigatória.'; return }
  if (!form.value.labId) { errorMessage.value = 'Selecione o laboratório.'; return }

  try {
    await ticketStore.updateTicket(props.ticket.id, {
      titulo:     form.value.titulo.trim(),
      descricao:  form.value.descricao.trim(),
      labId:      form.value.labId,
      status:     form.value.status,
      prioridade: form.value.prioridade,
      comentario: form.value.comentario.trim()
    })
    emit('updated')
    emit('close')
  } catch (err) {
    console.error('Erro ao atualizar chamado:', err)
    errorMessage.value = err.message ?? 'Não foi possível salvar as alterações. Tente novamente.'
  }
}
</script>

<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="isOpen && ticket" class="modal-overlay" @click.self="handleClose">
        <div class="modal" role="dialog" aria-modal="true" aria-labelledby="editar-modal-title">

          <div class="modal__header">
            <div>
              <h2 id="editar-modal-title" class="modal__title">Editar Chamado</h2>
              <p class="modal__subtitle">ID #{{ ticket.id }} — altere os campos desejados.</p>
            </div>
            <button class="modal__close-btn" :disabled="ticketStore.loading" aria-label="Fechar modal" @click="handleClose">
              <X :size="20" />
            </button>
          </div>

          <div class="modal__body">

            <div class="form-group">
              <label class="form-label" for="editar-titulo">Título do Problema</label>
              <input id="editar-titulo" v-model="form.titulo" class="form-input" type="text" :disabled="ticketStore.loading" />
            </div>

            <div class="form-group">
              <label class="form-label" for="editar-lab">Laboratório</label>
              <div class="select-wrapper">
                <select id="editar-lab" v-model="form.labId" class="form-select" :disabled="ticketStore.loading">
                  <option value="" disabled>Selecione o laboratório</option>
                  <option v-for="lab in labs" :key="lab.id" :value="lab.id">{{ lab.nome }}</option>
                </select>
                <ChevronDown :size="18" class="select-icon" />
              </div>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label class="form-label" for="editar-status">Status</label>
                <div class="select-wrapper">
                  <select id="editar-status" v-model="form.status" class="form-select" :disabled="ticketStore.loading">
                    <option v-for="s in STATUS_OPTIONS" :key="s" :value="s">{{ s }}</option>
                  </select>
                  <ChevronDown :size="18" class="select-icon" />
                </div>
              </div>

              <div class="form-group">
                <label class="form-label" for="editar-prioridade">Prioridade</label>
                <div class="select-wrapper">
                  <select id="editar-prioridade" v-model="form.prioridade" class="form-select" :disabled="ticketStore.loading">
                    <option v-for="p in PRIORIDADE_OPTIONS" :key="p.value" :value="p.value">{{ p.label }}</option>
                  </select>
                  <ChevronDown :size="18" class="select-icon" />
                </div>
              </div>
            </div>

            <div class="form-group">
              <label class="form-label" for="editar-descricao">Descrição Detalhada</label>
              <textarea id="editar-descricao" v-model="form.descricao" class="form-textarea" rows="4" :disabled="ticketStore.loading" />
            </div>

            <Transition name="fade">
              <div v-if="form.status === 'Concluído' || form.status === 'Fechado'" class="form-group">
                <label class="form-label" for="editar-comentario">
                  Comentário de Resolução
                  <span class="form-label__hint">(opcional)</span>
                </label>
                <textarea
                  id="editar-comentario"
                  v-model="form.comentario"
                  class="form-textarea"
                  rows="3"
                  placeholder="Descreva como o problema foi resolvido..."
                  :disabled="ticketStore.loading"
                />
              </div>
            </Transition>

            <p v-if="errorMessage" class="error-msg">
              <AlertCircle :size="16" />
              {{ errorMessage }}
            </p>

          </div>

          <div class="modal__footer">
            <button class="btn btn--cancel" :disabled="ticketStore.loading" @click="handleClose">Cancelar</button>
            <button class="btn btn--submit" :disabled="ticketStore.loading" @click="handleSubmit">
              <Loader2 v-if="ticketStore.loading" :size="16" class="spin" />
              <Save v-else :size="16" />
              {{ ticketStore.loading ? 'Salvando...' : 'Salvar Alterações' }}
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
  background: rgba(26,28,28,0.4); backdrop-filter: blur(8px); padding: 1rem;
}
.modal {
  background: #ffffff; width: 100%; max-width: 38rem;
  border-radius: 1rem; box-shadow: 0 24px 64px rgba(0,0,0,0.18);
  display: flex; flex-direction: column; max-height: 90vh; overflow: hidden;
}
.modal__header {
  display: flex; justify-content: space-between; align-items: flex-start;
  padding: 2rem 2rem 1rem; border-bottom: 1px solid rgba(190,202,185,0.15);
}
.modal__title {
  font-family: 'Public Sans', sans-serif; font-size: 1.5rem;
  font-weight: 800; color: #1a1c1c; letter-spacing: -0.02em;
}
.modal__subtitle { font-size: 0.875rem; color: #3f4a3c; margin-top: 0.25rem; }
.modal__close-btn {
  padding: 0.25rem; border-radius: 9999px; border: none;
  background: transparent; cursor: pointer; color: #3f4a3c; display: flex; transition: background 0.15s;
}
.modal__close-btn:hover { background: #e8e8e8; }
.modal__close-btn:disabled { opacity: 0.5; cursor: not-allowed; }
.modal__body {
  padding: 1.5rem 2rem; overflow-y: auto;
  display: flex; flex-direction: column; gap: 1.25rem;
}
.form-group { display: flex; flex-direction: column; gap: 0.5rem; }
.form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
.form-label {
  font-size: 0.625rem; font-weight: 700; text-transform: uppercase;
  letter-spacing: 0.1em; color: #3f4a3c; padding-left: 0.25rem;
  display: flex; gap: 0.375rem; align-items: center;
}
.form-label__hint { font-weight: 400; text-transform: none; letter-spacing: 0; font-size: 0.7rem; color: #6f7a6b; }
.form-input, .form-select, .form-textarea {
  width: 100%; background: #e8e8e8; border: none; border-radius: 0.75rem;
  padding: 0.75rem 1rem; font-size: 0.875rem; color: #1a1c1c;
  font-family: 'Inter', sans-serif; outline: none; transition: box-shadow 0.2s;
}
.form-input:focus, .form-select:focus, .form-textarea:focus { box-shadow: 0 0 0 2px #006b1f; }
.form-input:disabled, .form-select:disabled, .form-textarea:disabled { opacity: 0.6; cursor: not-allowed; }
.form-textarea { resize: vertical; }
.select-wrapper { position: relative; }
.form-select { appearance: none; cursor: pointer; }
.select-icon { position: absolute; right: 1rem; top: 50%; transform: translateY(-50%); pointer-events: none; color: #3f4a3c; }
.error-msg { display: flex; align-items: center; gap: 0.375rem; font-size: 0.8rem; color: #ba1a1a; font-weight: 500; }
.modal__footer {
  padding: 1rem 2rem 2rem; display: flex; gap: 0.75rem;
  border-top: 1px solid rgba(190,202,185,0.15);
}
.btn {
  padding: 0.75rem 1.5rem; border-radius: 0.75rem; font-size: 0.875rem; font-weight: 700;
  cursor: pointer; display: flex; align-items: center; justify-content: center;
  gap: 0.5rem; border: none; transition: opacity 0.2s, transform 0.1s;
}
.btn:disabled { opacity: 0.6; cursor: not-allowed; }
.btn:active:not(:disabled) { transform: scale(0.97); }
.btn--cancel { background: transparent; color: #3f4a3c; }
.btn--cancel:hover:not(:disabled) { background: #e8e8e8; }
.btn--submit {
  flex: 1; background: linear-gradient(135deg, #006b1f, #0b872b);
  color: #ffffff; box-shadow: 0 4px 16px rgba(0,107,31,0.2);
}
.btn--submit:hover:not(:disabled) { opacity: 0.92; }
.modal-enter-active, .modal-leave-active { transition: opacity 0.2s ease; }
.modal-enter-from, .modal-leave-to { opacity: 0; }
.fade-enter-active, .fade-leave-active { transition: opacity 0.2s, transform 0.2s; }
.fade-enter-from, .fade-leave-to { opacity: 0; transform: translateY(-6px); }
@keyframes spin { to { transform: rotate(360deg); } }
.spin { animation: spin 0.8s linear infinite; }
</style>
