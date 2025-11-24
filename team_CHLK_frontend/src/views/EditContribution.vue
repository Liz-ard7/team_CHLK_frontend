<script setup lang="ts">
import { ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { MemoryService } from '../api/services';
import { useAuthStore } from '../stores/auth';

const route = useRoute();
const router = useRouter();
const auth = useAuthStore();

const description = ref('');
// In a real app, pre-fill this data by fetching the memory first

const submit = async () => {
  if (!auth.userId) return;
  await MemoryService.editContribution(route.params.id as string, auth.userId, description.value);
  router.push(`/memory/${route.params.id}`);
};
</script>

<template>
  <div>
    <h1>Edit Contribution</h1>
    <textarea v-model="description" placeholder="Update your memory..."></textarea>
    <!-- Image editing simplified for this demo -->
    <button @click="submit">Edit Contribution!</button>
  </div>
</template>
