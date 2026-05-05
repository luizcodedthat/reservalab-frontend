import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/useAuthStore'

// ── Auth ──────────────────────────────────────────────────────────────────────
import LoginView   from '@/views/LoginView.vue'
import CadastroView from '@/views/CadastroView.vue'

// ── Dashboards ────────────────────────────────────────────────────────────────
import DashboardAlunoView      from '@/views/DashboardAlunoView.vue'
import DashboardProfessorView  from '@/views/DashboardProfessorView.vue'
import DashboardSecretariaView from '@/views/DashboardSecretariaView.vue'

// ── Modulos principais ────────────────────────────────────────────────────────
import LaboratoriosView  from '@/views/LaboratoriosView.vue'
import LaboratorioView   from '@/views/LaboratorioView.vue'
import ChamadoView       from '@/views/ChamadoView.vue'
import ChamadoDetalheView from '@/views/ChamadoDetalheView.vue'

// ── Novas views ───────────────────────────────────────────────────────────────
import HorariosView       from '@/views/HorariosView.vue'
import StatusView         from '@/views/StatusView.vue'
import ReservasView       from '@/views/ReservasView.vue'
import ProfessoresView    from '@/views/ProfessoresView.vue'
import ConfiguracoesView  from '@/views/ConfiguracoesView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [

    // ── Publicas ────────────────────────────────────────────────────────────
    { path: '/',         redirect: '/login' },
    { path: '/login',    name: 'Login',    component: LoginView    },
    { path: '/cadastro', name: 'Cadastro', component: CadastroView },

    // ── Dashboards por role ─────────────────────────────────────────────────
    {
      path: '/dashboard/aluno',
      name: 'DashboardAluno',
      component: DashboardAlunoView,
      meta: { requiresAuth: true, roles: ['STUDENT'] },
    },
    {
      path: '/dashboard/professor',
      name: 'DashboardProfessor',
      component: DashboardProfessorView,
      meta: { requiresAuth: true, roles: ['PROFESSOR'] },
    },
    {
      path: '/dashboard/secretaria',
      name: 'DashboardSecretaria',
      component: DashboardSecretariaView,
      meta: { requiresAuth: true, roles: ['SECRETARY', 'TECHNICIAN'] },
    },

    // ── Labs ─────────────────────────────────────────────────────────────────
    {
      path: '/laboratorios',
      name: 'Laboratorios',
      component: LaboratoriosView,
      meta: { requiresAuth: true },
    },
    {
      path: '/laboratorios/:id',
      name: 'Laboratorio',
      component: LaboratorioView,
      meta: { requiresAuth: true },
      props: true,
    },

    // ── Chamados ──────────────────────────────────────────────────────────────
    {
      path: '/chamados',
      name: 'Chamados',
      component: ChamadoView,
      meta: { requiresAuth: true },
    },
    {
      path: '/chamados/:id',
      name: 'ChamadoDetalhe',
      component: ChamadoDetalheView,
      meta: { requiresAuth: true },
      props: true,
    },

    // ── Horarios ──────────────────────────────────────────────────────────────
    {
      path: '/horarios',
      name: 'Horarios',
      component: HorariosView,
      meta: { requiresAuth: true },
    },

    // ── Status de uso ─────────────────────────────────────────────────────────
    {
      path: '/status',
      name: 'Status',
      component: StatusView,
      meta: { requiresAuth: true },
    },

    // ── Reservas ──────────────────────────────────────────────────────────────
    {
      path: '/reservas',
      name: 'Reservas',
      component: ReservasView,
      meta: { requiresAuth: true, roles: ['PROFESSOR', 'SECRETARY', 'TECHNICIAN'] },
    },

    // ── Professores (admin only) ───────────────────────────────────────────────
    {
      path: '/professores',
      name: 'Professores',
      component: ProfessoresView,
      meta: { requiresAuth: true, roles: ['SECRETARY', 'TECHNICIAN'] },
    },

    // ── Configuracoes ─────────────────────────────────────────────────────────
    {
      path: '/configuracoes',
      name: 'Configuracoes',
      component: ConfiguracoesView,
      meta: { requiresAuth: true },
    },

    // ── Gerenciar laboratorios (admin only) ─────────────────────────────────
    {
      path: '/gerenciar-laboratorios',
      name: 'GerenciarLaboratorios',
      component: () => import('@/views/GerenciarLaboratoriosView.vue'),
      meta: { requiresAuth: true, roles: ['SECRETARY', 'TECHNICIAN'] }
    },

    // ── 404 catch-all ─────────────────────────────────────────────────────────
    {
      path: '/:pathMatch(.*)*',
      redirect: '/login',
    },
  ],
})

// ─── Guard global ─────────────────────────────────────────────────────────────
router.beforeEach(async (to, _from, next) => {
  const auth = useAuthStore()

  // Rota publica
  if (!to.meta.requiresAuth) {
    // Se ja autenticado e for para /login ou /cadastro, redireciona ao dashboard
    if (auth.isAuthenticated) {
      if (!auth.user) await auth.init()
      if (auth.user) return next(auth.user.dashboardRoute)
    }
    return next()
  }

  // Sem token → login
  if (!auth.token) return next('/login')

  // Carrega usuario se necessario (ex: refresh de pagina)
  if (!auth.user) await auth.init()

  // Token invalido (init limpou a sessao)
  if (!auth.user) return next('/login')

  // Verifica permissao de role
  if (to.meta.roles && !to.meta.roles.includes(auth.user.role)) {
    return next(auth.user.dashboardRoute)
  }

  next()
})

export default router
