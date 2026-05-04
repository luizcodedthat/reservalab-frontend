<script setup>
import { ref, computed } from "vue";
import { useRouter } from "vue-router";
import { Form, Field } from "vee-validate";
import { useAuthStore } from "@/stores/useAuthStore";
import { LucideEye, LucideEyeClosed } from "lucide-vue-next";

const router = useRouter();
const authStore = useAuthStore();

const name = ref("");
const username = ref("");
const email = ref("");
const password = ref("");

const emailError = ref("");

const showPassword = ref(false);

function validateInstitutionalEmail() {
  if (!email.value) {
    emailError.value = "";
    return;
  }

  if (
    !email.value.endsWith("@discente.ifpe.edu.br") &&
    !email.value.endsWith("@palmares.ifpe.edu.br")
  ) {
    emailError.value =
      "Use um email institucional (@discente.ifpe.edu.br ou @palmares.ifpe.edu.br)";
  } else {
    emailError.value = "";
  }
}

const hasUppercase = computed(() => /[A-Z]/.test(password.value || ""));
const hasNumber = computed(() => /[0-9]/.test(password.value || ""));
const hasSpecial = computed(() =>
  /[!@#$%^&*(),.?":{}|<>]/.test(password.value || "")
);
const hasMinLength = computed(() => (password.value?.length || 0) >= 8);

const passwordStrength = computed(() => {
  let score = 0;
  if (hasUppercase.value) score++;
  if (hasNumber.value) score++;
  if (hasSpecial.value) score++;
  if (hasMinLength.value) score++;
  return score;
});

const canRegister = computed(() => passwordStrength.value === 4);

async function handleRegister() {
  validateInstitutionalEmail();
  if (emailError.value) return;

  if (!canRegister.value) {
    emailError.value = "Senha não atende aos requisitos.";
    return;
  }

  try {
    await authStore.doRegister({
      name: name.value,
      username: username.value,
      email: email.value,
      password: password.value,
    });

    router.push({ name: "Laboratorios" });
  } catch (error) {
    emailError.value =
      authStore.error || "Erro ao criar conta. Tente novamente.";
  }
}
</script>

<template>
  <button class="login-top-button" @click="router.push('/login')">
    Login
  </button>

  <div class="login-container">
    <div class="login-left">
      <h1 class="logo">ReservaLab</h1>
      <p class="quote">
        "A única maneira de fazer um ótimo trabalho é amar o que você faz."<br />
        <span class="span">– Steve Jobs</span>
      </p>
    </div>

    <div class="login-right">
      <div class="login-box">
        <h2>Crie sua conta</h2>
        <p class="subtitle">Insira seus dados para se cadastrar</p>

        <Form @submit="handleRegister" class="form">

          <div class="input-wrapper">
            <Field name="name" rules="required" v-slot="{ field, meta }">
              <input
                v-bind="field"
                v-model="name"
                type="text"
                placeholder="Nome completo"
                class="input-text"
                :class="{ 'input-error': meta.touched && meta.dirty && !meta.valid }"
              />
              <span v-if="meta.touched && meta.dirty && meta.errors[0]" class="error">
                {{ meta.errors[0] }}
              </span>
            </Field>
          </div>

          <div class="input-wrapper">
            <Field name="username" rules="required" v-slot="{ field, meta }">
              <input
                v-bind="field"
                v-model="username"
                type="text"
                placeholder="Nome de usuário"
                class="input-text"
                :class="{ 'input-error': meta.touched && meta.dirty && !meta.valid }"
              />
              <span v-if="meta.touched && meta.dirty && meta.errors[0]" class="error">
                {{ meta.errors[0] }}
              </span>
            </Field>
          </div>

          <div class="input-wrapper">
            <Field name="email" rules="required|email" v-slot="{ field, meta }">
              <input
                v-bind="field"
                v-model="email"
                type="email"
                placeholder="Email institucional"
                class="input-text"
                @input="validateInstitutionalEmail()"
                :class="{
                  'input-error':
                    (meta.touched && meta.dirty && !meta.valid) ||
                    (meta.dirty && emailError)
                }"
              />
              <span v-if="meta.touched && meta.dirty && meta.errors[0]" class="error">
                {{ meta.errors[0] }}
              </span>
              <span v-if="meta.dirty && emailError" class="error">
                {{ emailError }}
              </span>
            </Field>
          </div>

          <div class="input-wrapper">
            <Field name="password" rules="required|min:8" v-slot="{ field, meta }">
              <div style="position: relative">
                <input
                  v-bind="field"
                  v-model="password"
                  :type="showPassword ? 'text' : 'password'"
                  placeholder="Senha (mín. 8 caracteres)"
                  class="input-text"
                  :class="{ 'input-error': meta.touched && meta.dirty && !meta.valid }"
                />

                <span @click="showPassword = !showPassword" class="eye-icon">
                  <LucideEye v-if="showPassword" />
                  <LucideEyeClosed v-else />
                </span>
              </div>

              <span v-if="meta.touched && meta.dirty && meta.errors[0]" class="error">
                {{ meta.errors[0] }}
              </span>

              <ul class="password-check">
                <li :style="{ color: hasMinLength ? 'green' : 'red' }">✔ Mínimo 8 caracteres</li>
                <li :style="{ color: hasUppercase ? 'green' : 'red' }">✔ Letra maiúscula</li>
                <li :style="{ color: hasNumber ? 'green' : 'red' }">✔ Número</li>
                <li :style="{ color: hasSpecial ? 'green' : 'red' }">✔ Caractere especial</li>
              </ul>

              <div class="strength-bar">
                <div
                  :style="{
                    height: '100%',
                    width: passwordStrength * 25 + '%',
                    background:
                      passwordStrength <= 1
                        ? 'red'
                        : passwordStrength === 2
                        ? 'orange'
                        : passwordStrength === 3
                        ? 'gold'
                        : 'green',
                  }"
                ></div>
              </div>
            </Field>
          </div>

          <button
            type="submit"
            class="btn-primary btn-green"
            :disabled="!canRegister || authStore.loading"
            :class="{ 'btn-disabled': !canRegister || authStore.loading }"
          >
            {{ authStore.loading ? "Cadastrando..." : "Cadastrar" }}
          </button>

        </Form>
      </div>
    </div>
  </div>
