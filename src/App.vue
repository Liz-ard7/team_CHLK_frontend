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
  <div class="app-wrapper">
    <!-- Left side collage elements -->
    <div class="collage-left">
      <div class="collage-element envelope-1"></div>
      <div class="collage-element botanical-1"></div>
      <div class="collage-element paper-1"></div>
      <div class="collage-element sketch-1"></div>
    </div>
    
    <!-- Right side collage elements -->
    <div class="collage-right">
      <div class="collage-element envelope-2"></div>
      <div class="collage-element botanical-2"></div>
      <div class="collage-element paper-2"></div>
      <div class="collage-element sketch-2"></div>
    </div>
    
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
  </div>
</template>

<style>
/* Basic Global Reset */
body { margin: 0; font-family: sans-serif; background-color: var(--cream); color: var(--brown); position: relative; }

.app-wrapper {
  position: relative;
  min-height: 100vh;
  width: 100%;
  z-index: 1;
}

.app-container { 
  max-width: 800px; 
  margin: 0 auto; 
  min-height: 100vh; 
  display: flex; 
  flex-direction: column;
  position: relative;
  z-index: 2;
}

.navbar { background: var(--olive-green); color: var(--cream); padding: 1rem; display: flex; justify-content: space-between; align-items: center; box-shadow: 0 2px 8px rgba(139, 115, 85, 0.2); }
.logo { font-family: 'Italianno', 'Caveat', cursive; font-size: 2rem; font-weight: 600; color: var(--cream); }
.navbar a { color: var(--cream); margin-left: 1rem; text-decoration: none; transition: color 0.2s; font-weight: 500; }
.navbar a:hover { color: var(--lime-green); }
main { padding: 2rem; flex: 1; background: var(--cream); }
button { cursor: pointer; padding: 10px 15px; background: var(--olive-green); color: var(--cream); border: none; border-radius: 4px; font-size: 1rem; transition: background 0.2s; }
button:hover { background: var(--brown); }
input, textarea, select { width: 100%; padding: 10px; margin-bottom: 15px; border: 1px solid var(--olive-green); border-radius: 4px; box-sizing: border-box; background: var(--beige); color: var(--brown); }
.error { color: #dc2626; margin-bottom: 10px; }
h1 { margin-top: 0; font-family: 'Italianno', 'Caveat', cursive; }

/* Collage Background Elements */
.collage-left,
.collage-right {
  position: fixed;
  top: 0;
  width: 200px;
  height: 100vh;
  pointer-events: none;
  z-index: 0;
  overflow: hidden;
}

.collage-left {
  left: 0;
}

.collage-right {
  right: 0;
}

.collage-element {
  position: absolute;
  opacity: 0.15;
  filter: blur(0.5px);
}

/* Left side elements */
.collage-left .envelope-1 {
  width: 120px;
  height: 80px;
  background: var(--beige);
  border: 2px solid var(--brown);
  border-radius: 2px;
  top: 15%;
  left: 20px;
  transform: rotate(-8deg);
  box-shadow: 0 4px 8px rgba(139, 115, 85, 0.3);
}

.collage-left .envelope-1::before {
  content: '';
  position: absolute;
  top: -8px;
  left: 50%;
  transform: translateX(-50%);
  width: 0;
  height: 0;
  border-left: 60px solid transparent;
  border-right: 60px solid transparent;
  border-top: 15px solid var(--beige);
}

.collage-left .envelope-1::after {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 8px;
  height: 8px;
  background: var(--brown);
  border-radius: 50%;
  box-shadow: 0 0 0 2px var(--beige), 0 0 0 4px var(--brown);
}

.collage-left .botanical-1 {
  width: 100px;
  height: 140px;
  background: var(--lime-green);
  top: 35%;
  left: 40px;
  transform: rotate(12deg);
  border-radius: 50% 50% 50% 50% / 60% 60% 40% 40%;
  box-shadow: 0 4px 12px rgba(139, 115, 85, 0.25);
}

.collage-left .botanical-1::before {
  content: '';
  position: absolute;
  top: 20px;
  left: 30px;
  width: 40px;
  height: 60px;
  background: var(--olive-green);
  border-radius: 50% 50% 50% 50% / 60% 60% 40% 40%;
  transform: rotate(-20deg);
}

.collage-left .paper-1 {
  width: 90px;
  height: 110px;
  background: var(--cream);
  border: 1px solid var(--brown);
  top: 60%;
  left: 30px;
  transform: rotate(-5deg);
  box-shadow: 0 3px 10px rgba(139, 115, 85, 0.2);
}

.collage-left .paper-1::before {
  content: '';
  position: absolute;
  top: 10px;
  left: 10px;
  right: 10px;
  height: 1px;
  background: repeating-linear-gradient(
    to right,
    transparent,
    transparent 8px,
    var(--brown) 8px,
    var(--brown) 10px
  );
  opacity: 0.3;
}

.collage-left .sketch-1 {
  width: 80px;
  height: 100px;
  background: var(--beige);
  border: 2px double var(--olive-green);
  top: 80%;
  left: 50px;
  transform: rotate(10deg);
  box-shadow: 0 4px 8px rgba(139, 115, 85, 0.3);
}

.collage-left .sketch-1::before {
  content: '✿';
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 40px;
  color: var(--olive-green);
  opacity: 0.4;
}

/* Right side elements */
.collage-right .envelope-2 {
  width: 110px;
  height: 75px;
  background: var(--beige);
  border: 2px solid var(--brown);
  border-radius: 2px;
  top: 20%;
  right: 30px;
  transform: rotate(6deg);
  box-shadow: 0 4px 8px rgba(139, 115, 85, 0.3);
}

.collage-right .envelope-2::before {
  content: '';
  position: absolute;
  top: -7px;
  left: 50%;
  transform: translateX(-50%);
  width: 0;
  height: 0;
  border-left: 55px solid transparent;
  border-right: 55px solid transparent;
  border-top: 14px solid var(--beige);
}

.collage-right .envelope-2::after {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 6px;
  height: 6px;
  background: var(--brown);
  border-radius: 50%;
  box-shadow: 0 0 0 2px var(--beige), 0 0 0 4px var(--brown);
}

.collage-right .botanical-2 {
  width: 95px;
  height: 130px;
  background: var(--lime-green);
  top: 40%;
  right: 25px;
  transform: rotate(-15deg);
  border-radius: 50% 50% 50% 50% / 60% 60% 40% 40%;
  box-shadow: 0 4px 12px rgba(139, 115, 85, 0.25);
}

.collage-right .botanical-2::before {
  content: '';
  position: absolute;
  top: 25px;
  right: 25px;
  width: 35px;
  height: 55px;
  background: var(--olive-green);
  border-radius: 50% 50% 50% 50% / 60% 60% 40% 40%;
  transform: rotate(25deg);
}

.collage-right .paper-2 {
  width: 85px;
  height: 105px;
  background: var(--cream);
  border: 1px solid var(--brown);
  top: 65%;
  right: 40px;
  transform: rotate(8deg);
  box-shadow: 0 3px 10px rgba(139, 115, 85, 0.2);
}

.collage-right .paper-2::before {
  content: '';
  position: absolute;
  top: 12px;
  left: 12px;
  right: 12px;
  height: 1px;
  background: repeating-linear-gradient(
    to right,
    transparent,
    transparent 7px,
    var(--brown) 7px,
    var(--brown) 9px
  );
  opacity: 0.3;
}

.collage-right .sketch-2 {
  width: 75px;
  height: 95px;
  background: var(--beige);
  border: 2px double var(--olive-green);
  top: 85%;
  right: 35px;
  transform: rotate(-12deg);
  box-shadow: 0 4px 8px rgba(139, 115, 85, 0.3);
}

.collage-right .sketch-2::before {
  content: '🌿';
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 35px;
  opacity: 0.4;
}

/* Hide collage on mobile devices */
@media (max-width: 768px) {
  .collage-left,
  .collage-right {
    display: none;
  }
}

/* Adjust for smaller screens */
@media (max-width: 1200px) {
  .collage-left,
  .collage-right {
    width: 150px;
  }
  
  .collage-element {
    opacity: 0.1;
  }
}
</style>
