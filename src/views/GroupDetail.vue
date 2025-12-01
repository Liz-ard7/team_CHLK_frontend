<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { GroupService, AuthService, type GroupDetails } from '../api/services';
import { useAuthStore } from '../stores/auth';

const route = useRoute();
const auth = useAuthStore();
const group = ref<GroupDetails | null>(null);
const inviteUser = ref('');

onMounted(async () => {
  const res = await GroupService.getDetails(route.params.id as string);
  if (res[0]) group.value = res[0];
});

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
  <div v-if="group">
    <h1>{{ group.groupName }}</h1> <!-- Click to edit title impl left as exercise -->

    <h3>Members</h3>
    <ul>
      <li v-for="m in group.members" :key="m">{{ m }}</li>
    </ul>

    <div class="invite-section">
        <h3>Add Member</h3>
        <input v-model="inviteUser" placeholder="Username/ID" />
        <button @click="handleInvite">Invite</button>
    </div>
  </div>
</template>
