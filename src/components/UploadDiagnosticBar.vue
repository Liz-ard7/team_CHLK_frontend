<template>
  <div class="upload-diagnostic-bar" role="status" aria-live="polite">
    <div v-if="bucket">
      <span class="label">Bucket:</span>
      <span class="value">{{ bucket }}</span>
      <span class="sep">•</span>
      <span class="label">Object:</span>
      <span class="value object">{{ object }}</span>
      <span class="sep" v-if="imageName">•</span>
      <span class="label" v-if="imageName">File:</span>
      <span class="value" v-if="imageName">{{ imageName }}</span>
      <span class="spacer" />
      <span class="time" v-if="timestamp">{{ timeAgo }}</span>
    </div>
    <div v-else>
      Waiting for requestUploadUrl...
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, ref, computed } from 'vue';

type UploadPayload = {
  uploadUrl: string;
  bucket: string;
  object: string;
  timestamp: number;
  user?: string;
  imageName?: string;
  memory?: string;
};

const bucket = ref<string | null>(null);
const object = ref<string | null>(null);
const imageName = ref<string | null>(null);
const timestamp = ref<number | null>(null);

const timeAgo = computed(() => {
  if (!timestamp.value) return '';
  const diff = Date.now() - timestamp.value;
  const s = Math.floor(diff / 1000);
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  return `${h}h ago`;
});

function applyPayload(p: UploadPayload) {
  bucket.value = p.bucket || null;
  object.value = p.object || null;
  imageName.value = p.imageName || null;
  timestamp.value = p.timestamp || null;
}

function handleEvent(e: Event) {
  const ce = e as CustomEvent<UploadPayload>;
  if (ce.detail) applyPayload(ce.detail);
}

onMounted(() => {
  // Initialize from last known if available
  try {
    const w = window as any;
    if (w.__latestUploadUrl) applyPayload(w.__latestUploadUrl as UploadPayload);
  } catch {}
  window.addEventListener('upload-url-response', handleEvent as EventListener);
});

onUnmounted(() => {
  window.removeEventListener('upload-url-response', handleEvent as EventListener);
});
</script>

<style scoped>
.upload-diagnostic-bar {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 9999;
  display: flex;
  align-items: center;
  min-height: 34px;
  padding: 6px 10px;
  background: rgba(20, 20, 20, 0.9);
  color: #e8e8e8;
  font-size: 12px;
  line-height: 1.2;
  box-shadow: 0 -2px 6px rgba(0,0,0,0.25);
  -webkit-backdrop-filter: blur(4px);
  backdrop-filter: blur(4px);
}
.label { color: #9fd3ff; margin-right: 4px; }
.value { color: #ffffff; }
.object { max-width: 45vw; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; display: inline-block; vertical-align: bottom; }
.sep { margin: 0 8px; color: #888; }
.spacer { flex: 1; }
.time { color: #aaa; }
</style>
