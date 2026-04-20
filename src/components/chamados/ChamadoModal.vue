<script setup>
import { ref, watch } from 'vue'
import { useTicketStore } from '@/stores/useTicketStore'
import { useAuthStore } from '@/stores/useAuthStore'
import {
  X, ChevronDown, CloudUpload, CheckCircle2,
  AlertCircle, Ticket, Loader2
} from 'lucide-vue-next'

const props = defineProps({
  isOpen: { type: Boolean, default: false },
  labs:   { type: Array, default: () => [] }
})

const emit = defineEmits(['close', 'submitted'])

const ticketStore = useTicketStore()
const authStore   = useAuthStore()

const form = ref({
  titulo:    '',
  labId:     '',
  descricao: '',
  attachment: null
})

const errorMessage = ref('')
const isDragging   = ref(false)

watch(() => props.isOpen, (val) => {
  if (!val) resetForm()
})

function resetForm() {
  form.value = { titulo: '', labId: '', descricao: '', attachment: null }
  errorMessage.value = ''
  isDragging.value   = false
}

function handleClose() {
  if (!ticketStore.loading) emit('close')
}

function onFileChange(event) {
  const file = event.target.files[0]
  if (file) form.value.attachment = file
}

function onDrop(event) {
  isDragging.value = false
  const file = event.dataTransfer.files[0]
  if (file) form.value.attachment = file
}

async function handleSubmit() {
  errorMessage.value = ''

  if (!form.value.titulo.trim()) {
    errorMessage.value = 'O título do problema é obrigatório.'
    return
  }
  if (!form.value.labId) {
    errorMessage.value = 'Selecione o laboratório relacionado.'
    return
  }
  if (!form.value.descricao.trim()) {
    errorMessage.value = 'Descreva o problema com mais detalhes.'
    return
  }

  try {
    await ticketStore.addTicket({
      titulo:    form.value.titulo.trim(),
      descricao: form.value.descricao.trim(),
      labId:     form.value.labId,
      authorId:  authStore.user?.id ?? 1,
      status:    'Aberto',
      prioridade: 'MEDIUM'
    })

    emit('submitted')
    emit('close')
  } catch (err) {
    console.error('Erro ao criar chamado:', err)
    errorMessage.value = err.message ?? 'Não foi possível abrir o chamado. Tente novamente.'
  }
}
</script>

