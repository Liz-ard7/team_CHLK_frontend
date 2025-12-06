<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue';
import { useRoute } from 'vue-router';
import { GroupService, AuthService, type GroupDetails } from '../api/services';
import { useAuthStore } from '../stores/auth';

const route = useRoute();
const auth = useAuthStore();
const group = ref<GroupDetails | null>(null);
const inviteUser = ref('');
const suggestionsSource = ref<string[]>([]);
const highlightedIndex = ref(-1);
const suggestionsActive = ref(false);
const selectionMade = ref(false);
const memberUsernames = ref<Record<string, string>>({}); // Map user ID to username

onMounted(async () => {
  const res = await GroupService.getDetails(route.params.id as string);
  const first = res?.[0];
  if (first) {
    group.value = first;
    // Fetch usernames for all members
    await loadMemberUsernames();
  }
  // Load all usernames for suggestions
  try {
    const all = await AuthService.getAllUsernames();
    const names = Array.isArray(all) ? all.map(r => r.username).filter(Boolean) as string[] : [];
    suggestionsSource.value = names;
  } catch (e) {
    console.warn('Failed to load usernames for suggestions', e);
  }
});

// Load usernames for current group's members
const loadMemberUsernames = async () => {
  if (!group.value) return;
  for (const userId of group.value.members) {
    try {
      const result = await AuthService.getUsername(userId as any);
      const first = (result && Array.isArray(result)) ? result[0] : undefined;
      const uname = first && (first as any).username;
      if (typeof uname === 'string' && uname.length > 0) {
        memberUsernames.value[userId] = uname;
      }
    } catch (err) {
      console.error('Failed to get username for:', userId, err);
      memberUsernames.value[userId] = userId; // Fallback to ID
    }
  }
};

const getUsernameDisplay = (userId: string): string => {
  return memberUsernames.value[userId] || userId;
};

// Suggestions for inviting by username
const filteredSuggestions = computed(() => {
  if (!suggestionsActive.value) return [];
  const qRaw = inviteUser.value.trim();
  const q = qRaw.toLowerCase();
  if (!q) return [];
  const base = suggestionsSource.value.length > 0 ? suggestionsSource.value : [qRaw];
  return base
    .filter(u => u.toLowerCase().startsWith(q))
    .slice(0, 10);
});

watch(inviteUser, (v) => {
  if (!v.trim()) highlightedIndex.value = -1;
  if (selectionMade.value) {
    // Suppress re-opening suggestions due to programmatic fill
    suggestionsActive.value = false;
    selectionMade.value = false;
  } else {
    suggestionsActive.value = !!v.trim();
  }
});

function selectSuggestion(user: string) {
  selectionMade.value = true;
  inviteUser.value = user;
  suggestionsActive.value = false;
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
    const sel = highlightedIndex.value >= 0 ? list[highlightedIndex.value] : undefined;
    if (typeof sel === 'string') {
      selectSuggestion(sel);
    }
  } else if (e.key === 'Escape') {
    highlightedIndex.value = -1;
  }
}

const handleInvite = async () => {
  if(!auth.userId) return;

  // Resolve to user ID: try exact username lookup first
  const draft = inviteUser.value.trim();
  if (!draft) return;
  try {
    const lookup = await AuthService.getUserByUsername(draft);
    const userIdToInvite = Array.isArray(lookup) ? lookup[0]?.userId : undefined;
    if (!userIdToInvite) {
      alert('User not found!');
      return;
    }
    await GroupService.invite(auth.userId, route.params.id as string, userIdToInvite);
    alert('Invited!');
    inviteUser.value = '';
    suggestionsActive.value = false;
  } catch (e) {
    alert('Failed to invite user');
    console.error(e);
  }
};
</script>



<template>
  <div v-if="group" class="group-detail">
    <h1>{{ group.groupName }}</h1> <!-- Click to edit title impl left as exercise -->

    <div class="members-section">
      <h3>Members</h3>
      <ul class="members-list">
        <li v-for="m in group.members" :key="m">{{ getUsernameDisplay(m) }}</li>
      </ul>
    </div>

    <div class="invite-section">
        <h3>Add Member</h3>
        <div class="invite-input-wrapper">
          <input v-model="inviteUser" placeholder="Username/ID" @keydown="onKeyDown" />
          <ul v-if="filteredSuggestions.length" class="suggestions">
            <li
              v-for="(user, idx) in filteredSuggestions"
              :key="user"
              :class="['suggestion', { highlighted: idx === highlightedIndex }]"
              @mousedown.prevent="selectSuggestion(user)"
            >{{ user }}</li>
          </ul>
        </div>
        <button @click="handleInvite">Invite</button>
    </div>
  </div>
</template>

<style scoped>
.group-detail {
  max-width: 600px;
  margin: 0 auto;
}

.group-detail h1 {
  font-family: 'Italianno', 'Caveat', cursive;
  font-size: 2.5rem;
  color: var(--brown);
  margin-bottom: 30px;
}

.members-section {
  background: var(--beige);
  border: 4px double var(--olive-green);
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 20px;
  box-shadow: 0 4px 8px rgba(139, 115, 85, 0.15);
}

.members-section h3 {
  font-family: 'Italianno', 'Caveat', cursive;
  font-size: 1.8rem;
  color: var(--brown);
  margin-top: 0;
  margin-bottom: 15px;
}

.members-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.members-list li {
  padding: 10px;
  margin-bottom: 8px;
  background: var(--cream);
  border: 2px solid var(--olive-green);
  border-radius: 6px;
  color: var(--brown);
}

.invite-section {
  background: var(--lime-green);
  border: 4px double var(--olive-green);
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 4px 8px rgba(139, 115, 85, 0.15);
}

.invite-section h3 {
  font-family: 'Italianno', 'Caveat', cursive;
  font-size: 1.8rem;
  color: var(--brown);
  margin-top: 0;
  margin-bottom: 15px;
}

.invite-section input {
  background: var(--cream);
  border: 2px solid var(--olive-green);
  color: var(--brown);
  padding: 10px;
  border-radius: 6px;
  width: 100%;
  box-sizing: border-box;
  margin-bottom: 15px;
}

.invite-section input:focus {
  outline: none;
  border-color: var(--brown);
  box-shadow: 0 0 0 3px rgba(155, 168, 130, 0.2);
}

.invite-section button {
  background: var(--olive-green);
  color: var(--cream);
  padding: 10px 20px;
  border-radius: 6px;
  font-weight: 600;
}

.invite-section button:hover {
  background: var(--brown);
}
.invite-input-wrapper { display: flex; flex-direction: column; gap: 0.5rem; }
.suggestions {
  list-style: none;
  margin: 0 0 20px 0;
  padding: 0;
  border: 2px solid var(--olive-green);
  border-radius: 6px;
  background: var(--cream);
  max-height: 180px;
  overflow-y: auto;
  box-shadow: 0 2px 6px rgba(139, 115, 85, 0.2);
}
.suggestion { padding: 0.4rem 0.6rem; cursor: pointer; font-size: 0.85rem; color: var(--brown); }
.suggestion:hover,
.suggestion.highlighted { background: var(--lime-green); }
</style>
