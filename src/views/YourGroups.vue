<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';
import { useRoute } from 'vue-router';
import { useAuthStore } from '../stores/auth';
import { GroupService } from '../api/services';

const auth = useAuthStore();
const route = useRoute();
const groups = ref<any[]>([]);

const loadGroups = async () => {
  if (!auth.userId) return;
  try {
    const res = await GroupService.listForUser(auth.userId);
    // Fetch details for names
    const ids = res[0].groups;
    const details = await Promise.all(ids.map(id => GroupService.getDetails(id)));
    groups.value = details.map((d, i) => ({ ...d[0], id: ids[i] }));
  } catch (error) {
    console.error('Failed to load groups:', error);
  }
};

onMounted(loadGroups);

// Reload groups when route changes (e.g., navigating back to this page)
watch(() => route.path, () => {
  if (route.name === 'YourGroups') {
    loadGroups();
  }
});

const leaveGroup = async (id: string, name: string) => {
  if(confirm(`Are you sure you want to leave ${name}?`)) {
    if (!auth.userId) return;
    try {
      await GroupService.leave(auth.userId, id);
      // Remove the group from the list reactively
      groups.value = groups.value.filter(g => g.id !== id);
    } catch (error) {
      console.error('Failed to leave group:', error);
      alert(`Failed to leave group: ${error}`);
    }
  }
};

function getRotation(index: number): number {
  const rotations = [-1, 1.5, -1.5, 1, -0.5, 0.5];
  const len = rotations.length;
  const i = ((index % len) + len) % len;
  return rotations[i] ?? 0;
}
</script>

<template>
  <div class="your-groups">
    <h1>Your Groups</h1>
    <ul class="groups-list">
      <li 
        v-for="(g, index) in groups" 
        :key="g.id" 
        class="group-item"
        :style="{ transform: `rotate(${getRotation(index)}deg)` }"
      >
        <router-link :to="`/groups/${g.id}`">{{ g.groupName }}</router-link>
        <button class="leave-btn" @click="leaveGroup(g.id, g.groupName)">Leave</button>
      </li>
    </ul>
  </div>
</template>

<style scoped>
.your-groups {
  max-width: 700px;
  margin: 0 auto;
}

.your-groups h1 {
  font-family: 'Italianno', 'Caveat', cursive;
  font-size: 2.5rem;
  color: var(--brown);
  margin-bottom: 30px;
}

.groups-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.group-item { 
  display: flex; 
  justify-content: space-between; 
  align-items: center;
  padding: 20px; 
  margin-bottom: 15px;
  background: var(--beige);
  border: 4px double var(--olive-green);
  border-radius: 12px;
  box-shadow: 0 4px 8px rgba(139, 115, 85, 0.15);
  transition: transform 0.3s ease;
}

.group-item:hover {
  transform: rotate(0deg) scale(1.02) !important;
}

.group-item a {
  text-decoration: none;
  color: var(--brown);
  font-size: 1.2rem;
  font-weight: 600;
  flex: 1;
}

.group-item a:hover {
  color: var(--olive-green);
}

.leave-btn { 
  background: var(--brown); 
  color: var(--cream);
  font-size: 0.85rem; 
  padding: 8px 16px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 600;
  transition: background 0.2s;
}

.leave-btn:hover {
  background: #6b5a42;
}
</style>
