import { commentApi } from '@/api/commentApi'
import { Comment } from '@/models/CommentModel'

class CommentService {

  async getByTicket(ticketId, page = 0, size = 20) {
    const response = await commentApi.getByTicket(ticketId, page, size)
    const docs = response.data.content || []
    return docs.map(doc => new Comment({
      id:         doc.id,
      authorId:   doc.authorId,
      authorName: doc.authorName,
      content:    doc.content,
      createdAt:  doc.createdAt ? new Date(doc.createdAt).getTime() : null,
      upvotes:    0,
      downvotes:  0
    }))
  }

  async create(ticketId, commentData) {
    const comment = new Comment(commentData)

    if (!comment.isValid()) {
      throw new Error('Objeto Comment inválido')
    }

    const response = await commentApi.create(ticketId, {
      userId:  comment.authorId,
      content: comment.content
    })

    return new Comment({
      id:         response.data.id,
      authorId:   response.data.authorId,
      authorName: response.data.authorName,
      content:    response.data.content,
      createdAt:  response.data.createdAt ? new Date(response.data.createdAt).getTime() : null
    })
  }

  async delete(ticketId, commentId) {
    await commentApi.delete(ticketId, commentId)
    return true
  }
}

export default new CommentService()
