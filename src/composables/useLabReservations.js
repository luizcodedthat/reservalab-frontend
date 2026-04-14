import { computed } from 'vue'
import { useReservationStore } from '@/stores/useReservationStore'

// ⚠️ TEM QUE SER EXPORT NOMEADO
export function useLabReservations(labId) {
  const reservationStore = useReservationStore()

  function toMinutes(timeStr) {
    if (!timeStr) return Infinity
    const [h, m] = timeStr.slice(0, 5).split(':').map(Number)
    return h * 60 + m
  }

  function getStart(res) {
    return res.timeBlocks?.[0]?.startTime ?? null
  }

  function getEnd(res) {
    return res.timeBlocks?.at(-1)?.endTime ?? null
  }

  const today = new Date().toISOString().slice(0, 10)

  const reservations = computed(() =>
    reservationStore.reservations.filter(r =>
      Number(r.laboratoryId) === Number(labId.value) &&
      r.reservationDate?.startsWith(today)
    )
  )

  function nowMinutes() {
    const d = new Date()
    return d.getHours() * 60 + d.getMinutes()
  }

  const currentReservation = computed(() =>
    reservations.value.find(r => {
      const start = toMinutes(getStart(r))
      const end   = toMinutes(getEnd(r))
      const now   = nowMinutes()

      return now >= start && now < end
    }) || null
  )

  const nextReservations = computed(() =>
    reservations.value
      .filter(r => toMinutes(getStart(r)) > nowMinutes())
      .sort((a, b) => toMinutes(getStart(a)) - toMinutes(getStart(b)))
  )

  return {
    currentReservation,
    nextReservations,
    getStart,
    getEnd
  }
}
