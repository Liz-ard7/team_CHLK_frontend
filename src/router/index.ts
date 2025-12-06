import { createRouter, createWebHistory } from 'vue-router';
import { useAuthStore } from '../stores/auth';

import Login from '../views/Login.vue';
import Register from '../views/Register.vue';
import Timeline from '../views/Timeline.vue';
import MemoryDetail from '../views/MemoryDetail.vue';
import CreateMemory from '../views/CreateMemory.vue';
import EditMemory from '../views/EditMemory.vue';
import GroupDetail from '../views/GroupDetail.vue';
const CreateGroup = () => import('../views/CreateGroup.vue');
import YourGroups from '../views/YourGroups.vue';
import Profile from '../views/Profile.vue';
import AddContribution from '../views/AddContribution.vue';
import EditContribution from '../views/EditContribution.vue';

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', redirect: '/login' },
    { path: '/login', name: 'Login', component: Login },
    { path: '/register', name: 'Register', component: Register },
    { path: '/timeline', name: 'Timeline', component: Timeline },
    { path: '/groups', name: 'YourGroups', component: YourGroups },
    { path: '/groups/create', name: 'CreateGroup', component: CreateGroup },
    { path: '/groups/:id', name: 'GroupDetail', component: GroupDetail },
    { path: '/memory/create', name: 'CreateMemory', component: CreateMemory },
    { path: '/memory/:id', name: 'MemoryDetail', component: MemoryDetail },
    { path: '/memory/:id/edit', name: 'EditMemory', component: EditMemory },
    { path: '/memory/:id/contribute', name: 'AddContribution', component: AddContribution },
    { path: '/memory/:id/contribute/edit/:idx', name: 'EditContribution', component: EditContribution },
    { path: '/profile/:id', name: 'Profile', component: Profile },
  ]
});

// Guard: Redirect to login if not authenticated
router.beforeEach((to, _from, next) => {
  const auth = useAuthStore();
  if (!auth.userId && to.name !== 'Login' && to.name !== 'Register') {
    next({ name: 'Login' });
  } else {
    next();
  }
});

export default router;
