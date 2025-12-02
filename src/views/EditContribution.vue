<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { MemoryService, ImageService } from '../api/services';
import { useAuthStore } from '../stores/auth';

const route = useRoute();
const router = useRouter();
const auth = useAuthStore();

const description = ref('');
const contributionIndex = ref(parseInt(route.params.idx as string));
const existingImages = ref<string[]>([]); // Existing image object paths
const existingImageUrls = ref<Record<string, string>>({}); // Map object path to signed URL
const newFiles = ref<File[]>([]); // New files to upload
const newFilePreviews = ref<string[]>([]); // Preview URLs for new files
const isUploading = ref(false);
const uploadProgress = ref('');
const errorMessage = ref('');

// Pre-fill the description and images from the existing contribution
onMounted(async () => {
  const memoryIdParam = route.params.id;
  if (typeof memoryIdParam !== 'string') {
    errorMessage.value = 'Invalid memory id.';
    return;
  }
  const res = await MemoryService.get(memoryIdParam);
  if (res[0]?.memory) {
    const contribution = res[0].memory.contributions[contributionIndex.value];
    if (contribution) {
      description.value = contribution.description;
      // Parse existing images - handle both string and array formats
      const imageUrls = contribution.imageUrls as string | string[];
      if (typeof imageUrls === 'string') {
        existingImages.value = imageUrls
          .split(',')
          .map((url: string) => url.trim())
          .filter((url: string) => url.length > 0);
      } else if (Array.isArray(imageUrls)) {
        existingImages.value = imageUrls;
      }
      
      // Fetch signed URLs for existing images
      if (auth.userId) {
        for (const objectPath of existingImages.value) {
          try {
            const result = await ImageService.getViewUrl(auth.userId, objectPath);
            existingImageUrls.value[objectPath] = result.url;
          } catch (err) {
            console.error('Failed to get signed URL for:', objectPath, err);
            existingImageUrls.value[objectPath] = 'https://via.placeholder.com/100?text=Error';
          }
        }
      }
    }
  }
});

const handleFileSelect = (event: Event) => {
  const target = event.target as HTMLInputElement;
  if (target.files) {
    const filesArray = Array.from(target.files);
    newFiles.value.push(...filesArray);
    
    // Create preview URLs
    filesArray.forEach(file => {
      newFilePreviews.value.push(URL.createObjectURL(file));
    });
  }
};

const removeExistingImage = (objectPath: string) => {
  existingImages.value = existingImages.value.filter(img => img !== objectPath);
};

const removeNewFile = (index: number) => {
  const preview = newFilePreviews.value[index];
  if (preview !== undefined) URL.revokeObjectURL(preview);
  newFiles.value.splice(index, 1);
  newFilePreviews.value.splice(index, 1);
};

const submit = async () => {
  if (!auth.userId) return;
  
  isUploading.value = true;
  errorMessage.value = '';
  uploadProgress.value = 'Uploading new images...';
  
  try {
    // Resolve memory id locally (was only scoped inside onMounted earlier)
    const memoryIdParam = route.params.id;
    if (typeof memoryIdParam !== 'string') {
      errorMessage.value = 'Invalid memory id.';
      isUploading.value = false;
      return;
    }
    // Upload new images
    const newImagePaths: string[] = [];
    for (const [i, file] of newFiles.value.entries()) {
      uploadProgress.value = `Uploading new image ${i + 1} of ${newFiles.value.length}...`;
      try {
        const result = await ImageService.uploadImage(auth.userId as string, file, memoryIdParam);
        newImagePaths.push(result.object);
      } catch (err: any) {
        console.error('Failed to upload image:', err);
        const errorMsg = err?.message || err?.toString() || 'Unknown error';
        errorMessage.value = `Failed to upload ${file?.name ?? 'file'}: ${errorMsg}`;
        isUploading.value = false;
        return;
      }
    }
    
    uploadProgress.value = 'Saving contribution...';
    
    // Combine existing and new image paths
    const allImagePaths = [...existingImages.value, ...newImagePaths];
    const imageUrlsString = allImagePaths.join(',');
    
    // Update contribution with new description and images
    await MemoryService.editContribution(
      memoryIdParam,
      contributionIndex.value,
      auth.userId as string,
      description.value,
      imageUrlsString
    );
    
    router.push(`/memory/${memoryIdParam}`);
  } catch (error: any) {
    errorMessage.value = error.message || 'Failed to update contribution';
    isUploading.value = false;
  }
};

function getRotation(index: number): number {
  const rotations = [-1.5, 1, -1, 1.5, -0.5, 0.5, -1.2, 0.8];
  return rotations[index % rotations.length] ?? 0;
}
</script>

