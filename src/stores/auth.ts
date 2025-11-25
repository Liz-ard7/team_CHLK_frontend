import { defineStore } from 'pinia';
import { ref } from 'vue';

export const useAuthStore = defineStore('auth', () => {
  // Persist state in localStorage
  const userId = ref<string | null>(localStorage.getItem('userId'));
  const username = ref<string | null>(localStorage.getItem('username'));

  function setUser(id: string, name: string) {
    userId.value = id;
    username.value = name;
    localStorage.setItem('userId', id);
    localStorage.setItem('username', name);
  }

  function logout() {
    userId.value = null;
    username.value = null;
    localStorage.removeItem('userId');
    localStorage.removeItem('username');
  }

  return { userId, username, setUser, logout };
});
