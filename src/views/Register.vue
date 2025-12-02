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

const handleRegister = async () => {
  try {
    const res = await AuthService.register(username.value, password.value);
    auth.setUser(res.user, username.value);
    router.push('/timeline');
  } catch (e: any) {
    error.value = e;
  }
};
</script>

<template>
  <div class="auth-page">
    <h1>Register</h1>
    <p v-if="error" class="error">{{ error }}</p>
    <input v-model="username" placeholder="Username" />
    <input type="password" v-model="password" placeholder="Password" />
    <button @click="handleRegister">Register</button>
    <div class="footer">
      <router-link to="/login">Already have an account?</router-link>
    </div>
  </div>
</template>

<style scoped>
.auth-page {
  max-width: 400px;
  margin: 0 auto;
  padding: 40px 20px;
  background: var(--beige);
  border: 4px double var(--olive-green);
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(139, 115, 85, 0.2);
}

.auth-page h1 {
  font-family: 'Italianno', 'Caveat', cursive;
  font-size: 2.5rem;
  color: var(--brown);
  margin-bottom: 30px;
  text-align: center;
}

.auth-page input {
  background: var(--cream);
  border: 2px solid var(--olive-green);
  color: var(--brown);
  margin-bottom: 15px;
}

.auth-page input:focus {
  outline: none;
  border-color: var(--brown);
  box-shadow: 0 0 0 3px rgba(155, 168, 130, 0.2);
}

.auth-page button {
  width: 100%;
  background: var(--olive-green);
  color: var(--cream);
  padding: 12px;
  font-size: 1rem;
  font-weight: 600;
  margin-top: 10px;
}

.auth-page button:hover {
  background: var(--brown);
}

.footer {
  margin-top: 20px;
  text-align: center;
}

.footer a {
  color: var(--olive-green);
  text-decoration: none;
  font-weight: 500;
}

.footer a:hover {
  color: var(--brown);
  text-decoration: underline;
}

.error {
  background: #fee;
  color: #dc2626;
  padding: 10px;
  border-radius: 6px;
  margin-bottom: 15px;
  border: 1px solid #fcc;
}
</style>
