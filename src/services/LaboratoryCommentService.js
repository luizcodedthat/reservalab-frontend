import { laboratoryCommentApi } from '@/api/laboratoryCommentApi'
import { LaboratoryComment } from '@/models/LaboratoryCommentModel'

class LaboratoryCommentService {

  async getByLaboratory(laboratoryId, page = 0, size = 20) {
    const response = await laboratoryCommentApi.getByLaboratory(
      laboratoryId,
      page,
      size
    )

    const docs = response.data.content || []

    return docs.map(doc => new LaboratoryComment({
      id: doc.id,
      authorId: doc.authorId,
      authorName: doc.authorName,
      content: doc.content,
      upvotes: doc.upvotes ?? 0,
      downvotes: doc.downvotes ?? 0,
      userVote: doc.userVote ?? null,
      editedAt: doc.editedAt ? new Date(doc.editedAt).getTime() : null,
      createdAt: doc.createdAt ? new Date(doc.createdAt).getTime() : null
    }))
  }

  async create(laboratoryId, commentData) {
    if (!commentData.content || !commentData.content.trim()) {
      throw new Error('Conteúdo do comentário inválido')
    }

    const response = await laboratoryCommentApi.create(
      laboratoryId,
      { content: commentData.content }
    )

    return new LaboratoryComment({
      id: response.data.id,
      authorId: response.data.authorId,
      authorName: response.data.authorName,
      content: response.data.content,
      upvotes: response.data.upvotes ?? 0,
      downvotes: response.data.downvotes ?? 0,
      userVote: response.data.userVote ?? null,
      editedAt: response.data.editedAt ? new Date(response.data.editedAt).getTime() : null,
      createdAt: response.data.createdAt ? new Date(response.data.createdAt).getTime() : null
    })
  }

  async delete(laboratoryId, commentId) {
    await laboratoryCommentApi.delete(laboratoryId, commentId)
    return true
  }
}

export default new LaboratoryCommentService()