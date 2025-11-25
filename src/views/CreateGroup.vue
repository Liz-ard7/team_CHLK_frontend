<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth';
import { GroupService } from '../api/services';

const auth = useAuthStore();
const router = useRouter();
const groupName = ref('');
const inviteDraft = ref('');
const selectedUsers = ref<string[]>([]);
const suggestionsSource = ref<string[]>([]); // Will be populated via backend
const highlightedIndex = ref(-1);
const userEditedName = ref(false);

watch(groupName, (val, old) => {
  if (old !== undefined && val !== `${auth.username}'s group`) {
    userEditedName.value = true;
  }
});

watch(() => auth.username, (newName) => {
  if (!userEditedName.value && newName) {
    groupName.value = `${newName}'s group`;
  }
});

const filteredSuggestions = computed(() => {
  const q = inviteDraft.value.trim().toLowerCase();
  if (!q) return [];
  return suggestionsSource.value.filter((u: string) =>
    u.toLowerCase().includes(q) && !selectedUsers.value.includes(u)
  ).slice(0, 10);
});

watch(inviteDraft, (v) => {
  if (!v.trim()) highlightedIndex.value = -1;
});

function addInvite(value?: string) {
  const v = (value || inviteDraft.value).trim();
  if (!v) return;
  const match = suggestionsSource.value.find((u: string) => u.toLowerCase() === v.toLowerCase());
  const final = match || v;
  if (!selectedUsers.value.includes(final)) selectedUsers.value.push(final);
  inviteDraft.value = '';
  highlightedIndex.value = -1;
}

function removeInvite(index: number) {
  selectedUsers.value.splice(index, 1);
}

function onKeyDown(e: KeyboardEvent) {
  const list = filteredSuggestions.value;
  const validKeys = ['ArrowDown','ArrowUp','Enter','Escape'];
  if (validKeys.indexOf(e.key) !== -1) e.preventDefault();
  if (e.key === 'ArrowDown') {
    if (!list.length) return;
    highlightedIndex.value = (highlightedIndex.value + 1) % list.length;
  } else if (e.key === 'ArrowUp') {
    if (!list.length) return;
    highlightedIndex.value = (highlightedIndex.value - 1 + list.length) % list.length;
  } else if (e.key === 'Enter') {
    if (highlightedIndex.value >= 0 && list[highlightedIndex.value]) {
      addInvite(list[highlightedIndex.value]);
    } else if (list.length === 1) {
      addInvite(list[0]);
    } else {
      const exact = list.find((u: string) => u.toLowerCase() === inviteDraft.value.trim().toLowerCase());
      if (exact) addInvite(exact);
    }
  } else if (e.key === 'Escape') {
    inviteDraft.value = '';
    highlightedIndex.value = -1;
  }
}

function selectSuggestion(user: string) {
  addInvite(user);
}

async function createGroup() {
  if (!auth.userId) return;

  const finalName = groupName.value.trim() || `${auth.username}'s group`;

  try {
    // 1. Create Group
    const res = await GroupService.create(auth.userId, finalName);
    const gid = res.group;

    // 2. Invite users
    for (const userIdOrName of selectedUsers.value) {
      try {
        await GroupService.invite(auth.userId, gid, userIdOrName);
      } catch (err) {
        console.warn(`Failed to invite ${userIdOrName}:`, err);
      }
    }

    // Navigate to new group
    router.push(`/groups/${gid}`);
  } catch (err) {
    console.error('Failed to create group:', err);
  }
}
</script>

<template>
  <div class="create-group">
    <h1>Create a Group</h1>
    <form class="group-form" @submit.prevent="createGroup">
      <div class="form-row">
        <label for="groupName">Name</label>
        <input
          id="groupName"
          v-model="groupName"
          type="text"
          :placeholder="`${auth.username}'s group`"
          required
        />
      </div>
      <div class="form-row">
        <label>Users to Invite</label>
        <div class="invite-input-wrapper">
          <div class="chips">
            <span v-for="(user, idx) in selectedUsers" :key="user" class="chip">
              {{ user }}
              <button type="button" aria-label="Remove" @click="removeInvite(idx)">×</button>
            </span>
          </div>
          <input
            v-model="inviteDraft"
            type="text"
            placeholder="Start typing a username or user ID"
            @keydown="onKeyDown"
          />
          <ul v-if="filteredSuggestions.length" class="suggestions">
            <li
              v-for="(user, idx) in filteredSuggestions"
              :key="user"
              :class="['suggestion', { highlighted: idx === highlightedIndex }]"
              @mousedown.prevent="selectSuggestion(user)"
            >{{ user }}</li>
          </ul>
        </div>
        <small class="hint">Type to search. Arrow keys navigate. Enter adds highlighted. Click × to remove.</small>
      </div>
      <div class="actions">
        <button type="submit" class="create-btn">Create!</button>
      </div>
    </form>
  </div>
</template>

<style scoped>
.create-group {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}
.group-form {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  background: #fafafa;
  padding: 1.25rem 1.5rem 2.5rem;
  border: 1px solid #ddd;
  border-radius: 8px;
  position: relative;
}
.form-row {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}
.form-row label {
  font-weight: 600;
}
.form-row input[type="text"] {
  padding: 0.5rem 0.75rem;
  border: 1px solid #ccc;
  border-radius: 6px;
  font-size: 0.95rem;
}
.invite-input-wrapper {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}
.chips {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}
.chip {
  background: #e0f0ff;
  border: 1px solid #b5d8f5;
  color: #045381;
  padding: 0.25rem 0.5rem;
  border-radius: 16px;
  font-size: 0.75rem;
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
}
.chip button {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 0.9rem;
  line-height: 1;
  color: #045381;
}
.hint {
  font-size: 0.7rem;
  color: #666;
}
.actions {
  position: absolute;
  bottom: 1rem;
  right: 1rem;
}
.create-btn {
  background: #3b82f6;
  color: #fff;
  border: none;
  padding: 0.6rem 1.1rem;
  font-size: 0.9rem;
  border-radius: 6px;
  cursor: pointer;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}
.create-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
.create-btn:not(:disabled):hover {
  background: #1d64d9;
}
.suggestions {
  list-style: none;
  margin: 0;
  padding: 0;
  border: 1px solid #ccc;
  border-radius: 6px;
  background: #fff;
  max-height: 180px;
  overflow-y: auto;
  box-shadow: 0 2px 6px rgba(0,0,0,0.1);
}
.suggestion {
  padding: 0.4rem 0.6rem;
  cursor: pointer;
  font-size: 0.85rem;
}
.suggestion:hover,
.suggestion.highlighted {
  background: #eef6ff;
}
</style>
