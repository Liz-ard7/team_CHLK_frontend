import { createRouter, createWebHistory } from 'vue-router';
import Home from '../views/Home.vue';
import About from '../views/About.vue';
import CreateGroup from '../views/CreateGroup.vue';
import CreateMemory from '../views/CreateMemory.vue';

const routes = [
  { path: '/', name: 'Home', component: Home },
  { path: '/about', name: 'About', component: About },
  { path: '/create-group', name: 'CreateGroup', component: CreateGroup },
  { path: '/create-memory', name: 'CreateMemory', component: CreateMemory }
];

const router = createRouter({
  history: createWebHistory(),
  routes
});

export default router;
