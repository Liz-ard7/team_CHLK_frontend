import { createRouter, createWebHistory } from 'vue-router';
import Home from '../views/Home.vue';
import About from '../views/About.vue';
import CreateGroup from '../views/CreateGroup.vue';
import CreateMemory from '../views/CreateMemory.vue';
import EditMemory from '../views/EditMemory.vue';
import Group from '../views/Group.vue';

const routes = [
  { path: '/', name: 'Home', component: Home },
  { path: '/about', name: 'About', component: About },
  { path: '/create-group', name: 'CreateGroup', component: CreateGroup },
  { path: '/create-memory', name: 'CreateMemory', component: CreateMemory },
  { path: '/edit-memory', name: 'EditMemory', component: EditMemory },
  { path: '/group', name: 'Group', component: Group }
];

const router = createRouter({
  history: createWebHistory(),
  routes
});

export default router;
