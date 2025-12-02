<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { MemoryService, ImageService, type Memory } from '../api/services';
import { useAuthStore } from '../stores/auth';

const route = useRoute();
const auth = useAuthStore();
const memory = ref<Memory | null>(null);
const imageUrls = ref<Record<string, string>>({}); // Map object path to signed URL

onMounted(async () => {
  const res = await MemoryService.get(route.params.id as string);
  if (res[0]) {
    memory.value = res[0].memory;
    // Fetch signed URLs for all images
    await loadImageUrls();
  }
});

const loadImageUrls = async () => {
  if (!memory.value || !auth.userId) return;
  
  for (const contribution of memory.value.contributions) {
    const urls = getImageUrls(contribution.imageUrls);
    for (const objectPath of urls) {
      try {
        // Get signed view URL for each image
        const result = await ImageService.getViewUrl(auth.userId, objectPath);
        imageUrls.value[objectPath] = result.url;
      } catch (err) {
        console.error('Failed to get signed URL for:', objectPath, err);
        // Use placeholder on error
        imageUrls.value[objectPath] = 'https://via.placeholder.com/100?text=Error';
      }
    }
  }
};

const getSignedUrl = (objectPath: string): string => {
  return imageUrls.value[objectPath] || 'https://via.placeholder.com/100?text=Loading';
};

const isMyContribution = (uid: string) => uid === auth.userId;

// Parse imageUrls - backend stores as comma-separated string, but we need array
const getImageUrls = (imageUrls: string | string[]): string[] => {
  if (Array.isArray(imageUrls)) return imageUrls;
  if (!imageUrls || imageUrls.trim() === '') return [];
  return imageUrls.split(',').map(url => url.trim()).filter(url => url.length > 0);
};
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
          <img v-for="img in getImageUrls(c.imageUrls)" :src="getSignedUrl(img)" :key="img" class="thumb"/>
        </div>
        <div v-if="isMyContribution(c.user)">
          <router-link :to="`/memory/${memory.memoryID}/contribute/edit/${idx}`"><button>Edit Contribution</button></router-link>
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
