<template>
  <div class="group-view">
    <div class="header">
      <button type="button" class="back-btn" @click="goBack">
        &lt; My Groups
      </button>
      <button type="button" class="leave-btn" @click="leaveGroup">Leave Group</button>
    </div>

    <h1>{{ groupName }}</h1>

    <section class="members-section">
      <h2>Members</h2>
      <div class="members-list">
        <div v-for="member in members" :key="member" class="member-item">
          {{ member }}
        </div>
      </div>
      <button type="button" class="add-member-btn" @click="addMember">+ Add Member</button>
    </section>

    <section class="memories-section">
      <h2>Memories</h2>
      <div v-if="memories.length === 0" class="empty-state">
        No memories yet. Create one to get started!
      </div>
      <div v-else class="memories-list">
        <div v-for="memory in memories" :key="memory.id" class="memory-item">
          <h3>{{ memory.title }}</h3>
          <p class="memory-date">{{ memory.date }}</p>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();

// Placeholder data - will be populated from backend/route params
const groupName = ref('Sample Group');
const members = ref(['DemoUser']); // Placeholder members
const memories = ref([]); // Empty until backend implementation

function goBack() {
  // Navigate to groups list page (to be implemented)
  router.push('/');
}

function leaveGroup() {
  if (confirm('Are you sure you want to leave this group?')) {
    console.log('Leaving group');
    // In real implementation, would call API and navigate away
    router.push('/');
  }
}

function addMember() {
  console.log('Add member clicked');
  // In real implementation, would open a modal or navigate to add member page
}
</script>

<style scoped>
.group-view {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}
.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: -0.5rem;
}
.back-btn {
  background: none;
  border: none;
  color: #3b82f6;
  font-size: 0.95rem;
  cursor: pointer;
  padding: 0.5rem 0.75rem;
  border-radius: 6px;
  transition: background 0.2s;
}
.back-btn:hover {
  background: #f0f7ff;
}
.leave-btn {
  background: #dc2626;
  color: #fff;
  border: none;
  padding: 0.5rem 1rem;
  font-size: 0.85rem;
  border-radius: 6px;
  cursor: pointer;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}
.leave-btn:hover {
  background: #b91c1c;
}
h1 {
  margin: 0;
  font-size: 1.75rem;
}
section {
  background: #fafafa;
  padding: 1.25rem 1.5rem;
  border: 1px solid #ddd;
  border-radius: 8px;
}
h2 {
  margin: 0 0 1rem 0;
  font-size: 1.25rem;
  font-weight: 600;
}
.members-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-bottom: 1rem;
}
.member-item {
  padding: 0.5rem 0.75rem;
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  font-size: 0.95rem;
}
.add-member-btn {
  background: #3b82f6;
  color: #fff;
  border: none;
  padding: 0.5rem 1rem;
  font-size: 0.85rem;
  border-radius: 6px;
  cursor: pointer;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}
.add-member-btn:hover {
  background: #1d64d9;
}
.empty-state {
  color: #6b7280;
  font-size: 0.95rem;
  font-style: italic;
  padding: 1rem 0;
}
.memories-list {
  display: grid;
  gap: 1rem;
}
.memory-item {
  padding: 1rem;
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  cursor: pointer;
  transition: box-shadow 0.2s;
}
.memory-item:hover {
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}
.memory-item h3 {
  margin: 0 0 0.25rem 0;
  font-size: 1rem;
  font-weight: 600;
}
.memory-date {
  margin: 0;
  color: #6b7280;
  font-size: 0.85rem;
}
</style>
