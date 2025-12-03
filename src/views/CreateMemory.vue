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
  if (!auth.userId) return;
  const day = date.value && date.value.trim() ? date.value.trim() : undefined; // YYYY-MM-DD
  await MemoryService.create(auth.userId, selectedGroup.value, title.value, day);
  router.push('/timeline');
}
</script>

<template>
  <div class="create-memory">
    <h1>Create Memory</h1>
    <form @submit.prevent="create" class="memory-form">
      <div class="form-row">
        <label for="groupSelect">Group</label>
        <select id="groupSelect" v-model="selectedGroup" required>
          <option disabled value="">Select Group</option>
          <option v-for="g in myGroups" :key="g.id" :value="g.id">{{ g.groupName }}</option>
        </select>
      </div>
      <div class="form-row">
        <label for="dateInput">Date</label>
        <input id="dateInput" type="date" v-model="date" />
      </div>
      <div class="form-row">
        <label for="titleInput">Memory Title</label>
        <input id="titleInput" v-model="title" placeholder="Memory Title" required />
      </div>
      <div class="actions">
        <button type="submit">Create Memory!</button>
      </div>
    </form>
  </div>
</template>

<style scoped>
.create-memory {
  max-width: 600px;
  margin: 0 auto;
}

.create-memory h1 {
  font-family: 'Italianno', 'Caveat', cursive;
  font-size: 2.5rem;
  color: var(--brown);
  margin-bottom: 20px;
}

.memory-form {
  background: var(--beige);
  border: 4px double var(--olive-green);
  border-radius: 12px;
  padding: 30px;
  box-shadow: 0 4px 12px rgba(139, 115, 85, 0.2);
}

.form-row {
  margin-bottom: 20px;
}

.form-row label {
  display: block;
  margin-bottom: 8px;
  color: var(--brown);
  font-weight: 600;
  font-size: 0.95rem;
}

.form-row select,
.form-row input {
  background: var(--cream);
  border: 2px solid var(--olive-green);
  color: var(--brown);
  padding: 10px;
  border-radius: 6px;
  width: 100%;
  box-sizing: border-box;
}

.form-row select:focus,
.form-row input:focus {
  outline: none;
  border-color: var(--brown);
  box-shadow: 0 0 0 3px rgba(155, 168, 130, 0.2);
}

.actions {
  margin-top: 30px;
  text-align: right;
}

.actions button {
  background: var(--olive-green);
  color: var(--cream);
  padding: 12px 24px;
  font-size: 1rem;
  font-weight: 600;
  border-radius: 6px;
}

.actions button:hover {
  background: var(--brown);
}
</style>
