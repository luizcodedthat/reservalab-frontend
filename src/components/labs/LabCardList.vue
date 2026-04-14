<script setup>
import { Loader2, FlaskConical } from 'lucide-vue-next'
import LabCard from '@/components/labs/LabCard.vue'

defineProps({
  labs:    { type: Array,   default: () => [] },
  loading: { type: Boolean, default: false     },
})
</script>

<template>
  <div>
    <div v-if="loading" class="state-msg">
      <Loader2 :size="28" class="spin" />
      <span>Carregando laboratórios...</span>
    </div>

    <div v-else-if="labs.length === 0" class="state-msg">
      <FlaskConical :size="40" style="color: #becab9;" />
      <p>Nenhum laboratório encontrado.</p>
    </div>

    <div v-else class="labs-grid">
      <LabCard v-for="lab in labs" :key="lab.id" :lab="lab" />
    </div>
  </div>
</template>

<style scoped>
.labs-grid {
  display: grid; grid-template-columns: 1fr; gap: 2rem;
}
@media (min-width: 640px)  { .labs-grid { grid-template-columns: repeat(2, 1fr); } }
@media (min-width: 1024px) { .labs-grid { grid-template-columns: repeat(3, 1fr); } }
.state-msg {
  display: flex; flex-direction: column; align-items: center;
  justify-content: center; gap: 0.75rem;
  padding: 5rem 1rem; color: #6f7a6b;
}
@keyframes spin { to { transform: rotate(360deg); } }
.spin { animation: spin 0.8s linear infinite; }
</style>
