<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth';
import { GroupService, AuthService, type ID } from '../api/services';

const auth = useAuthStore();
const router = useRouter();
const groupName = ref('');
const inviteDraft = ref('');
const selectedUsers = ref<string[]>([]);
const suggestionsSource = ref<string[]>([]); // Will be populated via backend
const highlightedIndex = ref(-1);
const userEditedName = ref(false);
const selectionMade = ref(false);
const suggestionsActive = ref(false);

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

// Query helpers for suggestions
const qRaw = computed(() => inviteDraft.value.trim());
const q = computed(() => qRaw.value.toLowerCase());

// Live filtered suggestions (prefix match, exclude already selected)
const filteredSuggestions = computed(() => {
  if (!suggestionsActive.value) return [];
  if (!q.value) return [];
  const base = suggestionsSource.value.length > 0
    ? suggestionsSource.value
    : [qRaw.value];
  return base.filter((u: string) =>
    u.toLowerCase().startsWith(q.value) && !selectedUsers.value.includes(u)
  ).slice(0, 10);
});


watch(inviteDraft, (v) => {
  if (!v.trim()) highlightedIndex.value = -1;
  if (selectionMade.value) {
    // Suppress re-opening suggestions due to programmatic fill
    suggestionsActive.value = false;
    selectionMade.value = false;
  } else {
    suggestionsActive.value = !!v.trim();
  }
});

function addInvite(value?: string) {
  const v = (value || inviteDraft.value).trim();
  if (!v) return;
  const match = suggestionsSource.value.find((u: string) => u.toLowerCase() === v.toLowerCase());
  const final = match || v;
  if (!selectedUsers.value.includes(final)) selectedUsers.value.push(final);
  inviteDraft.value = '';
  highlightedIndex.value = -1;
  suggestionsActive.value = false;
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
    suggestionsActive.value = false;
  }
}

function selectSuggestion(user: string) {
  selectionMade.value = true;
  addInvite(user);
}

// Load all usernames to enable live suggestions while typing
onMounted(async () => {
  try {
    const res = await AuthService.getAllUsernames();
    const names = Array.isArray(res) ? res.map(r => r.username).filter(Boolean) as string[] : [];
    suggestionsSource.value = names;
  } catch (e) {
    console.warn('Failed to load usernames for suggestions', e);
  }
});

async function createGroup() {
  if (!auth.userId) return;

  const finalName = groupName.value.trim() || `${auth.username}'s group`;

  try {
    // 1. Create Group
    const res = await GroupService.create(auth.userId, finalName);
    const gid = res.group;

    // 2. Invite users (resolve usernames to IDs)
    for (const userIdOrName of selectedUsers.value) {
      try {
        let inviteeId: ID | null = null;

        // Try interpreting the entry as a user ID
        try {
          const existsRes = await AuthService.userExists(userIdOrName as ID);
          const exists = Array.isArray(existsRes) ? existsRes[0]?.exists === true : false;
          if (exists) inviteeId = userIdOrName as ID;
        } catch {}

        // Otherwise, resolve by username
        if (!inviteeId) {
          try {
            const lookup = await AuthService.getUserByUsername(userIdOrName);
            const uid = Array.isArray(lookup) ? lookup[0]?.userId : null;
            if (uid) inviteeId = uid as ID;
          } catch {}
        }

        if (!inviteeId) {
          console.warn(`Skipping invite: could not resolve '${userIdOrName}' to a user ID`);
          continue;
        }

        await GroupService.invite(auth.userId, gid, inviteeId);
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
          <div class="invite-controls">
            <input
              v-model="inviteDraft"
              type="text"
              placeholder="Start typing a username or user ID"
              @keydown="onKeyDown"
              @keydown.enter.prevent
              @blur="suggestionsActive = false"
              role="combobox"
              aria-autocomplete="list"
              :aria-expanded="suggestionsActive"
              aria-controls="suggestions-list"
              :aria-activedescendant="highlightedIndex >= 0 ? `suggestion-${highlightedIndex}` : undefined"
              @focus="suggestionsActive = !!inviteDraft.trim()"
            />
            <button type="button" class="add-invite-btn" @click="addInvite()">Add</button>
          </div>
          <ul v-if="suggestionsActive && filteredSuggestions.length" class="suggestions" role="listbox" id="suggestions-list">
            <li
              v-for="(user, idx) in filteredSuggestions"
              :key="user"
              :class="['suggestion', { highlighted: idx === highlightedIndex }]"
              role="option"
              :id="`suggestion-${idx}`"
              :aria-selected="idx === highlightedIndex"
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

.create-group h1 {
  font-family: 'Italianno', 'Caveat', cursive;
  font-size: 2.5rem;
  color: var(--brown);
  margin-bottom: 20px;
}

.group-form {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  background: var(--beige);
  padding: 1.25rem 1.5rem 2.5rem;
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
}
.form-row input[type="text"] {
  padding: 0.5rem 0.75rem;
  border: 2px solid var(--olive-green);
  border-radius: 6px;
  font-size: 0.95rem;
  background: var(--cream);
  color: var(--brown);
}

.form-row input[type="text"]:focus {
  outline: none;
  border-color: var(--brown);
  box-shadow: 0 0 0 3px rgba(155, 168, 130, 0.2);
}
.invite-input-wrapper {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}
.invite-controls {
  display: flex;
  gap: 0.5rem;
}
.add-invite-btn {
  background: var(--brown);
  color: var(--cream);
  border: none;
  padding: 0.4rem 0.75rem;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.85rem;
}
.chips {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}
.chip {
  background: var(--lime-green);
  border: 2px solid var(--olive-green);
  color: var(--brown);
  padding: 0.25rem 0.5rem;
  border-radius: 16px;
  font-size: 0.75rem;
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  font-weight: 500;
}
.chip button {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 0.9rem;
  line-height: 1;
  color: var(--brown);
  font-weight: bold;
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
  background: var(--olive-green);
  color: var(--cream);
  border: none;
  padding: 0.6rem 1.1rem;
  font-size: 0.9rem;
  border-radius: 6px;
  cursor: pointer;
  box-shadow: 0 2px 4px rgba(139, 115, 85, 0.2);
  font-weight: 600;
  transition: background 0.2s;
}
.create-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
.create-btn:not(:disabled):hover {
  background: var(--brown);
}
.suggestions {
  list-style: none;
  margin: 0;
  padding: 0;
  border: 2px solid var(--olive-green);
  border-radius: 6px;
  background: var(--cream);
  max-height: 180px;
  overflow-y: auto;
  box-shadow: 0 2px 6px rgba(139, 115, 85, 0.2);
}
.suggestion {
  padding: 0.4rem 0.6rem;
  cursor: pointer;
  font-size: 0.85rem;
  color: var(--brown);
}
.suggestion:hover,
.suggestion.highlighted {
  background: var(--lime-green);
}
</style>
