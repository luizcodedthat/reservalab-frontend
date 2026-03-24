<script setup>
import { ref, computed, onMounted } from 'vue';
import LabCardList from '@/components/labs/LabCardList.vue';
import SearchArea from '@/components/labs/SearchArea.vue';
import Navbar from '@/components/Navbar.vue';
import { useLabStore } from '@/stores/useLabStore';

const filter = ref('')
const labStore = useLabStore()

onMounted(async () => {
  await labStore.loadLabs()
})


const filteredLabs = computed(() => {
  return labStore.labs?.filter(
    (lab) => lab.matchesSearch(filter.value)
  ) || []
})
</script>

<template>
  <div>
    <Navbar />
  </div>
  <div id="content">

    <SearchArea v-model="filter" />
    <LabCardList :labList="filteredLabs" />
  </div>
</template>

<style scoped>
#content {
  display: flex;
  flex-direction: column;
  gap: 40px;
}
</style>
