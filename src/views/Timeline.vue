<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
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

// Generate rotation for collage effect
function getRotation(index: number): number {
  const rotations = [-2, 1.5, -1, 2, -1.5, 1, -2.5, 0.5, -1.5, 2];
  return rotations[index % rotations.length] ?? 0;
}

// Format YYYY-MM-DD or ISO string to M/D/YYYY
function formatDate(input: string): string {
  const s = String(input);
  const datePart = s.includes('T') ? s.slice(0, 10) : s;
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(datePart);
  if (!match) return s;
  const [, y, m, d] = match;
  return `${Number(m)}/${Number(d)}/${y}`;
}

// Generate timeline path (winding path connecting memories)
const sortedMemories = computed<Memory[]>(() => {
  // Sort by date (YYYY-MM-DD) descending; items without date go last
  const arr = memories.value.slice();
  arr.sort((a, b) => {
    const da = a.date ?? '';
    const db = b.date ?? '';
    if (da && db) return db.localeCompare(da); // newer first
    if (da) return -1;
    if (db) return 1;
    return 0;
  });
  return arr;
});

const timelinePath = computed(() => {
  if (sortedMemories.value.length === 0) return '';
  
  const cardHeight = 120;
  const cardSpacing = 20;
  const startX = 40;
  let path = `M ${startX} 0`;
  
  sortedMemories.value.forEach((_, index) => {
    const y = index * (cardHeight + cardSpacing) + cardHeight / 2;
    const offsetX = (index % 2 === 0 ? 1 : -1) * 15; // Winding effect
    path += ` Q ${startX + offsetX} ${y - 30} ${startX + offsetX * 2} ${y}`;
  });
  
  return path;
});
</script>

<template>
  <div class="timeline-page">
    <h1>Welcome back, {{ auth.username }}</h1>

    <div class="content-area">
      <div class="timeline-feed">
        <div v-if="loading" class="loading">Loading timeline...</div>
        <div v-else-if="memories.length === 0" class="empty-state">No memories found. Join a group!</div>

        <div v-else class="timeline-container">
          <svg class="timeline-path" v-if="memories.length > 0">
            <path 
              :d="timelinePath" 
              fill="none" 
              stroke="var(--olive-green)" 
              stroke-width="3"
              stroke-dasharray="5,5"
            />
          </svg>
          <div 
            v-for="(mem, index) in sortedMemories" 
            :key="mem.memoryID" 
            class="memory-card"
            :style="{ 
              transform: `rotate(${getRotation(index)}deg)`,
              zIndex: sortedMemories.length - index
            }"
          >
            <router-link :to="`/memory/${mem.memoryID}`">
              <div class="card-frame">
                <h3>{{ mem.title }}</h3>
                <p class="date" v-if="mem.date">{{ formatDate(mem.date) }}</p>
                <p>{{ mem.contributions.length }} Contributions</p>
              </div>
            </router-link>
          </div>
        </div>
      </div>

      <div class="sidebar">
        <h3>Group Invitations</h3>
        <div v-if="invitations.length === 0">
          <p>No pending invites.</p>
        </div>
        <div v-else>
          <div 
            v-for="(inv, index) in invitations" 
            :key="inv.id" 
            class="invite-card"
            :style="{ transform: `rotate(${getRotation(index + 10)}deg)` }"
          >
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
.timeline-page {
  position: relative;
}

.content-area { 
  display: flex; 
  gap: 20px; 
  position: relative;
}

.timeline-feed { 
  flex: 2; 
  position: relative;
  padding-left: 60px;
}

.timeline-container {
  position: relative;
  min-height: 200px;
}

.timeline-path {
  position: absolute;
  left: 0;
  top: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 1;
}

.memory-card { 
  position: relative;
  margin-bottom: 20px;
  margin-left: 20px;
  transition: transform 0.3s ease;
  z-index: 2;
}

.memory-card:hover {
  transform: rotate(0deg) scale(1.02) !important;
}

.card-frame {
  background: var(--beige);
  border: 4px double var(--olive-green);
  border-radius: 8px;
  padding: 20px;
  box-shadow: 
    0 4px 8px rgba(139, 115, 85, 0.2),
    inset 0 1px 0 rgba(255, 255, 255, 0.3);
  position: relative;
}

.card-frame::before {
  content: '';
  position: absolute;
  top: -2px;
  left: -2px;
  right: -2px;
  bottom: -2px;
  border: 2px solid var(--brown);
  border-radius: 8px;
  opacity: 0.3;
  pointer-events: none;
}

.memory-card a { 
  text-decoration: none; 
  color: inherit; 
  display: block;
}

.memory-card h3 {
  font-family: 'Italianno', 'Caveat', cursive;
  font-size: 1.8rem;
  margin: 0 0 8px 0;
  color: var(--brown);
}

.memory-card p {
  color: var(--brown);
  opacity: 0.8;
  margin: 0;
  font-size: 0.9rem;
}

.sidebar { 
  flex: 1; 
  background: var(--lime-green); 
  padding: 20px; 
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(139, 115, 85, 0.15);
}

.sidebar h3 {
  font-family: 'Italianno', 'Caveat', cursive;
  font-size: 1.5rem;
  color: var(--brown);
  margin-top: 0;
}

.invite-card { 
  background: var(--cream); 
  border: 3px double var(--olive-green); 
  padding: 15px; 
  margin-bottom: 15px; 
  border-radius: 6px;
  box-shadow: 0 2px 6px rgba(139, 115, 85, 0.15);
  transition: transform 0.3s ease;
}

.invite-card:hover {
  transform: rotate(0deg) scale(1.02) !important;
}

.invite-card h4 {
  font-family: 'Italianno', 'Caveat', cursive;
  color: var(--brown);
  margin: 0 0 8px 0;
}

.invite-card p {
  color: var(--brown);
  opacity: 0.8;
  margin: 0 0 10px 0;
  font-size: 0.9rem;
}

.invite-actions { 
  display: flex; 
  gap: 8px; 
  margin-top: 8px; 
}

.accept-btn { 
  background: var(--olive-green); 
  color: var(--cream); 
  padding: 6px 12px; 
  border: none; 
  border-radius: 4px; 
  cursor: pointer;
  font-size: 0.85rem;
  transition: background 0.2s;
}

.decline-btn { 
  background: var(--brown); 
  color: var(--cream); 
  padding: 6px 12px; 
  border: none; 
  border-radius: 4px; 
  cursor: pointer;
  font-size: 0.85rem;
  transition: background 0.2s;
}

.accept-btn:hover { 
  background: var(--brown); 
}

.decline-btn:hover { 
  background: #6b5a42; 
}

.bottom-actions { 
  position: fixed; 
  bottom: 0; 
  left: 0; 
  width: 100%; 
  background: var(--beige); 
  border-top: 3px double var(--olive-green); 
  padding: 15px; 
  display: flex; 
  justify-content: center; 
  gap: 10px;
  box-shadow: 0 -2px 8px rgba(139, 115, 85, 0.2);
  z-index: 100;
}

.bottom-actions button {
  background: var(--olive-green);
  color: var(--cream);
  border: none;
  padding: 10px 20px;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
  transition: background 0.2s;
}

.bottom-actions button:hover {
  background: var(--brown);
}

.loading, .empty-state {
  text-align: center;
  padding: 40px;
  color: var(--brown);
  font-size: 1.1rem;
}
</style>
