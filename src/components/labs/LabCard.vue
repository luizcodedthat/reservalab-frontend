<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { Users, MapPin } from 'lucide-vue-next'

const props = defineProps({
  lab: { type: Object, required: true }
})

const router = useRouter()

// Ajuste os valores conforme o enum do seu backend
const STATUS_CONFIG = {
  AVAILABLE:   { label: 'Disponível',  badgeClass: 'badge--available' },
  OCCUPIED:    { label: 'Ocupado',     badgeClass: 'badge--occupied'  },
  MAINTENANCE: { label: 'Manutenção',  badgeClass: 'badge--maintenance' },
  // aliases pt-BR caso venham assim
  DISPONIVEL:  { label: 'Disponível',  badgeClass: 'badge--available' },
  OCUPADO:     { label: 'Ocupado',     badgeClass: 'badge--occupied'  },
  MANUTENCAO:  { label: 'Manutenção',  badgeClass: 'badge--maintenance' },
}

const statusInfo = computed(() =>
  STATUS_CONFIG[props.lab.status] ?? STATUS_CONFIG.AVAILABLE
)

// Localização: tenta building+floor, senão location, senão vazio
const locationText = computed(() => {
  const lab = props.lab
  if (lab.building && lab.floor != null) return `Bloco ${lab.building} - Piso ${lab.floor}`
  return lab.location ?? lab.building ?? ''
})

// Capacidade: tenta capacity, senão computerCount
const capacityText = computed(() => {
  const lab = props.lab
  if (lab.capacity) return `${lab.capacity} Alunos`
  if (lab.computerCount) return `${lab.computerCount} Computadores`
  return '—'
})

function goToDetail() {
  router.push({ name: 'Laboratorio', params: { id: props.lab.id } })
}
</script>

<template>
  <article class="lab-card" @click="goToDetail">
    <!-- Imagem + badge de categoria -->
    <div class="lab-card__image-wrap">
      <img
        v-if="lab.imageUrl"
        :src="lab.imageUrl"
        :alt="lab.name"
        class="lab-card__image"
      />
      <div v-else class="lab-card__image-placeholder" />
      <span v-if="lab.category" class="lab-card__category-badge">
        {{ lab.category }}
      </span>
    </div>

    <!-- Corpo -->
    <div class="lab-card__body">
      <div class="lab-card__header">
        <div>
          <p class="lab-card__code">{{ lab.code }}</p>
          <h3 class="lab-card__name">{{ lab.name }}</h3>
        </div>
        <span class="lab-card__status" :class="statusInfo.badgeClass">
          <span class="lab-card__status-dot" />
          {{ statusInfo.label }}
        </span>
      </div>

      <div class="lab-card__meta">
        <div class="lab-card__meta-item">
          <Users :size="16" class="lab-card__meta-icon" />
          <div>
            <p class="lab-card__meta-label">Capacidade</p>
            <p class="lab-card__meta-value">{{ capacityText }}</p>
          </div>
        </div>
        <div class="lab-card__meta-item">
          <MapPin :size="16" class="lab-card__meta-icon" />
          <div>
            <p class="lab-card__meta-label">Localização</p>
            <p class="lab-card__meta-value">{{ locationText || '—' }}</p>
          </div>
        </div>
      </div>

      <button class="lab-card__btn">Ver Detalhes</button>
    </div>
  </article>
</template>

<style scoped>
.lab-card {
  background: #ffffff;
  border-radius: 0.75rem;
  overflow: hidden;
  box-shadow: 0 1px 4px rgba(0,0,0,0.06);
  cursor: pointer;
  transition: box-shadow 0.2s;
}
.lab-card:hover { box-shadow: 0 4px 20px rgba(0,0,0,0.1); }
.lab-card:hover .lab-card__image { transform: scale(1.05); }

/* Image */
.lab-card__image-wrap {
  height: 12rem;
  overflow: hidden;
  position: relative;
}
.lab-card__image {
  width: 100%; height: 100%;
  object-fit: cover;
  transition: transform 0.5s ease;
}
.lab-card__image-placeholder {
  width: 100%; height: 100%;
  background: linear-gradient(135deg, #e8e8e8, #d0d0d0);
}
.lab-card__category-badge {
  position: absolute;
  top: 1rem; left: 1rem;
  background: rgba(0, 107, 31, 0.9);
  color: #ffffff;
  font-size: 0.75rem;
  font-weight: 700;
  padding: 0.25rem 0.75rem;
  border-radius: 9999px;
  letter-spacing: 0.02em;
}

/* Body */
.lab-card__body { padding: 1.5rem; }
.lab-card__header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 0.5rem;
}
.lab-card__code {
  font-size: 0.625rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.15em;
  color: #3f4a3c;
  margin-bottom: 0.25rem;
}
.lab-card__name {
  font-family: 'Public Sans', sans-serif;
  font-size: 1.25rem;
  font-weight: 700;
  color: #1a1c1c;
}
.lab-card__status {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  font-size: 0.625rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  padding: 0.25rem 0.625rem;
  border-radius: 0.375rem;
  white-space: nowrap;
}
.lab-card__status-dot {
  width: 0.5rem; height: 0.5rem;
  border-radius: 9999px;
}
.badge--available   { background: #8dfa8f; color: #005316; }
.badge--available .lab-card__status-dot   { background: #0b872b; }
.badge--occupied    { background: #ffdad6; color: #93000d; }
.badge--occupied .lab-card__status-dot    { background: #ba1a1a; }
.badge--maintenance { background: #fef3c7; color: #92400e; }
.badge--maintenance .lab-card__status-dot { background: #d97706; }

/* Meta */
.lab-card__meta {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
  margin: 1.5rem 0;
}
.lab-card__meta-item { display: flex; align-items: center; gap: 0.5rem; }
.lab-card__meta-icon { color: #6f7a6b; flex-shrink: 0; }
.lab-card__meta-label {
  font-size: 0.5625rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: #6f7a6b;
}
.lab-card__meta-value {
  font-size: 0.875rem;
  font-weight: 600;
  color: #1a1c1c;
}

/* Button */
.lab-card__btn {
  width: 100%;
  padding: 0.75rem;
  background: linear-gradient(135deg, #006b1f, #0b872b);
  color: #ffffff;
  border: none;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  font-weight: 700;
  cursor: pointer;
  letter-spacing: 0.02em;
  transition: opacity 0.15s, transform 0.1s;
}
.lab-card__btn:hover { opacity: 0.92; }
.lab-card__btn:active { transform: scale(0.98); }
</style>
