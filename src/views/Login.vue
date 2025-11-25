<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { AuthService } from '../api/services';
import { useAuthStore } from '../stores/auth';

const username = ref('');
const password = ref('');
const error = ref('');
const router = useRouter();
const auth = useAuthStore();

const handleLogin = async () => {
  try {
    const res = await AuthService.login(username.value, password.value);
    auth.setUser(res.user, username.value);
    router.push('/timeline');
  } catch (e: any) {
    error.value = e;
  }
};
</script>

<template>
  <div class="auth-page">
    <h1>Login</h1>
    <p v-if="error" class="error">{{ error }}</p>
    <input v-model="username" placeholder="Username" />
    <input type="password" v-model="password" placeholder="Password" />
    <button @click="handleLogin">Login</button>
    <div class="footer">
      <router-link to="/register">Register New Account</router-link>
    </div>
  </div>
</template>
