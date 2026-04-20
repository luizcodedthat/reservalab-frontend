<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useTicketStore } from '@/stores/useTicketStore'
import { useCommentStore } from '@/stores/useCommentStore'
import { useAuthStore } from '@/stores/useAuthStore'
import { useLabStore } from '@/stores/useLabStore'
import Navbar from '@/components/Navbar.vue'
import ChamadoEditarModal from '@/components/chamados/ChamadoEditarModal.vue'
import {
  Loader2, ArrowLeft, User, CheckSquare, ThumbsUp, ThumbsDown,
  Paperclip, Image, Send, FilePen, XCircle, ChevronRight,
  SearchX
} from 'lucide-vue-next'

const router       = useRouter()
const route        = useRoute()
const ticketStore  = useTicketStore()
const commentStore = useCommentStore()
const authStore    = useAuthStore()
const labStore     = useLabStore()

const ticketId = computed(() => route.params.id)

const isEditModalOpen  = ref(false)
const newComment       = ref('')
const isSendingComment = ref(false)
const isClosing        = ref(false)

const labsForModal = computed(() =>
  (labStore.labs ?? []).map(lab => ({
    id:   lab.id,
    nome: lab.nome ?? lab.name ?? lab.id
  }))
)

const ticket = computed(() => ticketStore.ticketById[ticketId.value] ?? null)

const comments = computed(() =>
  commentStore.commentsByTicket?.[ticketId.value] ?? []
)

const STATUS_CONFIG = {
  'Aberto':       { badgeClass: 'badge--open',        label: 'Em Aberto'    },
  'Em andamento': { badgeClass: 'badge--in-progress',  label: 'Em Andamento' },
  'Concluído':    { badgeClass: 'badge--concluded',    label: 'Concluído'    },
  'Fechado':      { badgeClass: 'badge--closed',       label: 'Fechado'      },
}

const statusInfo = computed(() =>
  ticket.value ? (STATUS_CONFIG[ticket.value.status] ?? STATUS_CONFIG['Aberto']) : STATUS_CONFIG['Aberto']
)

const isActive = computed(() =>
  ticket.value && !['Concluído', 'Fechado'].includes(ticket.value.status)
)

const formattedDate = computed(() => ticket.value?.data ?? '')

function formatTimeAgo(timestamp) {
  if (!timestamp) return ''
  const diff = Math.floor((Date.now() - timestamp) / 60000)
  if (diff < 1)    return 'agora mesmo'
  if (diff < 60)   return `há ${diff} min`
  if (diff < 1440) return `há ${Math.floor(diff / 60)} hora${Math.floor(diff / 60) > 1 ? 's' : ''}`
  return `há ${Math.floor(diff / 1440)} dia${Math.floor(diff / 1440) > 1 ? 's' : ''}`
}

async function fetchData() {
  await ticketStore.loadTicketById(ticketId.value)
  await commentStore.loadComments(ticketId.value)
}

async function handleSendComment() {
  const content = newComment.value.trim()
  if (!content) return

  isSendingComment.value = true
  try {
    await commentStore.addComment(ticketId.value, {
      content,
      authorId:   authStore.user?.id ?? 1,
      authorName: authStore.user?.name ?? ''
    })
    newComment.value = ''
  } catch (err) {
    console.error('Erro ao enviar comentário:', err)
  } finally {
    isSendingComment.value = false
  }
}

async function handleCloseTicket() {
  if (!confirm('Tem certeza que deseja fechar este chamado?')) return
  isClosing.value = true
  try {
    await ticketStore.updateTicket(ticketId.value, { status: 'Fechado' })
  } catch (err) {
    console.error('Erro ao fechar chamado:', err)
  } finally {
    isClosing.value = false
  }
}

function handleEdit() { isEditModalOpen.value = true }

async function handleTicketUpdated() {
  await ticketStore.loadTicketById(ticketId.value, true)
}

function goBack() { router.push({ name: 'Chamados' }) }

onMounted(async () => {
  await Promise.all([
    fetchData(),
    labStore.loadLabs?.()
  ])
})
</script>

