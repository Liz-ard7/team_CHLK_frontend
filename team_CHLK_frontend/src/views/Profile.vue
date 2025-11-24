<script setup lang="ts">
import { useRoute } from 'vue-router';
const route = useRoute();
const userId = route.params.id;
</script>

<template>
  <div>
    <h1>Profile</h1>
    <div class="profile-card">
      <div class="pic">👤</div>
      <h3>User: {{ userId }}</h3>
      <p>Bio: A user of CHLK.</p>
    </div>

    <h3>Shared Groups</h3>
    <ul>
      <li>Group A (Demo)</li>
    </ul>
  </div>
</template>
