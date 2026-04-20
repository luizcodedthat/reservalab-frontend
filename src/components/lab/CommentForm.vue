<script setup>
import { ref } from 'vue'
import { Send, Loader2 } from 'lucide-vue-next'
import { useCommentStore } from '@/stores/useCommentStore'
import { useAuthStore } from '@/stores/useAuthStore'

const props = defineProps({
  labId: { type: [String, Number], required: true }
})

const emit = defineEmits(['submitted'])

const commentStore = useCommentStore()
const authStore    = useAuthStore()

const newComment = ref('')
const isSending  = ref(false)

async function handleSubmit() {
  const content = newComment.value.trim()
  if (!content) return

  isSending.value = true
  try {
    await commentStore.addComment({
      content,
      authorId:     authStore.user?.id ?? 1,
      authorName:   authStore.user?.name ?? '',
      laboratoryId: Number(props.labId)
    })
    newComment.value = ''
    emit('submitted')
  } catch (err) {
    console.error('Erro ao enviar comentário:', err)
  } finally {
    isSending.value = false
  }
}
</script>

<template>
  <div class="comment-form">
    <h3 class="comment-form__title">Deixe seu comentário</h3>
    <textarea
      v-model="newComment"
      class="comment-form__textarea"
      placeholder="Escreva aqui sua experiência ou dúvida..."
      :disabled="isSending"
    />
    <div class="comment-form__footer">
      <button
        class="btn-send"
        :disabled="isSending || !newComment.trim()"
        @click="handleSubmit"
      >
        <Loader2 v-if="isSending" :size="16" class="spin" />
        <Send color="#fff" v-else :size="16" />
        {{ isSending ? 'Enviando...' : 'Enviar Comentário' }}
      </button>
    </div>
  </div>
</template>

<style scoped>
.comment-form {
  background: rgba(232,232,232,0.3);
  padding: 2rem; border-radius: 0.75rem;
}
.comment-form__title {
  font-family: 'Public Sans', sans-serif;
  font-size: 1rem; font-weight: 700; color: #1a1c1c; margin-bottom: 1rem;
}
.comment-form__textarea {
  width: 100%; min-height: 8rem; background: #e8e8e8;
  border: none; border-radius: 0.5rem; padding: 1rem;
  font-family: 'Inter', sans-serif; font-size: 0.875rem;
  color: #1a1c1c; resize: vertical; outline: none; transition: box-shadow 0.2s;
}
.comment-form__textarea::placeholder { color: rgba(63,74,60,0.5); }
.comment-form__textarea:focus { box-shadow: 0 0 0 2px #006b1f; }
.comment-form__textarea:disabled { opacity: 0.6; }
.comment-form__footer { display: flex; justify-content: flex-end; margin-top: 1rem; }
.btn-send {
  padding: 0.75rem 1.5rem; border-radius: 0.5rem;
  font-size: 0.875rem; font-weight: 700; cursor: pointer; border: none;
  display: inline-flex; align-items: center; gap: 0.5rem;
  background: linear-gradient(135deg, #006b1f, #0b872b);
  color: #ffffff; box-shadow: 0 4px 12px rgba(0,107,31,0.2);
  transition: opacity 0.15s, transform 0.1s;
}
.btn-send:disabled { opacity: 0.6; cursor: not-allowed; }
.btn-send:active:not(:disabled) { transform: scale(0.97); }
@keyframes spin { to { transform: rotate(360deg); } }
.spin { animation: spin 0.8s linear infinite; }
</style>
