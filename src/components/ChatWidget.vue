<script setup>
import { ref, nextTick, watch } from 'vue'
import { MessageCircle, X, Send, Trash2, Bot } from 'lucide-vue-next'
import { useChatStore } from '@/stores/useChatStore'

const store      = useChatStore()
const input      = ref('')
const messagesEl = ref(null)

watch(
  () => store.messages.length,
  async () => {
    await nextTick()
    if (messagesEl.value) {
      messagesEl.value.scrollTop = messagesEl.value.scrollHeight
    }
  }
)

async function submit() {
  const text = input.value.trim()
  if (!text || store.loading) return
  input.value = ''
  await store.send(text)
}

function onKeydown(e) {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault()
    submit()
  }
}
</script>

<template>
  <!-- Botão flutuante -->
  <button
    class="chat-fab"
    :class="{ 'chat-fab--open': store.open }"
    @click="store.toggleOpen"
    aria-label="Abrir assistente"
  >
    <X v-if="store.open" :size="22" />
    <MessageCircle v-else :size="22" color="#fff" />
  </button>

  <!-- Painel -->
  <Transition name="chat">
    <div v-if="store.open" class="chat-panel">
      <!-- Header -->
      <div class="chat-header">
        <Bot :size="18" color="#fff" />
        <span style="color: #fff;">Assistente ReservaLab</span>
        <button class="chat-clear" title="Limpar conversa" @click="store.reset">
          <Trash2 :size="15" color="#ef4444"  />
        </button>
      </div>

      <!-- Mensagens -->
      <div ref="messagesEl" class="chat-messages">
        <div v-if="store.messages.length === 0" class="chat-empty">
          Olá! Como posso ajudar com as reservas de laboratório?
        </div>

        <div
          v-for="(msg, i) in store.messages"
          :key="i"
          class="chat-bubble"
          :class="`chat-bubble--${msg.role}`"
        >
          {{ msg.content }}
        </div>

        <div v-if="store.loading" class="chat-bubble chat-bubble--assistant chat-bubble--loading">
          <span class="dot" /><span class="dot" /><span class="dot" />
        </div>

        <div v-if="store.error" class="chat-error">{{ store.error }}</div>
      </div>

      <!-- Input -->
      <div class="chat-input-row">
        <textarea
          v-model="input"
          rows="1"
          placeholder="Digite sua mensagem..."
          :disabled="store.loading"
          @keydown="onKeydown"
        />
        <button :disabled="store.loading || !input.trim()" @click="submit">
          <Send :size="16" />
        </button>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.chat-fab {
  position: fixed;
  right: 24px;
  z-index: 1000;
  top: 50%;
  transform: translateY(-50%);
  transition:
    top 0.35s cubic-bezier(0.4, 0, 0.2, 1),
    transform 0.35s cubic-bezier(0.4, 0, 0.2, 1),
    background 0.2s;
  width: 52px;
  height: 52px;
  border-radius: 50%;
  background: linear-gradient(135deg, #006b1f, #0b872b);
  color: #fff;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 14px rgba(11, 135, 43, 0.4);
}

.chat-fab--open {
  top: calc(100vh - 76px);
  transform: translateY(0);
  background: #64748b;
}

.chat-fab:hover { background: linear-gradient(135deg, #005518, #0a7526); }
.chat-fab--open:hover { background: #475569; }

.chat-panel {
  position: fixed;
  bottom: 88px;
  right: 24px;
  z-index: 999;
  width: 360px;
  max-height: 520px;
  display: flex;
  flex-direction: column;
  background: #fff;
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
  overflow: hidden;
}

.chat-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 14px 16px;
  background: linear-gradient(135deg, #006b1f, #0b872b);
  color: #fff;
  font-weight: 600;
  font-size: 14px;
}
.chat-clear {
  margin-left: auto;
  background: none;
  border: none;
  color: rgba(255, 255, 255, 0.7);
  cursor: pointer;
  display: flex;
  align-items: center;
}
.chat-clear:hover { color: #fff; }

.chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.chat-empty {
  text-align: center;
  color: #94a3b8;
  font-size: 13px;
  padding: 24px 0;
}
.chat-bubble {
  max-width: 80%;
  padding: 10px 13px;
  border-radius: 14px;
  font-size: 13.5px;
  line-height: 1.5;
  white-space: pre-wrap;
  word-break: break-word;
}
.chat-bubble--user {
  background: linear-gradient(135deg, #006b1f, #0b872b);
  color: #fff;
  align-self: flex-end;
  border-bottom-right-radius: 4px;
}
.chat-bubble--assistant {
  background: #f1f5f9;
  color: #1e293b;
  align-self: flex-start;
  border-bottom-left-radius: 4px;
}
.chat-bubble--loading {
  display: flex;
  gap: 4px;
  align-items: center;
  padding: 12px 16px;
}
.dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #94a3b8;
  animation: bounce 1.2s infinite;
}
.dot:nth-child(2) { animation-delay: 0.2s; }
.dot:nth-child(3) { animation-delay: 0.4s; }
@keyframes bounce {
  0%, 80%, 100% { transform: translateY(0); }
  40%           { transform: translateY(-6px); }
}
.chat-error {
  font-size: 12px;
  color: #ef4444;
  text-align: center;
  padding: 4px 0;
}

.chat-input-row {
  display: flex;
  gap: 8px;
  padding: 12px;
  border-top: 1px solid #e2e8f0;
}
.chat-input-row textarea {
  flex: 1;
  resize: none;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  padding: 8px 12px;
  font-size: 13.5px;
  font-family: inherit;
  outline: none;
  line-height: 1.4;
  transition: border-color 0.2s;
}
.chat-input-row textarea:focus { border-color: #0b872b; }
.chat-input-row button {
  width: 38px;
  height: 38px;
  border-radius: 10px;
  background: linear-gradient(135deg, #006b1f, #0b872b);
  color: #fff;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  align-self: flex-end;
  transition: opacity 0.2s;
}
.chat-input-row button:hover:not(:disabled) { opacity: 0.88; }
.chat-input-row button:disabled { background: #cbd5e1; cursor: not-allowed; }

.chat-enter-active,
.chat-leave-active { transition: all 0.25s ease; }
.chat-enter-from,
.chat-leave-to { opacity: 0; transform: translateY(12px) scale(0.97); }
</style>