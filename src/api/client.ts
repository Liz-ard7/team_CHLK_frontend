import axios from 'axios';

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api",
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Enable CORS credentials
});

// Log the API URL on startup
console.log('API Client configured with baseURL:', apiClient.defaults.baseURL);

// MOCK MODE: Set to true to use mock data instead of real API calls
const MOCK_MODE = false;

// Helper to handle the { error: string } pattern from the backend
export const post = async <T>(url: string, body: any = {}): Promise<T> => {
  // Mock mode responses
  if (MOCK_MODE) {
    console.log(`[MOCK MODE] API Call: ${url}`, body);
    
    // Mock authentication
    if (url === '/UserAuthentication/authenticate') {
      return { user: 'mock-user-' + body.username } as T;
    }
    if (url === '/UserAuthentication/register') {
      return { user: 'mock-user-' + body.username } as T;
    }
    
    // Mock image upload
    if (url === '/ImageStorage/requestUploadUrl') {
      // Return mock upload URL that will accept the PUT
      return {
        uploadUrl: 'https://httpbin.org/put', // This accepts PUT requests for testing
        bucket: 'mock-bucket',
        object: `mock-object-${Date.now()}-${body.imageName}`
      } as T;
    }
    if (url === '/ImageStorage/confirmUpload') {
      // Return a mock image URL - use a real placeholder service
      return {
        image: 'mock-image-' + Date.now(),
        url: `https://picsum.photos/seed/${body.object}/400/300`
      } as T;
    }
    
    // Mock other endpoints
    if (url.includes('_listGroupsForUser')) {
      return [{ groups: [] }] as T;
    }
    if (url.includes('_getGroupDetails')) {
      return [{ groupName: 'Mock Group', members: [], invitedMembers: [] }] as T;
    }
    
    // Default mock response
    return {} as T;
  }
  
  try {
    const response = await apiClient.post(url, body);
    if (response.data.error) {
      throw new Error(response.data.error);
    }
    // Queries return arrays, Actions return objects.
    // The backend returns { result... } or [ result... ]
    return response.data;
  } catch (error: any) {
    console.error(`API Call Failed [${url}]:`, error);
    console.error('Error details:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
      baseURL: apiClient.defaults.baseURL
    });
    throw error.response?.data?.error || error.message || "Unknown Error";
  }
};

export default apiClient;
