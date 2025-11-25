<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { MemoryService, type Memory } from '../api/services';
import { useAuthStore } from '../stores/auth';

const route = useRoute();
const auth = useAuthStore();
const memory = ref<Memory | null>(null);

onMounted(async () => {
  const res = await MemoryService.get(route.params.id as string);
  if (res[0]) memory.value = res[0].memory;
});

const isMyContribution = (uid: string) => uid === auth.userId;
</script>

<template>
  <div v-if="memory">
    <div class="header">
      <router-link :to="`/memory/${memory.memoryID}/edit`">
        <h1>{{ memory.title }} ✏️</h1>
      </router-link>
    </div>

    <div class="contributions">
      <div v-for="(c, idx) in memory.contributions" :key="idx" class="contribution">
        <div class="user-header">
           <!-- Link to profile -->
           <router-link :to="`/profile/${c.user}`">👤 User: {{ c.user }}</router-link>
        </div>
        <p>{{ c.description }}</p>
        <div class="images">
          <img v-for="img in c.imageUrls" :src="img" :key="img" class="thumb"/>
        </div>
        <div v-if="isMyContribution(c.user)">
          <router-link :to="`/memory/${memory.memoryID}/contribute/edit`"><button>Edit Contribution</button></router-link>
        </div>
      </div>
    </div>

    <div class="actions">
      <router-link :to="`/memory/${memory.memoryID}/contribute`">
        <button>Add Contribution</button>
      </router-link>
    </div>
  </div>
  <div v-else>Loading...</div>
</template>

<style scoped>
.contribution { border: 1px solid #eee; padding: 15px; margin-bottom: 15px; border-radius: 8px; }
.thumb { width: 100px; height: 100px; object-fit: cover; margin-right: 5px; }
</style>
