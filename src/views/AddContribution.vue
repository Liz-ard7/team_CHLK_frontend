<script setup lang="ts">
import { ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { MemoryService } from '../api/services';
import { useAuthStore } from '../stores/auth';

const route = useRoute();
const router = useRouter();
const auth = useAuthStore();

const description = ref('');
const imageUrls = ref(''); // Simple text input for comma-sep URLs for now

const submit = async () => {
  if (!auth.userId) return;
  await MemoryService.addContribution(route.params.id as string, auth.userId, description.value, imageUrls.value);
  router.push(`/memory/${route.params.id}`);
};
</script>

<template>
  <div>
    <h1>Add Contribution</h1>
    <textarea v-model="description" placeholder="Write your memory..."></textarea>
    <input v-model="imageUrls" placeholder="Image URLs (comma separated)" />
    <button @click="submit">Create Contribution!</button>
  </div>
</template>
