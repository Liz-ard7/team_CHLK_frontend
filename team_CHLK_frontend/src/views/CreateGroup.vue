<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth';
import { GroupService } from '../api/services';

const auth = useAuthStore();
const router = useRouter();
const name = ref('');
const invitees = ref(''); // Comma sep

const create = async () => {
    if(!auth.userId) return;
    // 1. Create Group
    const res = await GroupService.create(auth.userId, name.value);
    const gid = res.group;

    // 2. Invite users
    const users = invitees.value.split(',').map(u => u.trim()).filter(u => u);
    for(const u of users) {
        await GroupService.invite(auth.userId, gid, u);
    }

    router.push(`/groups/${gid}`);
}
</script>

<template>
  <div>
    <h1>Create Group</h1>
    <input v-model="name" placeholder="Group Name" />
    <input v-model="invitees" placeholder="Invite Users (IDs comma separated)" />
    <button @click="create">Create Group!</button>
  </div>
</template>
