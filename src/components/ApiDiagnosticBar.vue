<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';

type LogType = 'request' | 'response' | 'error' | 'info';
interface LogEntry {
  type: LogType;
  url?: string;
  method?: string;
  status?: number | null;
  message?: string;
  time: number;
}

const logs = ref<LogEntry[]>([]);
const expanded = ref(true);
const maxLogs = 50;

const onEvent = (e: Event) => {
  const ce = e as CustomEvent<LogEntry>;
  if (!ce.detail) return;
  logs.value.unshift(ce.detail);
  if (logs.value.length > maxLogs) logs.value.pop();
};

onMounted(() => window.addEventListener('api-debug', onEvent as EventListener));
onUnmounted(() => window.removeEventListener('api-debug', onEvent as EventListener));

const clearLogs = () => { logs.value = []; };
const fmt = (t: number) => new Date(t).toLocaleTimeString();
</script>

<template>
  <div class="api-bar">
    <div class="api-bar__header">
      <div class="left"><strong>API</strong><span class="hint">diagnostics</span></div>
      <div class="right">
        <button @click="clearLogs">Clear</button>
        <button @click="expanded = !expanded">{{ expanded ? 'Hide' : 'Show' }}</button>
      </div>
    </div>
    <div v-if="expanded" class="api-bar__body">
      <div v-if="logs.length === 0" class="empty">No events yet</div>
      <ul v-else class="list">
        <li v-for="(l, i) in logs" :key="i" :class="['row', l.type]">
          <span class="time">{{ fmt(l.time) }}</span>
          <span class="type">{{ l.type.toUpperCase() }}</span>
          <span v-if="l.method" class="method">{{ l.method }}</span>
          <span v-if="l.status !== undefined" class="status">{{ l.status }}</span>
          <span v-if="l.url" class="url" :title="l.url">{{ l.url }}</span>
          <span v-if="l.message" class="message">{{ l.message }}</span>
        </li>
      </ul>
    </div>
  </div>
</template>

<style scoped>
.api-bar { position: fixed; left: 0; right: 0; bottom: 0; z-index: 9999; background: #1f1f23; color: #eee; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; font-size: 12px; border-top: 1px solid #333; }
.api-bar__header { display: flex; justify-content: space-between; align-items: center; padding: 4px 8px; background: #26262b; }
.left { display: flex; gap: 8px; align-items: center; }
.hint { color: #aaa; font-size: 11px; }
.right button { margin-left: 6px; background: #444; color: #fff; border: none; padding: 3px 8px; border-radius: 3px; cursor: pointer; }
.right button:hover { background: #666; }
.api-bar__body { max-height: 180px; overflow-y: auto; }
.list { list-style: none; margin: 0; padding: 0; }
.row { display: grid; grid-template-columns: auto auto auto auto 1fr; gap: 6px; align-items: center; padding: 4px 8px; border-bottom: 1px solid #2b2b31; }
.row.request { background: rgba(0, 123, 255, 0.08); }
.row.response { background: rgba(40, 167, 69, 0.08); }
.row.error { background: rgba(220, 53, 69, 0.12); }
.row.info { background: rgba(255, 193, 7, 0.08); }
.time { color: #bbb; }
.type { font-weight: 700; }
.method { color: #ffd166; }
.status { color: #6ee7b7; }
.error .status { color: #f87171; }
.url { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.message { color: #f0f0f0; }
.empty { padding: 8px; color: #999; }
</style>
