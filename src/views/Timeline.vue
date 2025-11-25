<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useAuthStore } from '../stores/auth';
import { GroupService, MemoryService, type Memory } from '../api/services';

const auth = useAuthStore();
const memories = ref<Memory[]>([]);
const loading = ref(true);

onMounted(async () => {
  if (!auth.userId) return;
  try {
    // 1. Get user groups
    const groupsRes = await GroupService.listForUser(auth.userId);
    const groupIds = groupsRes[0].groups;

    // 2. Get memories for all groups (Naive implementation for init)
    const allMemories: Memory[] = [];
    for (const gid of groupIds) {
      const memsRes = await MemoryService.listForGroup(gid);
      const memIds = memsRes[0].memories;
      for (const mid of memIds) {
        const detail = await MemoryService.get(mid);
        if (detail[0]?.memory) allMemories.push(detail[0].memory);
      }
    }
    memories.value = allMemories; // In a real app, sort by date/ID
  } catch (e) {
    console.error(e);
  } finally {
    loading.value = false;
  }
});
</script>

<template>
  <div>
    <h1>Welcome back, {{ auth.username }}</h1>

    <div class="content-area">
      <div class="timeline-feed">
        <div v-if="loading">Loading timeline...</div>
        <div v-else-if="memories.length === 0">No memories found. Join a group!</div>

        <div v-for="mem in memories" :key="mem.memoryID" class="memory-card">
          <router-link :to="`/memory/${mem.memoryID}`">
            <h3>{{ mem.title }}</h3>
            <p>{{ mem.contributions.length }} Contributions</p>
          </router-link>
        </div>
      </div>

      <div class="sidebar">
        <h3>Notifications</h3>
        <p>No new invites.</p>
      </div>
    </div>

    <div class="bottom-actions">
      <router-link to="/groups/create"><button>Create Group</button></router-link>
      <router-link to="/memory/create"><button>Create Memory</button></router-link>
      <router-link to="/groups"><button>Your Groups</button></router-link>
    </div>
  </div>
</template>

<style scoped>
.content-area { display: flex; gap: 20px; }
.timeline-feed { flex: 2; }
.sidebar { flex: 1; background: #eee; padding: 10px; border-radius: 4px; }
.memory-card { border: 1px solid #ddd; padding: 15px; margin-bottom: 10px; border-radius: 5px; }
.memory-card a { text-decoration: none; color: inherit; }
.bottom-actions { position: fixed; bottom: 0; left: 0; width: 100%; background: white; border-top: 1px solid #ccc; padding: 15px; display: flex; justify-content: center; gap: 10px; }
</style>
