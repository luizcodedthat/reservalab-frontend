import { commentVoteApi } from '@/api/commentVoteApi'

class CommentVoteService {

  async vote(commentId, type) {
    if (!commentId || !type) {
      throw new Error('Parâmetros inválidos para vote')
    }

    await commentVoteApi.vote(commentId, type)
    return true
  }

  async removeVote(commentId) {
    if (!commentId) {
      throw new Error('commentId é obrigatório para removeVote')
    }

    await commentVoteApi.removeVote(commentId)
    return true
  }
}

export default new CommentVoteService()