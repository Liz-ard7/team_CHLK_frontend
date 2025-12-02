<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth';
import { MemoryService, GroupService, type ID } from '../api/services';

const route = useRoute();
const router = useRouter();
const auth = useAuthStore();
const selectedGroup = ref('');
const memoryTitle = ref('');
const userGroups = ref<Array<{id: ID, name: string}>>([]);

onMounted(async () => {
  if (!auth.userId) return;
  try {
    // Load memory details
    const memoryId = route.params.id as string;
    const memRes = await MemoryService.get(memoryId);
    const memory = memRes[0]?.memory;
    if (memory) {
      memoryTitle.value = memory.title;
      selectedGroup.value = memory.group;
    }

    // Load user groups
    const groupsRes = await GroupService.listForUser(auth.userId);
    const groupIds = groupsRes[0]?.groups || [];

    const groupDetails = await Promise.all(
      groupIds.map(async (gid: string) => {
        try {
          const details = await GroupService.getDetails(gid);
          return { id: gid, name: details[0]?.groupName || gid };
        } catch {
          return { id: gid, name: gid };
        }
      })
    );
    userGroups.value = groupDetails;
  } catch (err) {
    console.error('Failed to load memory:', err);
  }
});

const isFormValid = computed(() => {
  return (
    selectedGroup.value.trim() !== '' &&
    memoryTitle.value.trim() !== ''
  );
});

async function editMemory() {
  if (!isFormValid.value || !auth.userId) return;

  try {
    const memoryId = route.params.id as string;
    await MemoryService.editTitle(memoryId, auth.userId, memoryTitle.value);
    router.push(`/memory/${memoryId}`);
  } catch (err) {
    console.error('Failed to edit memory:', err);
    alert('Failed to edit memory. Please try again.');
  }
}

async function deleteMemory() {
  if (!confirm('Are you sure you want to delete this memory?')) return;
  if (!auth.userId) return;

  try {
    const memoryId = route.params.id as string;
    await MemoryService.deleteMemory(memoryId, auth.userId);
    router.push('/timeline');
  } catch (err) {
    console.error('Failed to delete memory:', err);
    alert('Failed to delete memory. Please try again.');
  }
}
</script>

<template>
  <div class="edit-memory">
    <div class="header">
      <h1>Edit Memory</h1>
      <button type="button" class="delete-btn" @click="deleteMemory">Delete Memory</button>
    </div>
    <form class="memory-form" @submit.prevent="editMemory">
      <div class="form-row">
        <label for="groupSelect">Group</label>
        <select id="groupSelect" v-model="selectedGroup" required disabled>
          <option value="" disabled>Select a group</option>
          <option v-for="group in userGroups" :key="group.id" :value="group.id">
            {{ group.name }}
          </option>
        </select>
        <small class="hint">Group cannot be changed after creation</small>
      </div>
      <div class="form-row">
        <label for="memoryTitle">Title</label>
        <input
          id="memoryTitle"
          v-model="memoryTitle"
          type="text"
          placeholder="Memory title"
          required
        />
      </div>
      <div class="actions">
        <button type="submit" class="edit-btn" :disabled="!isFormValid">Save Changes</button>
      </div>
    </form>
  </div>
</template>

<style scoped>
.edit-memory {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  max-width: 600px;
  margin: 0 auto;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.header h1 {
  margin: 0;
  font-family: 'Italianno', 'Caveat', cursive;
  font-size: 2.5rem;
  color: var(--brown);
}

.delete-btn {
  background: #dc2626;
  color: #fff;
  border: none;
  padding: 0.6rem 1.2rem;
  font-size: 0.9rem;
  border-radius: 8px;
  cursor: pointer;
  box-shadow: 0 2px 4px rgba(0,0,0,0.2);
  font-weight: 600;
  transition: background 0.2s;
}

.delete-btn:hover {
  background: #b91c1c;
}

.memory-form {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  background: var(--beige);
  padding: 1.25rem 1.5rem 4rem;
  border: 4px double var(--olive-green);
  border-radius: 12px;
  position: relative;
  box-shadow: 0 4px 12px rgba(139, 115, 85, 0.2);
}

.form-row {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-row label {
  font-weight: 600;
  color: var(--brown);
  font-size: 0.95rem;
}

.form-row input[type="text"],
.form-row select {
  padding: 0.6rem 0.75rem;
  border: 2px solid var(--olive-green);
  border-radius: 8px;
  font-size: 0.95rem;
  background: var(--cream);
  color: var(--brown);
}

.form-row input[type="text"]:focus,
.form-row select:focus {
  outline: none;
  border-color: var(--brown);
  box-shadow: 0 0 0 3px rgba(155, 168, 130, 0.2);
}

.form-row select {
  cursor: pointer;
}

.form-row select:disabled {
  background: var(--beige);
  opacity: 0.7;
  cursor: not-allowed;
}

.hint {
  font-size: 0.75rem;
  color: var(--brown);
  opacity: 0.7;
}

.actions {
  position: absolute;
  bottom: 1rem;
  right: 1rem;
}

.edit-btn {
  background: var(--olive-green);
  color: var(--cream);
  border: none;
  padding: 0.6rem 1.1rem;
  font-size: 0.9rem;
  border-radius: 8px;
  cursor: pointer;
  box-shadow: 0 2px 4px rgba(139, 115, 85, 0.2);
  font-weight: 600;
  transition: background 0.2s;
}

.edit-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.edit-btn:not(:disabled):hover {
  background: var(--brown);
}

.error {
  color: #dc2626;
  font-size: 0.75rem;
  margin-top: -0.25rem;
}
</style>
