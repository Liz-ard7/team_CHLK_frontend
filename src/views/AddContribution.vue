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

function getRotation(index: number): number {
  const rotations = [-1.5, 1, -1, 1.5, -0.5, 0.5];
  return rotations[index % rotations.length];
}
</script>

<template>
  <div class="add-contribution">
    <h1>Add Contribution</h1>
    <div class="contribution-form">
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
            <div 
              v-for="(file, index) in selectedFiles" 
              :key="index" 
              class="image-item"
              :style="{ transform: `rotate(${getRotation(index)}deg)` }"
            >
              <img :src="previewUrls[index]" :alt="file.name" />
              <button @click="removeFile(index)" :disabled="isUploading" class="remove-btn">×</button>
              <span class="file-name">{{ file.name }}</span>
            </div>
          </div>
        </div>
      </div>
      
      <p v-if="uploadProgress" class="upload-progress">{{ uploadProgress }}</p>
      <p v-if="errorMessage" class="error-message">{{ errorMessage }}</p>
      
      <div class="actions">
        <button @click="submit" :disabled="isUploading || !description.trim()">
          {{ isUploading ? 'Uploading...' : 'Create Contribution!' }}
        </button>
      </div>
    </div>
  </div>
</template>


<style scoped>
.add-contribution {
  max-width: 800px;
  margin: 0 auto;
}

.add-contribution h1 {
  font-family: 'Italianno', 'Caveat', cursive;
  font-size: 2.5rem;
  color: var(--brown);
  margin-bottom: 20px;
}

.contribution-form {
  background: var(--beige);
  border: 4px double var(--olive-green);
  border-radius: 12px;
  padding: 30px;
  box-shadow: 0 4px 12px rgba(139, 115, 85, 0.2);
}

textarea {
  width: 100%;
  min-height: 120px;
  padding: 12px;
  margin-bottom: 1.5rem;
  border: 2px solid var(--olive-green);
  border-radius: 8px;
  font-family: inherit;
  background: var(--cream);
  color: var(--brown);
  resize: vertical;
}

textarea:focus {
  outline: none;
  border-color: var(--brown);
  box-shadow: 0 0 0 3px rgba(155, 168, 130, 0.2);
}

textarea:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.file-upload-section {
  margin: 1.5rem 0;
}

.file-label {
  display: inline-block;
  padding: 0.75rem 1.5rem;
  background: var(--olive-green);
  color: var(--cream);
  border-radius: 8px;
  cursor: pointer;
  margin-bottom: 1rem;
  font-weight: 600;
  transition: background 0.2s;
  box-shadow: 0 2px 4px rgba(139, 115, 85, 0.2);
}

.file-label:hover {
  background: var(--brown);
}

.file-label input[type="file"] {
  display: none;
}

.file-label:has(input:disabled) {
  background: var(--brown);
  opacity: 0.6;
  cursor: not-allowed;
}

.selected-files {
  margin-top: 1.5rem;
}

.selected-files h3 {
  margin: 0 0 1rem 0;
  font-size: 1.2rem;
  color: var(--brown);
  font-family: 'Italianno', 'Caveat', cursive;
}

.image-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 1.5rem;
}

.image-item {
  position: relative;
  background: var(--cream);
  border: 3px double var(--olive-green);
  border-radius: 12px;
  overflow: hidden;
  padding-bottom: 0.5rem;
  box-shadow: 0 4px 8px rgba(139, 115, 85, 0.15);
  transition: transform 0.3s ease;
}

.image-item:hover {
  transform: rotate(0deg) scale(1.05) !important;
  z-index: 10;
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
  background: rgba(220, 38, 38, 0.9);
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
  font-weight: bold;
}

.remove-btn:hover:not(:disabled) {
  background: rgba(185, 28, 28, 0.9);
}

.remove-btn:disabled {
  background: rgba(139, 115, 85, 0.6);
  cursor: not-allowed;
}

.file-name {
  display: block;
  padding: 0.5rem;
  font-size: 0.85rem;
  color: var(--brown);
  text-align: center;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.upload-progress {
  color: var(--olive-green);
  font-style: italic;
  margin: 0.5rem 0;
  font-size: 0.9rem;
  font-weight: 500;
}

.error-message {
  color: #dc2626;
  background: #fee;
  padding: 0.75rem;
  border-radius: 6px;
  margin: 0.5rem 0;
  font-size: 0.9rem;
  border: 1px solid #fcc;
}

.actions {
  margin-top: 1.5rem;
  text-align: right;
}

button {
  padding: 0.75rem 1.5rem;
  background: var(--olive-green);
  color: var(--cream);
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 1rem;
  font-weight: 600;
  transition: background 0.2s;
  box-shadow: 0 2px 4px rgba(139, 115, 85, 0.2);
}

button:hover:not(:disabled) {
  background: var(--brown);
}

button:disabled {
  background: var(--brown);
  opacity: 0.6;
  cursor: not-allowed;
}
</style>
