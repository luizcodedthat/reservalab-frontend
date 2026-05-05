<script setup>
import { ref, reactive, onMounted } from 'vue'
import AppLayout from '@/components/AppLayout.vue'
import { useAuthStore } from '@/stores/useAuthStore'
import { useUserStore } from '@/stores/useUserStore'
import { User, Lock, Bell, Save, Loader, CheckCircle2, Eye, EyeOff, AlertCircle } from 'lucide-vue-next'

const auth      = useAuthStore()
const userStore = useUserStore()

// ─── Aba ativa ────────────────────────────────────────────────────────────────
const activeTab = ref('perfil')
const TABS = [
  { id: 'perfil', label: 'Perfil',       icon: User },
  { id: 'senha',  label: 'Seguranca',    icon: Lock },
  { id: 'notif',  label: 'Notificacoes', icon: Bell },
]

// ─── Tab Perfil ───────────────────────────────────────────────────────────────
const profileForm = reactive({ name: '', username: '', email: '' })
const profileLoading = ref(false)
const profileError   = ref('')
const profileSuccess = ref(false)

onMounted(() => {
  if (auth.user) {
    profileForm.name     = auth.user.name     || ''
    profileForm.username = auth.user.username || ''
    profileForm.email    = auth.user.email    || ''
  }
})

async function saveProfile() {
  profileError.value   = ''
  profileSuccess.value = false
  if (!profileForm.name.trim())  { profileError.value = 'Nome nao pode ser vazio.'; return }
  if (!profileForm.email.trim()) { profileError.value = 'Email nao pode ser vazio.'; return }

  profileLoading.value = true
  try {
    // IMPORTANTE: envia role e active atuais para nao resetar
    const updated = await userStore.updateUser(auth.user.id, {
      name:     profileForm.name.trim(),
      username: profileForm.username.trim(),
      email:    profileForm.email.trim(),
      // NAO enviar role aqui — o backend mantem o atual (campo omitido = sem alteracao)
    })

    // Atualiza dados no auth store sem mexer no role
    auth.user.name     = updated.name
    auth.user.username = updated.username
    auth.user.email    = updated.email
    // role e active sao preservados pois vieram da resposta da API

    profileSuccess.value = true
    setTimeout(() => { profileSuccess.value = false }, 3000)
  } catch (err) {
    profileError.value = err?.response?.data?.message || 'Erro ao atualizar perfil.'
  } finally {
    profileLoading.value = false
  }
}

// ─── Tab Senha ────────────────────────────────────────────────────────────────
const pwForm    = reactive({ current: '', newPw: '', confirm: '' })
const showPw    = reactive({ current: false, newPw: false, confirm: false })
const pwLoading = ref(false)
const pwError   = ref('')
const pwSuccess = ref(false)

const pwStrength = {
  score(pw) {
    if (!pw) return 0
    let s = 0
    if (pw.length >= 6)  s++
    if (pw.length >= 8)  s++
    if (/[A-Z]/.test(pw)) s++
    if (/[^a-zA-Z0-9]/.test(pw)) s++
    return s
  },
  label: ['', 'Fraca', 'Razoavel', 'Boa', 'Forte'],
  color: ['', '#ef4444', '#f59e0b', '#22c55e', '#16a34a'],
}

async function savePassword() {
  pwError.value   = ''
  pwSuccess.value = false
  if (!pwForm.current)               { pwError.value = 'Informe a senha atual.'; return }
  if (pwForm.newPw.length < 6)       { pwError.value = 'Nova senha deve ter ao menos 6 caracteres.'; return }
  if (pwForm.newPw !== pwForm.confirm) { pwError.value = 'As senhas nao coincidem.'; return }

  pwLoading.value = true
  try {
    // Envia APENAS a senha — backend mantem todos os outros campos
    await userStore.updateUser(auth.user.id, { password: pwForm.newPw })
    pwForm.current = ''; pwForm.newPw = ''; pwForm.confirm = ''
    pwSuccess.value = true
    setTimeout(() => { pwSuccess.value = false }, 3000)
  } catch (err) {
    pwError.value = err?.response?.data?.message || 'Erro ao atualizar senha.'
  } finally {
    pwLoading.value = false
  }
}

// ─── Tab Notificacoes (localStorage) ─────────────────────────────────────────
const notifKey = `rl_notif_${auth.user?.id || 'guest'}`
function loadNotif() {
  try { return JSON.parse(localStorage.getItem(notifKey) || '{}') } catch { return {} }
}
const notif = reactive({ avisos: true, chamados: true, reservas: false, ...loadNotif() })
const notifSaved = ref(false)

