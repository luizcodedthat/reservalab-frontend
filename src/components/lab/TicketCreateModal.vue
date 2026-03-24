<script setup>
import { ref, onMounted } from "vue";
import { useAuthStore } from "@/stores/useAuthStore";
import { useTicketStore } from "@/stores/useTicketStore";

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  labId: { type: String, required: true }
});
const emit = defineEmits(["update:modelValue", "save"]);

const auth = useAuthStore();
const ticketStore = useTicketStore();

const titulo = ref("");
const descricao = ref("");
const prioridade = ref("MEDIUM");
const dataAtual = ref("");
const loading = ref(false);

onMounted(() => {
  const hoje = new Date().toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric"
  });
  dataAtual.value = hoje;
});

function fechar() {
  emit("update:modelValue", false);
  titulo.value = "";
  descricao.value = "";
  prioridade.value = "MEDIUM";
}

async function salvar() {
  if (!titulo.value.trim() || !descricao.value.trim()) {
    alert("Preencha título e descrição.");
    return;
  }

  loading.value = true;

  const payload = {
    authorId: 1,
    labId: props.labId,
    titulo: titulo.value.trim(),
    descricao: descricao.value.trim(),
    prioridade: prioridade.value,
    status: "Aberto",
    createdAt: Date.now()
  };

  try {
    const novoChamado = await ticketStore.addTicket(payload);
    emit("save", novoChamado);
    fechar();
  } catch (err) {
    console.error("Erro ao criar chamado:", err);
    alert("Erro ao criar chamado.");
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <div v-if="modelValue" class="modal-overlay">
    <div class="modal">
      <div class="modal-header">
        <h2>Novo Chamado</h2>
        <button class="btn-close" @click="fechar">✕</button>
      </div>

      <hr class="divider" />

      <div class="info-block">
        <div class="info-item">
          <label>Data do Chamado</label>
          <p>{{ dataAtual }}</p>
        </div>
      </div>

      <div class="field">
        <label class="field-label">Título</label>
        <input v-model="titulo" class="select" type="text" placeholder="Digite o título do chamado">
      </div>

      <div class="field">
        <label class="field-label">Descrição</label>
        <textarea v-model="descricao" class="textarea" rows="4" placeholder="Descreva brevemente o problema"></textarea>
      </div>

      <div class="field">
        <label class="field-label">Prioridade</label>
        <select v-model="prioridade" class="select">
          <option value="LOW">Baixa</option>
          <option value="MEDIUM">Média</option>
          <option value="HIGH">Alta</option>
          <option value="URGENT">Urgente</option>
        </select>
      </div>

      <div class="modal-footer">
        <button class="btn-cancel" @click="fechar">Cancelar</button>
        <button class="btn-save" @click="salvar" :disabled="loading">
          {{ loading ? 'Salvando...' : 'Salvar' }}
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
  z-index: 1000;
}

.modal {
  width: 100%;
  max-width: 520px;
  background: #ffffff;
  border-radius: 14px;
  box-shadow: 0px 6px 24px rgba(0, 0, 0, 0.12);
  padding: 22px 26px;
  animation: fadeIn 0.25s ease;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.modal-header h2 {
  font-size: 1.35rem;
  font-weight: 700;
  color: #111827;
}

.btn-close {
  background: transparent;
  border: none;
  color: #6b7280;
  cursor: pointer;
  font-size: 20px;
  padding: 4px;
  border-radius: 50%;
  transition: 0.2s;
}
.btn-close:hover {
  background: #f3f4f6;
}

.divider {
  border-top: 1px solid #e5e7eb;
  margin: 14px 0 18px;
  color: transparent;
}

.info-block {
  margin-bottom: 22px;
}

.info-item label {
  font-weight: 600;
  color: #111;
}

.field {
  margin-bottom: 14px;
}

.field-label {
  display: block;
  margin-bottom: 4px;
  font-size: 0.9rem;
  font-weight: 600;
  color: #111827;
}

.select,
.textarea {
  width: 100%;
  border-radius: 8px;
  border: 1px solid #cbd5e1;
  padding: 10px;
  background: #fff;
  font-size: 0.92rem;
  transition: 0.2s;
}

.select:focus,
.textarea:focus {
  border-color: #2563eb;
  box-shadow: 0px 0px 0px 2px rgba(37, 99, 235, 0.25);
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

.btn-cancel {
  background: #f3f4f6;
  border: 1px solid #d1d5db;
  padding: 8px 16px;
  border-radius: 8px;
  cursor: pointer;
}
.btn-cancel:hover {
  background: #e5e7eb;
}

.btn-save {
  background: var(--color-primary, #2563eb);
  color: white;
  padding: 8px 16px;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
}
.btn-save:hover {
  background: #1e40af;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
