<script setup lang="ts">
import { useAuthStore } from './stores/auth';
import { useRouter } from 'vue-router';

const auth = useAuthStore();
const router = useRouter();

const handleLogout = () => {
  auth.logout();
  router.push('/login');
};
</script>

<template>
  <div class="app-container">
    <nav v-if="auth.userId" class="navbar">
      <div class="logo">CHLK</div>
      <div class="links">
        <router-link to="/timeline">Timeline</router-link>
        <router-link to="/groups">Your Groups</router-link>
        <a href="#" @click.prevent="handleLogout">Logout</a>
      </div>
    </nav>
    <main>
      <router-view />
    </main>
  </div>
</template>

<style>
/* Basic Global Reset */
body { margin: 0; font-family: sans-serif; background-color: #f4f4f9; color: #333; }
.app-container { max-width: 800px; margin: 0 auto; min-height: 100vh; display: flex; flex-direction: column; }
.navbar { background: #333; color: white; padding: 1rem; display: flex; justify-content: space-between; align-items: center; }
.navbar a { color: white; margin-left: 1rem; text-decoration: none; }
main { padding: 2rem; flex: 1; background: white; box-shadow: 0 0 10px rgba(0,0,0,0.1); }
button { cursor: pointer; padding: 10px 15px; background: #007bff; color: white; border: none; border-radius: 4px; font-size: 1rem; }
button:hover { background: #0056b3; }
input, textarea, select { width: 100%; padding: 10px; margin-bottom: 15px; border: 1px solid #ccc; border-radius: 4px; box-sizing: border-box; }
.error { color: red; margin-bottom: 10px; }
h1 { margin-top: 0; }
</style>
