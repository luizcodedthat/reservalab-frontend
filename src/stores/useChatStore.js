import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { chat } from '@/services/ChatService'

export const useChatStore = defineStore('chat', () => {
  const messages = ref([])
  const loading  = ref(false)
  const error    = ref(null)
  const open     = ref(false)

  const history = computed(() =>
    messages.value.map(m => ({ role: m.role, content: m.content }))
  )

  function toggleOpen() {
    open.value = !open.value
  }

  function reset() {
    messages.value = []
    error.value    = null
  }

  async function send(text) {
    if (!text.trim() || loading.value) return

    messages.value.push({ role: 'user', content: text })
    loading.value = true
    error.value   = null

    try {
      const reply = await chat(text, history.value.slice(0, -1)) // histórico sem a msg atual
      messages.value.push({ role: 'assistant', content: reply })
    } catch (e) {
      const status = e.response?.status
      error.value = status === 429
        ? 'Limite de requisições atingido. Aguarde alguns segundos.'
        : 'Não foi possível obter resposta. Tente novamente.'
    } finally {
      loading.value = false
    }
  }

  return { messages, loading, error, open, toggleOpen, reset, send }
})