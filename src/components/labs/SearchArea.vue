<script setup>
import { ref } from 'vue'
import { Search, SlidersHorizontal } from 'lucide-vue-next'

const emit = defineEmits(['update:search', 'update:status'])

const searchQuery    = ref('')
const showFilters    = ref(false)
const selectedStatus = ref([])

const ALL_STATUS = [
  { value: 'AVAILABLE',   label: 'Disponível'  },
  { value: 'OCCUPIED',    label: 'Ocupado'     },
  { value: 'MAINTENANCE', label: 'Manutenção'  },
]

function toggleStatus(value) {
  const idx = selectedStatus.value.indexOf(value)
  if (idx === -1) selectedStatus.value.push(value)
  else selectedStatus.value.splice(idx, 1)
}

function applyFilters() {
  emit('update:status', [...selectedStatus.value])
  showFilters.value = false
}

function onSearch() {
  emit('update:search', searchQuery.value)
}
</script>

<template>
  <section class="controls-bar">
    <div class="search-wrapper">
      <Search :size="18" class="search-icon" />
      <input
        v-model="searchQuery"
        class="search-input"
        type="text"
        placeholder="Buscar laboratório pelo nome ou ID..."
        @input="onSearch"
      />
    </div>

    <div class="filter-container">
      <button
        class="filter-btn"
        :class="{ 'filter-btn--active': showFilters }"
        @click="showFilters = !showFilters"
      >
        <SlidersHorizontal :color="showFilters ? '#fff' : '#000000'" :size="18" />
        Filtros
      </button>

      <Transition name="dropdown">
        <div v-if="showFilters" class="filter-dropdown">
          <p class="filter-dropdown__title">Status</p>
          <label v-for="s in ALL_STATUS" :key="s.value" class="filter-option">
            <input
              type="checkbox"
              :value="s.value"
              :checked="selectedStatus.includes(s.value)"
              class="filter-checkbox"
              @change="toggleStatus(s.value)"
            />
            {{ s.label }}
          </label>
          <button class="filter-apply-btn" @click="applyFilters">Aplicar Filtros</button>
        </div>
      </Transition>
    </div>
  </section>
</template>

<style scoped>
.controls-bar {
  background: #f3f3f4; padding: 1.5rem; border-radius: 0.75rem;
  display: flex; flex-direction: column; gap: 1rem;
}
@media (min-width: 768px) {
  .controls-bar { flex-direction: row; align-items: center; }
}
.search-wrapper { position: relative; flex: 1; }
.search-icon {
  position: absolute; left: 1rem; top: 50%;
  transform: translateY(-50%); color: #6f7a6b; pointer-events: none;
}
.search-input {
  width: 100%; padding: 0.75rem 1rem 0.75rem 3rem;
  background: #ffffff; border: none; border-radius: 0.5rem;
  box-shadow: 0 0 0 1px rgba(190,202,185,0.3);
  font-size: 0.875rem; color: #1a1c1c; outline: none;
  font-family: 'Inter', sans-serif; transition: box-shadow 0.2s;
}
.search-input:focus { box-shadow: 0 0 0 2px #006b1f; }
.filter-container { position: relative; }
.filter-btn {
  display: flex; align-items: center; gap: 0.5rem;
  padding: 0.75rem 1.5rem; background: #ffffff; border: none;
  border-radius: 0.5rem; font-size: 0.875rem; font-weight: 600;
  color: #1a1c1c; cursor: pointer;
  box-shadow: 0 0 0 1px rgba(190,202,185,0.3); transition: background 0.15s;
}
.filter-btn:hover { background: #e2e2e2; }
.filter-btn--active { background: #006b1f; color: #ffffff; }
.filter-btn--active:hover { background: #005316; }
.filter-dropdown {
  position: absolute; right: 0; top: calc(100% + 0.5rem);
  width: 16rem; background: #ffffff; border-radius: 0.75rem;
  box-shadow: 0 16px 48px rgba(0,0,0,0.12);
  border: 1px solid rgba(190,202,185,0.15);
  padding: 1.5rem; z-index: 50;
}
.filter-dropdown__title {
  font-size: 0.75rem; font-weight: 700; text-transform: uppercase;
  letter-spacing: 0.1em; color: #1a1c1c; margin-bottom: 0.75rem;
}
.filter-option {
  display: flex; align-items: center; gap: 0.75rem;
  font-size: 0.875rem; color: #3f4a3c; padding: 0.375rem 0; cursor: pointer;
}
.filter-option:hover { color: #006b1f; }
.filter-checkbox { accent-color: #006b1f; width: 1rem; height: 1rem; cursor: pointer; }
.filter-apply-btn {
  width: 100%; margin-top: 1rem; padding: 0.625rem;
  background: #006b1f; color: #ffffff; border: none;
  border-radius: 0.375rem; font-size: 0.75rem; font-weight: 700;
  text-transform: uppercase; letter-spacing: 0.05em; cursor: pointer;
}
.filter-apply-btn:hover { background: #005316; }
.dropdown-enter-active, .dropdown-leave-active { transition: opacity 0.15s, transform 0.15s; }
.dropdown-enter-from, .dropdown-leave-to { opacity: 0; transform: translateY(-4px); }
</style>