<template>
  <div class="page">
    <navbar />
    <main class="page__content">

      <div v-if="ticketStore.loading && !ticket" class="state-loading">
        <Loader2 :size="32" class="spin" />
        <span>Carregando chamado...</span>
      </div>

      <template v-else-if="ticket">

        <button class="back-btn" @click="goBack">
          <ArrowLeft :size="16" />
          Voltar para Chamados
        </button>

        <div class="layout">

          <!-- Coluna principal -->
          <div class="layout__main">

            <section class="card">
              <div class="ticket-meta">
                <span class="badge" :class="statusInfo.badgeClass">{{ statusInfo.label }}</span>
                <span class="ticket-id">ID #{{ ticket.id }}</span>
              </div>

              <h1 class="ticket-title">{{ ticket.titulo }}</h1>

              <div class="ticket-info-row">
                <div class="ticket-author">
                  <div class="avatar"><User :size="18" /></div>
                  <div>
                    <p class="ticket-author__name">{{ ticket.authorId ?? 'Usuário' }}</p>
                    <p class="ticket-author__role">Autor</p>
                  </div>
                </div>

                <div class="divider-v" />

                <div>
                  <p class="info-label">Data de Criação</p>
                  <p class="info-value">{{ formattedDate }}</p>
                </div>

                <div class="divider-v" />

                <div>
                  <p class="info-label">Laboratório</p>
                  <p class="info-value">{{ ticket.labId?.replace('lab', 'LAB-').toUpperCase() ?? '—' }}</p>
                </div>
              </div>

              <div class="ticket-description">
                <p>{{ ticket.descricao }}</p>
              </div>

              <div v-if="ticket.comentario" class="resolution-note">
                <CheckSquare :size="18" style="color: #006b1f; margin-top: 0.125rem;" />
                <div>
                  <p class="info-label" style="margin-bottom: 0.25rem;">Resolução</p>
                  <p>{{ ticket.comentario }}</p>
                </div>
              </div>
            </section>

            <!-- Comentários -->
            <section class="card">
              <h2 class="section-title">
                Seção de Comentários
                <span class="comment-count">({{ comments.length }})</span>
              </h2>

              <div v-if="comments.length > 0" class="comments-list">
                <div v-for="comment in comments" :key="comment.id" class="comment">
                  <div class="comment__avatar"><User :size="18" /></div>
                  <div class="comment__body">
                    <div class="comment__header">
                      <div class="comment__author-info">
                        <span class="comment__author">{{ comment.authorName ?? 'Usuário' }}</span>
                        <span v-if="comment.authorRole" class="comment__role-badge">{{ comment.authorRole }}</span>
                      </div>
                      <span class="comment__time">{{ formatTimeAgo(comment.createdAt) }}</span>
                    </div>
                    <p class="comment__text">{{ comment.content }}</p>
                    <div class="comment__actions">
                      <div class="vote-group">
                        <button class="vote-btn"><ThumbsUp :size="16" /></button>
                        <span class="vote-count">{{ comment.likes ?? 0 }}</span>
                        <button class="vote-btn"><ThumbsDown :size="16" /></button>
                      </div>
                      <button class="reply-btn">Responder</button>
                    </div>
                  </div>
                </div>
              </div>

              <p v-else class="no-comments">Nenhum comentário ainda. Seja o primeiro a comentar.</p>

              <div class="comment-form">
                <h3 class="comment-form__title">Adicionar um comentário</h3>
                <textarea
                  v-model="newComment"
                  class="comment-form__textarea"
                  placeholder="Descreva sua atualização ou solução aqui..."
                  :disabled="isSendingComment"
                />
                <div class="comment-form__footer">
                  <div class="comment-form__tools">
                    <button class="icon-btn" title="Anexar arquivo"><Paperclip :size="18" /></button>
                    <button class="icon-btn" title="Anexar imagem"><Image :size="18" /></button>
                  </div>
                  <button
                    class="btn btn--send"
                    :disabled="isSendingComment || !newComment.trim()"
                    @click="handleSendComment"
                  >
                    <Loader2 v-if="isSendingComment" :size="16" class="spin" />
                    <Send color="#fff" v-else :size="16" />
                    {{ isSendingComment ? 'Enviando...' : 'Enviar' }}
                  </button>
                </div>
              </div>
            </section>
          </div>

          <!-- Sidebar -->
          <aside class="layout__sidebar">

            <div class="card card--compact">
              <h3 class="sidebar-title">Ações do Chamado</h3>
              <div class="actions-list">
                <button class="action-btn" @click="handleEdit">
                  <div class="action-btn__left">
                    <FilePen :size="18" style="color:#006b1f;" />
                    <span>Editar Detalhes</span>
                  </div>
                  <ChevronRight :size="16" class="action-btn__arrow" />
                </button>

                <button v-if="isActive" class="action-btn" :disabled="isClosing" @click="handleCloseTicket">
                  <div class="action-btn__left">
                    <XCircle :size="18" style="color:#ba1a1a;" />
                    <span>{{ isClosing ? 'Fechando...' : 'Fechar Chamado' }}</span>
                  </div>
                  <ChevronRight :size="16" class="action-btn__arrow" />
                </button>
              </div>
            </div>

            <div class="card card--no-padding">
              <div class="lab-banner">
                <div class="lab-banner__overlay" />
                <span class="lab-banner__name">
                  {{ ticket.labId?.replace('lab', 'LAB-').toUpperCase() ?? '—' }}
                </span>
              </div>
              <div class="lab-info">
                <button class="btn btn--outlined-primary">Ver Laboratório</button>
              </div>
            </div>

            <div class="card card--compact">
              <h3 class="sidebar-title">Histórico Recente</h3>
              <div class="history-list">
                <template v-if="ticket.history?.length">
                  <div
                    v-for="(entry, i) in ticket.history"
                    :key="i"
                    class="history-item"
                    :class="{ 'history-item--last': i === ticket.history.length - 1 }"
                  >
                    <div class="history-item__dot" :class="i === 0 ? 'dot--active' : 'dot--inactive'" />
                    <div>
                      <p class="history-item__event">{{ entry.event }}</p>
                      <p class="history-item__meta">{{ formatTimeAgo(entry.createdAt) }} • {{ entry.authorName }}</p>
                    </div>
                  </div>
                </template>
                <template v-else>
                  <div class="history-item history-item--last">
                    <div class="history-item__dot dot--inactive" />
                    <div>
                      <p class="history-item__event">Chamado Criado</p>
                      <p class="history-item__meta">{{ formattedDate }}</p>
                    </div>
                  </div>
                </template>
              </div>
            </div>

          </aside>
        </div>
      </template>

      <div v-else class="state-loading">
        <SearchX :size="40" style="color:#becab9;" />
        <p>Chamado não encontrado.</p>
        <button class="btn btn--outlined-primary" style="margin-top:1rem;" @click="goBack">
          Voltar para a lista
        </button>
      </div>

    </main>

    <ChamadoEditarModal
      :is-open="isEditModalOpen"
      :ticket="ticket"
      :labs="labsForModal"
      @close="isEditModalOpen = false"
      @updated="handleTicketUpdated"
    />
  </div>
