import api from './http'

export const commentApi = {

    getCommentsByLab(labId, page = 0, size = 20) {
        return api.get(`/laboratories/${labId}/comments`, {
            params: {
                page,
                size
            }
        })
    }

}