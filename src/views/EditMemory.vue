<template>
  <div class="edit-memory">
    <div class="header">
      <h1>Edit Memory</h1>
      <button type="button" class="delete-btn" @click="deleteMemory">Delete Memory</button>
    </div>
    <form class="memory-form" @submit.prevent="editMemory">
      <div class="form-row">
        <label for="groupSelect">Group</label>
        <select id="groupSelect" v-model="selectedGroup" required>
          <option value="" disabled>Select a group</option>
          <option v-for="group in userGroups" :key="group" :value="group">
            {{ group }}
          </option>
        </select>
      </div>
      <div class="form-row">
        <label for="memoryDate">Date</label>
        <input
          id="memoryDate"
          v-model="memoryDate"
          type="text"
          placeholder="MM/DD/YYYY"
          maxlength="10"
          required
          @input="handleDateInput"
          @blur="validateDate"
        />
        <small v-if="dateError" class="error">{{ dateError }}</small>
      </div>
      <div class="form-row">
        <label for="memoryTitle">Title</label>
        <input
          id="memoryTitle"
          v-model="memoryTitle"
          type="text"
          placeholder="Memory title"
          required
        />
      </div>
      <div class="actions">
        <button type="submit" class="edit-btn" :disabled="!isFormValid">Edit Memory</button>
      </div>
    </form>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';

const selectedGroup = ref('');
const memoryDate = ref('');
const memoryTitle = ref('');
const dateError = ref('');
const isDateValid = ref(false);

// Placeholder: will be populated from backend/store after auth
const userGroups = ref([]);

function handleDateInput(e) {
  let value = e.target.value.replace(/\D/g, '');
  if (value.length >= 2) {
    value = value.slice(0, 2) + '/' + value.slice(2);
  }
  if (value.length >= 5) {
    value = value.slice(0, 5) + '/' + value.slice(5, 9);
  }
  memoryDate.value = value;
  dateError.value = '';
  isDateValid.value = false;
}

function validateDate() {
  const datePattern = /^(0[1-9]|1[0-2])\/(0[1-9]|[12][0-9]|3[01])\/\d{4}$/;
  
  if (!memoryDate.value) {
    dateError.value = '';
    isDateValid.value = false;
    return;
  }
  
  if (!datePattern.test(memoryDate.value)) {
    dateError.value = 'Invalid date format. Use MM/DD/YYYY.';
    isDateValid.value = false;
    return;
  }
  
  const [month, day, year] = memoryDate.value.split('/').map(Number);
  const inputDate = new Date(year, month - 1, day);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  // Check if date is valid (e.g., not 13/32/2025)
  if (
    inputDate.getMonth() !== month - 1 ||
    inputDate.getDate() !== day ||
    inputDate.getFullYear() !== year
  ) {
    dateError.value = 'Invalid date.';
    isDateValid.value = false;
    return;
  }
  
  if (inputDate > today) {
    dateError.value = 'Date cannot be in the future.';
    isDateValid.value = false;
    return;
  }
  
  dateError.value = '';
  isDateValid.value = true;
}

const isFormValid = computed(() => {
  return (
    selectedGroup.value.trim() !== '' &&
    memoryTitle.value.trim() !== '' &&
    isDateValid.value &&
    !dateError.value
  );
});

function editMemory() {
  if (!isFormValid.value) return;
  
  const payload = {
    group: selectedGroup.value,
    date: memoryDate.value,
    title: memoryTitle.value
  };
  console.log('Editing memory:', payload);
  
  // In real implementation, would update the memory via API
}

function deleteMemory() {
  if (confirm('Are you sure you want to delete this memory?')) {
    console.log('Deleting memory');
    // In real implementation, would delete via API and navigate away
  }
}
</script>

<style scoped>
.edit-memory {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}
.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.header h1 {
  margin: 0;
}
.delete-btn {
  background: #dc2626;
  color: #fff;
  border: none;
  padding: 0.5rem 1rem;
  font-size: 0.85rem;
  border-radius: 6px;
  cursor: pointer;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}
.delete-btn:hover {
  background: #b91c1c;
}
.memory-form {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  background: #fafafa;
  padding: 1.25rem 1.5rem 4rem;
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
.form-row input[type="text"],
.form-row select {
  padding: 0.5rem 0.75rem;
  border: 1px solid #ccc;
  border-radius: 6px;
  font-size: 0.95rem;
  background: #fff;
}
.form-row select {
  cursor: pointer;
}
.actions {
  position: absolute;
  bottom: 1rem;
  right: 1rem;
}
.edit-btn {
  background: #3b82f6;
  color: #fff;
  border: none;
  padding: 0.6rem 1.1rem;
  font-size: 0.9rem;
  border-radius: 6px;
  cursor: pointer;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}
.edit-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
.edit-btn:not(:disabled):hover {
  background: #1d64d9;
}
.error {
  color: #dc2626;
  font-size: 0.75rem;
  margin-top: -0.25rem;
}
</style>
