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
    return this.content && this.content.trim().length > 0
  }

  isEdited() {
    return this.editedAt !== null
  }

  score() {
    return this.upvotes - this.downvotes
  }

  toJSON() {
    return {
      content: this.content,
      rating: this.rating
    }
  }

}