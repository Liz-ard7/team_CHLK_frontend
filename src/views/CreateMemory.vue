<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth';
import { GroupService, MemoryService } from '../api/services';

const auth = useAuthStore();
const router = useRouter();
const title = ref('');
const selectedGroup = ref('');
const date = ref(''); // Stored but not used in Concept as per spec
const myGroups = ref<any[]>([]);

onMounted(async () => {
  if (!auth.userId) return;
  const res = await GroupService.listForUser(auth.userId);
  // Fetch details to get names for dropdown
  const ids = res[0].groups;
  const details = await Promise.all(ids.map(id => GroupService.getDetails(id)));
  myGroups.value = details.map((d, i) => ({ ...d[0], id: ids[i] }));
});

const create = async () => {
    if(!auth.userId) return;
    await MemoryService.create(auth.userId, selectedGroup.value, title.value);
    router.push('/timeline');
}
</script>

<template>
  <div>
    <h1>Create Memory</h1>
    <select v-model="selectedGroup">
        <option disabled value="">Select Group</option>
        <option v-for="g in myGroups" :key="g.id" :value="g.id">{{ g.groupName }}</option>
    </select>
    <input type="date" v-model="date" />
    <input v-model="title" placeholder="Memory Title" />
    <button @click="create">Create Memory!</button>
  </div>
</template>
