<script setup lang="ts">
import { ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth';
import { MemoryService } from '../api/services';

const route = useRoute();
const router = useRouter();
const auth = useAuthStore();
const title = ref('');
const date = ref('');

const save = async () => {
    if(!auth.userId) return;
    await MemoryService.editTitle(route.params.id as string, auth.userId, title.value);
    router.push(`/memory/${route.params.id}`);
}

const remove = async () => {
    if(!auth.userId) return;
    await MemoryService.deleteMemory(route.params.id as string, auth.userId);
    router.push('/timeline');
}
</script>

<template>
  <div>
    <div style="display:flex; justify-content: space-between">
        <h1>Edit Memory</h1>
        <button @click="remove" style="background: red;">Delete Memory</button>
    </div>

    <input type="date" v-model="date" />
    <input v-model="title" placeholder="New Title" />
    <button @click="save">Edit Memory!</button>
  </div>
</template>
