<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useAuthStore } from '../stores/auth';
import { GroupService, MemoryService } from '../api/services';

const auth = useAuthStore();
const groups = ref<any[]>([]);

onMounted(async () => {
  if (!auth.userId) return;
  const res = await GroupService.listForUser(auth.userId);
  // Fetch details for names
  const ids = res[0].groups;
  const details = await Promise.all(ids.map(id => GroupService.getDetails(id)));
  groups.value = details.map((d, i) => ({ ...d[0], id: ids[i] }));
});

const leaveGroup = async (id: string, name: string) => {
  if(confirm(`Are you sure you want to leave ${name}?`)) {
    if (!auth.userId) return;
    await GroupService.leave(auth.userId, id);
    window.location.reload(); // Refresh
  }
};
</script>

<template>
  <div>
    <h1>Your Groups</h1>
    <ul>
      <li v-for="g in groups" :key="g.id" class="group-item">
        <router-link :to="`/groups/${g.id}`">{{ g.groupName }}</router-link>
        <button class="leave-btn" @click="leaveGroup(g.id, g.groupName)">Leave</button>
      </li>
    </ul>
  </div>
</template>

<style scoped>
.group-item { display: flex; justify-content: space-between; padding: 10px; border-bottom: 1px solid #ddd; }
.leave-btn { background: #dc3545; font-size: 0.8rem; padding: 5px 10px; }
</style>
