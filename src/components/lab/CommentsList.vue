<script setup>
import { onMounted, ref, watch } from 'vue'; // ✅ Bug 3: watch importado
import { useRoute } from 'vue-router';
import CommentCard from './CommentCard.vue';
import { useCommentStore } from '@/stores/useCommentStore';
import { useUserStore } from '@/stores/useUserStore';
import { Leaf, Loader2 } from 'lucide-vue-next';

const route = useRoute();
const commentStore = useCommentStore();
const userStore = useUserStore();

const labId = route.params.id;
const labComments = ref([]);


watch(
    () => commentStore.commentsByLab[labId],
    async (comments) => {
        if (!comments) return;

        labComments.value = await Promise.all(
            comments.map(async (c) => {
                const user = await userStore.loadUser(c.authorId);
                return {
                    ...c,
                    profilePicture: user?.picture || null,
                };
            })
        );
    },
    { deep: true, immediate: true }
);

onMounted(async () => {

    await commentStore.loadComments(labId);
});
</script>

<template>
    <div class="cards-list">

        <CommentCard
            v-for="comment in labComments.slice().sort((a, b) => b.upvotes.length - a.upvotes.length)"
            :key="comment.id"
            :authorName="comment.authorName"
            :profilePicture="comment.profilePicture"
            :commentText="comment.content"
            :upvoteCount="comment.upvotes.length"
        />
    </div>

    <div v-if="commentStore.loading || labComments.length === 0" class="loading-or-empty">
        <div class="message-box" v-if="commentStore.loading">
            <Loader2 size="48" color="#64748B" />
            <p class="not-loaded-text">Carregando comentários...</p>
        </div>
        <div class="message-box" v-else>
            <Leaf size="48" color="#64748B" />
            <p class="not-loaded-text">Seja o primeiro a comentar!</p>
        </div>
    </div>
</template>

<style scoped>
.cards-list {
    padding: 10px 0;
}

.loading-or-empty {
    margin: 20px 0;
    display: flex;
    align-items: center;
    flex-direction: column;
}

.message-box {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
}

.message-box p {
    color: hsl(215, 19%, 35%);
}
</style>
