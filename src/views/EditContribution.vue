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
</script>

<template>
  <div>
    <h1>Edit Contribution</h1>
    <textarea v-model="description" placeholder="Update your memory..."></textarea>
    
    <!-- Existing Images -->
    <div v-if="existingImages.length > 0" class="existing-images">
      <h3>Current Images</h3>
      <div class="image-grid">
        <div v-for="objectPath in existingImages" :key="objectPath" class="image-preview">
          <img :src="existingImageUrls[objectPath] || 'https://via.placeholder.com/100?text=Loading'" alt="Existing image" />
          <button @click="removeExistingImage(objectPath)" class="remove-btn">✕</button>
        </div>
      </div>
    </div>
    
    <!-- New Images -->
    <div v-if="newFiles.length > 0" class="new-images">
      <h3>New Images to Add</h3>
      <div class="image-grid">
        <div v-for="(preview, idx) in newFilePreviews" :key="idx" class="image-preview">
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
    
    <button @click="submit" :disabled="isUploading">
      {{ isUploading ? 'Updating...' : 'Update Contribution' }}
    </button>
    <button @click="router.push(`/memory/${route.params.id}`)" :disabled="isUploading">
      Cancel
    </button>
  </div>
</template>

<style scoped>
textarea {
  width: 100%;
  min-height: 100px;
  padding: 10px;
  margin-bottom: 15px;
  border: 1px solid #ccc;
  border-radius: 4px;
  font-family: inherit;
}

.existing-images, .new-images {
  margin-bottom: 20px;
}

.existing-images h3, .new-images h3 {
  margin-bottom: 10px;
  font-size: 16px;
  color: #666;
}

.image-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 10px;
  margin-bottom: 15px;
}

.image-preview {
  position: relative;
  width: 100%;
  padding-bottom: 100%;
  background: #f5f5f5;
  border-radius: 8px;
  overflow: hidden;
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
  top: 5px;
  right: 5px;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: rgba(255, 0, 0, 0.8);
  color: white;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  padding: 0;
}

.remove-btn:hover {
  background: rgba(255, 0, 0, 1);
}

.file-input-container {
  margin-bottom: 15px;
}

.file-input-label {
  display: inline-block;
  padding: 10px 20px;
  background: #007bff;
  color: white;
  border-radius: 4px;
  cursor: pointer;
  transition: background 0.2s;
}

.file-input-label:hover {
  background: #0056b3;
}

.progress {
  color: #007bff;
  margin: 10px 0;
  font-weight: 500;
}

.error {
  color: #dc3545;
  margin: 10px 0;
  padding: 10px;
  background: #f8d7da;
  border-radius: 4px;
}

button {
  padding: 10px 20px;
  margin-right: 10px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: background 0.2s;
}

button:first-of-type {
  background: #28a745;
  color: white;
}

button:first-of-type:hover:not(:disabled) {
  background: #218838;
}

button:last-of-type {
  background: #6c757d;
  color: white;
}

button:last-of-type:hover:not(:disabled) {
  background: #5a6268;
}

button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>