<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/useAuthStore'

const router    = useRouter()
const authStore = useAuthStore()

const email    = ref('')
const password = ref('')

// Alerta
const showAlert    = ref(false)
const alertMessage = ref('')

function notify(msg) {
  alertMessage.value = msg
  showAlert.value    = true
  setTimeout(() => { showAlert.value = false }, 3500)
}

async function handleLogin() {
  try {
    await authStore.doLogin(email.value, password.value)
    router.push({ name: 'Laboratorios' })
  } catch (error) {
    console.error(error)
    notify('Email ou senha inválidos.')
  }
}

// Login Google — mantido, mas desativado até migração completa
async function handleLoginGoogle() {
  notify('Login com Google ainda não disponível nesta versão.')
}
</script>

<template>
  <!-- Alerta -->
  <transition name="fade">
    <div v-if="showAlert" class="alert-box">
      {{ alertMessage }}
    </div>
  </transition>

  <div class="login-container">
    <!-- Coluna Esquerda -->
    <div class="login-left">
      <h1 class="logo">ReservaLab</h1>
      <p class="quote">
        "A única maneira de fazer um ótimo trabalho é amar o que você faz."<br />
        <span class="span">– Steve Jobs</span>
      </p>
    </div>

    <!-- Coluna Direita -->
    <div class="login-right">
      <div class="login-box">
        <h2>Entre na conta</h2>
        <p class="subtitle">Insira email e senha abaixo para entrar em sua conta</p>

        <form class="form" @submit.prevent="handleLogin">
          <div class="input-wrapper">
            <input
              v-model="email"
              type="email"
              placeholder="Email"
              class="input-text"
              required
            />
          </div>

          <div class="input-wrapper">
            <input
              v-model="password"
              type="password"
              placeholder="Senha"
              class="input-text"
              required
            />
          </div>

          <button type="submit" class="btn-primary btn-green" :disabled="authStore.loading">
            {{ authStore.loading ? 'Entrando...' : 'Entrar' }}
          </button>
        </form>

        <div class="divider">ou entre com</div>

        <button class="btn-secondary" @click="handleLoginGoogle">
          <img
            src="https://www.svgrepo.com/show/355037/google.svg"
            alt="Google"
            class="icon"
          />
          Entrar com Google
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.login-container {
  display: flex;
  height: 100vh;
  font-family: Arial, sans-serif;
}

.login-left {
  flex: 1;
  background: #18181b;
  color: white;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 2rem;
}

.logo {
  font-size: 1.5rem;
  font-weight: bold;
  color: var(--color-gray-background);
}

.quote {
  font-size: 0.9rem;
  line-height: 1.4;
  opacity: 0.9;
  color: var(--color-gray-background);
}

.span {
  font-style: italic;
  font-weight: 500;
  color: var(--color-gray-background);
}

.login-right {
  flex: 1;
  background: #ffffff;
  display: flex;
  justify-content: center;
  align-items: center;
}

.login-box {
  width: 100%;
  max-width: 380px;
  text-align: center;
}

.login-box h2 {
  font-size: 1.5rem;
  margin-bottom: 0.3rem;
}

.subtitle {
  color: #6b7280;
  font-size: 0.9rem;
  margin-bottom: 1.5rem;
}

.input-wrapper {
  margin-bottom: 1rem;
  text-align: left;
}

.input-text {
  width: 100%;
  padding: 10px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
}

.input-text:focus {
  border-color: #2563eb;
  outline: none;
}

.btn-primary {
  width: 100%;
  padding: 10px;
  border: none;
  border-radius: 6px;
  color: white;
  font-weight: bold;
  cursor: pointer;
  margin-bottom: 1rem;
  transition: opacity 0.15s;
}

.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-green {
  background-color: var(--color-primary);
}

.btn-green:hover:not(:disabled) {
  background-color: #16a34a;
}

.btn-secondary {
  width: 100%;
  padding: 10px;
  border-radius: 6px;
  border: 1px solid #d1d5db;
  background: white;
  color: #111827;
  font-weight: 500;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  cursor: pointer;
}

.btn-secondary:hover {
  background: #f9fafb;
}

.divider {
  margin: 1rem 0;
  font-size: 0.8rem;
  color: #9ca3af;
  text-transform: uppercase;
}

.icon {
  width: 20px;
  height: 20px;
}

.alert-box {
  position: fixed;
  top: 20px;
  right: 20px;
  background: #ef4444;
  color: white;
  padding: 14px 20px;
  border-radius: 8px;
  font-weight: bold;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  z-index: 9999;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.4s;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
