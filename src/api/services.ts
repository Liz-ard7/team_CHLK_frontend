import { post } from './client';

// Types
export type ID = string;

export interface User {
  _id: ID;
  username: string;
  url?: string; // Profile pic
  bio?: string;
}

export interface Contribution {
  user: ID;
  description: string;
  imageUrls: string[];
}

export interface Memory {
  memoryID: ID;
  group: ID;
  creator: ID;
  title: string;
  date?: string; // YYYY-MM-DD
  contributions: Contribution[];
}

export interface GroupDetails {
  groupName: string;
  members: ID[];
  invitedMembers: ID[];
}

// --- User Authentication ---
export const AuthService = {
  register: (u: string, p: string) => post<{user: ID}>('/UserAuthentication/register', { username: u, password: p }),
  login: (u: string, p: string) => post<{user: ID}>('/UserAuthentication/authenticate', { username: u, password: p }),
  changePhoto: (user: ID, url: string) => post('/UserAuthentication/changePhoto', { user, new_photo: url }),
  userExists: (user: ID) => post<[{exists: boolean}]>('/UserAuthentication/_userExists', { user }),
  getUserByUsername: (username: string) => post<Array<{userId: ID | null}>>('/UserAuthentication/_getUserByUsername', { username }),
};

// --- Groups ---
export const GroupService = {
  create: (user: ID, name: string) => post<{group: ID}>('/Groups/createGroup', { user, name }),
  listForUser: (user: ID) => post<[{groups: ID[]}]>('/Groups/_listGroupsForUser', { user }),
  listInvitations: (user: ID) => post<[{invitations: ID[]}]>('/Groups/_listInvitationsForUser', { user }),
  getDetails: (groupID: ID) => post<[GroupDetails]>('/Groups/_getGroupDetails', { groupID }),
  invite: (user: ID, group: ID, invitee: ID) => post('/Groups/inviteMember', { user, group, userToInvite: invitee }),
  accept: (user: ID, group: ID) => post('/Groups/acceptInvitation', { user, group }),
  decline: (user: ID, group: ID) => post('/Groups/declineInvitation', { user, group }),
  leave: (user: ID, group: ID) => post('/Groups/leaveGroup', { user, group }),
  editName: (user: ID, group: ID, new_name: string) => post('/Groups/editGroupName', { user, group, new_name }),
};

// --- Memory Entries ---
export const MemoryService = {
  create: (creator: ID, group: ID, title: string, date?: string) => 
    post<{memory: ID}>('/MemoryEntries/createMemory', { creator, group, title, ...(date ? { date } : {}) }),
  listForGroup: (groupID: ID) => post<[{memories: ID[]}]>('/MemoryEntries/_listMemoriesForGroup', { groupID }),
  get: (memoryID: ID) => post<[{memory: Memory}]>('/MemoryEntries/_getMemory', { memoryID }),
  addContribution: (memory: ID, user: ID, desc: string, imgUrls: string) => post('/MemoryEntries/addContribution', { memory, user, description: desc, imageUrls: imgUrls }),
  editContribution: (memory: ID, contributionIndex: number, user: ID, newDesc: string, newImageUrls?: string) => 
    post('/MemoryEntries/editContribution', { 
      memory, 
      contributionIndex, 
      user, 
      newDescription: newDesc,
      ...(newImageUrls !== undefined && { newImageUrls })
    }),
  editTitle: (memory: ID, user: ID, newTitle: string) => post('/MemoryEntries/editTitle', { memory, user, newTitle }),
  deleteMemory: (memory: ID, creator: ID) => post('/MemoryEntries/deleteMemory', { memory, creator }),
};

// --- Image Storage ---
export const ImageService = {
  // Step 1: Request a presigned URL for uploading
  requestUploadUrl: (user: ID, imageName: string, memory?: ID, contentType?: string, expiresInSeconds?: number) => 
    post<{uploadUrl: string, bucket: string, object: string}>('/ImageStorage/requestUploadUrl', { 
      user,
      imageName,
      ...(memory !== undefined && { memory }),
      contentType,
      expiresInSeconds 
    }),
  
  // Step 2: Upload the file directly to GCS using the presigned URL
  // This is done with a raw PUT request, not through the API client
  uploadToPresignedUrl: async (uploadUrl: string, file: File): Promise<void> => {
    const response = await fetch(uploadUrl, {
      method: 'PUT',
      body: file,
      // Don't set Content-Type header - it will trigger CORS preflight
      // The signed URL already includes the content type
    });
    if (!response.ok) {
      throw new Error(`Failed to upload file to GCS: ${response.status} ${response.statusText}`);
    }
  },
  
  // Step 3: Confirm the upload was successful and get the permanent URL
  confirmUpload: (user: ID, object: string, contentType?: string, size?: number, memory?: ID) => 
    post<{image: ID, url: string}>('/ImageStorage/confirmUpload', { 
      user, 
      object,
      contentType,
      size,
      ...(memory !== undefined && { memory })
    }),
  
  // Get a signed view URL for an image
  getViewUrl: (user: ID, object: string, expiresInSeconds?: number) =>
    post<{url: string}>('/ImageStorage/getViewUrl', { user, object, expiresInSeconds }),
  
  // Helper method to do the full upload flow
  uploadImage: async (user: ID, file: File, memory?: ID): Promise<{image: ID, url: string, object: string}> => {
    console.log('Starting image upload:', { user, fileName: file.name, fileType: file.type, fileSize: file.size });
    
    // 1. Request upload URL - don't pass contentType to avoid CORS preflight issues
    console.log('Step 1: Requesting upload URL...');
    const { uploadUrl, object } = await ImageService.requestUploadUrl(
      user,
      file.name,
      memory
      // Don't pass contentType - it causes CORS issues with GCS
    );
    console.log('Got upload URL:', { uploadUrl: uploadUrl.substring(0, 50) + '...', object });
    
    // 2. Upload file to presigned URL
    console.log('Step 2: Uploading to GCS...');
    await ImageService.uploadToPresignedUrl(uploadUrl, file);
    console.log('Upload to GCS successful');
    
    // 3. Confirm upload and get permanent URL
    console.log('Step 3: Confirming upload...');
    const result = await ImageService.confirmUpload(user, object, file.type, file.size, memory);
    console.log('Upload confirmed:', result);
    
    // Return both the result and the object path
    return { ...result, object };
  },
};
