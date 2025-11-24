<template>
  <div id="app">
    <nav class="nav">
      <router-link to="/">Home</router-link>
      <router-link to="/about">About</router-link>
      <router-link to="/create-group">Create Group</router-link>
      <router-link to="/create-memory">Create Memory</router-link>
    </nav>
    <router-view />
  </div>
</template>

<script setup>
</script>

<style>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  margin: 0 auto;
  max-width: 800px;
  padding: 1rem;
}
.nav {
  display: flex;
  gap: 1rem;
  margin-bottom: 1rem;
}
.nav a.router-link-active {
  font-weight: bold;
}
</style>
