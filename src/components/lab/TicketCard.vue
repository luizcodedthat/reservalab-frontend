<script setup>
defineProps({
  ticket: { type: Object, required: true }
})
</script>

<template>
  <tr class="ticket-row">
    <td class="ticket-row__main">
      <span class="ticket-title">{{ ticket.titulo }}</span>
      <span class="ticket-desc">{{ ticket.descricao }}</span>
    </td>
    <td>
      <span
        class="ticket-status"
        :class="{
          'ticket-status--open':     ticket.status === 'Aberto',
          'ticket-status--progress': ticket.status === 'Em andamento',
          'ticket-status--done':     ticket.status === 'Concluído',
          'ticket-status--closed':   ticket.status === 'Fechado',
        }"
      >{{ ticket.status }}</span>
    </td>
    <td class="ticket-meta">{{ ticket.authorId }}</td>
    <td class="ticket-meta">{{ ticket.data }}</td>
  </tr>
</template>

<style scoped>
.ticket-row { border-bottom: 1px solid rgba(190,202,185,0.1); }
.ticket-row__main { padding: 1.5rem 0; }
.ticket-title { display: block; font-weight: 700; color: #1a1c1c; font-size: 0.9375rem; }
.ticket-desc {
  display: block; font-size: 0.875rem; color: #3f4a3c;
  max-width: 20rem; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
}
.ticket-status {
  display: inline-block; padding: 0.25rem 0.75rem;
  border-radius: 9999px; font-size: 0.75rem; font-weight: 700;
}
.ticket-status--open     { background: #ffdad6; color: #93000a; }
.ticket-status--progress { background: #e2e2e2; color: #881546; }
.ticket-status--done     { background: #8dfa8f; color: #005316; }
.ticket-status--closed   { background: #e2e2e2; color: #3f4a3c; }
.ticket-meta { font-size: 0.875rem; color: #3f4a3c; padding: 1.5rem 0; }
</style>
