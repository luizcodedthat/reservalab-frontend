<script setup>
import { computed, onMounted } from 'vue'
import { useCommentStore } from '@/stores/useCommentStore'
import CommentCard from '@/components/lab/CommentCard.vue'
import CommentForm from '@/components/lab/CommentForm.vue'

const props = defineProps({
  labId: { type: [String, Number], required: true }
})

const commentStore = useCommentStore()

const labKey = computed(() => `lab${props.labId}`)

const comments = computed(() =>
  commentStore.commentsByLab?.[labKey.value] ?? []
)

async function handleSubmitted() {
  await commentStore.loadComments(labKey.value)
}

onMounted(() => commentStore.loadComments(labKey.value))
</script>

<template>
  <section class="comments-section">
    <h2 class="section-title">Comentários e Feedbacks</h2>

    <div v-if="comments.length > 0" class="comments-list">
      <CommentCard
        v-for="comment in comments"
        :key="comment.id"
        :comment="comment"
      />
    </div>

    <CommentForm :lab-id="labId" @submitted="handleSubmitted" />
  </section>
</template>

<style scoped>
.comments-section { display: flex; flex-direction: column; gap: 1.5rem; }
.section-title {
  font-family: 'Public Sans', sans-serif;
  font-size: 1.25rem; font-weight: 700; color: #1a1c1c;
}
.comments-list { display: flex; flex-direction: column; gap: 2rem; }
</style>
