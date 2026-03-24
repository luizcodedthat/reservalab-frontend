<script setup>
import { onMounted, computed } from 'vue'
import { useRoute } from 'vue-router'
import CommentCard from './CommentCard.vue'
import { useCommentStore } from '@/stores/useCommentStore'
import { Leaf, Loader2 } from 'lucide-vue-next'

const route = useRoute()
const commentStore = useCommentStore()

const labId = computed(() => Number(route.params.id))

const labComments = computed(() => {
  const comments =
    commentStore.getCommentsByLab?.(labId.value) ||
    commentStore.commentsByLab?.[labId.value] ||
    []

  return [...comments].sort((a, b) => (b.upvotes ?? 0) - (a.upvotes ?? 0))
})

onMounted(async () => {
  await commentStore.loadComments(labId.value)
})
</script>

<template>
  <div class="cards-list">
    <CommentCard
      v-for="comment in labComments"
      :key="comment.id"
      :authorName="comment.authorName"
      :profilePicture="'https://picsum.photos/50/50?random=' + comment.id"
      :commentText="comment.content"
      :upvoteCount="comment.upvotes ?? 0"
    />
  </div>

  <div v-if="commentStore.loading || labComments.length === 0" class="loading-or-empty">
    <div class="message-box" v-if="commentStore.loading">
      <Loader2 size="48" color="#64748B" />
      <p class="not-loaded-text">Carregando comentários...</p>
    </div>

    <div class="message-box" v-else>
      <Leaf size="48" color="#64748B" />
      <p class="not-loaded-text">Seja o primeiro a comentar!</p>
    </div>
  </div>
</template>

<style scoped>
.cards-list {
  padding: 10px 0;
}

.loading-or-empty {
  margin: 20px 0;
  display: flex;
  align-items: center;
  flex-direction: column;
}

.message-box {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.message-box p {
  color: hsl(215, 19%, 35%);
}
</style>