<script setup>
import { computed, onMounted } from 'vue'
import { useLaboratoryCommentStore } from '@/stores/useLaboratoryCommentStore'
import CommentCard from '@/components/lab/CommentCard.vue'
import CommentForm from '@/components/lab/CommentForm.vue'

const props = defineProps({
  labId: { type: [String, Number], required: true }
})

const commentStore = useLaboratoryCommentStore()

const comments = computed(() =>
  commentStore.getCommentsByLaboratory(props.labId)
)

const isLoading = computed(() => commentStore.isLoading)
const error = computed(() => commentStore.error)

async function handleSubmitted() {
  await commentStore.loadComments(props.labId, true)
}

onMounted(() => {
  commentStore.loadComments(props.labId)
})
</script>

<template>
  <section class="comments-section">
    <h2 class="section-title">Comentários e Feedbacks</h2>

    <p v-if="error" class="error">{{ error }}</p>

    <p v-if="isLoading && comments.length === 0">
      Carregando comentários...
    </p>

    <div v-if="comments.length > 0" class="comments-list">
      <CommentCard
        v-for="comment in comments"
        :key="comment.id"
        :comment="comment"
      />
    </div>

    <p v-else-if="!isLoading">
      Nenhum comentário ainda.
    </p>

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