<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="isOpen" class="modal-overlay" @click.self="handleClose">
        <div class="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title">

          <div class="modal__header">
            <div>
              <h2 id="modal-title" class="modal__title">Abrir Novo Chamado</h2>
              <p class="modal__subtitle">Preencha os dados abaixo para solicitar suporte técnico.</p>
            </div>
            <button class="modal__close-btn" :disabled="ticketStore.loading" @click="handleClose" aria-label="Fechar modal">
              <X :size="20" />
            </button>
          </div>

          <div class="modal__body">

            <div class="form-group">
              <label class="form-label" for="ticket-titulo">Título do Problema</label>
              <input
                id="ticket-titulo"
                v-model="form.titulo"
                class="form-input"
                type="text"
                placeholder="Ex: Ar condicionado barulhento"
                :disabled="ticketStore.loading"
              />
            </div>

            <div class="form-group">
              <label class="form-label" for="ticket-lab">Laboratório Relacionado</label>
              <div class="select-wrapper">
                <select
                  id="ticket-lab"
                  v-model="form.labId"
                  class="form-select"
                  :disabled="ticketStore.loading"
                >
                  <option value="" disabled>Selecione o laboratório</option>
                  <option v-for="lab in labs" :key="lab.id" :value="lab.id">
                    {{ lab.nome }}
                  </option>
                </select>
                <ChevronDown :size="18" class="select-icon" />
              </div>
            </div>

            <div class="form-group">
              <label class="form-label" for="ticket-descricao">Descrição Detalhada do Problema</label>
              <textarea
                id="ticket-descricao"
                v-model="form.descricao"
                class="form-textarea"
                placeholder="Descreva o problema com o máximo de detalhes possível..."
                rows="4"
                :disabled="ticketStore.loading"
              />
            </div>

            <div class="form-group">
              <label class="form-label">Anexar Evidências (Fotos ou Prints)</label>
              <div
                class="dropzone"
                :class="{ 'dropzone--dragging': isDragging, 'dropzone--has-file': form.attachment }"
                @dragover.prevent="isDragging = true"
                @dragleave.prevent="isDragging = false"
                @drop.prevent="onDrop"
                @click="$refs.fileInput.click()"
              >
                <input
                  ref="fileInput"
                  type="file"
                  accept="image/png,image/jpeg,application/pdf"
                  class="dropzone__input"
                  @change="onFileChange"
                />

                <div v-if="!form.attachment" class="dropzone__placeholder">
                  <div class="dropzone__icon-wrap">
                    <CloudUpload :size="24" />
                  </div>
                  <p class="dropzone__text">Clique para enviar ou arraste e solte</p>
                  <p class="dropzone__hint">PNG, JPG ou PDF (Máx. 10MB)</p>
                </div>

                <div v-else class="dropzone__file">
                  <CheckCircle2 :size="20" style="color: #006b1f;" />
                  <span class="dropzone__filename">{{ form.attachment.name }}</span>
                  <button class="dropzone__remove" @click.stop="form.attachment = null" aria-label="Remover arquivo">
                    <X :size="16" />
                  </button>
                </div>
              </div>
            </div>

            <p v-if="errorMessage" class="error-msg">
              <AlertCircle :size="16" />
              {{ errorMessage }}
            </p>

          </div>

          <div class="modal__footer">
            <button class="btn btn--cancel" :disabled="ticketStore.loading" @click="handleClose">
              Cancelar
            </button>
            <button class="btn btn--submit" :disabled="ticketStore.loading" @click="handleSubmit">
              <Loader2 v-if="ticketStore.loading" :size="16" class="spin" />
              <Ticket color="#fff" v-else :size="16" />
              {{ ticketStore.loading ? 'Abrindo...' : 'Abrir Chamado' }}
            </button>
          </div>

        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(26,28,28,0.4);
  backdrop-filter: blur(8px);
  padding: 1rem;
}
.modal {
  background: #ffffff;
  width: 100%;
  max-width: 36rem;
  border-radius: 1rem;
  box-shadow: 0 24px 64px rgba(0,0,0,0.18);
  display: flex;
  flex-direction: column;
  max-height: 90vh;
  overflow: hidden;
}
.modal__header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 2rem 2rem 1rem;
}
.modal__title {
  font-family: 'Public Sans', sans-serif;
  font-size: 1.5rem;
  font-weight: 800;
  color: #1a1c1c;
  letter-spacing: -0.02em;
}
.modal__subtitle { font-size: 0.875rem; color: #3f4a3c; margin-top: 0.25rem; }
.modal__close-btn {
  padding: 0.25rem;
  border-radius: 9999px;
  border: none;
  background: transparent;
  cursor: pointer;
  color: #3f4a3c;
  display: flex;
  transition: background 0.15s;
}
.modal__close-btn:hover { background: #e8e8e8; }
.modal__close-btn:disabled { opacity: 0.5; cursor: not-allowed; }
.modal__body {
  padding: 1rem 2rem;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}
.form-group { display: flex; flex-direction: column; gap: 0.5rem; }
.form-label {
  font-size: 0.625rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: #3f4a3c;
  padding-left: 0.25rem;
}
.form-input, .form-select, .form-textarea {
  width: 100%;
  background: #e8e8e8;
  border: none;
  border-radius: 0.75rem;
  padding: 0.75rem 1rem;
  font-size: 0.875rem;
  color: #1a1c1c;
  font-family: 'Inter', sans-serif;
  outline: none;
  transition: box-shadow 0.2s;
}
.form-input::placeholder, .form-textarea::placeholder { color: #9ca3af; }
.form-input:focus, .form-select:focus, .form-textarea:focus { box-shadow: 0 0 0 2px #006b1f; }
.form-input:disabled, .form-select:disabled, .form-textarea:disabled { opacity: 0.6; cursor: not-allowed; }
.form-textarea { resize: none; }
.select-wrapper { position: relative; }
.form-select { appearance: none; cursor: pointer; }
.select-icon {
  position: absolute;
  right: 1rem;
  top: 50%;
  transform: translateY(-50%);
  pointer-events: none;
  color: #3f4a3c;
}
.dropzone {
  border: 2px dashed rgba(190,202,185,0.5);
  border-radius: 1rem;
  padding: 2rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: rgba(243,243,244,0.5);
  cursor: pointer;
  transition: background 0.2s, border-color 0.2s;
}
.dropzone:hover, .dropzone--dragging { background: #f3f3f4; border-color: #006b1f; }
.dropzone__input { display: none; }
.dropzone__icon-wrap {
  width: 3rem;
  height: 3rem;
  background: rgba(0,107,31,0.1);
  color: #006b1f;
  border-radius: 9999px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 0.75rem;
  transition: transform 0.2s;
}
.dropzone:hover .dropzone__icon-wrap { transform: scale(1.1); }
.dropzone__text { font-weight: 700; color: #1a1c1c; font-size: 0.875rem; }
.dropzone__hint { font-size: 0.75rem; color: #3f4a3c; margin-top: 0.25rem; }
.dropzone__file { display: flex; align-items: center; gap: 0.75rem; }
.dropzone__filename {
  font-size: 0.875rem;
  font-weight: 500;
  color: #1a1c1c;
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.dropzone__remove {
  border: none;
  background: transparent;
  cursor: pointer;
  color: #3f4a3c;
  display: flex;
  padding: 0.25rem;
  border-radius: 9999px;
  transition: background 0.15s;
}
.dropzone__remove:hover { background: #e8e8e8; }
.error-msg {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  font-size: 0.8rem;
  color: #ba1a1a;
  font-weight: 500;
}
.modal__footer {
  padding: 1rem 2rem 2rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}
@media (min-width: 480px) { .modal__footer { flex-direction: row; } }
.btn {
  padding: 0.75rem 1.5rem;
  border-radius: 0.75rem;
  font-size: 0.875rem;
  font-weight: 700;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  border: none;
  transition: opacity 0.2s, transform 0.1s;
}
.btn:disabled { opacity: 0.6; cursor: not-allowed; }
.btn:active:not(:disabled) { transform: scale(0.97); }
.btn--cancel { background: transparent; color: #3f4a3c; }
.btn--cancel:hover:not(:disabled) { background: #e8e8e8; }
.btn--submit {
  flex: 1;
  background: linear-gradient(135deg, #006b1f, #0b872b);
  color: #ffffff;
  box-shadow: 0 4px 16px rgba(0,107,31,0.2);
}
.btn--submit:hover:not(:disabled) { opacity: 0.92; }
.modal-enter-active, .modal-leave-active { transition: opacity 0.2s ease; }
.modal-enter-from, .modal-leave-to { opacity: 0; }
@keyframes spin { to { transform: rotate(360deg); } }
.spin { animation: spin 0.8s linear infinite; }
</style>
