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
  create: (creator: ID, group: ID, title: string) => post<{memory: ID}>('/MemoryEntries/createMemory', { creator, group, title }),
  listForGroup: (groupID: ID) => post<[{memories: ID[]}]>('/MemoryEntries/_listMemoriesForGroup', { groupID }),
  get: (memoryID: ID) => post<[{memory: Memory}]>('/MemoryEntries/_getMemory', { memoryID }),
  addContribution: (memory: ID, user: ID, desc: string, imgUrls: string) => post('/MemoryEntries/addContribution', { memory, user, description: desc, imageUrls: imgUrls }),
  editContribution: (memory: ID, contributionIndex: number, user: ID, newDesc: string) => post('/MemoryEntries/editContribution', { memory, contributionIndex, user, newDescription: newDesc }),
  editTitle: (memory: ID, user: ID, newTitle: string) => post('/MemoryEntries/editTitle', { memory, user, newTitle }),
  deleteMemory: (memory: ID, creator: ID) => post('/MemoryEntries/deleteMemory', { memory, creator }),
};

// --- Image Storage (Stub for URL generation) ---
export const ImageService = {
  // In a real implementation, you would:
  // 1. Call requestUploadUrl
  // 2. PUT binary file to that URL
  // 3. Call confirmUpload
  confirmUpload: (user: ID, object: string) => post<{image: ID, url: string}>('/ImageStorage/confirmUpload', { user, object }),
};
