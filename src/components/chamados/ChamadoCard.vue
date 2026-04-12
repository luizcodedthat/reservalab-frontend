<script setup>
import { computed } from 'vue'
import {
  FlaskConical, User, Wrench, UserCheck, Eye, Info
} from 'lucide-vue-next'

const props = defineProps({
  ticket: { type: Object, required: true },
  labsMap: { type: Object, default: () => ({}) }
})

const emit = defineEmits(['view', 'attend'])

const STATUS_CONFIG = {
  'Aberto':       { badgeClass: 'badge--open',        ActionIcon: Wrench,    actionLabel: 'Atender chamado', isFinished: false },
  'Em andamento': { badgeClass: 'badge--in-progress',  ActionIcon: UserCheck, actionLabel: 'Atender chamado', isFinished: false },
  'Concluído':    { badgeClass: 'badge--concluded',    ActionIcon: Eye,       actionLabel: 'Ver informações', isFinished: true  },
  'Fechado':      { badgeClass: 'badge--closed',       ActionIcon: Info,      actionLabel: 'Ver informações', isFinished: true  },
}

const statusConfig = computed(() =>
  STATUS_CONFIG[props.ticket.status] ?? STATUS_CONFIG['Aberto']
)

const labName = computed(() => {
  const id = props.ticket.labId
  if (!id) return ''
  return props.labsMap[id] ?? id.replace('lab', 'LAB-').toUpperCase()
})
</script>

<template>
  <pre>{{ ticket }}</pre>
  <div class="chamado-card" :class="{ 'chamado-card--finished': statusConfig.isFinished }">

    <div class="chamado-card__header">
      <span class="chamado-card__date">{{ ticket.data }}</span>
      <span class="chamado-card__badge" :class="statusConfig.badgeClass">
        {{ ticket.status }}
      </span>
    </div>

    <div class="chamado-card__body">
      <div v-if="labName" class="chamado-card__lab">
        <FlaskConical :size="14" class="chamado-card__lab-icon" />
        <span class="chamado-card__lab-name">{{ labName }}</span>
      </div>
      <h3 class="chamado-card__title">{{ ticket.titulo }}</h3>
      <p class="chamado-card__description">{{ ticket.descricao }}</p>
    </div>

    <div class="chamado-card__footer">
      <div class="chamado-card__author">
        <div class="chamado-card__avatar">
          <User :size="16" />
        </div>
        <span class="chamado-card__author-name">{{ ticket.authorId ?? '—' }}</span>
      </div>

      <button
        v-if="!statusConfig.isFinished"
        class="btn btn--primary"
        @click="emit('attend', ticket)"
      >
        <component :is="statusConfig.ActionIcon" :size="16" />
        {{ statusConfig.actionLabel }}
      </button>

      <button v-else class="btn btn--outlined" @click="emit('view', ticket)">
        <component :is="statusConfig.ActionIcon" :size="16" />
        {{ statusConfig.actionLabel }}
      </button>
    </div>

  </div>
</template>

<style scoped>
.chamado-card {
  background: #ffffff;
  padding: 1.5rem;
  border-radius: 0.5rem;
  border: 1px solid rgba(190, 202, 185, 0.15);
  box-shadow: 0 1px 3px rgba(0,0,0,0.06);
  display: flex;
  flex-direction: column;
  height: 100%;
  transition: box-shadow 0.2s;
}
.chamado-card:hover { box-shadow: 0 4px 16px rgba(0,0,0,0.1); }
.chamado-card--finished { opacity: 0.75; transition: opacity 0.2s; }
.chamado-card--finished:hover { opacity: 1; }

.chamado-card__header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1rem;
}
.chamado-card__date {
  font-size: 0.625rem;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: #3f4a3c;
}
.chamado-card__badge {
  font-size: 0.625rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  padding: 0.2rem 0.625rem;
  border-radius: 0.25rem;
}
.badge--open        { background: #ffdad6; color: #93000d; }
.badge--in-progress { background: #fef3c7; color: #92400e; }
.badge--concluded   { background: #8dfa8f; color: #005316; }
.badge--closed      { background: #e2e2e2; color: #3f4a3c; }

.chamado-card__body { margin-bottom: 1rem; }
.chamado-card__lab { display: flex; align-items: center; gap: 0.375rem; margin-bottom: 0.25rem; }
.chamado-card__lab-icon { color: #006b1f; }
.chamado-card__lab-name { font-size: 0.75rem; font-weight: 700; color: #006b1f; }
.chamado-card__title {
  font-family: 'Public Sans', sans-serif;
  font-size: 1.125rem;
  font-weight: 700;
  color: #1a1c1c;
  line-height: 1.3;
  margin-top: 0.25rem;
}
.chamado-card__description {
  font-size: 0.875rem;
  color: #3f4a3c;
  margin-top: 0.5rem;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.chamado-card__footer {
  margin-top: auto;
  padding-top: 1.5rem;
  border-top: 1px solid rgba(226,226,226,0.5);
  display: flex;
  flex-direction: column;
  gap: 1rem;
}
.chamado-card__author { display: flex; align-items: center; gap: 0.75rem; }
.chamado-card__avatar {
  width: 2rem;
  height: 2rem;
  border-radius: 9999px;
  background: #e8e8e8;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #3f4a3c;
}
.chamado-card__author-name { font-size: 0.75rem; font-weight: 500; color: #1a1c1c; }

.btn {
  width: 100%;
  padding: 0.625rem;
  border-radius: 0.25rem;
  font-size: 0.875rem;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  cursor: pointer;
  transition: background 0.15s, transform 0.1s;
  border: none;
}
.btn:active { transform: scale(0.97); }
.btn--primary { background: #006b1f; color: #ffffff; }
.btn--primary:hover { background: #005316; }
.btn--outlined { background: transparent; color: #3f4a3c; border: 1px solid #becab9; }
.btn--outlined:hover { background: #f3f3f4; }
</style>
