import { defineStore } from 'pinia';

export const useUserStore = defineStore('user', {
  state: () => ({
    // Placeholder until auth implemented
    username: 'DemoUser'
  }),
  actions: {
    setUsername(name) {
      this.username = name;
    }
  }
});
