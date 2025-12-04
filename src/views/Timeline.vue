<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useAuthStore } from '../stores/auth';
import { GroupService, MemoryService, AuthService, type Memory } from '../api/services';

const auth = useAuthStore();
const storage = window.sessionStorage;
const memories = ref<Memory[]>([]);
const invitations = ref<any[]>([]);
const loading = ref(true);
const groupsDetails = ref<Array<{ id: string; name: string; members: string[] }>>([]);
const selectedGroupIds = ref<Set<string>>(new Set());
const selectedUserIds = ref<Set<string>>(new Set());
const appliedGroupIds = ref<Set<string>>(new Set());
const appliedUserIds = ref<Set<string>>(new Set());
const usernamesMap = ref<Record<string, string>>({});
const filtersDropdownOpen = ref(false);
const filterMode = ref<'group' | 'user'>('group');
const uniqueUsersShared = computed<string[]>(() => {
  const set = new Set<string>();
  if (auth.userId) set.add(auth.userId);
  for (const g of groupsDetails.value) {
    if (auth.userId && g.members.includes(auth.userId)) {
      for (const u of g.members) set.add(u);
    }
  }
  return Array.from(set);
});

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

    // Fetch group details (names + members) for filtering UI and logic
    const details = await Promise.all(groupIds.map(async (gid) => {
      const d = await GroupService.getDetails(gid);
      const g = d[0];
      return { id: gid, name: g.groupName, members: g.members };
    }));
    groupsDetails.value = details;

    // Resolve usernames for all unique members for display in filters
    const uniqueMemberIds: string[] = [];
    for (const g of details) {
      for (const uid of g.members) {
        if (!uniqueMemberIds.includes(uid)) uniqueMemberIds.push(uid);
      }
    }
    for (const uid of uniqueMemberIds) {
      try {
        const result = await AuthService.getUsername(uid as any);
        const first = (result && Array.isArray(result)) ? result[0] : undefined;
        const uname = first && (first as any).username;
        if (typeof uname === 'string' && uname.length > 0) {
          (usernamesMap.value as Record<string, string>)[uid] = uname;
        }
      } catch (err) {
        console.warn('Username lookup failed for', uid, err);
      }
    }

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

    // Restore filters; ensure new groups/users are auto-selected by union
    try {
      const sgRaw = storage.getItem('timeline.selectedGroupIds');
      const suRaw = storage.getItem('timeline.selectedUserIds');
      const agRaw = storage.getItem('timeline.appliedGroupIds');
      const auRaw = storage.getItem('timeline.appliedUserIds');

      const allGroupIds = details.map(d => d.id);
      const allUserIds: string[] = [];
      for (const d of details) {
        for (const u of d.members) {
          if (!allUserIds.includes(u)) allUserIds.push(u);
        }
      }

      const sgSet = new Set<string>(sgRaw ? JSON.parse(sgRaw) : []);
      const suSet = new Set<string>(suRaw ? JSON.parse(suRaw) : []);
      const agSet = new Set<string>(agRaw ? JSON.parse(agRaw) : []);
      const auSet = new Set<string>(auRaw ? JSON.parse(auRaw) : []);

      for (const id of allGroupIds) { sgSet.add(id); agSet.add(id); }
      for (const id of allUserIds) { suSet.add(id); auSet.add(id); }

      selectedGroupIds.value = sgSet;
      selectedUserIds.value = suSet;
      appliedGroupIds.value = agSet;
      appliedUserIds.value = auSet;

      storage.setItem('timeline.selectedGroupIds', JSON.stringify(Array.from(sgSet)));
      storage.setItem('timeline.selectedUserIds', JSON.stringify(Array.from(suSet)));
      storage.setItem('timeline.appliedGroupIds', JSON.stringify(Array.from(agSet)));
      storage.setItem('timeline.appliedUserIds', JSON.stringify(Array.from(auSet)));
    } catch {}
  } catch (e) {
    console.error(e);
  } finally {
    loading.value = false;
  }
});

// Ensure selections include newly added groups/users and set all on login
import { watch } from 'vue';

