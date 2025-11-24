<template>
  <div class="hello">
    <h1>{{ msg }}</h1>
    <p>Pinia counter: {{ counter.count }}</p>
    <button @click="counter.increment">Increment</button>
  </div>
</template>

<script setup>
import { defineProps } from 'vue';
import { useCounterStore } from '../stores/counter';

const props = defineProps({ msg: String });
const counter = useCounterStore();
</script>

<style scoped>
.hello {
  padding: 1rem;
  border: 1px solid #ddd;
  border-radius: 8px;
}
button {
  margin-top: .5rem;
}
</style>
