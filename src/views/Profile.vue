<script setup lang="ts">
import { useRoute } from 'vue-router';
const route = useRoute();
const userId = route.params.id;
</script>

<template>
  <div class="profile-page">
    <h1>Profile</h1>
    <div class="profile-card">
      <div class="pic">👤</div>
      <h3>User: {{ userId }}</h3>
      <p>Bio: A user of CHLK.</p>
    </div>

    <div class="groups-section">
      <h3>Shared Groups</h3>
      <ul>
        <li>Group A (Demo)</li>
      </ul>
    </div>
  </div>
</template>

<style scoped>
.profile-page {
  max-width: 600px;
  margin: 0 auto;
}

.profile-page h1 {
  font-family: 'Italianno', 'Caveat', cursive;
  font-size: 2.5rem;
  color: var(--brown);
  margin-bottom: 30px;
}

.profile-card {
  background: var(--beige);
  border: 4px double var(--olive-green);
  border-radius: 12px;
  padding: 30px;
  text-align: center;
  margin-bottom: 30px;
  box-shadow: 0 4px 12px rgba(139, 115, 85, 0.2);
  transform: rotate(-0.5deg);
}

.profile-card .pic {
  font-size: 4rem;
  margin-bottom: 15px;
}

.profile-card h3 {
  font-family: 'Italianno', 'Caveat', cursive;
  font-size: 1.8rem;
  color: var(--brown);
  margin: 15px 0;
}

.profile-card p {
  color: var(--brown);
  opacity: 0.8;
}

.groups-section {
  background: var(--lime-green);
  border: 4px double var(--olive-green);
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 4px 8px rgba(139, 115, 85, 0.15);
}

.groups-section h3 {
  font-family: 'Italianno', 'Caveat', cursive;
  font-size: 1.8rem;
  color: var(--brown);
  margin-top: 0;
  margin-bottom: 15px;
}

.groups-section ul {
  list-style: none;
  padding: 0;
  margin: 0;
}

.groups-section li {
  padding: 10px;
  margin-bottom: 8px;
  background: var(--cream);
  border: 2px solid var(--olive-green);
  border-radius: 6px;
  color: var(--brown);
}
</style>