<template>
  <div class="edit-contribution">
    <h1>Edit Contribution</h1>
    <div class="contribution-form">
      <textarea v-model="description" placeholder="Update your memory..."></textarea>
      
      <!-- Existing Images -->
      <div v-if="existingImages.length > 0" class="existing-images">
        <h3>Current Images</h3>
        <div class="image-grid">
          <div 
            v-for="(objectPath, idx) in existingImages" 
            :key="objectPath" 
            class="image-preview"
            :style="{ transform: `rotate(${getRotation(idx)}deg)` }"
          >
            <img :src="existingImageUrls[objectPath] || 'https://via.placeholder.com/100?text=Loading'" alt="Existing image" />
            <button @click="removeExistingImage(objectPath)" class="remove-btn">✕</button>
          </div>
        </div>
      </div>
      
      <!-- New Images -->
      <div v-if="newFiles.length > 0" class="new-images">
        <h3>New Images to Add</h3>
        <div class="image-grid">
          <div 
            v-for="(preview, idx) in newFilePreviews" 
            :key="idx" 
            class="image-preview"
            :style="{ transform: `rotate(${getRotation(existingImages.length + idx)}deg)` }"
          >
            <img :src="preview" alt="New image preview" />
            <button @click="removeNewFile(idx)" class="remove-btn">✕</button>
          </div>
        </div>
      </div>
      
      <!-- Add Images Button -->
      <div class="file-input-container">
        <label for="file-input" class="file-input-label">
          📎 Add More Images
        </label>
        <input 
          id="file-input"
          type="file" 
          @change="handleFileSelect" 
          accept="image/*" 
          multiple 
          style="display: none;"
        />
      </div>
      
      <div v-if="uploadProgress" class="progress">{{ uploadProgress }}</div>
      <div v-if="errorMessage" class="error">{{ errorMessage }}</div>
      
      <div class="actions">
        <button @click="submit" :disabled="isUploading">
          {{ isUploading ? 'Updating...' : 'Update Contribution' }}
        </button>
        <button @click="router.push(`/memory/${route.params.id}`)" :disabled="isUploading">
          Cancel
        </button>
      </div>
    </div>
  </div>
</template>


<style scoped>
.edit-contribution {
  max-width: 800px;
  margin: 0 auto;
}

.edit-contribution h1 {
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
  margin-bottom: 20px;
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

.existing-images, .new-images {
  margin-bottom: 25px;
}

.existing-images h3, .new-images h3 {
  margin-bottom: 15px;
  font-size: 1.3rem;
  color: var(--brown);
  font-family: 'Italianno', 'Caveat', cursive;
}

.image-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 15px;
  margin-bottom: 20px;
}

.image-preview {
  position: relative;
  width: 100%;
  padding-bottom: 100%;
  background: var(--cream);
  border: 3px double var(--olive-green);
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 8px rgba(139, 115, 85, 0.15);
  transition: transform 0.3s ease;
}

.image-preview:hover {
  transform: rotate(0deg) scale(1.05) !important;
  z-index: 10;
}

.image-preview img {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.remove-btn {
  position: absolute;
  top: 8px;
  right: 8px;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: rgba(220, 38, 38, 0.9);
  color: white;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  padding: 0;
  font-weight: bold;
  transition: background 0.2s;
}

.remove-btn:hover {
  background: rgba(185, 28, 28, 0.9);
}

.file-input-container {
  margin-bottom: 20px;
}

.file-input-label {
  display: inline-block;
  padding: 10px 20px;
  background: var(--olive-green);
  color: var(--cream);
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.2s;
  font-weight: 600;
  box-shadow: 0 2px 4px rgba(139, 115, 85, 0.2);
}

.file-input-label:hover {
  background: var(--brown);
}

.progress {
  color: var(--olive-green);
  margin: 15px 0;
  font-weight: 500;
  font-style: italic;
}

.error {
  color: #dc2626;
  margin: 15px 0;
  padding: 12px;
  background: #fee;
  border-radius: 6px;
  border: 1px solid #fcc;
}

.actions {
  margin-top: 25px;
  display: flex;
  gap: 10px;
}

button {
  padding: 12px 24px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 1rem;
  font-weight: 600;
  transition: background 0.2s;
  box-shadow: 0 2px 4px rgba(139, 115, 85, 0.2);
}

button:first-of-type {
  background: var(--olive-green);
  color: var(--cream);
}

button:first-of-type:hover:not(:disabled) {
  background: var(--brown);
}

button:last-of-type {
  background: var(--brown);
  color: var(--cream);
}

button:last-of-type:hover:not(:disabled) {
  background: #6b5a42;
}

button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>