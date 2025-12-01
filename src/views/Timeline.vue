<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useAuthStore } from '../stores/auth';
import { GroupService, MemoryService, type Memory } from '../api/services';

const auth = useAuthStore();
const memories = ref<Memory[]>([]);
const invitations = ref<any[]>([]);
const loading = ref(true);

onMounted(async () => {
  if (!auth.userId) return;
  try {
    // 1. Get user groups
    const groupsRes = await GroupService.listForUser(auth.userId);
    const groupIds = groupsRes[0].groups;

    // 2. Get pending invitations
    const invitesRes = await GroupService.listInvitations(auth.userId);
    const inviteIds = invitesRes[0].invitations;

    // Fetch details for invited groups
    const inviteDetails = await Promise.all(
      inviteIds.map(async (id) => {
        const details = await GroupService.getDetails(id);
        return { id, ...details[0] };
      })
    );
    invitations.value = inviteDetails;

    // 3. Get memories for all groups (Naive implementation for init)
    const allMemories: Memory[] = [];
    for (const gid of groupIds) {
      const memsRes = await MemoryService.listForGroup(gid);
      const memIds = memsRes[0].memories;
      for (const mid of memIds) {
        const detail = await MemoryService.get(mid);
        if (detail[0]?.memory) allMemories.push(detail[0].memory);
      }
    }
    memories.value = allMemories; // In a real app, sort by date/ID
  } catch (e) {
    console.error(e);
  } finally {
    loading.value = false;
  }
});

async function acceptInvite(groupId: string) {
  if (!auth.userId) return;
  try {
    await GroupService.accept(auth.userId, groupId);
    window.location.reload(); // Refresh to show new group
  } catch (e) {
    console.error('Failed to accept invitation:', e);
  }
}

async function declineInvite(groupId: string) {
  if (!auth.userId) return;
  try {
    await GroupService.decline(auth.userId, groupId);
    invitations.value = invitations.value.filter(inv => inv.id !== groupId);
  } catch (e) {
    console.error('Failed to decline invitation:', e);
  }
}
</script>

<template>
  <div>
    <h1>Welcome back, {{ auth.username }}</h1>

    <div class="content-area">
      <div class="timeline-feed">
        <div v-if="loading">Loading timeline...</div>
        <div v-else-if="memories.length === 0">No memories found. Join a group!</div>

        <div v-for="mem in memories" :key="mem.memoryID" class="memory-card">
          <router-link :to="`/memory/${mem.memoryID}`">
            <h3>{{ mem.title }}</h3>
            <p>{{ mem.contributions.length }} Contributions</p>
          </router-link>
        </div>
      </div>

      <div class="sidebar">
        <h3>Group Invitations</h3>
        <div v-if="invitations.length === 0">
          <p>No pending invites.</p>
        </div>
        <div v-else>
          <div v-for="inv in invitations" :key="inv.id" class="invite-card">
            <h4>{{ inv.groupName }}</h4>
            <p>{{ inv.members.length }} members</p>
            <div class="invite-actions">
              <button @click="acceptInvite(inv.id)" class="accept-btn">Accept</button>
              <button @click="declineInvite(inv.id)" class="decline-btn">Decline</button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="bottom-actions">
      <router-link to="/groups/create"><button>Create Group</button></router-link>
      <router-link to="/memory/create"><button>Create Memory</button></router-link>
      <router-link to="/groups"><button>Your Groups</button></router-link>
    </div>
  </div>
</template>

<style scoped>
.content-area { display: flex; gap: 20px; }
.timeline-feed { flex: 2; }
.sidebar { flex: 1; background: #eee; padding: 10px; border-radius: 4px; }
.memory-card { border: 1px solid #ddd; padding: 15px; margin-bottom: 10px; border-radius: 5px; }
.memory-card a { text-decoration: none; color: inherit; }
.invite-card { background: white; border: 1px solid #ccc; padding: 10px; margin-bottom: 10px; border-radius: 4px; }
.invite-actions { display: flex; gap: 5px; margin-top: 8px; }
.accept-btn { background: #28a745; color: white; padding: 5px 10px; border: none; border-radius: 3px; cursor: pointer; }
.decline-btn { background: #dc3545; color: white; padding: 5px 10px; border: none; border-radius: 3px; cursor: pointer; }
.accept-btn:hover { background: #218838; }
.decline-btn:hover { background: #c82333; }
.bottom-actions { position: fixed; bottom: 0; left: 0; width: 100%; background: white; border-top: 1px solid #ccc; padding: 15px; display: flex; justify-content: center; gap: 10px; }
</style>
