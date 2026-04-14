<script setup>
import { Tag, Users, MapPin, CalendarDays } from 'lucide-vue-next'

defineProps({
  lab: { type: Object, required: true }
})

const emit = defineEmits(['open-reservation'])
</script>

<template>
  <aside class="sidebar">

    <!-- Detalhes Técnicos -->
    <div class="card">
      <h2 class="card__title">Detalhes Técnicos</h2>

      <div class="details-list">
        <div class="detail-item">
          <div class="detail-item__icon"><Tag :size="18" /></div>
          <div>
            <span class="detail-item__label">Categoria</span>
            <span class="detail-item__value">{{ lab.category ?? '—' }}</span>
          </div>
        </div>

        <div class="detail-item">
          <div class="detail-item__icon"><Users :size="18" /></div>
          <div>
            <span class="detail-item__label">Capacidade</span>
            <span class="detail-item__value">
              {{ lab.computerCount ? `${lab.computerCount} computadores / ` : '' }}{{ lab.capacity ?? '—' }} lugares
            </span>
          </div>
        </div>

        <div class="detail-item">
          <div class="detail-item__icon"><MapPin :size="18" /></div>
          <div>
            <span class="detail-item__label">Localização</span>
            <span class="detail-item__value">
              {{ lab.floor != null ? `${lab.floor} Andar` : '' }}{{ lab.building ? `, ${lab.building}` : '' }}
            </span>
          </div>
        </div>
      </div>

      <div v-if="lab.equipment?.length" class="equipment-section">
        <p class="equipment-section__title">Equipamentos Disponíveis</p>
        <div class="equipment-list">
          <span v-for="eq in lab.equipment" :key="eq" class="equipment-tag">
            {{ eq }}
          </span>
        </div>
      </div>
    </div>

    <!-- CTA Reserva -->
    <div class="cta-card">
      <h3 class="cta-card__title">Precisa reservar?</h3>
      <p class="cta-card__text">
        Verifique a disponibilidade completa no calendário e faça sua solicitação em poucos cliques.
      </p>
      <button class="cta-card__btn" @click="emit('open-reservation')">
        <CalendarDays :size="18" />
        ABRIR CALENDÁRIO
      </button>
    </div>

  </aside>
</template>

<style scoped>
.sidebar { display: flex; flex-direction: column; gap: 2rem; }

.card {
  background: #ffffff; border-radius: 0.75rem; padding: 2rem;
  box-shadow: 0 1px 8px rgba(0,0,0,0.06);
  border: 1px solid rgba(190,202,185,0.1);
}
.card__title {
  font-family: 'Public Sans', sans-serif;
  font-size: 1.25rem; font-weight: 700; color: #1a1c1c; margin-bottom: 2rem;
}
.details-list { display: flex; flex-direction: column; gap: 2rem; }
.detail-item  { display: flex; align-items: flex-start; gap: 1rem; }
.detail-item__icon {
  width: 2.5rem; height: 2.5rem; flex-shrink: 0;
  background: rgba(0,107,31,0.08); border-radius: 0.5rem;
  display: flex; align-items: center; justify-content: center; color: #006b1f;
}
.detail-item__label {
  display: block; font-size: 0.625rem; font-weight: 700;
  text-transform: uppercase; letter-spacing: 0.1em; color: #3f4a3c;
}
.detail-item__value {
  display: block; font-size: 1.0625rem; font-weight: 700;
  color: #1a1c1c; margin-top: 0.25rem;
}

.equipment-section {
  margin-top: 2rem; padding-top: 2rem;
  border-top: 1px solid rgba(190,202,185,0.15);
}
.equipment-section__title {
  font-size: 0.625rem; font-weight: 700; text-transform: uppercase;
  letter-spacing: 0.1em; color: #3f4a3c; margin-bottom: 0.75rem;
}
.equipment-list { display: flex; flex-wrap: wrap; gap: 0.5rem; }
.equipment-tag {
  background: #eeeeee; color: #3f4a3c;
  font-size: 0.75rem; font-weight: 700;
  padding: 0.25rem 0.75rem; border-radius: 9999px;
}

.cta-card {
  background: #2f3131; border-radius: 0.75rem; padding: 2rem;
  box-shadow: 0 8px 24px rgba(0,0,0,0.15);
}
.cta-card__title {
  font-family: 'Public Sans', sans-serif;
  font-size: 1.125rem; font-weight: 700; color: #f0f1f1; margin-bottom: 1rem;
}
.cta-card__text {
  font-size: 0.875rem; color: rgba(240,241,241,0.8);
  line-height: 1.6; margin-bottom: 1.5rem;
}
.cta-card__btn {
  width: 100%; padding: 1rem;
  background: #006b1f; color: #ffffff; border: none;
  border-radius: 0.5rem; font-weight: 900; font-size: 0.875rem;
  letter-spacing: 0.05em; cursor: pointer;
  display: flex; align-items: center; justify-content: center; gap: 0.5rem;
  transition: background 0.15s;
}
.cta-card__btn:hover { background: #0b872b; }
</style>