</template>

<style scoped>
.login-container {
  display: flex;
  min-height: 100vh;
  font-family: Arial, sans-serif;
}

.login-left {
  flex: 1;
  background: #18181b;
  color: white;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 3rem 2.5rem;
}

.logo {
  font-size: 1.8rem;
  font-weight: bold;
  color: var(--color-gray-background);
}

.quote {
  font-size: 0.95rem;
  line-height: 1.6;
  opacity: 0.9;
  color: var(--color-gray-background);
  max-width: 320px;
}

.span {
  display: block;
  margin-top: 8px;
  font-style: italic;
  font-weight: 500;
}

.login-right {
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 2rem;
}

.login-box {
  width: 100%;
  max-width: 400px;
  text-align: center;
}

.login-box h2 {
  margin-bottom: 6px;
}

.subtitle {
  font-size: 0.9rem;
  color: #6b7280;
  margin-bottom: 1.5rem;
}

.input-wrapper {
  margin-bottom: 1.2rem;
  text-align: left;
}

.input-text {
  width: 100%;
  padding: 12px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  transition: 0.2s;
  font-size: 0.9rem;
}

.input-text:focus {
  outline: none;
  border-color: var(--color-primary);
}

.input-error {
  border-color: red !important;
}

.error {
  color: red;
  font-size: 0.75rem;
  margin-top: 4px;
}

.eye-icon {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  cursor: pointer;
  opacity: 0.7;
}

.eye-icon:hover {
  opacity: 1;
}

.password-check {
  font-size: 0.75rem;
  margin-top: 8px;
  padding-left: 18px;
  line-height: 1.5;
}

.strength-bar {
  height: 6px;
  width: 100%;
  background: #e5e7eb;
  margin-top: 8px;
  border-radius: 4px;
  overflow: hidden;
}

.btn-primary {
  width: 100%;
  padding: 12px;
  border: none;
  border-radius: 6px;
  color: white;
  font-weight: bold;
  cursor: pointer;
  margin-top: 0.5rem;
  margin-bottom: 1.2rem;
  transition: 0.2s;
}

.btn-green {
  background-color: var(--color-primary);
}

.btn-green:hover {
  background-color: #16a34a;
}

.btn-secondary {
  width: 100%;
  padding: 12px;
  border-radius: 6px;
  border: 1px solid #d1d5db;
  background: white;
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  transition: 0.2s;
}

.btn-secondary:hover {
  background: #f9fafb;
}

.divider {
  margin: 1.5rem 0;
  font-size: 0.75rem;
  color: #9ca3af;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.icon {
  width: 18px;
  height: 18px;
}

.login-top-button {
  position: absolute;
  top: 20px;
  right: 20px;

  background: var(--color-primary);
  color: white;

  padding: 10px 18px;
  border-radius: 6px;
  border: none;

  font-weight: bold;
  font-size: 0.85rem;

  cursor: pointer;
  transition: 0.2s ease;

  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
}

.login-top-button:hover {
  background: #16a34a;
}

.btn-disabled {
  background: #d1d5db !important;
  cursor: not-allowed !important;
  color: #6b7280 !important;
}
</style>