watch(groupsDetails, (details) => {
  if (!details || details.length === 0) return;
  const allGroupIds = details.map(d => d.id);
  const allUserIds: string[] = [];
  for (const d of details) {
    for (const u of d.members) {
      if (!allUserIds.includes(u)) allUserIds.push(u);
    }
  }
  // Union in any new IDs without removing prior choices
  for (const id of allGroupIds) {
    selectedGroupIds.value.add(id);
    appliedGroupIds.value.add(id);
  }
  for (const id of allUserIds) {
    selectedUserIds.value.add(id);
    appliedUserIds.value.add(id);
  }
  storage.setItem('timeline.selectedGroupIds', JSON.stringify(Array.from(selectedGroupIds.value)));
  storage.setItem('timeline.selectedUserIds', JSON.stringify(Array.from(selectedUserIds.value)));
  storage.setItem('timeline.appliedGroupIds', JSON.stringify(Array.from(appliedGroupIds.value)));
  storage.setItem('timeline.appliedUserIds', JSON.stringify(Array.from(appliedUserIds.value)));
});

watch(() => auth.userId, (uid) => {
  if (!uid) return;
  // On login, select all groups/users by default
  const details = groupsDetails.value;
  const allGroupIds = details.map(d => d.id);
  const allUserIds: string[] = [];
  for (const d of details) {
    for (const u of d.members) {
      if (!allUserIds.includes(u)) allUserIds.push(u);
    }
  }
  selectedGroupIds.value = new Set(allGroupIds);
  selectedUserIds.value = new Set(allUserIds);
  appliedGroupIds.value = new Set(allGroupIds);
  appliedUserIds.value = new Set(allUserIds);
  storage.setItem('timeline.selectedGroupIds', JSON.stringify(Array.from(selectedGroupIds.value)));
  storage.setItem('timeline.selectedUserIds', JSON.stringify(Array.from(selectedUserIds.value)));
  storage.setItem('timeline.appliedGroupIds', JSON.stringify(Array.from(appliedGroupIds.value)));
  storage.setItem('timeline.appliedUserIds', JSON.stringify(Array.from(appliedUserIds.value)));
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

// Filter by selected group or selected user (shared groups with current user)
const filteredMemories = computed<Memory[]>(() => {
  let base = sortedMemories.value;
  if (appliedGroupIds.value.size > 0) {
    base = base.filter(m => appliedGroupIds.value.has(m.group));
  }
  if (appliedUserIds.value.size > 0) {
    // Access: groups the current user belongs to
    const myGroupIds = new Set<string>();
    for (const g of groupsDetails.value) {
      if (g.members.includes(auth.userId as string)) myGroupIds.add(g.id);
    }
    // Filter memories created by selected users AND accessible to current user
    base = base.filter(m => myGroupIds.has(m.group) && appliedUserIds.value.has(m.creator));
  }
  return base;
});

const timelinePath = computed(() => {
  if (filteredMemories.value.length === 0) return '';
  
  const cardHeight = 120;
  const cardSpacing = 20;
  const startX = 40;
  let path = `M ${startX} 0`;
  
  filteredMemories.value.forEach((_, index) => {
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

    <div class="filters">
      <div class="dropdown">
        <button type="button" class="dropdown-toggle" @click="filtersDropdownOpen = !filtersDropdownOpen">
          Filters
          <span class="caret">▾</span>
        </button>
        <div v-if="filtersDropdownOpen" class="dropdown-menu">
          <div class="filter-mode">
            <label class="mode-option">
              <input type="radio" value="group" v-model="filterMode" />
              By Group
            </label>
            <label class="mode-option">
              <input type="radio" value="user" v-model="filterMode" />
              By User
            </label>
          </div>
          <template v-if="filterMode === 'group'">
            <div class="dropdown-actions">
              <button type="button" @click="selectedGroupIds = new Set(groupsDetails.map(g => g.id))">Select All</button>
              <button type="button" @click="selectedGroupIds = new Set()">Deselect All</button>
            </div>
            <div class="dropdown-checkboxes">
              <label v-for="g in groupsDetails" :key="g.id" class="checkbox">
                <input type="checkbox"
                       :value="g.id"
                       :checked="selectedGroupIds.has(g.id)"
                       @change="(e) => {
                          const checked = (e.target as HTMLInputElement).checked;
                          const next = new Set(selectedGroupIds);
                          if (checked) next.add(g.id); else next.delete(g.id);
                          selectedGroupIds = next as any;
                       }"
                />
                <span>{{ g.name }}</span>
              </label>
            </div>
          </template>
          <template v-else>
            <div class="dropdown-actions">
              <button type="button" @click="selectedUserIds = new Set(uniqueUsersShared)">Select All</button>
              <button type="button" @click="selectedUserIds = new Set()">Deselect All</button>
            </div>
            <div class="dropdown-checkboxes">
              <label v-for="u in uniqueUsersShared" :key="u" class="checkbox">
                <input type="checkbox"
                       :value="u"
                       :checked="selectedUserIds.has(u)"
                       @change="(e) => {
                          const checked = (e.target as HTMLInputElement).checked;
                          const next = new Set(selectedUserIds);
                          if (checked) next.add(u); else next.delete(u);
                          selectedUserIds = next as any;
                       }"
                />
                <span>{{ usernamesMap[u] || u }}</span>
              </label>
            </div>
          </template>
          <div class="apply-row">
            <button type="button" class="apply-btn" @click="(() => {
              appliedGroupIds = new Set(selectedGroupIds);
              appliedUserIds = new Set(selectedUserIds);
              try {
                storage.setItem('timeline.selectedGroupIds', JSON.stringify(Array.from(selectedGroupIds)));
                storage.setItem('timeline.selectedUserIds', JSON.stringify(Array.from(selectedUserIds)));
                storage.setItem('timeline.appliedGroupIds', JSON.stringify(Array.from(appliedGroupIds)));
                storage.setItem('timeline.appliedUserIds', JSON.stringify(Array.from(appliedUserIds)));
              } catch {}
              filtersDropdownOpen = false;
            })()">Apply Filters</button>
          </div>
        </div>
      </div>
    </div>

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
            v-for="(mem, index) in filteredMemories" 
            :key="mem.memoryID" 
            class="memory-card"
            :style="{ 
              transform: `rotate(${getRotation(index)}deg)`,
              zIndex: filteredMemories.length - index
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

.dropdown { position: relative; display: inline-block; margin-right: 12px; }
.dropdown-toggle { background: var(--olive-green); color: var(--cream); border: none; padding: 8px 12px; border-radius: 6px; cursor: pointer; }
.dropdown-toggle .caret { margin-left: 6px; opacity: 0.8; }
.dropdown-menu { position: absolute; top: calc(100% + 6px); left: 0; background: var(--beige); border: 2px solid var(--olive-green); border-radius: 8px; box-shadow: 0 2px 8px rgba(139,115,85,0.2); padding: 10px; min-width: 240px; z-index: 50; display: flex; flex-direction: column; max-height: 320px; }
.apply-row { display: flex; justify-content: flex-end; margin-top: auto; padding-top: 8px; border-top: 1px solid var(--olive-green); background: var(--beige); }
.apply-btn { background: var(--olive-green); color: var(--cream); border: none; padding: 6px 10px; border-radius: 6px; cursor: pointer; }
.filter-mode { display: flex; gap: 12px; align-items: center; margin-bottom: 8px; }
.mode-option { display: inline-flex; align-items: center; gap: 6px; }
.dropdown-actions { display: flex; gap: 8px; margin-bottom: 8px; }
.dropdown-actions button { background: var(--brown); color: var(--cream); border: none; padding: 6px 10px; border-radius: 6px; cursor: pointer; }
.dropdown-checkboxes { display: flex; flex-direction: column; align-items: flex-start; gap: 6px; max-height: 220px; overflow: auto; }
.checkbox { display: inline-flex; align-items: center; justify-content: flex-start; gap: 6px; padding: 4px 8px; background: var(--cream); border: 1px solid var(--olive-green); border-radius: 6px; box-sizing: border-box; text-align: left; }
.checkbox input[type="checkbox"] { margin: 0; }
.checkbox span { flex: 0 0 auto; text-align: left; }
.optgroup-label { font-weight: 600; color: var(--brown); margin: 6px 0 4px; }
</style>