function saveNotif() {
  localStorage.setItem(notifKey, JSON.stringify({ ...notif }))
  notifSaved.value = true
  setTimeout(() => { notifSaved.value = false }, 2000)
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
const ROLE_LABEL = { STUDENT: 'Aluno', PROFESSOR: 'Professor', SECRETARY: 'Secretario(a)', TECHNICIAN: 'Tecnico(a)' }
</script>

<template>
  <AppLayout>

    <div class="page-header">
      <h1 class="page-title">Configurações</h1>
      <p class="page-sub">Gerencie suas preferencias e dados da conta.</p>
    </div>

    <div class="cfg-layout">

      <!-- Sidebar -->
      <aside class="cfg-sidebar">
        <button
          v-for="tab in TABS"
          :key="tab.id"
          class="tab-btn"
          :class="{ active: activeTab === tab.id }"
          @click="activeTab = tab.id"
        >
          <component :is="tab.icon" :size="16" />
          {{ tab.label }}
        </button>
      </aside>

      <!-- Conteudo -->
      <section class="cfg-body">

        <!-- ══ PERFIL ══════════════════════════════════════════════════════ -->
        <div v-if="activeTab === 'perfil'" class="cfg-card">
          <div class="cfg-card-title">
            <User :size="16" color="#16a34a" /> Dados Pessoais
          </div>

          <!-- Avatar row -->
          <div class="avatar-row">
            <div class="avatar-circle">{{ auth.user?.initials || '?' }}</div>
            <div>
              <div class="avatar-name">{{ auth.user?.name }}</div>
              <div class="avatar-role">{{ ROLE_LABEL[auth.user?.role] || auth.user?.role }}</div>
            </div>
          </div>

          <div v-if="profileError" class="alert alert-error">
            <AlertCircle :size="14" /> {{ profileError }}
          </div>
          <div v-if="profileSuccess" class="alert alert-ok">
            <CheckCircle2 :size="14" /> Perfil atualizado com sucesso!
          </div>

          <div class="field-grid">
            <div class="field">
              <label>Nome completo</label>
              <input v-model="profileForm.name" type="text" placeholder="Seu nome completo" />
            </div>
            <div class="field">
              <label>Username</label>
              <input v-model="profileForm.username" type="text" placeholder="seu.username" />
            </div>
            <div class="field full">
              <label>Email</label>
              <input v-model="profileForm.email" type="email" placeholder="seu@email.com" />
            </div>
          </div>

          <div class="card-footer">
            <button class="btn-save" :disabled="profileLoading" @click="saveProfile">
              <Loader v-if="profileLoading" :size="14" class="spin" />
              <Save   v-else                :size="14" color="#fff" />
              {{ profileLoading ? 'Salvando...' : 'Salvar Alteracoes' }}
            </button>
          </div>
        </div>

        <!-- ══ SENHA ════════════════════════════════════════════════════════ -->
        <div v-if="activeTab === 'senha'" class="cfg-card">
          <div class="cfg-card-title">
            <Lock :size="16" color="#16a34a" /> Alterar Senha
          </div>

          <div v-if="pwError" class="alert alert-error">
            <AlertCircle :size="14" /> {{ pwError }}
          </div>
          <div v-if="pwSuccess" class="alert alert-ok">
            <CheckCircle2 :size="14" /> Senha alterada com sucesso!
          </div>

          <div class="field-col">
            <div class="field">
              <label>Senha atual</label>
              <div class="pw-wrap">
                <input v-model="pwForm.current" :type="showPw.current ? 'text' : 'password'" placeholder="••••••" />
                <button class="pw-eye" @click="showPw.current = !showPw.current">
                  <component :is="showPw.current ? EyeOff : Eye" :size="15" color="#94a3b8" />
                </button>
              </div>
            </div>

            <div class="field">
              <label>Nova senha</label>
              <div class="pw-wrap">
                <input v-model="pwForm.newPw" :type="showPw.newPw ? 'text' : 'password'" placeholder="Minimo 6 caracteres" />
                <button class="pw-eye" @click="showPw.newPw = !showPw.newPw">
                  <component :is="showPw.newPw ? EyeOff : Eye" :size="15" color="#94a3b8" />
                </button>
              </div>

              <!-- Indicador de forca -->
              <div v-if="pwForm.newPw" class="pw-strength">
                <div class="pw-bars">
                  <div
                    v-for="i in 4" :key="i"
                    class="pw-bar"
                    :style="{ background: i <= pwStrength.score(pwForm.newPw) ? pwStrength.color[pwStrength.score(pwForm.newPw)] : '#e2e8f0' }"
                  ></div>
                </div>
                <span class="pw-lbl">{{ pwStrength.label[pwStrength.score(pwForm.newPw)] }}</span>
              </div>
            </div>

            <div class="field">
              <label>Confirmar nova senha</label>
              <div class="pw-wrap">
                <input v-model="pwForm.confirm" :type="showPw.confirm ? 'text' : 'password'" placeholder="Repita a nova senha" />
                <button class="pw-eye" @click="showPw.confirm = !showPw.confirm">
                  <component :is="showPw.confirm ? EyeOff : Eye" :size="15" color="#94a3b8" />
                </button>
              </div>
              <span
                v-if="pwForm.confirm && pwForm.newPw !== pwForm.confirm"
                class="field-hint error"
              >Senhas nao coincidem</span>
              <span
                v-else-if="pwForm.confirm && pwForm.newPw === pwForm.confirm"
                class="field-hint ok"
              >Senhas coincidem</span>
            </div>
          </div>

          <div class="card-footer">
            <button class="btn-save" :disabled="pwLoading" @click="savePassword">
              <Loader v-if="pwLoading" :size="14" class="spin" />
              <Lock   v-else           :size="14" />
              {{ pwLoading ? 'Alterando...' : 'Alterar Senha' }}
            </button>
          </div>
        </div>

        <!-- ══ NOTIFICACOES ════════════════════════════════════════════════ -->
        <div v-if="activeTab === 'notif'" class="cfg-card">
          <div class="cfg-card-title">
            <Bell :size="16" color="#16a34a" /> Preferencias de Notificacao
          </div>

          <div v-if="notifSaved" class="alert alert-ok">
            <CheckCircle2 :size="14" /> Preferencias salvas!
          </div>

          <div class="toggle-list">
            <div class="toggle-row">
              <div class="toggle-info">
                <div class="toggle-lbl">Avisos institucionais</div>
                <div class="toggle-sub">Comunicados do campus e laboratorios</div>
              </div>
              <button class="toggle-btn" :class="{ on: notif.avisos }" @click="notif.avisos = !notif.avisos">
                <div class="thumb"></div>
              </button>
            </div>
            <div class="toggle-row">
              <div class="toggle-info">
                <div class="toggle-lbl">Atualizacoes de chamados</div>
                <div class="toggle-sub">Quando seu chamado for atualizado ou respondido</div>
              </div>
              <button class="toggle-btn" :class="{ on: notif.chamados }" @click="notif.chamados = !notif.chamados">
                <div class="thumb"></div>
              </button>
            </div>
            <div class="toggle-row">
              <div class="toggle-info">
                <div class="toggle-lbl">Lembretes de reserva</div>
                <div class="toggle-sub">Notificacao antes do inicio da sua reserva</div>
              </div>
              <button class="toggle-btn" :class="{ on: notif.reservas }" @click="notif.reservas = !notif.reservas">
                <div class="thumb"></div>
              </button>
            </div>
          </div>

          <div class="card-footer">
            <button class="btn-save" @click="saveNotif">
              <Save :size="14" /> Salvar Preferencias
            </button>
          </div>
        </div>

      </section>
    </div>

  </AppLayout>
</template>

<style scoped>
/* ─── Page ───────────────────────────────────────────────────────────────────── */
.page-header { margin-bottom: 24px; }
.page-title  { font-size: 24px; font-weight: 800; color: #0f172a; margin: 0 0 4px; }
.page-sub    { font-size: 13px; color: #64748b; margin: 0; }

/* ─── Layout ─────────────────────────────────────────────────────────────────── */
.cfg-layout {
  display: grid;
  grid-template-columns: 190px 1fr;
  gap: 20px;
  align-items: start;
}

/* ─── Sidebar ────────────────────────────────────────────────────────────────── */
.cfg-sidebar {
  background: #fff;
  border: 1px solid #e8ecf0;
  border-radius: 12px;
  padding: 10px;
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.tab-btn {
  display: flex; align-items: center; gap: 9px;
  padding: 10px 12px; border-radius: 8px;
  font-size: 13.5px; font-weight: 500; color: #64748b;
  background: none; border: none; cursor: pointer;
  text-align: left; width: 100%; transition: all 0.13s;
}
.tab-btn:hover  { background: #f1f5f9; color: #0f172a; }
.tab-btn.active { background: #f0fdf4; color: #16a34a; font-weight: 600; }

/* ─── Card ───────────────────────────────────────────────────────────────────── */
.cfg-card {
  background: #fff;
  border: 1px solid #e8ecf0;
  border-radius: 12px;
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.cfg-card-title {
  display: flex; align-items: center; gap: 8px;
  font-size: 15px; font-weight: 700; color: #0f172a;
  padding-bottom: 14px;
  border-bottom: 1px solid #f1f5f9;
}

/* ─── Avatar row ─────────────────────────────────────────────────────────────── */
.avatar-row    { display: flex; align-items: center; gap: 14px; background: #f8fafc; border-radius: 10px; padding: 14px 16px; }
.avatar-circle { width: 48px; height: 48px; background: #16a34a; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: #fff; font-size: 18px; font-weight: 700; flex-shrink: 0; }
.avatar-name   { font-size: 15px; font-weight: 600; color: #0f172a; }
.avatar-role   { font-size: 12.5px; color: #94a3b8; margin-top: 2px; }

/* ─── Alerts ─────────────────────────────────────────────────────────────────── */
.alert       { display: flex; align-items: center; gap: 7px; font-size: 13px; padding: 10px 13px; border-radius: 8px; }
.alert-error { background: #fef2f2; color: #ef4444; border: 1px solid #fecaca; }
.alert-ok    { background: #f0fdf4; color: #16a34a; border: 1px solid #bbf7d0; }

/* ─── Fields ─────────────────────────────────────────────────────────────────── */
.field-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px;
}
.field-col { display: flex; flex-direction: column; gap: 16px; }

.field     { display: flex; flex-direction: column; gap: 6px; }
.field.full{ grid-column: 1 / -1; }

.field label { font-size: 12px; font-weight: 600; color: #374151; text-transform: uppercase; letter-spacing: 0.4px; }

.field input {
  border: 1.5px solid #e2e8f0; border-radius: 8px;
  padding: 10px 13px; font-size: 13.5px; color: #0f172a;
  outline: none; background: #fff; width: 100%;
  font-family: inherit; transition: border-color 0.15s, box-shadow 0.15s;
  box-sizing: border-box;
}
.field input:focus { border-color: #16a34a; box-shadow: 0 0 0 3px #16a34a18; }

.field-hint       { font-size: 12px; margin-top: 3px; }
.field-hint.error { color: #ef4444; }
.field-hint.ok    { color: #16a34a; }

/* ─── Password ───────────────────────────────────────────────────────────────── */
.pw-wrap { position: relative; }
.pw-wrap input { width: 100%; padding-right: 42px; border: 1.5px solid #e2e8f0; border-radius: 8px; padding: 10px 42px 10px 13px; font-size: 13.5px; color: #0f172a; outline: none; box-sizing: border-box; font-family: inherit; transition: border-color 0.15s, box-shadow 0.15s; }
.pw-wrap input:focus { border-color: #16a34a; box-shadow: 0 0 0 3px #16a34a18; }
.pw-eye { position: absolute; right: 11px; top: 50%; transform: translateY(-50%); background: none; border: none; cursor: pointer; padding: 2px; display: flex; align-items: center; }

.pw-strength { display: flex; align-items: center; gap: 10px; margin-top: 6px; }
.pw-bars     { display: flex; gap: 4px; flex: 1; }
.pw-bar      { flex: 1; height: 4px; border-radius: 2px; transition: background 0.25s; }
.pw-lbl      { font-size: 11.5px; color: #64748b; white-space: nowrap; min-width: 54px; }

/* ─── Footer ─────────────────────────────────────────────────────────────────── */
.card-footer { display: flex; justify-content: flex-end; border-top: 1px solid #f1f5f9; padding-top: 16px; margin-top: 4px; }

.btn-save {
  display: flex; align-items: center; gap: 7px;
  background: #16a34a; color: #fff; border: none;
  padding: 10px 22px; border-radius: 8px;
  font-size: 13.5px; font-weight: 600; cursor: pointer;
  transition: background 0.15s;
}
.btn-save:hover:not(:disabled) { background: #15803d; }
.btn-save:disabled { opacity: 0.6; cursor: not-allowed; }

/* ─── Toggles ────────────────────────────────────────────────────────────────── */
.toggle-list { display: flex; flex-direction: column; gap: 18px; }
.toggle-row  { display: flex; justify-content: space-between; align-items: center; gap: 20px; padding: 14px; background: #f8fafc; border-radius: 9px; }
.toggle-info { flex: 1; }
.toggle-lbl  { font-size: 13.5px; font-weight: 600; color: #0f172a; }
.toggle-sub  { font-size: 12px; color: #94a3b8; margin-top: 3px; }

.toggle-btn {
  width: 46px; height: 26px; border-radius: 13px; background: #e2e8f0;
  border: none; cursor: pointer; position: relative; flex-shrink: 0;
  transition: background 0.2s; padding: 0;
}
.toggle-btn.on { background: #16a34a; }
.thumb {
  position: absolute; top: 3px; left: 3px;
  width: 20px; height: 20px; border-radius: 50%; background: #fff;
  box-shadow: 0 1px 4px rgba(0,0,0,0.18);
  transition: left 0.2s;
}
.toggle-btn.on .thumb { left: 23px; }

/* ─── Spin ───────────────────────────────────────────────────────────────────── */
@keyframes spin { to { transform: rotate(360deg); } }
.spin { animation: spin 1s linear infinite; }
</style>
