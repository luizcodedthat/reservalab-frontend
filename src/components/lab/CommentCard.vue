<script setup>
import { ThumbsUp, ThumbsDown, User } from 'lucide-vue-next'
import { useLaboratoryCommentStore } from '@/stores/useLaboratoryCommentStore'

const props = defineProps({
  comment: { type: Object, required: true },
  labId: { type: Number, required: true }
})

const commentStore = useLaboratoryCommentStore()

function formatTimeAgo(timestamp) {
  if (!timestamp) return ''

  const date = new Date(timestamp)
  const diff = Math.floor((Date.now() - date.getTime()) / 60000)

  if (diff < 1) return 'agora mesmo'
  if (diff < 60) return `há ${diff} min`
  if (diff < 1440) return `há ${Math.floor(diff / 60)}h`
  return `há ${Math.floor(diff / 1440)} dias`
}

async function upvote() {
  try {
    await commentStore.upvote(props.labId, props.comment.id)
  } catch (err) {
    console.error('Erro ao dar UPVOTE', err)
  }
}

async function downvote() {
  try {
    await commentStore.downvote(props.labId, props.comment.id)
  } catch (err) {
    console.error('Erro ao dar DOWNVOTE', err)
  }
}

async function removeVote() {
  try {
    await commentStore.removeVote(props.labId, props.comment.id)
  } catch (err) {
    console.error('Erro ao remover voto', err)
  }
}
</script>

<template>
  <div class="comment">
    <div class="comment__avatar">
      <User :size="18" />
    </div>

    <div class="comment__body">
      <div class="comment__header">
        <span class="comment__author">
          {{ comment.authorName || 'Usuário' }}
        </span>

        <span class="comment__time">
          {{ formatTimeAgo(comment.createdAt) }}
        </span>
      </div>

      <p class="comment__text">
        {{ comment.content }}
      </p>

      <div class="comment__actions">
        <button class="vote-btn" @click="upvote">
          <ThumbsUp :size="15" />
          {{ comment.upvotes ?? 0 }}
        </button>

        <button class="vote-btn" @click="downvote">
          <ThumbsDown :size="15" />
          {{ comment.downvotes ?? 0 }}
        </button>

        <button v-if="(comment.upvotes > 0 || comment.downvotes > 0)" class="vote-btn" @click="removeVote">
          Remover voto
        </button>
      </div>

      <small v-if="comment.editedAt" class="edited">
        editado
      </small>
    </div>
  </div>
</template>

<style scoped>
.comment {
  display: flex;
  gap: 1rem;
}

.comment__avatar {
  width: 3rem;
  height: 3rem;
  border-radius: 9999px;
  background: #e8e8e8;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  color: #3f4a3c;
  border: 2px solid #e8e8e8;
}

.comment__body {
  flex: 1;
  background: #f3f3f4;
  padding: 1.5rem;
  border-radius: 0.75rem 0.75rem 0.75rem 0;
}

.comment__header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 0.5rem;
}

.comment__author {
  font-weight: 700;
  color: #1a1c1c;
}

.comment__time {
  font-size: 0.75rem;
  color: #3f4a3c;
}

.comment__text {
  color: #3f4a3c;
  line-height: 1.6;
  margin-bottom: 1rem;
}

.comment__actions {
  display: flex;
  gap: 1rem;
}

.vote-btn {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  background: none;
  border: none;
  cursor: pointer;
  font-size: 0.875rem;
  font-weight: 700;
  color: #3f4a3c;
  transition: color 0.15s;
}

.vote-btn:hover {
  color: #006b1f;
}

.edited {
  font-size: 0.7rem;
  color: #9ca3af;
}
</style>