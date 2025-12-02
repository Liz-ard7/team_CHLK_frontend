<script setup lang="ts">
import { ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { MemoryService, ImageService } from '../api/services';
import { useAuthStore } from '../stores/auth';

const route = useRoute();
const router = useRouter();
const auth = useAuthStore();

const description = ref('');
const selectedFiles = ref<File[]>([]);
const previewUrls = ref<string[]>([]);
const uploadedUrls = ref<string[]>([]);
const isUploading = ref(false);
const uploadProgress = ref('');
const errorMessage = ref('');

const handleFileSelect = (event: Event) => {
  const target = event.target as HTMLInputElement;
  if (target.files) {
    const newFiles = Array.from(target.files);
    selectedFiles.value.push(...newFiles);
    
    // Create preview URLs for each new file
    newFiles.forEach(file => {
      const url = URL.createObjectURL(file);
      previewUrls.value.push(url);
    });
  }
};

const removeFile = (index: number) => {
  // Safely revoke object URL (guard against undefined under strict indexing)
  const url = previewUrls.value[index];
  if (url !== undefined) {
    URL.revokeObjectURL(url);
  }
  selectedFiles.value.splice(index, 1);
  previewUrls.value.splice(index, 1);
};

const submit = async () => {
  if (!auth.userId) return;
  const memoryIdParam = route.params.id;
  if (typeof memoryIdParam !== 'string') {
    errorMessage.value = 'Invalid memory id.';
    return;
  }
  
  isUploading.value = true;
  errorMessage.value = '';
  uploadProgress.value = 'Uploading images...';
  
  try {
    // Upload all selected images first
    const urls: string[] = [];
    for (const [i, file] of selectedFiles.value.entries()) {
      uploadProgress.value = `Uploading image ${i + 1} of ${selectedFiles.value.length}...`;
      try {
        const result = await ImageService.uploadImage(auth.userId as string, file, memoryIdParam);
        urls.push(result.object);
      } catch (err: any) {
        console.error('Failed to upload image:', err);
        const errorMsg = err?.message || err?.toString() || 'Unknown error';
        errorMessage.value = `Failed to upload ${file?.name ?? 'file'}: ${errorMsg}`;
        isUploading.value = false;
        return;
      }
    }
    
    uploadProgress.value = 'Saving contribution...';
    
    // Join URLs as comma-separated string as backend expects
    const imageUrlsString = urls.join(',');
    
    await MemoryService.addContribution(
      route.params.id as string, 
      auth.userId, 
      description.value, 
      imageUrlsString
    );
    
    // Clean up preview URLs
    previewUrls.value.forEach(url => URL.revokeObjectURL(url));
    
    router.push(`/memory/${route.params.id}`);
  } catch (error) {
    console.error('Failed to add contribution:', error);
    errorMessage.value = `Error: ${error}`;
    isUploading.value = false;
  }
};
</script>

<template>
  <div>
    <h1>Add Contribution</h1>
    <textarea v-model="description" placeholder="Write your memory..." :disabled="isUploading"></textarea>
    
    <div class="file-upload-section">
      <label for="file-input" class="file-label">
        <span>📷 Choose Images</span>
        <input 
          id="file-input"
          type="file" 
          accept="image/*"
          multiple
          @change="handleFileSelect"
          :disabled="isUploading"
        />
      </label>
      
      <div v-if="selectedFiles.length > 0" class="selected-files">
        <h3>Selected Images ({{ selectedFiles.length }}):</h3>
        <div class="image-grid">
          <div v-for="(file, index) in selectedFiles" :key="index" class="image-item">
            <img :src="previewUrls[index]" :alt="file.name" />
            <button @click="removeFile(index)" :disabled="isUploading" class="remove-btn">×</button>
            <span class="file-name">{{ file.name }}</span>
          </div>
        </div>
      </div>
    </div>
    
    <p v-if="uploadProgress" class="upload-progress">{{ uploadProgress }}</p>
    <p v-if="errorMessage" class="error-message">{{ errorMessage }}</p>
    
    <button @click="submit" :disabled="isUploading || !description.trim()">
      {{ isUploading ? 'Uploading...' : 'Create Contribution!' }}
    </button>
  </div>
</template>

<style scoped>
textarea {
  width: 100%;
  min-height: 100px;
  padding: 0.5rem;
  margin-bottom: 1rem;
  border: 1px solid #ccc;
  border-radius: 4px;
  font-family: inherit;
}

.file-upload-section {
  margin: 1rem 0;
}

.file-label {
  display: inline-block;
  padding: 0.75rem 1.5rem;
  background: #3b82f6;
  color: white;
  border-radius: 6px;
  cursor: pointer;
  margin-bottom: 1rem;
  font-weight: 500;
  transition: background 0.2s;
}

.file-label:hover {
  background: #2563eb;
}

.file-label input[type="file"] {
  display: none;
}

.file-label:has(input:disabled) {
  background: #9ca3af;
  cursor: not-allowed;
}

.selected-files {
  margin-top: 1rem;
}

.selected-files h3 {
  margin: 0 0 1rem 0;
  font-size: 1rem;
  color: #374151;
}

.image-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 1rem;
}

.image-item {
  position: relative;
  background: #f3f4f6;
  border-radius: 8px;
  overflow: hidden;
  padding-bottom: 0.5rem;
}

.image-item img {
  width: 100%;
  height: 200px;
  object-fit: cover;
  display: block;
}

.remove-btn {
  position: absolute;
  top: 8px;
  right: 8px;
  background: rgba(239, 68, 68, 0.9);
  color: white;
  border: none;
  border-radius: 50%;
  width: 32px;
  height: 32px;
  cursor: pointer;
  font-size: 24px;
  line-height: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  transition: background 0.2s;
}

.remove-btn:hover:not(:disabled) {
  background: rgba(220, 38, 38, 0.9);
}

.remove-btn:disabled {
  background: rgba(156, 163, 175, 0.9);
  cursor: not-allowed;
}

.file-name {
  display: block;
  padding: 0.5rem;
  font-size: 0.85rem;
  color: #4b5563;
  text-align: center;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.upload-progress {
  color: #3b82f6;
  font-style: italic;
  margin: 0.5rem 0;
  font-size: 0.9rem;
}

.error-message {
  color: #ef4444;
  background: #fee;
  padding: 0.75rem;
  border-radius: 4px;
  margin: 0.5rem 0;
  font-size: 0.9rem;
}

button {
  padding: 0.75rem 1.5rem;
  background: #10b981;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 1rem;
  font-weight: 500;
  transition: background 0.2s;
}

button:hover:not(:disabled) {
  background: #059669;
}

button:disabled {
  background: #9ca3af;
  cursor: not-allowed;
}
</style>
