export class Reservation {
  constructor(data = {}) {
    this.id = data.id ?? null;

    this.laboratoryId = data.laboratoryId ?? null;
    this.laboratoryName = data.laboratoryName ?? '';

    this.requestedByUserId = data.requestedByUserId ?? null;
    this.requestedByName = data.requestedByName ?? '';

    this.approvedByUserId = data.approvedByUserId ?? null;
    this.approvedByName = data.approvedByName ?? '';

    this.groupId = data.groupId ?? null;

    this.reservationDate = data.reservationDate ?? null;

    this.purpose = data.purpose ?? '';

    this.status = data.status ?? 'PENDING';

    this.rejectionReason = data.rejectionReason ?? null;
    this.notes = data.notes ?? null;

    this.timeBlocks = Array.isArray(data.timeBlocks)
      ? data.timeBlocks.map(b => ({
        id: b.id ?? null,
        startTime: b.startTime,
        endTime: b.endTime,
        blockOrder: b.blockOrder ?? 1,
        durationMinutes: b.durationMinutes ?? this.calculateDuration(b.startTime, b.endTime)
      }))
      : [];

    this.totalDurationMinutes =
      data.totalDurationMinutes ?? this.calculateTotalDuration();

    this.occurrenceNumber = data.occurrenceNumber ?? null;

    this.createdAt = data.createdAt ?? null;
    this.updatedAt = data.updatedAt ?? null;
  }

  calculateDuration(start, end) {
    if (!start || !end) return 0;

    const [sh, sm] = start.slice(0, 5).split(':').map(Number);
    const [eh, em] = end.slice(0, 5).split(':').map(Number);

    return (eh * 60 + em) - (sh * 60 + sm);
  }

  calculateTotalDuration() {
    return this.timeBlocks.reduce((sum, b) => sum + (b.durationMinutes ?? 0), 0);
  }

  isValid() {
    if (!this.laboratoryId) return false;
    if (!this.requestedByUserId) return false;
    if (!this.reservationDate) return false;

    if (!Array.isArray(this.timeBlocks) || this.timeBlocks.length === 0) {
      return false;
    }

    return true;
  }

  get startTime() {
    return this.timeBlocks[0]?.startTime ?? null
  }

  get endTime() {
    return this.timeBlocks.at(-1)?.endTime ?? null
  }

  toJSON() {
    return {
      laboratoryId: this.laboratoryId,
      requestedByUserId: this.requestedByUserId,
      requestedByName: this.requestedByName,
      reservationDate: this.reservationDate,
      purpose: this.purpose,
      status: this.status,
      notes: this.notes,
      timeBlocks: this.timeBlocks.map(b => ({
        startTime: b.startTime,
        endTime: b.endTime,
        blockOrder: b.blockOrder,
        durationMinutes: b.durationMinutes
      }))
    };
  }

  matchesSearch(searchTerm) {
    if (!searchTerm) return true;

    const term = searchTerm.toLowerCase();

    const fields = [
      this.requestedByName?.toLowerCase() ?? '',
      this.laboratoryName?.toLowerCase() ?? '',
      this.purpose?.toLowerCase() ?? '',
      this.status?.toLowerCase() ?? ''
    ];

    return fields.some(field => field.includes(term));
  }
}