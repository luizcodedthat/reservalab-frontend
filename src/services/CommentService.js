import { commentApi } from "@/api/commentApi";
import { Comment } from "@/models/CommentModel";

class CommentService {

  async getByLab(labId, page = 0, size = 20) {
    const response = await commentApi.getCommentsByLab(labId, page, size);

    const docs = response.data.content || [];

    return docs.map(doc => new Comment(doc));
  }

  async getAll(page = 0, size = 20) {
    const response = await commentApi.getAll(page, size);

    const docs = response.data.content || [];

    return docs.map(doc => new Comment(doc));
  }

  async create(commentData) {
    const comment = new Comment(commentData);

    if (!comment.isValid()) {
      throw new Error("Objeto Comment inválido");
    }

    const response = await commentApi.create(comment.toJSON());

    return new Comment(response.data);
  }

  async update(id, fields) {
    const response = await commentApi.update(id, fields);
    return new Comment(response.data);
  }

  async delete(id) {
    await commentApi.delete(id);
    return true;
  }
}

export default new CommentService();