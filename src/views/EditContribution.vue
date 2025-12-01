<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { MemoryService } from '../api/services';
import { useAuthStore } from '../stores/auth';

const route = useRoute();
const router = useRouter();
const auth = useAuthStore();

const description = ref('');
const contributionIndex = ref(parseInt(route.params.idx as string));

// Pre-fill the description from the existing contribution
onMounted(async () => {
  const res = await MemoryService.get(route.params.id as string);
  if (res[0]?.memory) {
    const contribution = res[0].memory.contributions[contributionIndex.value];
    if (contribution) {
      description.value = contribution.description;
    }
  }
});

const submit = async () => {
  if (!auth.userId) return;
  await MemoryService.editContribution(
    route.params.id as string,
    contributionIndex.value,
    auth.userId,
    description.value
  );
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
