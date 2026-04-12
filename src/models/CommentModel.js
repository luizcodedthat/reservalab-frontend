export class Comment {

  constructor(data = {}) {
    this.id = data.id ?? null

    this.authorId = data.authorId ?? null
    this.authorName = data.authorName ?? ''


    this.content = data.content ?? ''

    this.rating = data.rating ?? null

    this.upvotes = data.upvotes ?? 0
    this.downvotes = data.downvotes ?? 0

    this.editedAt = data.editedAt ?? null
    this.createdAt = data.createdAt ?? null
  }

  isValid() {
    if (!this.authorId) return false
    if (!this.content || !this.content.trim()) return false

    return true
  }

  isEdited() {
    return this.editedAt !== null
  }

  score() {
    return this.upvotes - this.downvotes
  }

  toJSON() {
    return {
      authorId: this.authorId,
      authorName: this.authorName,
      content: this.content,
      rating: this.rating
    }
  }

}
