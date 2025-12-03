<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { GroupService, AuthService, type GroupDetails } from '../api/services';
import { useAuthStore } from '../stores/auth';

const route = useRoute();
const auth = useAuthStore();
const group = ref<GroupDetails | null>(null);
const inviteUser = ref('');
const memberUsernames = ref<Record<string, string>>({}); // Map user ID to username

onMounted(async () => {
  const res = await GroupService.getDetails(route.params.id as string);
  const first = res?.[0];
  if (first) {
    group.value = first;
    // Fetch usernames for all members
    await loadMemberUsernames();
  }
});

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

const handleInvite = async () => {
    if(!auth.userId) return;

    // Look up the user ID by username
    const userLookup = await AuthService.getUserByUsername(inviteUser.value.trim());
    if (userLookup.length === 0) {
        alert('User not found!');
        return;
    }

    const userIdToInvite = userLookup[0]?.userId;
    if (!userIdToInvite) {
        alert('User not found!');
        return;
    }
    await GroupService.invite(auth.userId, route.params.id as string, userIdToInvite);
    alert('Invited!');
    inviteUser.value = '';
}
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
        <input v-model="inviteUser" placeholder="Username/ID" />
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
</style>