</template>

<style scoped>
.page { min-height: 100vh; background: #f9f9f9; }
.page__content {
  padding: 6rem 1.5rem 3rem;
  max-width: 80rem;
  margin: 0 auto;
  width: 100%;
}
.back-btn {
  display: inline-flex; align-items: center; gap: 0.375rem;
  background: none; border: none; cursor: pointer; color: #3f4a3c;
  font-size: 0.875rem; font-weight: 500; margin-bottom: 2rem;
  padding: 0.25rem; border-radius: 0.25rem; transition: color 0.15s;
}
.back-btn:hover { color: #006b1f; }
.layout { display: grid; grid-template-columns: 1fr; gap: 2rem; }
@media (min-width: 1024px) { .layout { grid-template-columns: 1fr 22rem; } }
.layout__main { display: flex; flex-direction: column; gap: 2rem; }
.layout__sidebar { display: flex; flex-direction: column; gap: 1.5rem; }
.card {
  background: #ffffff; border-radius: 0.75rem; padding: 2rem;
  box-shadow: 0 12px 32px rgba(0,0,0,0.04); border: 1px solid rgba(190,202,185,0.1);
}
.card--compact { padding: 1.5rem; }
.card--no-padding { padding: 0; overflow: hidden; }
.ticket-meta { display: flex; align-items: center; justify-content: space-between; margin-bottom: 1rem; }
.badge {
  display: inline-flex; align-items: center; padding: 0.25rem 0.75rem;
  border-radius: 9999px; font-size: 0.75rem; font-weight: 600;
  text-transform: uppercase; letter-spacing: 0.05em;
}
.badge--open        { background: #ffdad6; color: #93000d; }
.badge--in-progress { background: #fef3c7; color: #92400e; }
.badge--concluded   { background: #8dfa8f; color: #005316; }
.badge--closed      { background: #e2e2e2; color: #3f4a3c; }
.ticket-id { font-size: 0.875rem; color: #3f4a3c; }
.ticket-title {
  font-family: 'Public Sans', sans-serif; font-size: 1.875rem; font-weight: 800;
  color: #1a1c1c; letter-spacing: -0.02em; line-height: 1.2; margin-bottom: 1.5rem;
}
.ticket-info-row {
  display: flex; flex-wrap: wrap; align-items: center; gap: 1.5rem;
  padding: 1rem 0; border-top: 1px solid rgba(190,202,185,0.2);
  border-bottom: 1px solid rgba(190,202,185,0.2); margin-bottom: 1.5rem;
}
.ticket-author { display: flex; align-items: center; gap: 0.75rem; }
.avatar {
  width: 2.5rem; height: 2.5rem; border-radius: 9999px; background: #e8e8e8;
  display: flex; align-items: center; justify-content: center; color: #3f4a3c;
}
.ticket-author__name { font-size: 0.875rem; font-weight: 600; color: #1a1c1c; }
.ticket-author__role { font-size: 0.75rem; color: #3f4a3c; }
.divider-v { width: 1px; height: 2rem; background: rgba(190,202,185,0.25); }
.info-label { font-size: 0.625rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; color: #3f4a3c; }
.info-value { font-size: 0.875rem; font-weight: 500; color: #1a1c1c; margin-top: 0.125rem; }
.ticket-description { color: #3f4a3c; line-height: 1.75; font-size: 1.0625rem; }
.resolution-note {
  display: flex; align-items: flex-start; gap: 0.75rem; margin-top: 1.5rem;
  padding: 1rem; background: #f3f3f4; border-radius: 0.5rem;
  font-size: 0.875rem; color: #3f4a3c;
}
.section-title {
  font-family: 'Public Sans', sans-serif; font-size: 1.25rem; font-weight: 700;
  color: #1a1c1c; margin-bottom: 1.5rem;
}
.comment-count { color: #3f4a3c; font-weight: 400; }
.comments-list { display: flex; flex-direction: column; gap: 1.5rem; margin-bottom: 2rem; }
.comment {
  display: flex; gap: 1rem; background: #f9f9f9; border-radius: 0.75rem; padding: 1.25rem;
}
.comment__avatar {
  width: 2.5rem; height: 2.5rem; border-radius: 9999px; background: #e8e8e8;
  display: flex; align-items: center; justify-content: center; flex-shrink: 0; color: #3f4a3c;
}
.comment__body { flex: 1; }
.comment__header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.5rem; }
.comment__author-info { display: flex; align-items: center; gap: 0.5rem; }
.comment__author { font-weight: 700; color: #1a1c1c; font-size: 0.9375rem; }
.comment__role-badge {
  font-size: 0.625rem; font-weight: 700; text-transform: uppercase;
  background: #ffdad6; color: #410002; padding: 0.125rem 0.5rem; border-radius: 9999px;
}
.comment__time { font-size: 0.75rem; color: #3f4a3c; }
.comment__text { color: #3f4a3c; line-height: 1.6; font-size: 0.9375rem; }
.comment__actions { display: flex; align-items: center; gap: 1rem; margin-top: 0.75rem; }
.vote-group {
  display: flex; align-items: center; gap: 0.25rem;
  background: #eeeeee; border-radius: 0.5rem; padding: 0.25rem;
}
.vote-btn {
  background: none; border: none; cursor: pointer; padding: 0.25rem;
  color: #3f4a3c; display: flex; border-radius: 0.25rem; transition: color 0.15s;
}
.vote-btn:hover { color: #006b1f; }
.vote-count { font-size: 0.75rem; font-weight: 700; color: #1a1c1c; padding: 0 0.25rem; }
.reply-btn {
  background: none; border: none; cursor: pointer;
  font-size: 0.75rem; font-weight: 600; color: #006b1f;
}
.reply-btn:hover { text-decoration: underline; }
.no-comments { color: #6f7a6b; font-size: 0.875rem; margin-bottom: 1.5rem; }
.comment-form { border-top: 1px solid rgba(190,202,185,0.2); padding-top: 1.5rem; }
.comment-form__title { font-size: 1rem; font-weight: 700; color: #1a1c1c; margin-bottom: 0.75rem; }
.comment-form__textarea {
  width: 100%; min-height: 7.5rem; background: #e8e8e8; border: none;
  border-radius: 0.75rem; padding: 1rem; font-family: 'Inter', sans-serif;
  font-size: 0.875rem; color: #1a1c1c; resize: vertical; outline: none; transition: box-shadow 0.2s;
}
.comment-form__textarea::placeholder { color: rgba(63,74,60,0.5); }
.comment-form__textarea:focus { box-shadow: 0 0 0 2px #006b1f; }
.comment-form__footer { display: flex; justify-content: space-between; align-items: center; margin-top: 0.75rem; }
.comment-form__tools { display: flex; gap: 0.25rem; }
.icon-btn {
  background: none; border: none; cursor: pointer; padding: 0.5rem;
  color: #3f4a3c; border-radius: 0.5rem; display: flex; transition: background 0.15s;
}
.icon-btn:hover { background: #e8e8e8; }
.sidebar-title {
  font-size: 0.6875rem; font-weight: 700; text-transform: uppercase;
  letter-spacing: 0.1em; color: #3f4a3c; margin-bottom: 1rem;
}
.actions-list { display: flex; flex-direction: column; gap: 0.75rem; }
.action-btn {
  width: 100%; display: flex; align-items: center; justify-content: space-between;
  padding: 1rem; background: #f3f3f4; border: none; border-radius: 0.5rem;
  cursor: pointer; transition: background 0.15s;
}
.action-btn:hover { background: #eeeeee; }
.action-btn:disabled { opacity: 0.6; cursor: not-allowed; }
.action-btn__left { display: flex; align-items: center; gap: 0.75rem; font-size: 0.9375rem; font-weight: 600; color: #1a1c1c; }
.action-btn__arrow { color: #3f4a3c; opacity: 0; transition: opacity 0.15s; }
.action-btn:hover .action-btn__arrow { opacity: 1; }
.lab-banner {
  position: relative; height: 8rem;
  background: linear-gradient(135deg, #006b1f, #0b872b);
  display: flex; align-items: flex-end; padding: 1rem;
}
.lab-banner__overlay { position: absolute; inset: 0; background: linear-gradient(to top, rgba(0,0,0,0.4), transparent); }
.lab-banner__name { position: relative; color: #ffffff; font-weight: 700; font-size: 0.9375rem; z-index: 1; }
.lab-info { padding: 1.5rem; }
.history-list { display: flex; flex-direction: column; gap: 1rem; }
.history-item { display: flex; gap: 0.75rem; position: relative; }
.history-item:not(.history-item--last)::after {
  content: ''; position: absolute; left: 5px; top: 14px; bottom: -1rem;
  width: 1px; background: rgba(190,202,185,0.4);
}
.history-item__dot { width: 0.75rem; height: 0.75rem; border-radius: 9999px; margin-top: 0.125rem; flex-shrink: 0; z-index: 1; }
.dot--active   { background: #006b1f; }
.dot--inactive { background: #becab9; }
.history-item__event { font-size: 0.75rem; font-weight: 700; color: #1a1c1c; }
.history-item__meta  { font-size: 0.625rem; color: #3f4a3c; margin-top: 0.125rem; }
.btn {
  padding: 0.625rem 1.5rem; border-radius: 0.75rem; font-size: 0.875rem; font-weight: 700;
  cursor: pointer; border: none; display: inline-flex; align-items: center;
  gap: 0.5rem; transition: opacity 0.15s, transform 0.1s;
}
.btn:disabled { opacity: 0.6; cursor: not-allowed; }
.btn:active:not(:disabled) { transform: scale(0.97); }
.btn--send {
  background: linear-gradient(135deg, #006b1f, #0b872b);
  color: #ffffff; box-shadow: 0 4px 16px rgba(0,107,31,0.2);
}
.btn--outlined-primary {
  width: 100%; justify-content: center; background: transparent;
  color: #006b1f; border: 1px solid rgba(0,107,31,0.25);
}
.btn--outlined-primary:hover { background: rgba(0,107,31,0.05); }
.state-loading {
  display: flex; flex-direction: column; align-items: center;
  justify-content: center; gap: 0.75rem; padding: 8rem 1rem; color: #3f4a3c;
}
@keyframes spin { to { transform: rotate(360deg); } }
.spin { animation: spin 0.8s linear infinite; }
</style>
